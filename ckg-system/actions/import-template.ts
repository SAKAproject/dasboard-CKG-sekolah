'use server'

import ExcelJS from 'exceljs'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

/**
 * Membuat file template Excel untuk import data siswa massal.
 * Mengembalikan base64 string agar bisa di-download langsung dari client
 * tanpa perlu endpoint route handler terpisah.
 */
export async function generateImportTemplate(): Promise<{
  success: boolean
  base64?: string
  filename?: string
  error?: string
}> {
  try {
    const user = await requireRole(['admin', 'petugas_entri'])

    const [schools, classes] = await Promise.all([
      prisma.school.findMany({
        where: { tenantId: user.tenantId, statusAktif: true },
        select: { namaSekolah: true, kodeSekolah: true },
        orderBy: { namaSekolah: 'asc' },
      }),
      prisma.class.findMany({
        where: { tenantId: user.tenantId },
        select: {
          namaKelas: true,
          klasifikasiKelas: true,
          school: { select: { namaSekolah: true } },
        },
        orderBy: [{ school: { namaSekolah: 'asc' } }, { namaKelas: 'asc' }],
      }),
    ])

    const wb = new ExcelJS.Workbook()
    wb.creator = 'Sistem CKG'
    wb.created = new Date()

    // ───────────── SHEET PETUNJUK ─────────────
    const shPetunjuk = wb.addWorksheet('PETUNJUK')
    shPetunjuk.columns = [{ width: 4 }, { width: 90 }]
    const petunjukRows: [string, string][] = [
      ['', 'TEMPLATE IMPORT DATA SISWA — PROGRAM CKG'],
      ['', ''],
      ['1.', 'Isi data pada sheet "DATA SISWA". Jangan mengubah urutan atau nama kolom.'],
      ['2.', 'Kolom bertanda (*) WAJIB diisi: NIK, Nama Lengkap, Jenis Kelamin, Nama Sekolah, Kelas.'],
      ['3.', 'NIK harus 16 digit angka dan harus UNIK (tidak boleh duplikat / sudah terdaftar).'],
      ['4.', 'NISN bersifat opsional, jika diisi harus 10 digit angka.'],
      ['5.', 'Format Tanggal Lahir: YYYY-MM-DD (contoh: 2015-08-17).'],
      ['6.', 'Jenis Kelamin diisi persis: "Laki-laki" atau "Perempuan".'],
      ['7.', 'Nama Sekolah harus sama persis dengan daftar di sheet "REFERENSI SEKOLAH".'],
      ['8.', 'Kelas harus sama persis dengan daftar di sheet "REFERENSI KELAS" untuk sekolah terkait.'],
      ['9.', 'Format Nomor HP: diawali 08 atau +62, tanpa spasi (contoh: 081234567890).'],
      ['10.', 'Setelah file diisi, unggah kembali lewat menu Import Data → pilih file ini.'],
      ['11.', 'Sistem akan menampilkan pratinjau data valid dan data error sebelum disimpan.'],
      ['', ''],
      ['', 'CONTOH DATA YANG BENAR:'],
      ['', '3201012508150001 | Ahmad Fauzi | Laki-laki | 2015-08-25 | SD Negeri 1 Demo | 1 A'],
    ]
    petunjukRows.forEach((row, i) => {
      const r = shPetunjuk.addRow(row)
      if (i === 0) r.font = { bold: true, size: 13 }
      if (row[1].startsWith('CONTOH')) r.font = { italic: true }
    })

    // ───────────── SHEET DATA SISWA ─────────────
    const shData = wb.addWorksheet('DATA SISWA')
    const headers = [
      'NIK (*)', 'NISN', 'Nama Lengkap (*)', 'Jenis Kelamin (*)',
      'Tempat Lahir', 'Tanggal Lahir (YYYY-MM-DD)', 'Agama', 'Golongan Darah',
      'Nama Sekolah (*)', 'Kelas (*)', 'Alamat Lengkap',
      'Nama Wali', 'No. HP Wali', 'Email',
    ]
    shData.addRow(headers)
    shData.getRow(1).font = { bold: true }
    shData.getRow(1).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' },
    }
    shData.columns = headers.map(() => ({ width: 20 }))

    // Baris contoh
    shData.addRow([
      '3201012508150001', '0012345678', 'Ahmad Fauzi', 'Laki-laki',
      'Jakarta', '2015-08-25', 'Islam', 'O',
      schools[0]?.namaSekolah ?? 'SD Negeri 1 Demo', '1 A', 'Jl. Contoh No. 1',
      'Budi Santoso', '081234567890', 'ortu@email.com',
    ])
    shData.getRow(2).font = { italic: true, color: { argb: 'FF888888' } }

    // ───────────── SHEET REFERENSI SEKOLAH ─────────────
    const shSekolah = wb.addWorksheet('REFERENSI SEKOLAH')
    shSekolah.addRow(['Nama Sekolah', 'Kode Sekolah (NPSN)'])
    shSekolah.getRow(1).font = { bold: true }
    shSekolah.columns = [{ width: 35 }, { width: 20 }]
    for (const s of schools) {
      shSekolah.addRow([s.namaSekolah, s.kodeSekolah ?? ''])
    }

    // ───────────── SHEET REFERENSI KELAS ─────────────
    const shKelas = wb.addWorksheet('REFERENSI KELAS')
    shKelas.addRow(['Nama Sekolah', 'Kelas (format: "1 A", "2 B", dst)'])
    shKelas.getRow(1).font = { bold: true }
    shKelas.columns = [{ width: 35 }, { width: 30 }]
    for (const c of classes) {
      const labelKelas = `${c.namaKelas}${c.klasifikasiKelas ? ` ${c.klasifikasiKelas}` : ''}`
      shKelas.addRow([c.school.namaSekolah, labelKelas])
    }

    const buffer = await wb.xlsx.writeBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    return {
      success: true,
      base64,
      filename: `Template_Import_Siswa_CKG_${new Date().toISOString().slice(0, 10)}.xlsx`,
    }
  } catch (err) {
    console.error('generateImportTemplate error:', err)
    return { success: false, error: 'Gagal membuat template Excel.' }
  }
}
