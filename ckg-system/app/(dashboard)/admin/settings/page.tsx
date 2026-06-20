import { requireRole } from '@/lib/auth'
import { getBrandingFull } from '@/actions/branding'
import { BrandingClient } from '@/components/dashboard/BrandingClient'

export default async function BrandingSettingsPage() {
  await requireRole(['admin'])
  const branding = await getBrandingFull()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Branding</h1>
        <p className="text-muted-foreground mt-1">
          Ubah nama aplikasi, logo, dan warna tema tanpa coding.
        </p>
      </div>

      <BrandingClient initial={branding} />
    </div>
  )
}
