import { requireRole } from '@/lib/auth'
import { getSchoolDashboard } from '@/actions/reports'
import { ExportButtons } from '@/components/dashboard/ExportButtons'

export default async function ReportsPage() {
  const user = await requireRole(['admin', 'guru'])
  const schools = user.roleKode === 'admin' ? await getSchoolDashboard(user.tenantId) : []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Laporan &amp; Rekap</h1>
          <p className="text-muted-foreground mt-1">
            Rekap per sekolah, kelas, desa, golongan darah, jenis kelamin, dan
            status pengisian form CKG.
          </p>
        </div>
        <ExportButtons />
      </div>

      {user.roleKode === 'admin' && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sekolah</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Siswa</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Sudah Isi</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Belum Isi</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada data sekolah.
                  </td>
                </tr>
              ) : (
                schools.map((s: (typeof schools)[number]) => (
                  <tr key={s.schoolId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.namaSekolah}</td>
                    <td className="px-4 py-3 text-right">{s.totalSiswa}</td>
                    <td className="px-4 py-3 text-right text-green-600">{s.sudahIsi}</td>
                    <td className="px-4 py-3 text-right text-amber-600">{s.belumIsi}</td>
                    <td className="px-4 py-3 text-right">{s.persentase}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-muted/40 border border-border rounded-xl p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Isi Laporan Excel/PDF</p>
        <p>
          File ekspor berisi rincian lengkap: rekap per sekolah, per kelas, per
          desa, per golongan darah, per jenis kelamin, dan status pengisian
          form — sesuai kebutuhan pelaporan ke Dinas Kesehatan.
        </p>
      </div>
    </div>
  )
}
