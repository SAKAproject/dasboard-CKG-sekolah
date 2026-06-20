'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { validateNIK } from '@/lib/utils'
import type { SubmitFormCKGInput } from '@/types'

type SubmitResult =
  | { success: true; submissionId: string }
  | { success: false; error: string }

/**
 * Submit form CKG dari sisi siswa/orang tua. Endpoint ini PUBLIK (tanpa login),
 * diakses lewat link form sekolah. Tidak ada query SELECT data siswa lain di sini —
 * hanya upsert data milik NIK yang sedang mengisi, sesuai batasan RLS
 * "Siswa tidak bisa baca submission lain" pada desain database.
 */
export async function submitFormCKG(input: SubmitFormCKGInput): Promise<SubmitResult> {
  try {
    if (!validateNIK(input.student.nik)) {
      return { success: false, error: 'NIK harus berupa 16 digit angka.' }
    }

    if (!input.consent) {
      // Tetap simpan sebagai record penolakan untuk rekap, tanpa data skrining
      const submission = await prisma.formSubmission.create({
        data: {
          tenantId: input.tenantId,
          informedConsent: false,
          alasanTidakSetuju: input.alasanTidakSetuju ?? null,
          statusPengisian: 'submitted',
          submittedAt: new Date(),
        },
      })
      return { success: true, submissionId: submission.id }
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Upsert siswa berdasarkan NIK (idempotent — mencegah duplikasi jika diisi ulang)
      const student = await tx.student.upsert({
        where: { nik: input.student.nik },
        update: {
          tenantId: input.tenantId,
          nisn: input.student.nisn,
          namaLengkap: input.student.namaLengkap,
          jenisKelamin: input.student.jenisKelamin,
          tempatLahir: input.student.tempatLahir,
          tanggalLahir: input.student.tanggalLahir
            ? new Date(input.student.tanggalLahir)
            : null,
          agama: input.student.agama,
          golonganDarah: input.student.golonganDarah,
          disabilitas: input.student.disabilitas ?? 'Tidak',
          schoolId: input.student.schoolId,
          classId: input.student.classId,
          alamatLengkap: input.student.alamatLengkap,
          kelurahanDomisili: input.student.kelurahanDomisili,
          kecamatanDomisili: input.student.kecamatanDomisili,
          kabupatenDomisili: input.student.kabupatenDomisili,
          namaWali: input.student.namaWali,
          nikWali: input.student.nikWali,
          tanggalLahirWali: input.student.tanggalLahirWali
            ? new Date(input.student.tanggalLahirWali)
            : null,
          alamatWali: input.student.alamatWali,
          nomorHp: input.student.nomorHp,
          emailSiswa: input.student.emailSiswa,
        },
        create: {
          tenantId: input.tenantId,
          nik: input.student.nik,
          nisn: input.student.nisn,
          namaLengkap: input.student.namaLengkap,
          jenisKelamin: input.student.jenisKelamin,
          tempatLahir: input.student.tempatLahir,
          tanggalLahir: input.student.tanggalLahir
            ? new Date(input.student.tanggalLahir)
            : null,
          agama: input.student.agama,
          golonganDarah: input.student.golonganDarah,
          disabilitas: input.student.disabilitas ?? 'Tidak',
          schoolId: input.student.schoolId,
          classId: input.student.classId,
          alamatLengkap: input.student.alamatLengkap,
          kelurahanDomisili: input.student.kelurahanDomisili,
          kecamatanDomisili: input.student.kecamatanDomisili,
          kabupatenDomisili: input.student.kabupatenDomisili,
          namaWali: input.student.namaWali,
          nikWali: input.student.nikWali,
          tanggalLahirWali: input.student.tanggalLahirWali
            ? new Date(input.student.tanggalLahirWali)
            : null,
          alamatWali: input.student.alamatWali,
          nomorHp: input.student.nomorHp,
          emailSiswa: input.student.emailSiswa,
        },
      })

      const submission = await tx.formSubmission.create({
        data: {
          tenantId: input.tenantId,
          studentId: student.id,
          informedConsent: true,
          statusPengisian: 'submitted',
          progressPersen: 100,
          submittedAt: new Date(),
        },
      })

      const answersToInsert = input.answers.filter(
        (a) => a.jawaban !== undefined || a.jawabanArray !== undefined
      )

      if (answersToInsert.length > 0) {
        await tx.screeningAnswer.createMany({
          data: answersToInsert.map((a) => ({
            tenantId: input.tenantId,
            submissionId: submission.id,
            questionId: a.questionId,
            jawaban: a.jawaban ?? null,
            jawabanArray: a.jawabanArray ?? undefined,
          })),
        })
      }

      return submission
    })

    // Notifikasi sukses ke siswa/ortu — TIDAK mengembalikan data kesehatan apapun ke sisi siswa
    // (lihat catatan keamanan: siswa hanya menerima konfirmasi, bukan rincian jawaban)

    return { success: true, submissionId: result.id }
  } catch (err) {
    console.error('submitFormCKG error:', err)
    return {
      success: false,
      error: 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.',
    }
  }
}
