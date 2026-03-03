import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-150 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

  const variants = {
    primary:
      'bg-accent text-bg hover:brightness-110 active:brightness-95 focus-visible:outline-accent',
    ghost:
      'bg-transparent text-text-muted hover:text-text hover:bg-surface-raised focus-visible:outline-border',
    danger:
      'bg-expense-muted text-expense border border-expense/30 hover:bg-expense hover:text-bg focus-visible:outline-expense',
    outline:
      'bg-transparent text-text border border-border hover:border-text-muted hover:bg-surface-raised focus-visible:outline-border',
  }

  const sizes = {
    sm: 'h-7 px-3 text-xs rounded-sm',
    md: 'h-9 px-4 text-sm rounded-sm',
    lg: 'h-11 px-6 text-base rounded-sm',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading ? (
        <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  )
}
