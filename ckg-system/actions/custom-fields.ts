'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const CUSTOM_FIELD_PATH = '/dashboard/admin/custom-field'

export async function getCustomFields() {
  const user = await requireRole(['admin'])

  return prisma.customField.findMany({
    where: { tenantId: user.tenantId },
    orderBy: [{ modul: 'asc' }, { nomorUrut: 'asc' }],
  })
}

export type CustomFieldInput = {
  modul: 'student' | 'parent' | 'health'
  namaField: string
  label: string
  tipeField: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox'
  opsiPilihan?: string[]
  wajib: boolean
}

function slugifyFieldName(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export async function createCustomField(input: CustomFieldInput) {
  const user = await requireRole(['admin'])

  const namaField = input.namaField || slugifyFieldName(input.label)

  const existing = await prisma.customField.findFirst({
    where: { tenantId: user.tenantId, modul: input.modul, namaField },
  })
  if (existing) {
    return {
      success: false,
      error: `Field dengan nama "${namaField}" sudah ada di modul ini.`,
    }
  }

  const maxUrut = await prisma.customField.aggregate({
    where: { tenantId: user.tenantId, modul: input.modul },
    _max: { nomorUrut: true },
  })

  const field = await prisma.customField.create({
    data: {
      tenantId: user.tenantId,
      modul: input.modul,
      namaField,
      label: input.label,
      tipeField: input.tipeField,
      opsiPilihan: input.opsiPilihan?.length ? input.opsiPilihan : undefined,
      wajib: input.wajib,
      nomorUrut: (maxUrut._max.nomorUrut ?? 0) + 1,
      aktif: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      aksi: 'CREATE',
      modul: 'custom_fields',
      recordId: field.id,
      dataBaru: input,
    },
  })

  revalidatePath(CUSTOM_FIELD_PATH)
  return { success: true, fieldId: field.id }
}

export async function toggleCustomFieldStatus(fieldId: string, aktif: boolean) {
  const user = await requireRole(['admin'])

  await prisma.customField.update({
    where: { id: fieldId, tenantId: user.tenantId },
    data: { aktif },
  })

  revalidatePath(CUSTOM_FIELD_PATH)
  return { success: true }
}

export async function deleteCustomField(fieldId: string) {
  const user = await requireRole(['admin'])

  // Soft-delete agar nilai historis di custom_field_values tetap utuh
  await prisma.customField.update({
    where: { id: fieldId, tenantId: user.tenantId },
    data: { aktif: false },
  })

  revalidatePath(CUSTOM_FIELD_PATH)
  return { success: true }
}
