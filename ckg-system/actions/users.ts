'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Buat user baru beserta akun Supabase Auth.
 * Hanya admin.
 */
export async function createUser(input: {
  namaLengkap: string
  email: string
  roleId: string
  schoolId?: string
  password: string
}) {
  const currentUser = await requireRole(['admin'])

  // Buat akun di Supabase Auth
  const supabase = await createClient()
  const { data: authData, error: authErr } =
    await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    })

  if (authErr || !authData.user) {
    return {
      success: false,
      error: authErr?.message ?? 'Gagal membuat akun autentikasi.',
    }
  }

  // Simpan ke tabel users dengan link supabase_uid
  const user = await prisma.user.create({
    data: {
      tenantId: currentUser.tenantId,
      supabaseUid: authData.user.id,
      namaLengkap: input.namaLengkap,
      email: input.email,
      roleId: input.roleId,
      schoolId: input.schoolId ?? null,
      statusAktif: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      aksi: 'CREATE',
      modul: 'users',
      recordId: user.id,
      dataBaru: { email: input.email, roleId: input.roleId },
    },
  })

  return { success: true, userId: user.id }
}

/**
 * Ambil semua user satu tenant (admin only).
 */
export async function getUsersByTenant() {
  const user = await requireRole(['admin'])

  return prisma.user.findMany({
    where: { tenantId: user.tenantId },
    include: {
      role: { select: { namaRole: true, kodeRole: true } },
      school: { select: { namaSekolah: true } },
    },
    orderBy: { namaLengkap: 'asc' },
  })
}

/**
 * Ubah status aktif user.
 */
export async function toggleUserStatus(userId: string, aktif: boolean) {
  const currentUser = await requireRole(['admin'])

  await prisma.user.update({
    where: { id: userId, tenantId: currentUser.tenantId },
    data: { statusAktif: aktif },
  })

  await prisma.auditLog.create({
    data: {
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      aksi: 'UPDATE',
      modul: 'users',
      recordId: userId,
      dataBaru: { statusAktif: aktif },
    },
  })

  return { success: true }
}

/**
 * Ambil semua role yang tersedia untuk tenant.
 */
export async function getRoles() {
  const user = await requireRole(['admin'])
  return prisma.role.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { namaRole: 'asc' },
  })
}
