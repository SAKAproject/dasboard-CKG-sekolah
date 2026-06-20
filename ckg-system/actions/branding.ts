'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const SETTINGS_PATH = '/dashboard/admin/settings'

const BRANDING_KEYS = [
  'nama_aplikasi',
  'nama_instansi',
  'logo_url',
  'favicon_url',
  'warna_utama',
  'warna_sekunder',
  'footer_text',
] as const

export type BrandingKey = (typeof BRANDING_KEYS)[number]

export async function getBrandingFull(): Promise<Record<BrandingKey, string>> {
  const user = await requireRole(['admin'])

  const rows = await prisma.systemSetting.findMany({
    where: { tenantId: user.tenantId, kunci: { in: [...BRANDING_KEYS] } },
  })

  const result = Object.fromEntries(
    BRANDING_KEYS.map((k) => [k, ''])
  ) as Record<BrandingKey, string>

  for (const row of rows) {
    result[row.kunci as BrandingKey] = row.nilai ?? ''
  }

  return result
}

export async function updateBranding(values: Partial<Record<BrandingKey, string>>) {
  const user = await requireRole(['admin'])

  const entries = Object.entries(values).filter(
    ([k]) => (BRANDING_KEYS as readonly string[]).includes(k)
  ) as [BrandingKey, string][]

  await prisma.$transaction(
    entries.map(([kunci, nilai]) =>
      prisma.systemSetting.upsert({
        where: { tenantId_kunci: { tenantId: user.tenantId, kunci } },
        update: { nilai },
        create: { tenantId: user.tenantId, kunci, nilai, tipe: 'text' },
      })
    )
  )

  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      aksi: 'UPDATE',
      modul: 'system_settings',
      dataBaru: values,
    },
  })

  revalidatePath(SETTINGS_PATH)
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}
