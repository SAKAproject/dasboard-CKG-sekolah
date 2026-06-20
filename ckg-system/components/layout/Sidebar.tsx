'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Users, ClipboardCheck, CheckSquare, Database,
  Settings, BarChart2, UserCog, Palette, Server,
  ListChecks, ChevronDown, ChevronRight, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { MenuNode } from '@/actions/menu'

// Map icon name dari database ke komponen Lucide
const ICON_MAP: Record<string, React.ElementType> = {
  home: Home,
  users: Users,
  'clipboard-check': ClipboardCheck,
  check: CheckSquare,
  database: Database,
  settings: Settings,
  'chart-bar': BarChart2,
  'user-cog': UserCog,
  palette: Palette,
  'server-cog': Server,
  'list-details': ListChecks,
  forms: ListChecks,
}

function IconComponent({ name }: { name: string | null }) {
  const Icon = name ? (ICON_MAP[name] ?? Home) : Home
  return <Icon className="w-4 h-4 flex-shrink-0" />
}

function MenuItem({ item, depth = 0 }: { item: MenuNode; depth?: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const hasChildren = item.children.length > 0
  const isActive =
    item.route !== null && pathname.startsWith(item.route)

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            'text-muted-foreground hover:bg-secondary hover:text-foreground',
            isActive && 'text-foreground bg-secondary'
          )}
        >
          <IconComponent name={item.icon} />
          <span className="flex-1 text-left">{item.namaMenu}</span>
          {open ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
        {open && (
          <div className="ml-4 mt-0.5 border-l border-border pl-2 space-y-0.5">
            {item.children.map((child) => (
              <MenuItem key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.route ?? '#'}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        'text-muted-foreground hover:bg-secondary hover:text-foreground',
        isActive && 'bg-primary/10 text-primary font-semibold'
      )}
    >
      <IconComponent name={item.icon} />
      {item.namaMenu}
    </Link>
  )
}

type SidebarProps = {
  menus: MenuNode[]
  namaAplikasi: string
  namaUser: string
  roleLabel: string
}

export function Sidebar({ menus, namaAplikasi, namaUser, roleLabel }: SidebarProps) {
  return (
    <aside className="flex flex-col h-full w-60 border-r border-border bg-card px-3 py-4">
      {/* Header / Logo */}
      <div className="px-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">
              {namaAplikasi || 'Sistem CKG'}
            </p>
            <p className="text-xs text-muted-foreground">Cek Kesehatan Gratis</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {menus.map((menu) => (
          <MenuItem key={menu.id} item={menu} />
        ))}
      </nav>

      {/* Footer User Info */}
      <div className="border-t border-border pt-3 mt-3">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
            {namaUser.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{namaUser}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          <Link
            href="/auth/logout"
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
