import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCategory, deleteCategory } from '@/api/category'
import { createBudget } from '@/api/budget'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { CategoryType, BudgetResponse } from '@/types/api'

// ── Types ─────────────────────────────────────────────────────────────────────
export type CategoryAction = 'rename' | 'delete'

interface CategoryActionsModalProps {
  /** The category id needed by the API */
  categoryId: number
  categoryName: string
  categoryType: CategoryType
  /** All budget entries in the current view that belong to this category */
  entries: BudgetResponse[]
  action: CategoryAction | null
  year: number
  month: number
  onClose: () => void
}

// ── Main component ────────────────────────────────────────────────────────────
export function CategoryActionsModal({
  categoryId,
  categoryName,
  categoryType,
  entries,
  action,
  year,
  month,
  onClose,
}: CategoryActionsModalProps) {
  return (
    <>
      <RenameModal
        open={action === 'rename'}
        categoryId={categoryId}
        categoryName={categoryName}
        categoryType={categoryType}
        entries={entries}
        year={year}
        month={month}
        onClose={onClose}
      />
      <DeleteModal
        open={action === 'delete'}
        categoryId={categoryId}
        categoryName={categoryName}
        categoryType={categoryType}
        onClose={onClose}
      />
    </>
  )
}

// ── Rename modal ──────────────────────────────────────────────────────────────
interface RenameModalProps {
  open: boolean
  categoryId: number
  categoryName: string
  categoryType: CategoryType
  entries: BudgetResponse[]
  year: number
  month: number
  onClose: () => void
}

function RenameModal({
  open,
  categoryId,
  categoryName,
  categoryType,
  entries,
  year,
  month,
  onClose,
}: RenameModalProps) {
  const qc = useQueryClient()
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Step 2 choice (only shown after user types a name and clicks Next)
  const [step, setStep] = useState<'input' | 'choice'>('input')

  function reset() {
    setNewName('')
    setError(null)
    setStep('input')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function invalidateAll() {
    void qc.invalidateQueries({ queryKey: ['budgets', year, month] })
    void qc.invalidateQueries({ queryKey: ['categories'] })
  }

  // --- Option A: rename in-place (impacts all months/years) ---
  const renameMutation = useMutation({
    mutationFn: () => updateCategory(categoryId, { name: newName.trim() }),
    onSuccess: () => { invalidateAll(); handleClose() },
    onError: () => setError('Failed to rename. Please try again.'),
  })

  // --- Option B: create new category entries from current month's budgets ---
  const createNewMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        entries.map((e) =>
          createBudget({
            name: e.name,
            year,
            month,
            value: e.value,
            category_name: newName.trim(),
            category_type: categoryType,
          }),
        ),
      )
    },
    onSuccess: () => { invalidateAll(); handleClose() },
    onError: () => setError('Failed to create new entries. Please try again.'),
  })

  const busy = renameMutation.isPending || createNewMutation.isPending

  return (
    <Modal open={open} onClose={handleClose} title="Rename category">
      {step === 'input' ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            Enter a new name for <span className="text-text font-medium">"{categoryName}"</span>.
          </p>
          <Input
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) setStep('choice')
            }}
            autoFocus
          />
          {error && <p className="text-xs text-expense">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
            <Button
              size="sm"
              disabled={!newName.trim() || newName.trim() === categoryName}
              onClick={() => setStep('choice')}
            >
              Next →
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Warning banner */}
          <div className="flex gap-3 px-4 py-3 bg-saving-muted border border-saving/25 rounded-sm">
            <span className="text-saving text-base leading-none mt-0.5">⚠</span>
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="text-text font-medium">"{categoryName}"</span> may be used by
              budgets across <span className="text-text font-medium">other months and years</span>.
              Choose how to apply the rename:
            </p>
          </div>

          {/* Option A */}
          <button
            onClick={() => renameMutation.mutate()}
            disabled={busy}
            className="group w-full text-left px-4 py-3.5 border border-border hover:border-text-dim rounded-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <p className="text-sm font-medium text-text">
              Rename everywhere
            </p>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              Updates <span className="text-text">"{categoryName}"</span> to{' '}
              <span className="text-text">"{newName.trim()}"</span> across{' '}
              <span className="text-expense font-medium">all months and years</span>.
            </p>
          </button>

          {/* Option B */}
          <button
            onClick={() => createNewMutation.mutate()}
            disabled={busy}
            className="group w-full text-left px-4 py-3.5 border border-border hover:border-text-dim rounded-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <p className="text-sm font-medium text-text">
              Create new for this month only
            </p>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              Duplicates the <span className="text-text">{entries.length}</span> entr
              {entries.length === 1 ? 'y' : 'ies'} from{' '}
              <span className="text-text font-medium">this month</span> into a new category{' '}
              <span className="text-text">"{newName.trim()}"</span>. Original category and
              historical budgets are <span className="text-income font-medium">untouched</span>.
            </p>
          </button>

          {error && <p className="text-xs text-expense">{error}</p>}

          <div className="flex gap-2 justify-between">
            <Button variant="ghost" size="sm" onClick={() => { setStep('input'); setError(null) }}>
              ← Back
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Delete modal ──────────────────────────────────────────────────────────────
interface DeleteModalProps {
  open: boolean
  categoryId: number
  categoryName: string
  categoryType: CategoryType
  onClose: () => void
}

function DeleteModal({
  open,
  categoryId,
  categoryName,
  onClose,
}: DeleteModalProps) {
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: () => deleteCategory(categoryId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['budgets'] })
      void qc.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
    onError: () => setError('Failed to delete. Please try again.'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Delete category">
      <div className="flex flex-col gap-4">
        {/* Warning */}
        <div className="flex gap-3 px-4 py-3 bg-expense-muted border border-expense/25 rounded-sm">
          <span className="text-expense text-base leading-none mt-0.5">⚠</span>
          <p className="text-xs text-text-muted leading-relaxed">
            Deleting <span className="text-text font-medium">"{categoryName}"</span> will
            permanently remove it and{' '}
            <span className="text-expense font-medium">
              all budget entries linked to it across every month and year
            </span>
            . This cannot be undone.
          </p>
        </div>

        {error && <p className="text-xs text-expense">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Delete permanently
          </Button>
        </div>
      </div>
    </Modal>
  )
}
