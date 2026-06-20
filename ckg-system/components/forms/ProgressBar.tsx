import { cn } from '@/lib/utils'

type ProgressBarProps = {
  currentStep: number
  totalSteps: number
  stepLabel?: string
}

export function ProgressBar({ currentStep, totalSteps, stepLabel }: ProgressBarProps) {
  const persen = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{stepLabel ?? `Langkah ${currentStep} dari ${totalSteps}`}</span>
        <span className="font-medium">{persen}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${persen}%` }}
        />
      </div>
    </div>
  )
}
