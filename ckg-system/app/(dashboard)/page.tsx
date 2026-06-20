import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

export default async function DashboardPage() {
  const user = await requireUser()

  // Arahkan setiap role ke halaman dashboard yang sesuai
  switch (user.roleKode) {
    case 'admin':
      redirect('/dashboard/admin')
    case 'petugas_entri':
      redirect('/dashboard/petugas')
    case 'guru':
      redirect('/dashboard/guru')
    case 'siswa':
      redirect('/dashboard/student')
    default:
      redirect('/dashboard/admin')
  }
}
