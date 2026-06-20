'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function getSystemStats() {
  const user = await requireRole(['admin'])

  const [
    totalSiswa,
    totalSekolah,
    totalUser,
    totalSubmission,
    totalKategori,
    totalPertanyaan,
    auditLogCount,
  ] = await Promise.all([
    prisma.student.count({ where: { tenantId: user.tenantId } }),
    prisma.school.count({ where: { tenantId: user.tenantId } }),
    prisma.user.count({ where: { tenantId: user.tenantId } }),
    prisma.formSubmission.count({ where: { tenantId: user.tenantId } }),
    prisma.screeningCategory.count({ where: { tenantId: user.tenantId } }),
    prisma.screeningQuestion.count({ where: { tenantId: user.tenantId } }),
    prisma.auditLog.count({ where: { tenantId: user.tenantId } }),
  ])

  return {
    totalSiswa,
    totalSekolah,
    totalUser,
    totalSubmission,
    totalKategori,
    totalPertanyaan,
    auditLogCount,
  }
}

export async function getRecentAuditLogs(limit = 20) {
  const user = await requireRole(['admin'])

  return prisma.auditLog.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { namaLengkap: true } },
    },
  })
}

export async function getMigrationHistory() {
  await requireRole(['admin'])

  // Daftar migrasi diambil dari folder prisma/migrations (lihat catatan di halaman UI).
  // Tabel migration_logs di schema dapat dipakai untuk mencatat migrasi
  // yang dijalankan manual lewat panel ini di versi mendatang.
  return prisma.$queryRaw<
    { migration_name: string; finished_at: Date | null }[]
  >`
    SELECT migration_name, finished_at
    FROM _prisma_migrations
    ORDER BY finished_at DESC NULLS LAST
    LIMIT 20
  `.catch(() => [])
}
