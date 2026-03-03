import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { getBudgets, deleteBudget, createBudget } from '@/api/budget'
import { getCategories } from '@/api/category'
import { formatCurrency, getMonthName, shiftMonth } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CategoryCombobox } from '@/components/ui/CategoryCombobox'
import { Spinner } from '@/components/ui/Spinner'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { LogoWordmark } from '@/components/ui/Logo'
import { PageShell } from '@/components/layout/PageShell'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import type { CategoryType, BudgetResponse, CategoryResponse } from '@/types/api'

const SECTION_ORDER: CategoryType[] = ['income', 'expense', 'saving']

const SECTION_META: Record<
  CategoryType,
  { label: string; color: string; glow: string; borderColor: string; totalColor: string }
> = {
  income: {
    label: 'Incomes',
    color: 'text-income',
    glow: 'var(--color-income-glow)',
    borderColor: 'var(--color-income)',
    totalColor: '#10b981',
  },
  expense: {
    label: 'Expenses',
    color: 'text-expense',
    glow: 'var(--color-expense-glow)',
    borderColor: 'var(--color-expense)',
    totalColor: '#f43f5e',
  },
  saving: {
    label: 'Savings',
    color: 'text-saving',
    glow: 'var(--color-saving-glow)',
    borderColor: 'var(--color-saving)',
    totalColor: '#8b5cf6',
  },
}

export default function BudgetPage() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const handleSignOut = () => {
    clearAuth()
    navigate('/login')
  }

  const prev = () => {
    const s = shiftMonth(year, month, -1)
    setYear(s.year)
    setMonth(s.month)
  }
  const next = () => {
    const s = shiftMonth(year, month, 1)
    setYear(s.year)
    setMonth(s.month)
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="border-b border-border bg-surface sticky top-0 z-20">
        <PageShell className="py-0">
          <div className="flex items-center justify-between h-14 gap-6">
            <LogoWordmark size="sm" />

            {/* Month / year navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={prev}
                aria-label="Previous month"
                className="w-8 h-8 flex items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-raised transition-colors cursor-pointer"
              >
                ←
              </button>
              <span className="font-num text-sm font-medium text-text min-w-[120px] text-center select-none">
                {getMonthName(month)} {year}
              </span>
              <button
                onClick={next}
                aria-label="Next month"
                className="w-8 h-8 flex items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-raised transition-colors cursor-pointer"
              >
                →
              </button>
            </div>

            {/* User */}
            <div className="flex items-center gap-3">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  width={28}
                  height={28}
                  referrerPolicy="no-referrer"
                  className="rounded-full ring-1 ring-border"
                />
              ) : null}
              <span className="text-sm text-text-muted hidden sm:inline">{user?.name}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </div>
        </PageShell>
      </header>

      {/* ── Sections grid ───────────────────────────────────────── */}
      <main className="flex-1">
        <PageShell className="py-6">
          <div className="grid grid-cols-3 gap-5 items-start">
            {SECTION_ORDER.map((type) => (
              <BudgetSection key={type} type={type} year={year} month={month} />
            ))}
          </div>
        </PageShell>
      </main>
    </div>
  )
}

// ── Budget Section ────────────────────────────────────────────────────────────
interface BudgetSectionProps {
  type: CategoryType
  year: number
  month: number
}

