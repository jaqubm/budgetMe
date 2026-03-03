import { cn } from '@/lib/utils'
import type { CategoryType } from '@/types/api'

interface TypeBadgeProps {
  type: CategoryType
  className?: string
}

const config: Record<CategoryType, { label: string; classes: string }> = {
  expense: {
    label: 'Expense',
    classes: 'bg-expense-muted text-expense border-expense/25',
  },
  income: {
    label: 'Income',
    classes: 'bg-income-muted text-income border-income/25',
  },
  saving: {
    label: 'Saving',
    classes: 'bg-saving-muted text-saving border-saving/25',
  },
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const { label, classes } = config[type]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium tracking-wide rounded-sm border uppercase',
        classes,
        className,
      )}
    >
      {label}
    </span>
  )
}
