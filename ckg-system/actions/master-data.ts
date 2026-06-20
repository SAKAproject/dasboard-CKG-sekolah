'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const MASTER_DATA_PATH = '/dashboard/admin/master-data'

// ───────────────────────── KECAMATAN ─────────────────────────

export async function getKecamatans() {
  const user = await requireRole(['admin'])
  return prisma.kecamatan.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { namaKecamatan: 'asc' },
    include: { _count: { select: { desas: true } } },
  })
}

export async function createKecamatan(namaKecamatan: string) {
  const user = await requireRole(['admin'])
  if (!namaKecamatan.trim()) {
    return { success: false, error: 'Nama kecamatan wajib diisi.' }
  }
  const kec = await prisma.kecamatan.create({
    data: { tenantId: user.tenantId, namaKecamatan: namaKecamatan.trim() },
  })
  revalidatePath(MASTER_DATA_PATH)
  return { success: true, id: kec.id }
}

export async function deleteKecamatan(id: string) {
  const user = await requireRole(['admin'])
  try {
    await prisma.kecamatan.delete({ where: { id, tenantId: user.tenantId } })
    revalidatePath(MASTER_DATA_PATH)
    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Tidak bisa dihapus — masih ada desa yang terhubung ke kecamatan ini.',
    }
  }
}

// ───────────────────────── DESA ─────────────────────────

export async function getDesas() {
  const user = await requireRole(['admin'])
  return prisma.desa.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { namaDesa: 'asc' },
    include: {
      kecamatan: { select: { namaKecamatan: true } },
      _count: { select: { schools: true } },
    },
  })
}

export async function createDesa(namaDesa: string, kecamatanId: string) {
  const user = await requireRole(['admin'])
  if (!namaDesa.trim() || !kecamatanId) {
    return { success: false, error: 'Nama desa dan kecamatan wajib diisi.' }
  }
  const desa = await prisma.desa.create({
    data: { tenantId: user.tenantId, namaDesa: namaDesa.trim(), kecamatanId },
  })
  revalidatePath(MASTER_DATA_PATH)
  return { success: true, id: desa.id }
}

export async function deleteDesa(id: string) {
  const user = await requireRole(['admin'])
  try {
    await prisma.desa.delete({ where: { id, tenantId: user.tenantId } })
    revalidatePath(MASTER_DATA_PATH)
    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Tidak bisa dihapus — masih ada sekolah yang terhubung ke desa ini.',
    }
  }
}

// ───────────────────────── SEKOLAH ─────────────────────────

export async function getSchoolsWithClasses() {
  const user = await requireRole(['admin'])
  return prisma.school.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { namaSekolah: 'asc' },
    include: {
      desa: { select: { namaDesa: true } },
      classes: { orderBy: [{ namaKelas: 'asc' }, { klasifikasiKelas: 'asc' }] },
      _count: { select: { students: true } },
    },
  })
}

export type SchoolInput = {
  namaSekolah: string
  kodeSekolah?: string
  alamat?: string
  desaId?: string
  tingkatPendidikan: string
}

export async function createSchool(input: SchoolInput) {
  const user = await requireRole(['admin'])
  if (!input.namaSekolah.trim()) {
    return { success: false, error: 'Nama sekolah wajib diisi.' }
  }
  const school = await prisma.school.create({
    data: {
      tenantId: user.tenantId,
      namaSekolah: input.namaSekolah.trim(),
      kodeSekolah: input.kodeSekolah,
      alamat: input.alamat,
      desaId: input.desaId || undefined,
      tingkatPendidikan: input.tingkatPendidikan || 'SD',
      statusAktif: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      aksi: 'CREATE',
      modul: 'schools',
      recordId: school.id,
      dataBaru: input,
    },
  })

  revalidatePath(MASTER_DATA_PATH)
  return { success: true, id: school.id }
}

export async function toggleSchoolStatus(schoolId: string, aktif: boolean) {
  const user = await requireRole(['admin'])
  await prisma.school.update({
    where: { id: schoolId, tenantId: user.tenantId },
    data: { statusAktif: aktif },
  })
  revalidatePath(MASTER_DATA_PATH)
  return { success: true }
}

// ───────────────────────── KELAS ─────────────────────────

export async function createClass(input: {
  schoolId: string
  namaKelas: string
  klasifikasiKelas?: string
  tahunAjaran?: string
}) {
  const user = await requireRole(['admin'])
  if (!input.namaKelas.trim()) {
    return { success: false, error: 'Nama kelas wajib diisi.' }
  }

  const existing = await prisma.class.findFirst({
    where: {
      schoolId: input.schoolId,
      namaKelas: input.namaKelas,
      klasifikasiKelas: input.klasifikasiKelas || null,
    },
  })
  if (existing) {
    return { success: false, error: 'Kelas dengan nama ini sudah ada di sekolah tersebut.' }
  }

  const kelas = await prisma.class.create({
    data: {
      tenantId: user.tenantId,
      schoolId: input.schoolId,
      namaKelas: input.namaKelas,
      klasifikasiKelas: input.klasifikasiKelas || null,
      tahunAjaran: input.tahunAjaran || new Date().getFullYear().toString(),
    },
  })

  revalidatePath(MASTER_DATA_PATH)
  return { success: true, id: kelas.id }
}

export async function deleteClass(classId: string) {
  const user = await requireRole(['admin'])
  try {
    await prisma.class.delete({ where: { id: classId, tenantId: user.tenantId } })
    revalidatePath(MASTER_DATA_PATH)
    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Tidak bisa dihapus — masih ada siswa terdaftar di kelas ini.',
    }
  }
}
