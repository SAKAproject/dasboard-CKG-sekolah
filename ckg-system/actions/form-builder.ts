'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const FORM_BUILDER_PATH = '/dashboard/admin/form-builder'

// ───────────────────────── KATEGORI ─────────────────────────

export async function getCategoriesWithQuestions() {
  const user = await requireRole(['admin'])

  return prisma.screeningCategory.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { nomorUrut: 'asc' },
    include: {
      questions: { orderBy: { nomorUrut: 'asc' } },
      _count: { select: { questions: true } },
    },
  })
}

export async function createCategory(input: {
  namaKategori: string
  kodeKategori: string
  deskripsi?: string
  targetKelas?: string
}) {
  const user = await requireRole(['admin'])

  const maxUrut = await prisma.screeningCategory.aggregate({
    where: { tenantId: user.tenantId },
    _max: { nomorUrut: true },
  })

  const category = await prisma.screeningCategory.create({
    data: {
      tenantId: user.tenantId,
      namaKategori: input.namaKategori,
      kodeKategori: input.kodeKategori,
      deskripsi: input.deskripsi,
      targetKelas: input.targetKelas ?? 'all',
      nomorUrut: (maxUrut._max.nomorUrut ?? 0) + 1,
      aktif: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      aksi: 'CREATE',
      modul: 'screening_categories',
      recordId: category.id,
      dataBaru: input,
    },
  })

  revalidatePath(FORM_BUILDER_PATH)
  return { success: true, categoryId: category.id }
}

export async function toggleCategoryStatus(categoryId: string, aktif: boolean) {
  const user = await requireRole(['admin'])

  await prisma.screeningCategory.update({
    where: { id: categoryId, tenantId: user.tenantId },
    data: { aktif },
  })

  revalidatePath(FORM_BUILDER_PATH)
  return { success: true }
}

export async function reorderCategory(categoryId: string, arah: 'naik' | 'turun') {
  const user = await requireRole(['admin'])

  const categories = await prisma.screeningCategory.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { nomorUrut: 'asc' },
  })

  const idx = categories.findIndex((c: (typeof categories)[number]) => c.id === categoryId)
  if (idx === -1) return { success: false, error: 'Kategori tidak ditemukan.' }

  const swapIdx = arah === 'naik' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= categories.length) {
    return { success: false, error: 'Tidak bisa dipindah lagi.' }
  }

  const current = categories[idx]
  const target = categories[swapIdx]
  if (!current || !target) return { success: false, error: 'Data tidak valid.' }

  await prisma.$transaction([
    prisma.screeningCategory.update({
      where: { id: current.id },
      data: { nomorUrut: target.nomorUrut },
    }),
    prisma.screeningCategory.update({
      where: { id: target.id },
      data: { nomorUrut: current.nomorUrut },
    }),
  ])

  revalidatePath(FORM_BUILDER_PATH)
  return { success: true }
}

// ───────────────────────── PERTANYAAN ─────────────────────────

export type QuestionFormInput = {
  categoryId: string
  nomorPertanyaan: number
  teksPertanyaan: string
  tipeJawaban: string
  opsiJawaban?: string[]
  wajib: boolean
  kondisiKelas?: string[]
  kondisiGender?: string
}

export async function createQuestion(input: QuestionFormInput) {
  const user = await requireRole(['admin'])

  const maxUrut = await prisma.screeningQuestion.aggregate({
    where: { categoryId: input.categoryId },
    _max: { nomorUrut: true },
  })

  const kondisiTampil: Record<string, unknown> = {}
  if (input.kondisiKelas?.length) kondisiTampil.kelas = input.kondisiKelas
  if (input.kondisiGender) kondisiTampil.jenis_kelamin = input.kondisiGender

  const question = await prisma.screeningQuestion.create({
    data: {
      tenantId: user.tenantId,
      categoryId: input.categoryId,
      nomorPertanyaan: input.nomorPertanyaan,
      teksPertanyaan: input.teksPertanyaan,
      tipeJawaban: input.tipeJawaban,
      opsiJawaban: input.opsiJawaban?.length ? input.opsiJawaban : undefined,
      wajib: input.wajib,
      kondisiTampil: Object.keys(kondisiTampil).length ? kondisiTampil : undefined,
      nomorUrut: (maxUrut._max.nomorUrut ?? 0) + 1,
      aktif: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      aksi: 'CREATE',
      modul: 'screening_questions',
      recordId: question.id,
      dataBaru: input,
    },
  })

  revalidatePath(FORM_BUILDER_PATH)
  return { success: true, questionId: question.id }
}

export async function updateQuestion(
  questionId: string,
  input: Partial<QuestionFormInput>
) {
  const user = await requireRole(['admin'])

  const kondisiTampil: Record<string, unknown> = {}
  if (input.kondisiKelas?.length) kondisiTampil.kelas = input.kondisiKelas
  if (input.kondisiGender) kondisiTampil.jenis_kelamin = input.kondisiGender

  await prisma.screeningQuestion.update({
    where: { id: questionId, tenantId: user.tenantId },
    data: {
      teksPertanyaan: input.teksPertanyaan,
      tipeJawaban: input.tipeJawaban,
      opsiJawaban: input.opsiJawaban?.length ? input.opsiJawaban : undefined,
      wajib: input.wajib,
      kondisiTampil: Object.keys(kondisiTampil).length ? kondisiTampil : undefined,
    },
  })

  revalidatePath(FORM_BUILDER_PATH)
  return { success: true }
}

export async function deleteQuestion(questionId: string) {
  const user = await requireRole(['admin'])

  // Soft-delete: nonaktifkan saja agar jawaban historis tetap utuh
  await prisma.screeningQuestion.update({
    where: { id: questionId, tenantId: user.tenantId },
    data: { aktif: false },
  })

  revalidatePath(FORM_BUILDER_PATH)
  return { success: true }
}

export async function toggleQuestionStatus(questionId: string, aktif: boolean) {
  const user = await requireRole(['admin'])

  await prisma.screeningQuestion.update({
    where: { id: questionId, tenantId: user.tenantId },
    data: { aktif },
  })

  revalidatePath(FORM_BUILDER_PATH)
  return { success: true }
}
