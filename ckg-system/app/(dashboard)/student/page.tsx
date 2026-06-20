import { requireUser } from '@/lib/auth'
import { ClipboardCheck } from 'lucide-react'

/**
 * Halaman ini hanya muncul jika akun bertipe 'siswa' mencoba mengakses /dashboard.
 * Sesuai aturan akses, siswa tidak memiliki dashboard data — diarahkan untuk
 * mengisi form lewat link resmi dari sekolah.
 */
export default async function StudentPage() {
  await requireUser()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <ClipboardCheck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-lg font-bold">Tidak Ada Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Akun Anda hanya memiliki akses untuk mengisi Form CKG. Silakan gunakan
          link form yang diberikan oleh pihak sekolah untuk mengisi data
          kesehatan.
        </p>
      </div>
    </div>
  )
}
