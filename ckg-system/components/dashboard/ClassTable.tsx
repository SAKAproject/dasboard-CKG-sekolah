import { cn } from '@/lib/utils'
import type { ClassDashboardRow } from '@/types'

type ClassTableProps = {
  rows: ClassDashboardRow[]
  namaSekolah?: string
}

export function ClassTable({ rows, namaSekolah }: ClassTableProps) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Belum ada data kelas. Pastikan data kelas sudah diinput oleh administrator.
      </div>
    )
  }

  return (
    <div>
      {namaSekolah && (
        <h3 className="font-semibold text-foreground mb-3">{namaSekolah}</h3>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kelas</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Siswa</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Sudah Isi</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Belum Isi</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.classId} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">
                  Kelas {row.namaKelas}
                  {row.klasifikasiKelas && ` - ${row.klasifikasiKelas}`}
                </td>
                <td className="px-4 py-3 text-right">{row.totalSiswa}</td>
                <td className="px-4 py-3 text-right text-green-600 font-medium">
                  {row.sudahIsi}
                </td>
                <td className="px-4 py-3 text-right text-amber-600 font-medium">
                  {row.belumIsi}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          row.persentase >= 80
                            ? 'bg-green-500'
                            : row.persentase >= 50
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                        )}
                        style={{ width: `${row.persentase}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-9 text-right">
                      {row.persentase}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/40 font-semibold border-t border-border">
            <tr>
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3 text-right">
                {rows.reduce((a, r) => a + r.totalSiswa, 0)}
              </td>
              <td className="px-4 py-3 text-right text-green-600">
                {rows.reduce((a, r) => a + r.sudahIsi, 0)}
              </td>
              <td className="px-4 py-3 text-right text-amber-600">
                {rows.reduce((a, r) => a + r.belumIsi, 0)}
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
