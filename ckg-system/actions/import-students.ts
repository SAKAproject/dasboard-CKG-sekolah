'use server'

import ExcelJS from 'exceljs'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { validateNIK, validateNISN } from '@/lib/utils'

export type ImportRowResult = {
  baris: number
  nik: string
  namaLengkap: string
  status: 'valid' | 'error'
  pesanError?: string
  data?: {
    nik: string
    nisn?: string
    namaLengkap: string
    jenisKelamin: string
    tempatLahir?: string
    tanggalLahir?: string
    agama?: string
    golonganDarah?: string
    schoolId: string
    classId: string
    alamatLengkap?: string
    namaWali?: string
    nomorHp?: string
    emailSiswa?: string
  }
}

export type ImportPreviewResult = {
  success: boolean
  error?: string
  rows?: ImportRowResult[]
  totalValid?: number
  totalError?: number
}

const HP_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,10}$/
const TANGGAL_REGEX = /^\d{4}-\d{2}-\d{2}$/

function cellToString(cell: ExcelJS.CellValue): string {
  if (cell === null || cell === undefined) return ''
  if (cell instanceof Date) return cell.toISOString().slice(0, 10)
  if (typeof cell === 'object' && 'text' in cell) return String(cell.text ?? '')
  if (typeof cell === 'object' && 'result' in cell) return String(cell.result ?? '')
  return String(cell).trim()
}

/**
 * Parsing dan validasi file Excel yang diunggah, TANPA menyimpan ke database.
 * Hasilnya ditampilkan sebagai pratinjau (data valid vs data error) sebelum
 * admin/petugas mengonfirmasi penyimpanan — sesuai alur "Preview Data" pada
 * desain sistem (Bagian 9 SISTEM_CKG_DESAIN_LENGKAP.md).
 */
export async function previewImportExcel(
  base64File: string
): Promise<ImportPreviewResult> {
  try {
    const user = await requireRole(['admin', 'petugas_entri'])

    const buffer = Buffer.from(base64File, 'base64')
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer as unknown as ArrayBuffer)

    const sheet = wb.getWorksheet('DATA SISWA')
    if (!sheet) {
      return {
        success: false,
        error: 'Sheet "DATA SISWA" tidak ditemukan. Gunakan template resmi.',
      }
    }

    // Ambil referensi sekolah & kelas untuk validasi
    const [schools, classes] = await Promise.all([
      prisma.school.findMany({
        where: { tenantId: user.tenantId, statusAktif: true },
        select: { id: true, namaSekolah: true },
      }),
      prisma.class.findMany({
        where: { tenantId: user.tenantId },
        select: { id: true, namaKelas: true, klasifikasiKelas: true, schoolId: true },
      }),
    ])

    type SchoolRef = { id: string; namaSekolah: string }
    type ClassRef = {
      id: string
      namaKelas: string
      klasifikasiKelas: string | null
      schoolId: string
    }

    const schoolByName = new Map<string, SchoolRef>(
      (schools as SchoolRef[]).map((s) => [s.namaSekolah.trim().toLowerCase(), s])
    )

    const existingNiks = new Set(
      (
        await prisma.student.findMany({
          where: { tenantId: user.tenantId },
          select: { nik: true },
        })
      ).map((s: { nik: string }) => s.nik)
    )

    const results: ImportRowResult[] = []
    const seenNikInFile = new Set<string>()

    // Baris 1 = header, baris 2 = contoh (dilewati jika kolom NIK kosong/contoh)
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // header

      const nik = cellToString(row.getCell(1).value)
      const nisn = cellToString(row.getCell(2).value)
      const namaLengkap = cellToString(row.getCell(3).value)
      const jenisKelamin = cellToString(row.getCell(4).value)
      const tempatLahir = cellToString(row.getCell(5).value)
      const tanggalLahirRaw = cellToString(row.getCell(6).value)
      const agama = cellToString(row.getCell(7).value)
      const golonganDarah = cellToString(row.getCell(8).value)
      const namaSekolah = cellToString(row.getCell(9).value)
      const kelasRaw = cellToString(row.getCell(10).value)
      const alamatLengkap = cellToString(row.getCell(11).value)
      const namaWali = cellToString(row.getCell(12).value)
      const nomorHp = cellToString(row.getCell(13).value)
      const emailSiswa = cellToString(row.getCell(14).value)

      // Lewati baris kosong sepenuhnya
      if (!nik && !namaLengkap) return

      const errors: string[] = []

      if (!validateNIK(nik)) {
        errors.push('NIK harus 16 digit angka')
      } else if (existingNiks.has(nik)) {
        errors.push('NIK sudah terdaftar di sistem')
      } else if (seenNikInFile.has(nik)) {
        errors.push('NIK duplikat dalam file ini')
      }
      seenNikInFile.add(nik)

      if (nisn && !validateNISN(nisn)) {
        errors.push('NISN harus 10 digit angka')
      }

      if (!namaLengkap) errors.push('Nama lengkap wajib diisi')

      if (!['Laki-laki', 'Perempuan'].includes(jenisKelamin)) {
        errors.push('Jenis kelamin harus "Laki-laki" atau "Perempuan"')
      }

      if (tanggalLahirRaw && !TANGGAL_REGEX.test(tanggalLahirRaw)) {
        errors.push('Format tanggal lahir harus YYYY-MM-DD')
      }

      if (nomorHp && !HP_REGEX.test(nomorHp.replace(/\s+/g, ''))) {
        errors.push('Format nomor HP tidak valid')
      }

      const school = schoolByName.get(namaSekolah.trim().toLowerCase())
      if (!namaSekolah) {
        errors.push('Nama sekolah wajib diisi')
      } else if (!school) {
        errors.push(`Sekolah "${namaSekolah}" tidak ditemukan di referensi`)
      }

      let matchedClass: ClassRef | undefined
      if (school && kelasRaw) {
        const parts = kelasRaw.trim().split(/\s+/)
        const namaKelas = parts[0] ?? ''
        const klasifikasi = parts.slice(1).join(' ') || null
        matchedClass = (classes as ClassRef[]).find(
          (c) =>
            c.schoolId === school.id &&
            c.namaKelas === namaKelas &&
            (c.klasifikasiKelas ?? null) === klasifikasi
        )
        if (!matchedClass) {
          errors.push(`Kelas "${kelasRaw}" tidak ditemukan di sekolah "${namaSekolah}"`)
        }
      } else if (!kelasRaw) {
        errors.push('Kelas wajib diisi')
      }

      if (errors.length > 0) {
        results.push({
          baris: rowNumber,
          nik: nik || '-',
          namaLengkap: namaLengkap || '-',
          status: 'error',
          pesanError: errors.join('; '),
        })
        return
      }

      results.push({
        baris: rowNumber,
        nik,
        namaLengkap,
        status: 'valid',
        data: {
          nik,
          nisn: nisn || undefined,
          namaLengkap,
          jenisKelamin,
          tempatLahir: tempatLahir || undefined,
          tanggalLahir: tanggalLahirRaw || undefined,
          agama: agama || undefined,
          golonganDarah: golonganDarah || undefined,
          schoolId: school!.id,
          classId: matchedClass!.id,
          alamatLengkap: alamatLengkap || undefined,
          namaWali: namaWali || undefined,
          nomorHp: nomorHp || undefined,
          emailSiswa: emailSiswa || undefined,
        },
      })
    })

    return {
      success: true,
      rows: results,
      totalValid: results.filter((r) => r.status === 'valid').length,
      totalError: results.filter((r) => r.status === 'error').length,
    }
  } catch (err) {
    console.error('previewImportExcel error:', err)
    return {
      success: false,
      error: 'Gagal membaca file. Pastikan file sesuai format template.',
    }
  }
}

