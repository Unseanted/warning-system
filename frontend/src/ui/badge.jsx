import { cn } from '@/lib/utils'
import { riskClassName } from '@/lib/utils'

export function Badge({ className, risk, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        risk ? riskClassName(risk) : 'bg-secondary text-secondary-foreground border-border',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
