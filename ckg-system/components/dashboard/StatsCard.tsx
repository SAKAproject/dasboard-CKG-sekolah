import { cn } from '@/lib/utils'

type StatsCardProps = {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted'
  trend?: { value: number; label: string }
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
}: StatsCardProps) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    destructive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    muted: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={cn('p-2.5 rounded-lg flex-shrink-0', colorMap[color])}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {trend && (
          <p
            className={cn(
              'text-xs mt-1 font-medium',
              trend.value >= 0 ? 'text-green-600' : 'text-red-500'
            )}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </div>
    </div>
  )
}
