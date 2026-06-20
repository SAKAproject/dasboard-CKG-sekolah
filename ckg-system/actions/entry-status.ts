'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import type { SubmissionRow } from '@/types'

/**
 * Mengambil daftar submission dengan status entri.
 * Hanya bisa diakses oleh admin dan petugas_entri.
 */
export async function getSubmissionsForEntry(
  tenantId: string,
  filter?: {
    sudahDiinput?: boolean
    schoolId?: string
    search?: string
  }
): Promise<SubmissionRow[]> {
  await requireRole(['admin', 'petugas_entri'])

  const rows = await prisma.formSubmission.findMany({
    where: {
      tenantId,
      informedConsent: true,
      statusPengisian: 'submitted',
      ...(filter?.sudahDiinput !== undefined && {
        sudahDiinputSistem: filter.sudahDiinput,
      }),
      student: filter?.schoolId
        ? { schoolId: filter.schoolId }
        : undefined,
    },
    include: {
      student: {
        include: {
          school: { select: { namaSekolah: true } },
          class: { select: { namaKelas: true, klasifikasiKelas: true } },
        },
      },
    },
    orderBy: [{ sudahDiinputSistem: 'asc' }, { submittedAt: 'desc' }],
  })

  return rows
    .filter((r: (typeof rows)[number]) => {
      if (!filter?.search) return true
      const q = filter.search.toLowerCase()
      return (
        r.student?.namaLengkap.toLowerCase().includes(q) ||
        r.student?.nik.includes(q)
      )
    })
    .map((r: (typeof rows)[number]) => ({
      submissionId: r.id,
      namaSiswa: r.student?.namaLengkap ?? '-',
      nik: r.student?.nik ?? '-',
      namaKelas: r.student?.class
        ? `${r.student.class.namaKelas}${r.student.class.klasifikasiKelas ?? ''}`
        : null,
      namaSekolah: r.student?.school?.namaSekolah ?? null,
      tanggalSubmit: r.submittedAt,
      sudahDiinputSistem: r.sudahDiinputSistem,
      diinputOlehNama: null, // diisi lewat join terpisah jika diperlukan
      diinputPada: r.diinputPada,
    }))
}

/**
 * Tandai sebuah submission sebagai sudah/belum diinput ke sistem.
 * Hanya admin dan petugas_entri.
 */
export async function setEntryStatus(
  submissionId: string,
  sudahDiinput: boolean,
  catatan?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole(['admin', 'petugas_entri'])

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.formSubmission.update({
        where: { id: submissionId },
        data: {
          sudahDiinputSistem: sudahDiinput,
          diinputOleh: user.id,
          diinputPada: sudahDiinput ? new Date() : null,
          catatanPetugas: catatan ?? null,
        },
      })

      await tx.entryLog.create({
        data: {
          tenantId: user.tenantId,
          submissionId,
          petugasId: user.id,
          aksi: sudahDiinput ? 'set_sudah_input' : 'set_belum_input',
          catatan: catatan ?? null,
        },
      })

      // Catat ke audit log
      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          aksi: 'UPDATE',
          modul: 'entry_status',
          recordId: submissionId,
          dataBaru: {
            sudahDiinputSistem: sudahDiinput,
            catatan,
          },
        },
      })
    })

    return { success: true }
  } catch (err) {
    console.error('setEntryStatus error:', err)
    return { success: false, error: 'Gagal memperbarui status.' }
  }
}

/**
 * Mengambil detail jawaban skrining sebuah submission (untuk petugas entri & admin).
 */
export async function getSubmissionDetail(submissionId: string) {
  await requireRole(['admin', 'petugas_entri'])

  return prisma.formSubmission.findUnique({
    where: { id: submissionId },
    include: {
      student: {
        include: {
          school: true,
          class: true,
        },
      },
      answers: {
        include: {
          question: {
            include: { category: true },
          },
        },
        orderBy: {
          question: { nomorUrut: 'asc' },
        },
      },
    },
  })
}
