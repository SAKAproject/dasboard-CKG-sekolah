import { requireRole } from '@/lib/auth'
import { getSystemStats, getRecentAuditLogs } from '@/actions/database-center'
import { StatsCard } from '@/components/dashboard/StatsCard'
import {
  Users, School, ClipboardList, ListChecks,
  HelpCircle, History, Database, Terminal,
} from 'lucide-react'
import { formatTanggalIndo } from '@/lib/utils'

const AKSI_LABEL: Record<string, string> = {
  CREATE: 'Membuat',
  UPDATE: 'Mengubah',
  DELETE: 'Menghapus',
  EXPORT: 'Mengekspor',
  IMPORT: 'Mengimpor',
  LOGIN: 'Masuk',
  LOGOUT: 'Keluar',
}

export default async function DatabaseCenterPage() {
  await requireRole(['admin'])
  const [stats, logs] = await Promise.all([
    getSystemStats(),
    getRecentAuditLogs(15),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Pusat Pembaruan Database</h1>
        <p className="text-muted-foreground mt-1">
          Statistik sistem, riwayat aktivitas, dan panduan operasi database.
        </p>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Siswa"
          value={stats.totalSiswa.toLocaleString('id-ID')}
          icon={<Users className="w-5 h-5" />}
          color="primary"
        />
        <StatsCard
          title="Total Sekolah"
          value={stats.totalSekolah.toLocaleString('id-ID')}
          icon={<School className="w-5 h-5" />}
          color="muted"
        />
        <StatsCard
          title="Total Pengguna"
          value={stats.totalUser.toLocaleString('id-ID')}
          icon={<Users className="w-5 h-5" />}
          color="muted"
        />
        <StatsCard
          title="Total Submission"
          value={stats.totalSubmission.toLocaleString('id-ID')}
          icon={<ClipboardList className="w-5 h-5" />}
          color="success"
        />
        <StatsCard
          title="Kategori Skrining"
          value={stats.totalKategori.toLocaleString('id-ID')}
          icon={<ListChecks className="w-5 h-5" />}
          color="muted"
        />
        <StatsCard
          title="Pertanyaan Skrining"
          value={stats.totalPertanyaan.toLocaleString('id-ID')}
          icon={<HelpCircle className="w-5 h-5" />}
          color="muted"
        />
        <StatsCard
          title="Total Log Aktivitas"
          value={stats.auditLogCount.toLocaleString('id-ID')}
          icon={<History className="w-5 h-5" />}
          color="muted"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Riwayat Aktivitas */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Riwayat Aktivitas Terbaru</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border max-h-[480px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Belum ada aktivitas tercatat.
              </p>
            ) : (
              logs.map((log: (typeof logs)[number]) => (
                <div key={log.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {log.user?.namaLengkap ?? 'Sistem'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTanggalIndo(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {AKSI_LABEL[log.aksi] ?? log.aksi}
                    {log.modul && <> pada modul <span className="font-medium">{log.modul}</span></>}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panduan Operasi Database */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Panduan Operasi Database</h2>
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 text-sm">
            <div className="flex gap-3">
              <Database className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Backup Database</p>
                <code className="block mt-1 px-2 py-1.5 bg-muted rounded text-xs overflow-x-auto">
                  supabase db dump --db-url "$DATABASE_URL" -f backup.sql
                </code>
              </div>
            </div>
            <div className="flex gap-3">
              <Terminal className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Migrasi Schema Baru</p>
                <code className="block mt-1 px-2 py-1.5 bg-muted rounded text-xs overflow-x-auto">
                  npx prisma migrate dev --name nama_perubahan
                </code>
              </div>
            </div>
            <div className="flex gap-3">
              <Database className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Restore Database</p>
                <code className="block mt-1 px-2 py-1.5 bg-muted rounded text-xs overflow-x-auto">
                  psql "$DATABASE_URL" -f backup.sql
                </code>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Panduan lengkap (export/import per-tenant, rollback migrasi)
              tersedia di dokumen <code className="px-1 bg-muted rounded">SISTEM_CKG_DESAIN_LENGKAP.md</code> Bagian 14.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
