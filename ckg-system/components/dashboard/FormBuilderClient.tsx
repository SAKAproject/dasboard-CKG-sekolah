'use client'

import { useState, useTransition } from 'react'
import {
  ChevronDown, ChevronUp, Plus, Power, Trash2, Loader2,
  ListChecks, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createCategory, toggleCategoryStatus, reorderCategory,
  createQuestion, toggleQuestionStatus, deleteQuestion,
  type QuestionFormInput,
} from '@/actions/form-builder'

type Question = {
  id: string
  nomorPertanyaan: number
  teksPertanyaan: string
  tipeJawaban: string
  opsiJawaban: unknown
  wajib: boolean
  aktif: boolean
  kondisiTampil: unknown
}

type Category = {
  id: string
  namaKategori: string
  kodeKategori: string
  targetKelas: string | null
  aktif: boolean
  nomorUrut: number
  questions: Question[]
}

const TIPE_JAWABAN_OPTIONS = [
  { value: 'ya_tidak', label: 'Ya / Tidak' },
  { value: 'pilihan_ganda', label: 'Pilihan Ganda' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox (Multi-pilih)' },
  { value: 'angka', label: 'Angka' },
  { value: 'tanggal', label: 'Tanggal' },
  { value: 'teks', label: 'Teks Bebas' },
]

const inputClass = cn(
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
)
const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'

function CategoryBadge({ aktif }: { aktif: boolean }) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium',
        aktif
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {aktif ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}

function NewCategoryModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [nama, setNama] = useState('')
  const [kode, setKode] = useState('')
  const [targetKelas, setTargetKelas] = useState('all')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function handleSubmit() {
    setError(null)
    if (!nama.trim() || !kode.trim()) {
      setError('Nama dan kode kategori wajib diisi.')
      return
    }
    startTransition(async () => {
      const result = await createCategory({
        namaKategori: nama,
        kodeKategori: kode,
        targetKelas,
      })
      if (result.success) {
        setNama('')
        setKode('')
        onClose()
      } else {
        setError('error' in result ? (result.error as string) : 'Gagal menambah kategori.')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Tambah Kategori Skrining</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className={labelClass}>Nama Kategori</label>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Skrining Anemia"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Kode Kategori (unik, tanpa spasi)</label>
          <input
            value={kode}
            onChange={(e) => setKode(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            placeholder="skrining_anemia"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Target Kelas</label>
          <select
            value={targetKelas}
            onChange={(e) => setTargetKelas(e.target.value)}
            className={inputClass}
          >
            <option value="all">Semua Kelas</option>
            <option value="1">Kelas 1</option>
            <option value="1-3">Kelas 1-3</option>
            <option value="4-6">Kelas 4-6</option>
          </select>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}

function NewQuestionModal({
  open,
  onClose,
  categoryId,
  nextNomor,
}: {
  open: boolean
  onClose: () => void
  categoryId: string
  nextNomor: number
}) {
  const [teks, setTeks] = useState('')
  const [tipe, setTipe] = useState('ya_tidak')
  const [opsiText, setOpsiText] = useState('')
  const [wajib, setWajib] = useState(true)
  const [kelasFilter, setKelasFilter] = useState<string[]>([])
  const [genderFilter, setGenderFilter] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const needsOpsi = ['pilihan_ganda', 'dropdown', 'checkbox'].includes(tipe)

  function handleSubmit() {
    setError(null)
    if (!teks.trim()) {
      setError('Teks pertanyaan wajib diisi.')
      return
    }
    if (needsOpsi && !opsiText.trim()) {
      setError('Opsi jawaban wajib diisi untuk tipe ini (pisahkan dengan koma).')
      return
    }

    const input: QuestionFormInput = {
      categoryId,
      nomorPertanyaan: nextNomor,
      teksPertanyaan: teks,
      tipeJawaban: tipe,
      opsiJawaban: needsOpsi
        ? opsiText.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      wajib,
      kondisiKelas: kelasFilter.length ? kelasFilter : undefined,
      kondisiGender: genderFilter || undefined,
    }

    startTransition(async () => {
      const result = await createQuestion(input)
      if (result.success) {
        setTeks('')
        setOpsiText('')
        setKelasFilter([])
        setGenderFilter('')
        onClose()
      } else {
        setError('Gagal menambah pertanyaan.')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Tambah Pertanyaan Skrining</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className={labelClass}>Teks Pertanyaan</label>
          <textarea
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            rows={2}
            className={cn(inputClass, 'resize-none')}
            placeholder="Apakah anak Anda mengalami..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Tipe Jawaban</label>
            <select value={tipe} onChange={(e) => setTipe(e.target.value)} className={inputClass}>
              {TIPE_JAWABAN_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={wajib}
                onChange={(e) => setWajib(e.target.checked)}
                className="rounded border-border"
              />
              Pertanyaan wajib diisi
            </label>
          </div>
        </div>

        {needsOpsi && (
          <div>
            <label className={labelClass}>Opsi Jawaban (pisahkan dengan koma)</label>
            <input
              value={opsiText}
              onChange={(e) => setOpsiText(e.target.value)}
              placeholder="Opsi A, Opsi B, Opsi C"
              className={inputClass}
            />
          </div>
        )}

        <div className="border-t border-border pt-3 space-y-3">
          <p className="text-xs font-medium text-foreground">
            Tampilkan pertanyaan hanya untuk (opsional):
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Kelas Tertentu</label>
              <div className="flex flex-wrap gap-1.5">
                {['1', '2', '3', '4', '5', '6'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() =>
                      setKelasFilter((prev) =>
                        prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
                      )
                    }
                    className={cn(
                      'w-8 h-8 rounded-lg border text-xs font-medium transition-colors',
                      kelasFilter.includes(k)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Jenis Kelamin</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className={inputClass}
              >
                <option value="">Semua</option>
                <option value="Laki-laki">Laki-laki saja</option>
                <option value="Perempuan">Perempuan saja</option>
              </select>
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestionRow({ question }: { question: Question }) {
  const [isPending, startTransition] = useTransition()
  const [aktif, setAktif] = useState(question.aktif)

  function handleToggle() {
    startTransition(async () => {
      await toggleQuestionStatus(question.id, !aktif)
      setAktif((a) => !a)
    })
  }

  function handleDelete() {
    if (!confirm('Nonaktifkan pertanyaan ini? Data jawaban lama tetap tersimpan.')) return
    startTransition(async () => {
      await deleteQuestion(question.id)
    })
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border/60 text-sm',
        !aktif && 'opacity-50'
      )}
    >
      <span className="text-muted-foreground text-xs mt-0.5 flex-shrink-0">
        Q{question.nomorPertanyaan}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-foreground">{question.teksPertanyaan}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
            {TIPE_JAWABAN_OPTIONS.find((t) => t.value === question.tipeJawaban)?.label ??
              question.tipeJawaban}
          </span>
          {question.wajib && (
            <span className="text-xs text-destructive">Wajib</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleToggle}
          disabled={isPending}
          title={aktif ? 'Nonaktifkan' : 'Aktifkan'}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Power className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          title="Hapus (nonaktifkan permanen)"
          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function CategoryCard({
  category,
  isFirst,
  isLast,
}: {
  category: Category
  isFirst: boolean
  isLast: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [showNewQuestion, setShowNewQuestion] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [aktif, setAktif] = useState(category.aktif)

  function handleToggleCategory() {
    startTransition(async () => {
      await toggleCategoryStatus(category.id, !aktif)
      setAktif((a) => !a)
    })
  }

  function handleReorder(arah: 'naik' | 'turun') {
    startTransition(async () => {
      await reorderCategory(category.id, arah)
    })
  }

  const nextNomor =
    category.questions.length > 0
      ? Math.max(...category.questions.map((q) => q.nomorPertanyaan)) + 1
      : 1

  return (
    <div className={cn('bg-card border border-border rounded-xl', !aktif && 'opacity-60')}>
      <div className="flex items-center gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => handleReorder('naik')}
            disabled={isFirst || isPending}
            className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleReorder('turun')}
            disabled={isLast || isPending}
            className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ListChecks className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{category.namaKategori}</p>
            <p className="text-xs text-muted-foreground">
              {category.questions.length} pertanyaan
              {category.targetKelas && category.targetKelas !== 'all'
                ? ` · Kelas ${category.targetKelas}`
                : ''}
            </p>
          </div>
        </button>

        <CategoryBadge aktif={aktif} />

        <button
          onClick={handleToggleCategory}
          disabled={isPending}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title={aktif ? 'Nonaktifkan kategori' : 'Aktifkan kategori'}
        >
          <Power className="w-4 h-4" />
        </button>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {category.questions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">
              Belum ada pertanyaan di kategori ini.
            </p>
          ) : (
            category.questions.map((q) => <QuestionRow key={q.id} question={q} />)
          )}
          <button
            onClick={() => setShowNewQuestion(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Pertanyaan
          </button>
        </div>
      )}

      <NewQuestionModal
        open={showNewQuestion}
        onClose={() => setShowNewQuestion(false)}
        categoryId={category.id}
        nextNomor={nextNomor}
      />
    </div>
  )
}

export function FormBuilderClient({ categories }: { categories: Category[] }) {
  const [showNewCategory, setShowNewCategory] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowNewCategory(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori
        </button>
      </div>

      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Belum ada kategori skrining. Klik &quot;Tambah Kategori&quot; untuk mulai.
          </div>
        ) : (
          categories.map((cat, idx) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isFirst={idx === 0}
              isLast={idx === categories.length - 1}
            />
          ))
        )}
      </div>

      <NewCategoryModal open={showNewCategory} onClose={() => setShowNewCategory(false)} />
    </div>
  )
}
