import { Users, ClipboardCheck, CheckSquare, AlertCircle } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { getDashboardSummary, getSchoolDashboard } from '@/actions/reports'
import { StatsCard } from '@/components/dashboard/StatsCard'

export default async function AdminDashboardPage() {
  const user = await requireRole(['admin'])

  const [summary, schools] = await Promise.all([
    getDashboardSummary(user.tenantId),
    getSchoolDashboard(user.tenantId),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard Administrasi</h1>
        <p className="text-muted-foreground mt-1">
          Rekap keseluruhan program Cek Kesehatan Gratis (CKG)
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Siswa Terdaftar"
          value={summary.totalSiswa.toLocaleString('id-ID')}
          icon={<Users className="w-5 h-5" />}
          color="primary"
        />
        <StatsCard
          title="Sudah Isi Form CKG"
          value={summary.totalSubmit.toLocaleString('id-ID')}
          subtitle={`${summary.persentaseIsi}% dari total siswa`}
          icon={<ClipboardCheck className="w-5 h-5" />}
          color="success"
        />
        <StatsCard
          title="Belum Isi Form"
          value={summary.belumIsi.toLocaleString('id-ID')}
          icon={<AlertCircle className="w-5 h-5" />}
          color="warning"
        />
        <StatsCard
          title="Sudah Diinput Sistem"
          value={summary.totalSudahInput.toLocaleString('id-ID')}
          subtitle="Oleh petugas entri"
          icon={<CheckSquare className="w-5 h-5" />}
          color="muted"
        />
      </div>

      {/* Tabel Rekap Per Sekolah */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Rekap Per Sekolah</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Nama Sekolah
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Total Siswa
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Sudah Isi
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Belum Isi
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-44">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schools.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Belum ada data sekolah.
                  </td>
                </tr>
              ) : (
                schools.map((s: (typeof schools)[number]) => (
                  <tr key={s.schoolId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{s.namaSekolah}</td>
                    <td className="px-4 py-3 text-right">{s.totalSiswa}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                      {s.sudahIsi}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600 font-medium">
                      {s.belumIsi}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all bg-primary"
                            style={{ width: `${s.persentase}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-9 text-right">
                          {s.persentase}%
                        </span>
                      </div>
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
