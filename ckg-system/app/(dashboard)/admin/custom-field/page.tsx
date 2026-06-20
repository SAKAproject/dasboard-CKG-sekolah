import { requireRole } from '@/lib/auth'
import { getCustomFields } from '@/actions/custom-fields'
import { CustomFieldClient } from '@/components/dashboard/CustomFieldClient'

export default async function CustomFieldPage() {
  await requireRole(['admin'])
  const fields = await getCustomFields()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Custom Field Builder</h1>
        <p className="text-muted-foreground mt-1">
          Tambah field baru ke modul Data Siswa, Orang Tua, atau Kesehatan
          tanpa coding. Field baru otomatis muncul di form terkait.
        </p>
      </div>

      <CustomFieldClient fields={fields} />
    </div>
  )
}
