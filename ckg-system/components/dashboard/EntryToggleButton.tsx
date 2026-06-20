'use client'

import { useState, useTransition } from 'react'
import { setEntryStatus } from '@/actions/entry-status'
import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

type EntryToggleButtonProps = {
  submissionId: string
  sudahDiinput: boolean
}

export function EntryToggleButton({
  submissionId,
  sudahDiinput: initialStatus,
}: EntryToggleButtonProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      const result = await setEntryStatus(submissionId, !status)
      if (result.success) {
        setStatus((s) => !s)
      } else {
        alert(result.error ?? 'Terjadi kesalahan.')
      }
    })
  }

  if (status) {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
          'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="Batalkan status sudah diinput"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RotateCcw className="w-3.5 h-3.5" />
        )}
        Batalkan
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
      title="Tandai sudah diinput ke sistem"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5" />
      )}
      Tandai Sudah Input
    </button>
  )
}
