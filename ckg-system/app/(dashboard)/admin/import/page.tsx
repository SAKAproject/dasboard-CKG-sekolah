import { requireRole } from '@/lib/auth'
import { ImportClient } from '@/components/dashboard/ImportClient'

export default async function ImportPage() {
  await requireRole(['admin', 'petugas_entri'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Data Siswa Massal</h1>
        <p className="text-muted-foreground mt-1">
          Unggah data siswa dalam jumlah besar lewat file Excel, lengkap dengan
          validasi otomatis sebelum disimpan.
        </p>
      </div>

      <ImportClient />
    </div>
  )
}
