import { requireRole } from '@/lib/auth'
import { getUsersByTenant } from '@/actions/users'
import { UserStatusToggle } from '@/components/dashboard/UserStatusToggle'
import { UserCog } from 'lucide-react'

const ROLE_BADGE_COLOR: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  petugas_entri: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  guru: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  siswa: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

export default async function AdminUsersPage() {
  await requireRole(['admin'])
  const users = await getUsersByTenant()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manajemen User</h1>
          <p className="text-muted-foreground mt-1">
            Kelola akun dan hak akses pengguna sistem
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nama</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sekolah</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <UserCog className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Belum ada user terdaftar.
                </td>
              </tr>
            ) : (
              users.map((u: (typeof users)[number]) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.namaLengkap}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        ROLE_BADGE_COLOR[u.role?.kodeRole ?? ''] ??
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      {u.role?.namaRole ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.school?.namaSekolah ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        u.statusAktif
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {u.statusAktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserStatusToggle userId={u.id} statusAktif={u.statusAktif} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-muted/40 border border-border rounded-xl p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Catatan</p>
        <p>
          Untuk membuat user baru, gunakan menu &quot;Tambah User&quot; (perlu
          integrasi dengan Supabase Auth Admin API). Lihat
          <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-xs">actions/users.ts</code>
          fungsi <code className="px-1.5 py-0.5 bg-muted rounded text-xs">createUser</code>.
        </p>
      </div>
    </div>
  )
}
