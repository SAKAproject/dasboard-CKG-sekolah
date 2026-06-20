'use server'

import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

type ExportResult = {
  success: boolean
  base64?: string
  filename?: string
  mime?: string
  error?: string
}

/**
 * Mengumpulkan data rekap lengkap: per sekolah, per kelas, per desa,
 * per golongan darah, per jenis kelamin, dan status pengisian form.
 * Dipakai bersama oleh export Excel maupun PDF agar datanya konsisten.
 */
async function collectRekapData(tenantId: string) {
  const students = await prisma.student.findMany({
    where: { tenantId, statusAktif: true },
    include: {
      school: { select: { namaSekolah: true, desa: { select: { namaDesa: true } } } },
      class: { select: { namaKelas: true, klasifikasiKelas: true } },
      formSubmissions: {
        where: { statusPengisian: 'submitted', informedConsent: true },
        select: { id: true, sudahDiinputSistem: true },
      },
    },
  })

  type StudentRow = (typeof students)[number]

  function groupCount(
    keyFn: (s: StudentRow) => string
  ): { label: string; total: number; sudahIsi: number }[] {
    const map = new Map<string, { total: number; sudahIsi: number }>()
    for (const s of students) {
      const key = keyFn(s) || 'Tidak Diketahui'
      const entry = map.get(key) ?? { total: 0, sudahIsi: 0 }
      entry.total++
      if (s.formSubmissions.length > 0) entry.sudahIsi++
      map.set(key, entry)
    }
    return Array.from(map.entries())
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  return {
    totalSiswa: students.length,
    rekapSekolah: groupCount((s) => s.school?.namaSekolah ?? '-'),
    rekapKelas: groupCount(
      (s) => `${s.school?.namaSekolah ?? '-'} — Kelas ${s.class?.namaKelas ?? '-'}${s.class?.klasifikasiKelas ? ` ${s.class.klasifikasiKelas}` : ''}`
    ),
    rekapDesa: groupCount((s) => s.school?.desa?.namaDesa ?? '-'),
    rekapGolonganDarah: groupCount((s) => s.golonganDarah ?? 'Tidak Diketahui'),
    rekapJenisKelamin: groupCount((s) => s.jenisKelamin),
    rekapStatusPengisian: [
      {
        label: 'Sudah Mengisi Form',
        total: students.filter((s: StudentRow) => s.formSubmissions.length > 0).length,
        sudahIsi: students.filter((s: StudentRow) =>
          s.formSubmissions.some(
            (f: StudentRow['formSubmissions'][number]) => f.sudahDiinputSistem
          )
        ).length,
      },
      {
        label: 'Belum Mengisi Form',
        total: students.filter((s: StudentRow) => s.formSubmissions.length === 0).length,
        sudahIsi: 0,
      },
    ],
  }
}

// ───────────────────────── EXPORT EXCEL ─────────────────────────

export async function exportRekapExcel(): Promise<ExportResult> {
  try {
    const user = await requireRole(['admin', 'guru'])
    const rekap = await collectRekapData(user.tenantId)

    const wb = new ExcelJS.Workbook()
    wb.creator = 'Sistem CKG'
    wb.created = new Date()

    function addRekapSheet(
      name: string,
      data: { label: string; total: number; sudahIsi: number }[],
      labelHeader: string
    ) {
      const sh = wb.addWorksheet(name)
      sh.addRow([labelHeader, 'Total Siswa', 'Sudah Isi Form', 'Belum Isi Form', '% Pengisian'])
      sh.getRow(1).font = { bold: true }
      sh.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
      sh.columns = [{ width: 40 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 14 }]

      for (const row of data) {
        const belum = row.total - row.sudahIsi
        const persen = row.total > 0 ? Math.round((row.sudahIsi / row.total) * 100) : 0
        sh.addRow([row.label, row.total, row.sudahIsi, belum, `${persen}%`])
      }

      const totalAll = data.reduce((a, r) => a + r.total, 0)
      const totalSudah = data.reduce((a, r) => a + r.sudahIsi, 0)
      const lastRow = sh.addRow([
        'TOTAL', totalAll, totalSudah, totalAll - totalSudah,
        totalAll > 0 ? `${Math.round((totalSudah / totalAll) * 100)}%` : '0%',
      ])
      lastRow.font = { bold: true }
    }

    addRekapSheet('Rekap Sekolah', rekap.rekapSekolah, 'Nama Sekolah')
    addRekapSheet('Rekap Kelas', rekap.rekapKelas, 'Sekolah — Kelas')
    addRekapSheet('Rekap Desa', rekap.rekapDesa, 'Nama Desa')
    addRekapSheet('Rekap Golongan Darah', rekap.rekapGolonganDarah, 'Golongan Darah')
    addRekapSheet('Rekap Jenis Kelamin', rekap.rekapJenisKelamin, 'Jenis Kelamin')
    addRekapSheet('Rekap Status Pengisian', rekap.rekapStatusPengisian, 'Status')

    const buffer = await wb.xlsx.writeBuffer()
    return {
      success: true,
      base64: Buffer.from(buffer).toString('base64'),
      filename: `Rekap_CKG_${new Date().toISOString().slice(0, 10)}.xlsx`,
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  } catch (err) {
    console.error('exportRekapExcel error:', err)
    return { success: false, error: 'Gagal membuat file Excel.' }
  }
}

// ───────────────────────── EXPORT PDF ─────────────────────────

export async function exportRekapPDF(): Promise<ExportResult> {
  try {
    const user = await requireRole(['admin', 'guru'])
    const rekap = await collectRekapData(user.tenantId)

    const chunks: Buffer[] = []
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    const finished = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('Laporan Rekap Program CKG', { align: 'center' })
    doc.fontSize(9).font('Helvetica').fillColor('#666666')
      .text(`Dicetak: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}`, { align: 'center' })
    doc.fillColor('#000000')
    doc.moveDown(1.2)

    doc.fontSize(11).font('Helvetica-Bold').text(`Total Siswa Terdaftar: ${rekap.totalSiswa}`)
    doc.moveDown(0.8)

    function drawTable(
      title: string,
      headerLabel: string,
      data: { label: string; total: number; sudahIsi: number }[]
    ) {
      if (doc.y > 680) doc.addPage()

      doc.fontSize(12).font('Helvetica-Bold').text(title)
      doc.moveDown(0.3)

      const colX = [40, 280, 360, 440, 510]
      const colW = [240, 80, 80, 70, 45]
      const headers = [headerLabel, 'Total', 'Sudah Isi', 'Belum', '%']

      doc.fontSize(9).font('Helvetica-Bold')
      headers.forEach((h, i) => {
        doc.text(h, colX[i] ?? 0, doc.y, { width: colW[i] ?? 60, continued: false })
      })
      const headerY = doc.y
      doc.moveTo(40, headerY + 12).lineTo(555, headerY + 12).strokeColor('#cccccc').stroke()
      doc.y = headerY + 16

      doc.font('Helvetica').fontSize(9)
      for (const row of data) {
        if (doc.y > 760) {
          doc.addPage()
          doc.y = 40
        }
        const belum = row.total - row.sudahIsi
        const persen = row.total > 0 ? Math.round((row.sudahIsi / row.total) * 100) : 0
        const rowY = doc.y
        doc.text(row.label, colX[0] ?? 0, rowY, { width: colW[0] ?? 240 })
        doc.text(String(row.total), colX[1] ?? 0, rowY, { width: colW[1] ?? 80 })
        doc.text(String(row.sudahIsi), colX[2] ?? 0, rowY, { width: colW[2] ?? 80 })
        doc.text(String(belum), colX[3] ?? 0, rowY, { width: colW[3] ?? 70 })
        doc.text(`${persen}%`, colX[4] ?? 0, rowY, { width: colW[4] ?? 45 })
        doc.y = rowY + 14
      }
      doc.moveDown(0.8)
    }

    drawTable('Rekap Per Sekolah', 'Nama Sekolah', rekap.rekapSekolah)
    drawTable('Rekap Per Desa', 'Nama Desa', rekap.rekapDesa)
    drawTable('Rekap Per Golongan Darah', 'Golongan Darah', rekap.rekapGolonganDarah)
    drawTable('Rekap Per Jenis Kelamin', 'Jenis Kelamin', rekap.rekapJenisKelamin)
    drawTable('Rekap Status Pengisian Form', 'Status', rekap.rekapStatusPengisian)

    doc.end()
    const buffer = await finished

    return {
      success: true,
      base64: buffer.toString('base64'),
      filename: `Rekap_CKG_${new Date().toISOString().slice(0, 10)}.pdf`,
      mime: 'application/pdf',
    }
  } catch (err) {
    console.error('exportRekapPDF error:', err)
    return { success: false, error: 'Gagal membuat file PDF.' }
  }
}
