'use client'

import { useTransition } from 'react'
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { exportRekapExcel, exportRekapPDF } from '@/actions/export-reports'

function downloadBase64File(base64: string, filename: string, mime: string) {
  const link = document.createElement('a')
  link.href = `data:${mime};base64,${base64}`
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function ExportButtons() {
  const [isExportingExcel, startExcel] = useTransition()
  const [isExportingPdf, startPdf] = useTransition()

  function handleExportExcel() {
    startExcel(async () => {
      const result = await exportRekapExcel()
      if (result.success && result.base64 && result.filename && result.mime) {
        downloadBase64File(result.base64, result.filename, result.mime)
      } else {
        alert(result.error ?? 'Gagal mengekspor Excel.')
      }
    })
  }

  function handleExportPdf() {
    startPdf(async () => {
      const result = await exportRekapPDF()
      if (result.success && result.base64 && result.filename && result.mime) {
        downloadBase64File(result.base64, result.filename, result.mime)
      } else {
        alert(result.error ?? 'Gagal mengekspor PDF.')
      }
    })
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportExcel}
        disabled={isExportingExcel}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
      >
        {isExportingExcel ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
        )}
        Export Excel
      </button>
      <button
        onClick={handleExportPdf}
        disabled={isExportingPdf}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
      >
        {isExportingPdf ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 text-red-600" />
        )}
        Export PDF
      </button>
    </div>
  )
}