/**
 * Menyimpan baris-baris yang valid ke database setelah dikonfirmasi admin/petugas.
 */
export async function confirmImportExcel(
  validRows: NonNullable<ImportRowResult['data']>[]
): Promise<{ success: boolean; imported?: number; error?: string }> {
  try {
    const user = await requireRole(['admin', 'petugas_entri'])

    let imported = 0
    for (const row of validRows) {
      await prisma.student.create({
        data: {
          tenantId: user.tenantId,
          nik: row.nik,
          nisn: row.nisn,
          namaLengkap: row.namaLengkap,
          jenisKelamin: row.jenisKelamin,
          tempatLahir: row.tempatLahir,
          tanggalLahir: row.tanggalLahir ? new Date(row.tanggalLahir) : undefined,
          agama: row.agama,
          golonganDarah: row.golonganDarah,
          schoolId: row.schoolId,
          classId: row.classId,
          alamatLengkap: row.alamatLengkap,
          namaWali: row.namaWali,
          nomorHp: row.nomorHp,
          emailSiswa: row.emailSiswa,
        },
      })
      imported++
    }

    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        aksi: 'IMPORT',
        modul: 'students',
        dataBaru: { totalImported: imported },
      },
    })

    return { success: true, imported }
  } catch (err) {
    console.error('confirmImportExcel error:', err)
    return { success: false, error: 'Gagal menyimpan data ke database.' }
  }
}

/**
 * Membuat file Excel berisi baris-baris yang error, untuk diunduh dan diperbaiki.
 */
export async function generateErrorExcel(
  errorRows: ImportRowResult[]
): Promise<{ success: boolean; base64?: string; filename?: string; error?: string }> {
  try {
    await requireRole(['admin', 'petugas_entri'])

    const wb = new ExcelJS.Workbook()
    const sheet = wb.addWorksheet('DATA ERROR')
    sheet.addRow(['Baris', 'NIK', 'Nama Lengkap', 'Pesan Error'])
    sheet.getRow(1).font = { bold: true }
    sheet.columns = [{ width: 8 }, { width: 20 }, { width: 30 }, { width: 60 }]

    for (const row of errorRows) {
      sheet.addRow([row.baris, row.nik, row.namaLengkap, row.pesanError ?? ''])
    }

    const buffer = await wb.xlsx.writeBuffer()
    return {
      success: true,
      base64: Buffer.from(buffer).toString('base64'),
      filename: `Data_Error_Import_${new Date().toISOString().slice(0, 10)}.xlsx`,
    }
  } catch (err) {
    console.error('generateErrorExcel error:', err)
    return { success: false, error: 'Gagal membuat file error.' }
  }
}
