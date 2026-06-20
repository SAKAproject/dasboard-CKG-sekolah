'use client'

import { useMemo } from 'react'
import type { ScreeningQuestionDTO } from '@/types'
import { cn } from '@/lib/utils'

type QuestionProps = {
  question: ScreeningQuestionDTO
  value: string | string[] | undefined
  onChange: (questionId: string, value: string | string[]) => void
  disabled?: boolean
}

/** Komponen untuk merender satu pertanyaan skrining secara dinamis berdasarkan tipe_jawaban */
function DynamicQuestion({ question, value, onChange, disabled }: QuestionProps) {
  const { id, teksPertanyaan, tipeJawaban, opsiJawaban, wajib } = question

  const baseInputClass = cn(
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  )

  switch (tipeJawaban) {
    case 'ya_tidak':
      return (
        <div className="flex gap-3">
          {['Ya', 'Tidak'].map((opt) => (
            <label
              key={opt}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm',
                value === opt
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <input
                type="radio"
                name={id}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(id, opt)}
                disabled={disabled}
                className="sr-only"
                required={wajib}
              />
              {opt}
            </label>
          ))}
        </div>
      )

    case 'pilihan_ganda':
      return (
        <div className="flex flex-col gap-2">
          {(opsiJawaban ?? []).map((opt) => (
            <label
              key={opt}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm',
                value === opt
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <input
                type="radio"
                name={id}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(id, opt)}
                disabled={disabled}
                className="sr-only"
                required={wajib}
              />
              {opt}
            </label>
          ))}
        </div>
      )

    case 'dropdown':
      return (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(id, e.target.value)}
          disabled={disabled}
          required={wajib}
          className={baseInputClass}
        >
          <option value="">-- Pilih --</option>
          {(opsiJawaban ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )

    case 'checkbox':
      return (
        <div className="flex flex-col gap-2">
          {(opsiJawaban ?? []).map((opt) => {
            const selected = Array.isArray(value) ? value : []
            const isChecked = selected.includes(opt)
            return (
              <label
                key={opt}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm',
                  isChecked
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <input
                  type="checkbox"
                  value={opt}
                  checked={isChecked}
                  onChange={(e) => {
                    const prev = Array.isArray(value) ? value : []
                    const next = e.target.checked
                      ? [...prev, opt]
                      : prev.filter((v) => v !== opt)
                    onChange(id, next)
                  }}
                  disabled={disabled}
                  className="sr-only"
                />
                {opt}
              </label>
            )
          })}
        </div>
      )

    case 'angka':
      return (
        <input
          type="number"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(id, e.target.value)}
          disabled={disabled}
          required={wajib}
          className={baseInputClass}
          min={0}
        />
      )

    case 'tanggal':
      return (
        <input
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(id, e.target.value)}
          disabled={disabled}
          required={wajib}
          className={baseInputClass}
        />
      )

    case 'teks':
    default:
      return (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(id, e.target.value)}
          disabled={disabled}
          required={wajib}
          rows={3}
          className={cn(baseInputClass, 'resize-none')}
        />
      )
  }
}

type FormSectionProps = {
  namaKategori: string
  nomorUrut: number
  totalSeksi: number
  questions: ScreeningQuestionDTO[]
  answers: Record<string, string | string[]>
  onAnswerChange: (questionId: string, value: string | string[]) => void
  jenisKelamin?: string
  kelas?: string
}

/**
 * Menampilkan satu seksi pertanyaan skrining (satu kategori).
 * Pertanyaan difilter secara dinamis berdasarkan kondisi_tampil (kelas, jenis_kelamin).
 */
export function FormSection({
  namaKategori,
  nomorUrut,
  totalSeksi,
  questions,
  answers,
  onAnswerChange,
  jenisKelamin,
  kelas,
}: FormSectionProps) {
  // Filter pertanyaan berdasarkan kondisi_tampil
  const visibleQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (!q.kondisiTampil) return true
      const cond = q.kondisiTampil

      if (cond.jenis_kelamin && jenisKelamin) {
        if (cond.jenis_kelamin !== jenisKelamin) return false
      }
      if (cond.kelas && kelas) {
        if (!cond.kelas.includes(kelas)) return false
      }
      return true
    })
  }, [questions, jenisKelamin, kelas])

  if (visibleQuestions.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
          {nomorUrut}
        </span>
        <div>
          <h3 className="font-semibold text-foreground">{namaKategori}</h3>
          <p className="text-xs text-muted-foreground">
            Seksi {nomorUrut} dari {totalSeksi}
          </p>
        </div>
      </div>

      <div className="space-y-5 pl-10">
        {visibleQuestions.map((q) => (
          <div key={q.id} className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              <span className="text-muted-foreground mr-2">Q{q.nomorPertanyaan}.</span>
              {q.teksPertanyaan}
              {q.wajib && <span className="text-destructive ml-1">*</span>}
            </label>
            <DynamicQuestion
              question={q}
              value={answers[q.id]}
              onChange={onAnswerChange}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
