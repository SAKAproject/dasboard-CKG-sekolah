'use client'

import { useState, useTransition } from 'react'
import { toggleUserStatus } from '@/actions/users'
import { Loader2, UserCheck, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'

type UserStatusToggleProps = {
  userId: string
  statusAktif: boolean
}

export function UserStatusToggle({ userId, statusAktif }: UserStatusToggleProps) {
  const [status, setStatus] = useState(statusAktif)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleUserStatus(userId, !status)
      if (result.success) {
        setStatus((s) => !s)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
        status
          ? 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
          : 'bg-primary text-primary-foreground hover:bg-primary/90',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : status ? (
        <UserX className="w-3.5 h-3.5" />
      ) : (
        <UserCheck className="w-3.5 h-3.5" />
      )}
      {status ? 'Nonaktifkan' : 'Aktifkan'}
    </button>
  )
}
