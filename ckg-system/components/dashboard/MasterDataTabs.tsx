'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { WilayahClient } from './WilayahClient'
import { SekolahClient } from './SekolahClient'

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

const TABS = [
  { key: 'sekolah', label: 'Sekolah & Kelas' },
  { key: 'wilayah', label: 'Wilayah (Kecamatan & Desa)' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function MasterDataTabs({
  kecamatans,
  desas,
  schools,
}: {
  kecamatans: Kecamatan[]
  desas: Desa[]
  schools: SchoolRow[]
}) {
  const [active, setActive] = useState<TabKey>('sekolah')

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              active === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === 'sekolah' && (
        <SekolahClient schools={schools} desas={desas.map((d) => ({ id: d.id, namaDesa: d.namaDesa }))} />
      )}
      {active === 'wilayah' && <WilayahClient kecamatans={kecamatans} desas={desas} />}
    </div>
  )
}
