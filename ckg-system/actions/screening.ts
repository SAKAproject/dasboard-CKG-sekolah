'use server'

import { prisma } from '@/lib/prisma'
import type { ScreeningCategoryDTO } from '@/types'

/**
 * Mengambil seluruh kategori + pertanyaan skrining aktif milik sebuah tenant,
 * terurut sesuai nomor_urut. Form di frontend membaca data ini secara dinamis —
 * tidak ada pertanyaan yang di-hardcode di komponen React.
 */
export async function getScreeningStructure(
  tenantId: string
): Promise<ScreeningCategoryDTO[]> {
  const categories = await prisma.screeningCategory.findMany({
    where: { tenantId, aktif: true },
    orderBy: { nomorUrut: 'asc' },
    include: {
      questions: {
        where: { aktif: true },
        orderBy: { nomorUrut: 'asc' },
      },
    },
  })

  return categories.map((c: (typeof categories)[number]) => ({
    id: c.id,
    namaKategori: c.namaKategori,
    kodeKategori: c.kodeKategori,
    nomorUrut: c.nomorUrut,
    targetKelas: c.targetKelas,
    questions: c.questions.map((q: (typeof c.questions)[number]) => ({
      id: q.id,
      categoryId: q.categoryId,
      nomorPertanyaan: q.nomorPertanyaan,
      teksPertanyaan: q.teksPertanyaan,
      tipeJawaban: q.tipeJawaban as ScreeningCategoryDTO['questions'][number]['tipeJawaban'],
      opsiJawaban: (q.opsiJawaban as string[] | null) ?? null,
      wajib: q.wajib,
      skipLogic: (q.skipLogic as Record<string, string> | null) ?? null,
      kondisiTampil:
        (q.kondisiTampil as { kelas?: string[]; jenis_kelamin?: string } | null) ?? null,
      nomorUrut: q.nomorUrut,
    })),
  }))
}

/** Mengambil daftar sekolah aktif suatu tenant, untuk dropdown form CKG */
export async function getActiveSchools(tenantId: string) {
  return prisma.school.findMany({
    where: { tenantId, statusAktif: true },
    select: { id: true, namaSekolah: true, desaId: true },
    orderBy: { namaSekolah: 'asc' },
  })
}

/** Mengambil daftar kelas suatu sekolah, untuk dropdown form CKG */
export async function getClassesBySchool(schoolId: string) {
  return prisma.class.findMany({
    where: { schoolId },
    select: { id: true, namaKelas: true, klasifikasiKelas: true },
    orderBy: [{ namaKelas: 'asc' }, { klasifikasiKelas: 'asc' }],
  })
}
