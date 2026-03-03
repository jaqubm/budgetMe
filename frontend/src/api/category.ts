import { apiClient } from './client'
import type {
  CategoryResponse,
  CategoryUpdate,
  CategoryType,
  BudgetDateResponse,
} from '@/types/api'

/** GET /category — list all categories for the authenticated user */
export async function getCategories(category_type?: CategoryType): Promise<CategoryResponse[]> {
  const { data } = await apiClient.get<CategoryResponse[]>('/category', {
    params: category_type ? { category_type } : undefined,
  })
  return data
}

/** GET /category/:id/budget-dates — distinct (year, month) pairs with budgets */
export async function getCategoryBudgetDates(id: number): Promise<BudgetDateResponse[]> {
  const { data } = await apiClient.get<BudgetDateResponse[]>(
    `/category/${id}/budget-dates`,
  )
  return data
}

/** PATCH /category/:id — rename a category */
export async function updateCategory(
  id: number,
  payload: CategoryUpdate,
): Promise<CategoryResponse> {
  const { data } = await apiClient.patch<CategoryResponse>(`/category/${id}`, payload)
  return data
}

/** DELETE /category/:id — delete category (cascades all linked budgets) */
export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/category/${id}`)
}
