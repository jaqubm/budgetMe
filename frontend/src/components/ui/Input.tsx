import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface InputProps extends HTMLAttributes<HTMLInputElement> {
  type?: string
  value?: string | number
  placeholder?: string
  disabled?: boolean
  name?: string
  min?: number
  max?: number
  step?: number
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full h-9 px-3 bg-bg border border-border rounded-sm text-sm text-text placeholder:text-text-dim',
        'focus:outline-none focus:border-text-muted transition-colors duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
        className,
      )}
      {...props}
    />
  )
}

interface SelectProps extends HTMLAttributes<HTMLSelectElement> {
  value?: string
  disabled?: boolean
  name?: string
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
  children: React.ReactNode
}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'w-full h-9 px-3 bg-bg border border-border rounded-sm text-sm text-text appearance-none',
        'focus:outline-none focus:border-text-muted transition-colors duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
