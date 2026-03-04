import { apiClient } from './client'
import type { BudgetResponse, BudgetCreate, BudgetUpdate, BudgetCloneRequest, CategoryType } from '@/types/api'

export interface GetBudgetsParams {
  year: number
  month: number
  category_type?: CategoryType
}

/** GET /budget — list budgets for a given year/month (optionally filtered by type) */
export async function getBudgets(params: GetBudgetsParams): Promise<BudgetResponse[]> {
  const { data } = await apiClient.get<BudgetResponse[]>('/budget', { params })
  return data
}

/** POST /budget — create a new budget entry */
export async function createBudget(payload: BudgetCreate): Promise<BudgetResponse> {
  const { data } = await apiClient.post<BudgetResponse>('/budget', payload)
  return data
}

/** PATCH /budget/:id — partially update a budget entry */
export async function updateBudget(id: number, payload: BudgetUpdate): Promise<BudgetResponse> {
  const { data } = await apiClient.patch<BudgetResponse>(`/budget/${id}`, payload)
  return data
}

/** DELETE /budget/:id — remove a budget entry */
export async function deleteBudget(id: number): Promise<void> {
  await apiClient.delete(`/budget/${id}`)
}

/** POST /budget/clone — clone all reoccurring budgets from the previous month into the given month */
export async function cloneReoccurringBudgets(payload: BudgetCloneRequest): Promise<BudgetResponse[]> {
  const { data } = await apiClient.post<BudgetResponse[]>('/budget/clone', payload)
  return data
}
