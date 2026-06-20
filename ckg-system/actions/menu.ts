'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export type MenuNode = {
  id: string
  namaMenu: string
  icon: string | null
  route: string | null
  children: MenuNode[]
}

/**
 * Mengambil menu sidebar dari database, difilter berdasarkan role user yang login.
 * Admin bisa ubah menu lewat halaman pengaturan tanpa coding.
 */
export async function getSidebarMenu(): Promise<MenuNode[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const allMenus = await prisma.systemMenu.findMany({
    where: { tenantId: user.tenantId, aktif: true },
    orderBy: { nomorUrut: 'asc' },
  })
  type MenuRow = (typeof allMenus)[number]

  // Filter berdasarkan roleAccess
  const accessible = allMenus.filter((m: MenuRow) => {
    if (!m.roleAccess) return true
    const roles = m.roleAccess as string[]
    return roles.includes(user.roleKode)
  })

  // Bangun hierarki (parent → children)
  const rootMenus = accessible.filter((m: MenuRow) => !m.parentId)
  return rootMenus.map((parent: MenuRow) => ({
    id: parent.id,
    namaMenu: parent.namaMenu,
    icon: parent.icon,
    route: parent.route,
    children: accessible
      .filter((m: MenuRow) => m.parentId === parent.id)
      .map((child: MenuRow) => ({
        id: child.id,
        namaMenu: child.namaMenu,
        icon: child.icon,
        route: child.route,
        children: [],
      })),
  }))
}

/**
 * Mengambil pengaturan branding tenant (nama aplikasi, warna, logo) untuk ditampilkan di layout.
 */
export async function getBrandingSettings(tenantId: string) {
  const settings = await prisma.systemSetting.findMany({
    where: {
      tenantId,
      kunci: {
        in: ['nama_aplikasi', 'logo_url', 'warna_utama', 'warna_sekunder', 'nama_instansi'],
      },
    },
  })

  return Object.fromEntries(
    settings.map((s: (typeof settings)[number]) => [s.kunci, s.nilai ?? ''])
  )
}
