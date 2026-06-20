import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export type CurrentUser = {
  id: string
  tenantId: string
  namaLengkap: string
  email: string
  schoolId: string | null
  roleKode: 'admin' | 'petugas_entri' | 'guru' | 'siswa' | string
}

/**
 * Mengambil user yang sedang login beserta role dan tenant-nya.
 * Mengembalikan null jika belum login atau akun nonaktif.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUid: authUser.id },
    include: { role: true },
  })

  if (!dbUser || !dbUser.statusAktif) return null

  return {
    id: dbUser.id,
    tenantId: dbUser.tenantId,
    namaLengkap: dbUser.namaLengkap,
    email: dbUser.email,
    schoolId: dbUser.schoolId,
    roleKode: dbUser.role?.kodeRole ?? 'siswa',
  }
}

/** Guard: redirect ke /login jika belum login. Dipakai di server component dashboard. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/** Guard: redirect ke halaman utama dashboard jika role tidak diizinkan. Dipakai di awal Server Action. */
export async function requireRole(allowed: string[]): Promise<CurrentUser> {
  const user = await requireUser()
  if (!allowed.includes(user.roleKode)) {
    redirect('/dashboard?error=akses_ditolak')
  }
  return user
}
