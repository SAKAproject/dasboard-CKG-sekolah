'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2, X, School as SchoolIcon, Power, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createSchool, toggleSchoolStatus,
  createClass, deleteClass,
  type SchoolInput,
} from '@/actions/master-data'

type ClassRow = {
  id: string
  namaKelas: string
  klasifikasiKelas: string | null
  tahunAjaran: string | null
}

type SchoolRow = {
  id: string
  namaSekolah: string
  kodeSekolah: string | null
  alamat: string | null
  tingkatPendidikan: string
  statusAktif: boolean
  desa: { namaDesa: string } | null
  classes: ClassRow[]
  _count: { students: number }
}

type Desa = { id: string; namaDesa: string }

const inputClass = cn(
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
)
const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'

function NewSchoolModal({
  open,
  onClose,
  desas,
}: {
  open: boolean
  onClose: () => void
  desas: Desa[]
}) {
  const [form, setForm] = useState<SchoolInput>({
    namaSekolah: '', kodeSekolah: '', alamat: '', desaId: '', tingkatPendidikan: 'SD',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await createSchool(form)
      if (result.success) {
        setForm({ namaSekolah: '', kodeSekolah: '', alamat: '', desaId: '', tingkatPendidikan: 'SD' })
        onClose()
      } else {
        setError(result.error ?? 'Gagal menambah sekolah.')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Tambah Sekolah</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className={labelClass}>Nama Sekolah</label>
          <input
            value={form.namaSekolah}
            onChange={(e) => setForm((f) => ({ ...f, namaSekolah: e.target.value }))}
            placeholder="SD Negeri 1 Demo"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Kode Sekolah (NPSN)</label>
            <input
              value={form.kodeSekolah}
              onChange={(e) => setForm((f) => ({ ...f, kodeSekolah: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Jenjang</label>
            <select
              value={form.tingkatPendidikan}
              onChange={(e) => setForm((f) => ({ ...f, tingkatPendidikan: e.target.value }))}
              className={inputClass}
            >
              <option value="SD">SD</option>
              <option value="MI">MI</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Desa / Kelurahan</label>
          <select
            value={form.desaId}
            onChange={(e) => setForm((f) => ({ ...f, desaId: e.target.value }))}
            className={inputClass}
          >
            <option value="">-- Pilih Desa --</option>
            {desas.map((d) => (
              <option key={d.id} value={d.id}>{d.namaDesa}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Alamat</label>
          <textarea
            value={form.alamat}
            onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
            rows={2}
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted">
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

function NewClassModal({
  open,
  onClose,
  schoolId,
}: {
  open: boolean
  onClose: () => void
  schoolId: string
}) {
  const [namaKelas, setNamaKelas] = useState('1')
  const [klasifikasi, setKlasifikasi] = useState('')
  const [tahunAjaran, setTahunAjaran] = useState(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await createClass({
        schoolId,
        namaKelas,
        klasifikasiKelas: klasifikasi || undefined,
        tahunAjaran,
      })
      if (result.success) {
        setKlasifikasi('')
        onClose()
      } else {
        setError(result.error ?? 'Gagal menambah kelas.')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Tambah Kelas</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Kelas</label>
            <select value={namaKelas} onChange={(e) => setNamaKelas(e.target.value)} className={inputClass}>
              {['1', '2', '3', '4', '5', '6'].map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Rombel (opsional)</label>
            <input
              value={klasifikasi}
              onChange={(e) => setKlasifikasi(e.target.value.toUpperCase())}
              placeholder="A"
              maxLength={2}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Tahun Ajaran</label>
          <input
            value={tahunAjaran}
            onChange={(e) => setTahunAjaran(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted">
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

function SchoolCard({ school }: { school: SchoolRow }) {
  const [expanded, setExpanded] = useState(false)
  const [showNewClass, setShowNewClass] = useState(false)
  const [aktif, setAktif] = useState(school.statusAktif)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleSchoolStatus(school.id, !aktif)
      setAktif((a) => !a)
    })
  }

  function handleDeleteClass(classId: string) {
    if (!confirm('Hapus kelas ini?')) return
    startTransition(async () => {
      const result = await deleteClass(classId)
      if (!result.success) alert(result.error)
    })
  }

  return (
    <div className={cn('bg-card border border-border rounded-xl', !aktif && 'opacity-60')}>
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <SchoolIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{school.namaSekolah}</p>
            <p className="text-xs text-muted-foreground">
              {school.tingkatPendidikan}
              {school.desa && ` · ${school.desa.namaDesa}`}
              {' · '}{school._count.students} siswa · {school.classes.length} kelas
            </p>
          </div>
        </button>

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

        <button
          onClick={handleToggle}
          disabled={isPending}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Power className="w-4 h-4" />
        </button>

        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {school.classes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">Belum ada kelas.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {school.classes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/60 text-sm"
                >
                  <span>
                    Kelas {c.namaKelas}{c.klasifikasiKelas && ` ${c.klasifikasiKelas}`}
                  </span>
                  <button
                    onClick={() => handleDeleteClass(c.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowNewClass(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Kelas
          </button>
        </div>
      )}

      <NewClassModal open={showNewClass} onClose={() => setShowNewClass(false)} schoolId={school.id} />
    </div>
  )
}

export function SekolahClient({
  schools,
  desas,
}: {
  schools: SchoolRow[]
  desas: Desa[]
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Sekolah
        </button>
      </div>

      <div className="space-y-3">
        {schools.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Belum ada sekolah terdaftar. Klik &quot;Tambah Sekolah&quot; untuk mulai.
          </div>
        ) : (
          schools.map((s) => <SchoolCard key={s.id} school={s} />)
        )}
      </div>

      <NewSchoolModal open={showModal} onClose={() => setShowModal(false)} desas={desas} />
    </div>
  )
}
