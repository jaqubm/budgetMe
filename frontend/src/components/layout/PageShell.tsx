import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageShellProps {
  children: ReactNode
  className?: string
}

/**
 * Centers content with a max-width of 1600 px and consistent horizontal padding.
 * The outer wrapper fills the viewport; the inner wrapper constrains width.
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('flex-1 w-full mx-auto px-6', 'max-w-400', className)}>
      {children}
    </div>
  )
}
