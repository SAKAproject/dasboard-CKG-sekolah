'use client'

import { useState, useTransition } from 'react'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateBranding, type BrandingKey } from '@/actions/branding'

const inputClass = cn(
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
)
const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

export function BrandingClient({
  initial,
}: {
  initial: Record<BrandingKey, string>
}) {
  const [values, setValues] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function set(key: BrandingKey, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateBranding(values)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Identitas Aplikasi</h3>
          <div>
            <label className={labelClass}>Nama Aplikasi</label>
            <input
              value={values.nama_aplikasi}
              onChange={(e) => set('nama_aplikasi', e.target.value)}
              placeholder="Sistem CKG"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nama Instansi</label>
            <input
              value={values.nama_instansi}
              onChange={(e) => set('nama_instansi', e.target.value)}
              placeholder="Puskesmas Demo"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Teks Footer</label>
            <input
              value={values.footer_text}
              onChange={(e) => set('footer_text', e.target.value)}
              placeholder="© 2026 Puskesmas Demo. Semua hak dilindungi."
              className={inputClass}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Logo &amp; Gambar</h3>
          <div>
            <label className={labelClass}>URL Logo</label>
            <input
              value={values.logo_url}
              onChange={(e) => set('logo_url', e.target.value)}
              placeholder="https://.../logo.png"
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Unggah logo ke Supabase Storage lalu tempel URL publiknya di sini.
            </p>
          </div>
          <div>
            <label className={labelClass}>URL Favicon</label>
            <input
              value={values.favicon_url}
              onChange={(e) => set('favicon_url', e.target.value)}
              placeholder="https://.../favicon.ico"
              className={inputClass}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Warna Tema</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Warna Utama</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={values.warna_utama || '#166534'}
                  onChange={(e) => set('warna_utama', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <input
                  value={values.warna_utama}
                  onChange={(e) => set('warna_utama', e.target.value)}
                  placeholder="#166534"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Warna Sekunder</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={values.warna_sekunder || '#dcfce7'}
                  onChange={(e) => set('warna_sekunder', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <input
                  value={values.warna_sekunder}
                  onChange={(e) => set('warna_sekunder', e.target.value)}
                  placeholder="#dcfce7"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? 'Tersimpan!' : isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>

      {/* Preview */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pratinjau Sidebar
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="p-3 flex items-center gap-2 bg-background">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: values.warna_utama || '#166534' }}
              >
                {(values.nama_aplikasi || 'C').charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">
                  {values.nama_aplikasi || 'Sistem CKG'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {values.nama_instansi || 'Nama Instansi'}
                </p>
              </div>
            </div>
            <div
              className="px-3 py-2 text-xs text-center"
              style={{
                backgroundColor: values.warna_sekunder || '#dcfce7',
                color: values.warna_utama || '#166534',
              }}
            >
              Contoh tombol / highlight
            </div>
          </div>
          {values.footer_text && (
            <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
              {values.footer_text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
