import { CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

type EntryStatusBadgeProps = {
  sudahDiinput: boolean
  tanggalInput?: Date | null
  className?: string
}

export function EntryStatusBadge({
  sudahDiinput,
  tanggalInput,
  className,
}: EntryStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        sudahDiinput
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        className
      )}
      title={
        sudahDiinput && tanggalInput
          ? `Diinput pada: ${new Intl.DateTimeFormat('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(tanggalInput))}`
          : 'Belum diinput ke sistem'
      }
    >
      {sudahDiinput ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Sudah Diinput
        </>
      ) : (
        <>
          <Clock className="w-3.5 h-3.5" />
          Belum Diinput
        </>
      )}
    </span>
  )
}
