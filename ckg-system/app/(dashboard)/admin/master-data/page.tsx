import { requireRole } from '@/lib/auth'
import { getKecamatans, getDesas, getSchoolsWithClasses } from '@/actions/master-data'
import { MasterDataTabs } from '@/components/dashboard/MasterDataTabs'

export default async function MasterDataPage() {
  await requireRole(['admin'])

  const [kecamatans, desas, schools] = await Promise.all([
    getKecamatans(),
    getDesas(),
    getSchoolsWithClasses(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Master Data</h1>
        <p className="text-muted-foreground mt-1">
          Kelola data sekolah, kelas, kecamatan, dan desa tanpa coding.
        </p>
      </div>

      <MasterDataTabs kecamatans={kecamatans} desas={desas} schools={schools} />
    </div>
  )
}
