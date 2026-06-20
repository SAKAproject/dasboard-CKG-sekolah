import { requireRole } from '@/lib/auth'
import { getSubmissionsForEntry } from '@/actions/entry-status'
import { getDashboardSummary } from '@/actions/reports'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { EntryStatusBadge } from '@/components/dashboard/EntryStatusBadge'
import { EntryToggleButton } from '@/components/dashboard/EntryToggleButton'
import { ClipboardCheck, CheckSquare, Clock } from 'lucide-react'
import { formatTanggalIndo } from '@/lib/utils'

export default async function PetugasDashboardPage() {
  const user = await requireRole(['petugas_entri'])

  const [summary, submissions] = await Promise.all([
    getDashboardSummary(user.tenantId),
    getSubmissionsForEntry(user.tenantId),
  ])

  const belumInput = submissions.filter((s) => !s.sudahDiinputSistem).length
  const sudahInput = submissions.filter((s) => s.sudahDiinputSistem).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard Petugas Entri</h1>
        <p className="text-muted-foreground mt-1">
          Daftar form CKG yang sudah disubmit siswa
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Submission Masuk"
          value={submissions.length.toLocaleString('id-ID')}
          icon={<ClipboardCheck className="w-5 h-5" />}
          color="primary"
        />
        <StatsCard
          title="Sudah Diinput ke Sistem"
          value={sudahInput.toLocaleString('id-ID')}
          icon={<CheckSquare className="w-5 h-5" />}
          color="success"
        />
        <StatsCard
          title="Belum Diinput"
          value={belumInput.toLocaleString('id-ID')}
          subtitle="Perlu segera diproses"
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />
      </div>

      {/* Tabel Submission */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Daftar Pengisian Form</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Belum diinput diprioritaskan di atas
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Nama Siswa
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  NIK
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Sekolah / Kelas
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Tgl Submit
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Status Entri
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Belum ada form yang disubmit oleh siswa.
                  </td>
                </tr>
              ) : (
                submissions.map((s) => (
                  <tr key={s.submissionId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{s.namaSiswa}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {s.nik}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.namaSekolah ?? '-'}
                      {s.namaKelas && (
                        <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded">
                          Kl. {s.namaKelas}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.tanggalSubmit
                        ? formatTanggalIndo(s.tanggalSubmit)
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <EntryStatusBadge
                        sudahDiinput={s.sudahDiinputSistem}
                        tanggalInput={s.diinputPada}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <EntryToggleButton
                        submissionId={s.submissionId}
                        sudahDiinput={s.sudahDiinputSistem}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
