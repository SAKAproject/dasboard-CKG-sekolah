'use client'

import { useState, useTransition } from 'react'
import { Plus, Power, Trash2, Loader2, X, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createCustomField,
  toggleCustomFieldStatus,
  deleteCustomField,
  type CustomFieldInput,
} from '@/actions/custom-fields'

type CustomField = {
  id: string
  modul: string
  namaField: string
  label: string
  tipeField: string
  opsiPilihan: unknown
  wajib: boolean
  aktif: boolean
}

const MODUL_LABEL: Record<string, string> = {
  student: 'Data Siswa',
  parent: 'Data Orang Tua',
  health: 'Data Kesehatan',
}

const TIPE_LABEL: Record<string, string> = {
  text: 'Teks',
  number: 'Angka',
  date: 'Tanggal',
  dropdown: 'Dropdown',
  checkbox: 'Checkbox',
}

const inputClass = cn(
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
)
const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'

function NewFieldModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [modul, setModul] = useState<CustomFieldInput['modul']>('student')
  const [label, setLabel] = useState('')
  const [tipeField, setTipeField] = useState<CustomFieldInput['tipeField']>('text')
  const [opsiText, setOpsiText] = useState('')
  const [wajib, setWajib] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  const needsOpsi = tipeField === 'dropdown' || tipeField === 'checkbox'

  function handleSubmit() {
    setError(null)
    if (!label.trim()) {
      setError('Label field wajib diisi.')
      return
    }
    if (needsOpsi && !opsiText.trim()) {
      setError('Opsi pilihan wajib diisi (pisahkan dengan koma).')
      return
    }

    startTransition(async () => {
      const result = await createCustomField({
        modul,
        namaField: '',
        label,
        tipeField,
        opsiPilihan: needsOpsi
          ? opsiText.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        wajib,
      })
      if (result.success) {
        setLabel('')
        setOpsiText('')
        setWajib(false)
        onClose()
      } else {
        setError(result.error ?? 'Gagal menambah field.')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Tambah Field Baru</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className={labelClass}>Modul</label>
          <select
            value={modul}
            onChange={(e) => setModul(e.target.value as CustomFieldInput['modul'])}
            className={inputClass}
          >
            <option value="student">Data Siswa</option>
            <option value="parent">Data Orang Tua</option>
            <option value="health">Data Kesehatan</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Label Field</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Contoh: Status Stunting"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Tipe Field</label>
          <select
            value={tipeField}
            onChange={(e) => setTipeField(e.target.value as CustomFieldInput['tipeField'])}
            className={inputClass}
          >
            <option value="text">Teks</option>
            <option value="number">Angka</option>
            <option value="date">Tanggal</option>
            <option value="dropdown">Dropdown</option>
            <option value="checkbox">Checkbox</option>
          </select>
        </div>

        {needsOpsi && (
          <div>
            <label className={labelClass}>Opsi Pilihan (pisahkan dengan koma)</label>
            <input
              value={opsiText}
              onChange={(e) => setOpsiText(e.target.value)}
              placeholder="Stunting, Normal, Gizi Buruk"
              className={inputClass}
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={wajib}
            onChange={(e) => setWajib(e.target.checked)}
            className="rounded border-border"
          />
          Wajib diisi
        </label>

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

function FieldRow({ field }: { field: CustomField }) {
  const [aktif, setAktif] = useState(field.aktif)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleCustomFieldStatus(field.id, !aktif)
      setAktif((a) => !a)
    })
  }

  function handleDelete() {
    if (!confirm(`Nonaktifkan field "${field.label}"?`)) return
    startTransition(async () => {
      await deleteCustomField(field.id)
    })
  }

  return (
    <tr className={cn('hover:bg-muted/30 transition-colors', !aktif && 'opacity-50')}>
      <td className="px-4 py-3 font-medium">{field.label}</td>
      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{field.namaField}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {TIPE_LABEL[field.tipeField] ?? field.tipeField}
      </td>
      <td className="px-4 py-3">
        {field.wajib ? (
          <span className="text-xs text-destructive">Wajib</span>
        ) : (
          <span className="text-xs text-muted-foreground">Opsional</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title={aktif ? 'Nonaktifkan' : 'Aktifkan'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            title="Hapus"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export function CustomFieldClient({ fields }: { fields: CustomField[] }) {
  const [showModal, setShowModal] = useState(false)

  const grouped = fields.reduce<Record<string, CustomField[]>>((acc, f) => {
    ;(acc[f.modul] ??= []).push(f)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Field
        </button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Belum ada custom field. Klik &quot;Tambah Field&quot; untuk mulai.
        </div>
      ) : (
        Object.entries(grouped).map(([modul, items]) => (
          <div key={modul}>
            <h3 className="font-semibold text-sm mb-2">
              {MODUL_LABEL[modul] ?? modul}
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Label</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Nama Field</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Tipe</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((f) => (
                    <FieldRow key={f.id} field={f} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      <NewFieldModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
