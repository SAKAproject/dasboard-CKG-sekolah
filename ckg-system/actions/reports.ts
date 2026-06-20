'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import type { ClassDashboardRow } from '@/types'

/**
 * Dashboard guru: rekap total siswa + sudah isi per kelas,
 * dibatasi berdasarkan school_id milik guru yang login.
 */
export async function getClassDashboard(
  schoolId?: string
): Promise<ClassDashboardRow[]> {
  const user = await requireRole(['admin', 'guru'])

  // Guru hanya bisa lihat sekolahnya sendiri
  const targetSchoolId =
    user.roleKode === 'guru' ? (user.schoolId ?? '') : (schoolId ?? '')

  if (!targetSchoolId) return []

  const classes = await prisma.class.findMany({
    where: { schoolId: targetSchoolId },
    orderBy: [{ namaKelas: 'asc' }, { klasifikasiKelas: 'asc' }],
    include: {
      students: {
        where: { statusAktif: true },
        include: {
          formSubmissions: {
            where: { statusPengisian: 'submitted', informedConsent: true },
            select: { id: true },
          },
        },
      },
    },
  })

  return classes.map((c: (typeof classes)[number]) => {
    const total = c.students.length
    const sudahIsi = c.students.filter(
      (s: (typeof c.students)[number]) => s.formSubmissions.length > 0
    ).length
    return {
      classId: c.id,
      namaKelas: c.namaKelas,
      klasifikasiKelas: c.klasifikasiKelas,
      totalSiswa: total,
      sudahIsi,
      belumIsi: total - sudahIsi,
      persentase: total > 0 ? Math.round((sudahIsi / total) * 100) : 0,
    }
  })
}

/**
 * Rekap per sekolah — untuk admin.
 */
export async function getSchoolDashboard(tenantId?: string) {
  const user = await requireRole(['admin'])

  const schools = await prisma.school.findMany({
    where: { tenantId: tenantId ?? user.tenantId, statusAktif: true },
    include: {
      _count: { select: { students: true } },
      students: {
        where: { statusAktif: true },
        include: {
          formSubmissions: {
            where: { statusPengisian: 'submitted', informedConsent: true },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { namaSekolah: 'asc' },
  })

  return schools.map((s: (typeof schools)[number]) => {
    const total = s.students.length
    const sudahIsi = s.students.filter(
      (st: (typeof s.students)[number]) => st.formSubmissions.length > 0
    ).length
    return {
      schoolId: s.id,
      namaSekolah: s.namaSekolah,
      totalSiswa: total,
      sudahIsi,
      belumIsi: total - sudahIsi,
      persentase: total > 0 ? Math.round((sudahIsi / total) * 100) : 0,
    }
  })
}

/**
 * Ringkasan angka untuk header dashboard (total siswa, total sudah isi, persen).
 */
export async function getDashboardSummary(tenantId: string) {
  const user = await requireRole(['admin', 'guru', 'petugas_entri'])

  const whereStudent =
    user.roleKode === 'guru' && user.schoolId
      ? { tenantId, schoolId: user.schoolId, statusAktif: true }
      : { tenantId, statusAktif: true }

  const [totalSiswa, totalSubmit, totalSudahInput] = await Promise.all([
    prisma.student.count({ where: whereStudent }),
    prisma.formSubmission.count({
      where: {
        tenantId,
        statusPengisian: 'submitted',
        informedConsent: true,
        ...(user.roleKode === 'guru' && user.schoolId
          ? { student: { schoolId: user.schoolId } }
          : {}),
      },
    }),
    prisma.formSubmission.count({
      where: {
        tenantId,
        statusPengisian: 'submitted',
        sudahDiinputSistem: true,
      },
    }),
  ])

  return {
    totalSiswa,
    totalSubmit,
    totalSudahInput,
    belumIsi: totalSiswa - totalSubmit,
    persentaseIsi:
      totalSiswa > 0 ? Math.round((totalSubmit / totalSiswa) * 100) : 0,
  }
}
