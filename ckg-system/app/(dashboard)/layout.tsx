import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getSidebarMenu, getBrandingSettings } from '@/actions/menu'
import { Sidebar } from '@/components/layout/Sidebar'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrasi',
  petugas_entri: 'Petugas Entri',
  guru: 'Guru',
  siswa: 'Siswa / Orang Tua',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  // Siswa tidak punya dashboard — redirect ke halaman form/konfirmasi
  if (user.roleKode === 'siswa') {
    redirect('/dashboard/student')
  }

  const [menus, branding] = await Promise.all([
    getSidebarMenu(),
    getBrandingSettings(user.tenantId),
  ])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        menus={menus}
        namaAplikasi={branding['nama_aplikasi'] ?? 'Sistem CKG'}
        namaUser={user.namaLengkap}
        roleLabel={ROLE_LABEL[user.roleKode] ?? user.roleKode}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
