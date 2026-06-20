'use client'

import { useState, useTransition, useRef } from 'react'
import {
  Download, Upload, CheckCircle2, XCircle, Loader2,
  FileSpreadsheet, AlertTriangle, ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateImportTemplate } from '@/actions/import-template'
import {
  previewImportExcel, confirmImportExcel, generateErrorExcel,
  type ImportRowResult,
} from '@/actions/import-students'

function downloadBase64File(base64: string, filename: string) {
  const link = document.createElement('a')
  link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

type Step = 'upload' | 'preview' | 'done'

export function ImportClient() {
  const [step, setStep] = useState<Step>('upload')
  const [isPending, startTransition] = useTransition()
  const [isDownloadingTemplate, startDownloadTemplate] = useTransition()
  const [rows, setRows] = useState<ImportRowResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [importedCount, setImportedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validRows = rows.filter((r) => r.status === 'valid')
  const errorRows = rows.filter((r) => r.status === 'error')

  function handleDownloadTemplate() {
    startDownloadTemplate(async () => {
      const result = await generateImportTemplate()
      if (result.success && result.base64 && result.filename) {
        downloadBase64File(result.base64, result.filename)
      } else {
        alert(result.error ?? 'Gagal membuat template.')
      }
    })
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setError(null)

    startTransition(async () => {
      const base64 = await fileToBase64(file)
      const result = await previewImportExcel(base64)
      if (result.success && result.rows) {
        setRows(result.rows)
        setStep('preview')
      } else {
        setError(result.error ?? 'Gagal memproses file.')
      }
    })
  }

  function handleConfirmImport() {
    startTransition(async () => {
      const data = validRows.map((r) => r.data!).filter(Boolean)
      const result = await confirmImportExcel(data)
      if (result.success) {
        setImportedCount(result.imported ?? 0)
        setStep('done')
      } else {
        setError(result.error ?? 'Gagal menyimpan data.')
      }
    })
  }

  function handleDownloadErrors() {
    startTransition(async () => {
      const result = await generateErrorExcel(errorRows)
      if (result.success && result.base64 && result.filename) {
        downloadBase64File(result.base64, result.filename)
      }
    })
  }

  function handleReset() {
    setStep('upload')
    setRows([])
    setError(null)
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ───────────── STEP: UPLOAD ─────────────
  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Langkah 1: Unduh Template</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Template berisi sheet Petunjuk, Data Siswa, Referensi Sekolah, dan
                Referensi Kelas sesuai data yang sudah terdaftar.
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isDownloadingTemplate ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Template Excel
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Langkah 2: Unggah File Terisi</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Pilih file Excel yang sudah diisi sesuai petunjuk pada template.
              </p>
            </div>
          </div>

          <label
            className={cn(
              'flex flex-col items-center justify-center gap-2 px-6 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
              isPending
                ? 'border-border opacity-50 cursor-not-allowed'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isPending}
              className="hidden"
            />
            {isPending ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Memproses {fileName}...</p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-medium">Klik untuk pilih file Excel</p>
                <p className="text-xs text-muted-foreground">Format .xlsx atau .xls</p>
              </>
            )}
          </label>

          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ───────────── STEP: PREVIEW ─────────────
  if (step === 'preview') {
    return (
      <div className="space-y-5">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Unggah file lain
        </button>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {validRows.length}
              </p>
              <p className="text-xs text-green-700/80 dark:text-green-400/80">Data Valid</p>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {errorRows.length}
              </p>
              <p className="text-xs text-red-700/80 dark:text-red-400/80">Data Error</p>
            </div>
          </div>
        </div>

        {errorRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Detail Data Error</h3>
              <button
                onClick={handleDownloadErrors}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Download Excel Error
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Baris</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">NIK</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Nama</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {errorRows.map((r) => (
                    <tr key={r.baris} className="hover:bg-muted/30">
                      <td className="px-3 py-2 text-muted-foreground">{r.baris}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.nik}</td>
                      <td className="px-3 py-2">{r.namaLengkap}</td>
                      <td className="px-3 py-2 text-destructive text-xs">{r.pesanError}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {validRows.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Pratinjau Data Valid (akan disimpan)</h3>
            <div className="overflow-x-auto rounded-xl border border-border max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Baris</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">NIK</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Nama</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Jenis Kelamin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {validRows.slice(0, 50).map((r) => (
                    <tr key={r.baris} className="hover:bg-muted/30">
                      <td className="px-3 py-2 text-muted-foreground">{r.baris}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.nik}</td>
                      <td className="px-3 py-2">{r.namaLengkap}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.data?.jenisKelamin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validRows.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-2 bg-muted/30">
                  + {validRows.length - 50} baris lainnya
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleConfirmImport}
            disabled={isPending || validRows.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan {validRows.length} Data Valid ke Database
          </button>
        </div>
      </div>
    )
  }

  // ───────────── STEP: DONE ─────────────
  return (
    <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h3 className="font-bold text-lg">Import Berhasil!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {importedCount} data siswa berhasil disimpan ke database.
        </p>
      </div>
      <button
        onClick={handleReset}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
      >
        Import File Lain
      </button>
    </div>
  )
}
