'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Loader2, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createKecamatan, deleteKecamatan,
  createDesa, deleteDesa,
} from '@/actions/master-data'

type Kecamatan = {
  id: string
  namaKecamatan: string
  _count: { desas: number }
}

type Desa = {
  id: string
  namaDesa: string
  kecamatanId: string | null
  kecamatan: { namaKecamatan: string } | null
  _count: { schools: number }
}

const inputClass = cn(
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
)

function KecamatanPanel({ kecamatans }: { kecamatans: Kecamatan[] }) {
  const [nama, setNama] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleAdd() {
    setError(null)
    startTransition(async () => {
      const result = await createKecamatan(nama)
      if (result.success) {
        setNama('')
      } else {
        setError(result.error ?? 'Gagal menambah kecamatan.')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus kecamatan ini?')) return
    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteKecamatan(id)
      if (!result.success) alert(result.error)
      setDeletingId(null)
    })
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm">Kecamatan</h3>
      <div className="flex gap-2">
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Nama kecamatan baru"
          className={inputClass}
        />
        <button
          onClick={handleAdd}
          disabled={isPending}
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm flex-shrink-0 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="space-y-1 max-h-72 overflow-y-auto">
        {kecamatans.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Belum ada kecamatan.</p>
        ) : (
          kecamatans.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 text-sm"
            >
              <span>{k.namaKecamatan}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{k._count.desas} desa</span>
                <button
                  onClick={() => handleDelete(k.id)}
                  disabled={isPending && deletingId === k.id}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function DesaPanel({
  desas,
  kecamatans,
}: {
  desas: Desa[]
  kecamatans: Kecamatan[]
}) {
  const [nama, setNama] = useState('')
  const [kecamatanId, setKecamatanId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleAdd() {
    setError(null)
    startTransition(async () => {
      const result = await createDesa(nama, kecamatanId)
      if (result.success) {
        setNama('')
      } else {
        setError(result.error ?? 'Gagal menambah desa.')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus desa ini?')) return
    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteDesa(id)
      if (!result.success) alert(result.error)
      setDeletingId(null)
    })
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm">Desa / Kelurahan</h3>
      <div className="space-y-2">
        <select
          value={kecamatanId}
          onChange={(e) => setKecamatanId(e.target.value)}
          className={inputClass}
        >
          <option value="">-- Pilih Kecamatan --</option>
          {kecamatans.map((k) => (
            <option key={k.id} value={k.id}>{k.namaKecamatan}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Nama desa baru"
            className={inputClass}
          />
          <button
            onClick={handleAdd}
            disabled={isPending}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm flex-shrink-0 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="space-y-1 max-h-72 overflow-y-auto">
        {desas.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Belum ada desa.</p>
        ) : (
          desas.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 text-sm"
            >
              <div>
                <span>{d.namaDesa}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({d.kecamatan?.namaKecamatan ?? '-'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{d._count.schools} sekolah</span>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={isPending && deletingId === d.id}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function WilayahClient({
  kecamatans,
  desas,
}: {
  kecamatans: Kecamatan[]
  desas: Desa[]
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4" />
        Kelola data wilayah administratif (kecamatan &amp; desa)
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KecamatanPanel kecamatans={kecamatans} />
        <DesaPanel desas={desas} kecamatans={kecamatans} />
      </div>
    </div>
  )
}