function BudgetSection({ type, year, month }: BudgetSectionProps) {
  const meta = SECTION_META[type]
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['budgets', year, month, type],
    queryFn: () => getBudgets({ year, month, category_type: type }),
  })

  const total = items.reduce((sum, item) => sum + item.value, 0)

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['budgets', year, month, type] }),
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col bg-surface border border-border rounded-sm overflow-hidden"
      style={{ borderTop: `2px solid ${meta.borderColor}` }}
    >
      {/* Section header */}
      <div
        className="px-5 py-4 flex items-start justify-between"
        style={{ background: meta.glow }}
      >
        <div>
          <div className="flex items-center gap-2">
            <TypeBadge type={type} />
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight">{meta.label}</h2>
        </div>
        <div className="text-right">
          <span className="text-xs text-text-muted block mb-0.5">Total</span>
          <span
            className="font-num text-lg font-semibold"
            style={{ color: meta.totalColor }}
          >
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Items list */}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : items.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-text-dim text-sm">No entries yet</span>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            <AnimatePresence initial={false}>
              {groupByCategory(items).map(({ categoryName, subtotal, entries }) => (
                <CategoryGroup
                  key={categoryName}
                  categoryName={categoryName}
                  subtotal={subtotal}
                  entries={entries}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  deletingId={deleteMutation.isPending ? deleteMutation.variables : undefined}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Inline add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <AddBudgetForm
                type={type}
                year={year}
                month={month}
                onClose={() => setShowForm(false)}
                onSaved={() => {
                  void qc.invalidateQueries({ queryKey: ['budgets', year, month, type] })
                  setShowForm(false)
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer: add button */}
      {!showForm && (
        <div className="px-5 py-3 border-t border-border-subtle">
          <button
            onClick={() => setShowForm(true)}
            className="w-full h-8 flex items-center justify-center gap-1.5 text-xs text-text-dim hover:text-text-muted border border-dashed border-border hover:border-text-dim rounded-sm transition-colors cursor-pointer"
          >
            <span className="text-base leading-none">+</span> Add entry
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
interface CategoryGroup {
  categoryName: string
  subtotal: number
  entries: BudgetResponse[]
}

function groupByCategory(items: BudgetResponse[]): CategoryGroup[] {
  const map = new Map<string, BudgetResponse[]>()
  for (const item of items) {
    const key = item.category.name
    const group = map.get(key) ?? []
    group.push(item)
    map.set(key, group)
  }
  return Array.from(map.entries()).map(([categoryName, entries]) => ({
    categoryName,
    subtotal: entries.reduce((s, e) => s + e.value, 0),
    entries,
  }))
}

// ── Category Group ────────────────────────────────────────────────────────────
interface CategoryGroupProps {
  categoryName: string
  subtotal: number
  entries: BudgetResponse[]
  onDelete: (id: number) => void
  deletingId: number | undefined
}

function CategoryGroup({ categoryName, subtotal, entries, onDelete, deletingId }: CategoryGroupProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {/* Category header row */}
      <div className="flex items-center justify-between px-5 py-2 bg-surface-raised border-b border-border-subtle">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
          {categoryName}
        </span>
        <span className="font-num text-xs text-text-dim flex-shrink-0 ml-3">
          {formatCurrency(subtotal)}
        </span>
      </div>

      {/* Entries under this category */}
      <ul>
        {entries.map((item) => (
          <BudgetItem
            key={item.id}
            item={item}
            onDelete={() => onDelete(item.id)}
            deleting={deletingId === item.id}
          />
        ))}
      </ul>
    </motion.div>
  )
}

// ── Budget Item ───────────────────────────────────────────────────────────────
interface BudgetItemProps {
  item: BudgetResponse
  onDelete: () => void
  deleting: boolean
}

function BudgetItem({ item, onDelete, deleting }: BudgetItemProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.18 }}
      className="group flex items-center gap-3 px-5 py-2.5 hover:bg-surface-raised transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text truncate">{item.name}</p>
      </div>

      <span className="font-num text-sm font-medium text-text flex-shrink-0">
        {formatCurrency(item.value)}
      </span>

      <button
        onClick={onDelete}
        disabled={deleting}
        aria-label="Delete entry"
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-6 h-6 flex items-center justify-center text-text-dim hover:text-expense transition-all cursor-pointer disabled:cursor-not-allowed"
      >
        {deleting ? <Spinner size="sm" /> : '×'}
      </button>
    </motion.li>
  )
}

// ── Add Budget Form ───────────────────────────────────────────────────────────
interface AddBudgetFormProps {
  type: CategoryType
  year: number
  month: number
  onClose: () => void
  onSaved: () => void
}

function AddBudgetForm({ type, year, month, onClose, onSaved }: AddBudgetFormProps) {
  const [name, setName] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: categories = [] } = useQuery<CategoryResponse[]>({
    queryKey: ['categories', type],
    queryFn: () => getCategories(type),
  })

  const mutation = useMutation({
    mutationFn: createBudget,
    onSuccess: onSaved,
    onError: () => setError('Failed to save. Please try again.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Entry name is required.'); return }
    if (!categoryName.trim()) { setError('Please select or enter a category.'); return }
    setError(null)
    mutation.mutate({
      name: name.trim(),
      category_name: categoryName.trim(),
      category_type: type,
      year,
      month,
      value: value ? parseFloat(value) : 0,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-5 py-4 flex flex-col gap-3 border-t border-border-subtle bg-surface-raised"
    >
      <p className="text-xs font-medium text-text-muted uppercase tracking-wider">New entry</p>

      <Input
        placeholder="Entry name (e.g. Rent)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        name="name"
      />

      <CategoryCombobox
        categories={categories}
        value={categoryName}
        onChange={setCategoryName}
      />

      <Input
        type="number"
        placeholder="Value (0.00)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        min={0}
        step={0.01}
        name="value"
      />

      {error && <p className="text-xs text-expense">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={mutation.isPending} className="flex-1">
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
