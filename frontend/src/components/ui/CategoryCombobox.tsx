import { useState, useRef, useEffect, useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { CategoryResponse } from '@/types/api'

interface CategoryComboboxProps {
  categories: CategoryResponse[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function CategoryCombobox({
  categories,
  value,
  onChange,
  placeholder = 'Search or create category…',
  disabled = false,
}: CategoryComboboxProps) {
  const id = useId()
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep query in sync if parent resets value (e.g. form reset)
  useEffect(() => {
    if (value === '') setQuery('')
  }, [value])

  const trimmed = query.trim()

  const filtered = trimmed
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(trimmed.toLowerCase()),
      )
    : categories

  // Show "Create" only when there are zero matching results
  const showCreate = trimmed.length > 0 && filtered.length === 0

  const options: Array<{ label: string; value: string; isCreate?: boolean }> = [
    ...filtered.map((c) => ({ label: c.name, value: c.name })),
    ...(showCreate
      ? [{ label: `Create "${trimmed}"`, value: trimmed, isCreate: true }]
      : []),
  ]

  // Close on outside click
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  function select(optValue: string) {
    setQuery(optValue)
    onChange(optValue)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    onChange(v)
    setOpen(true)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true)
        e.preventDefault()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && options[activeIndex]) {
          select(options[activeIndex].value)
        } else if (query.trim()) {
          select(query.trim())
        }
        break
      case 'Escape':
        setOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            'w-full h-9 px-3 pr-8 bg-bg border border-border rounded-sm text-sm text-text placeholder:text-text-dim',
            'focus:outline-none focus:border-text-muted transition-colors duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        />
        {/* Chevron */}
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim transition-transform duration-150',
            open && 'rotate-180',
          )}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      <AnimatePresence>
        {open && options.length > 0 && (
          <motion.ul
            ref={listRef}
            role="listbox"
            key="dropdown"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              'absolute z-50 mt-1 w-full max-h-52 overflow-y-auto',
              'bg-surface-raised border border-border rounded-sm shadow-lg',
            )}
          >
            {options.map((opt, i) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onPointerDown={(e) => {
                  e.preventDefault() // keep focus on input
                  select(opt.value)
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none transition-colors duration-75',
                  i === activeIndex
                    ? 'bg-accent/10 text-text'
                    : 'text-text-muted hover:bg-surface hover:text-text',
                  opt.isCreate && 'text-accent',
                )}
              >
                {opt.isCreate ? (
                  <>
                    <span className="text-accent font-medium text-xs leading-none">NEW</span>
                    <span>{opt.label.replace(/^Create /, '')}</span>
                  </>
                ) : (
                  <>
                    {/* Checkmark when selected */}
                    <span className={cn('text-xs w-3 flex-shrink-0', opt.value === value ? 'text-accent' : 'opacity-0')}>✓</span>
                    {opt.label}
                  </>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
