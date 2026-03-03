// ── Category ─────────────────────────────────────────────────────────────────
export type CategoryType = 'income' | 'expense' | 'saving'

export interface CategoryInfo {
  id: number
  name: string
  type: CategoryType
}

export interface CategoryResponse {
  id: number
  name: string
  type: CategoryType
}

export interface CategoryUpdate {
  name: string
}

export interface BudgetDateResponse {
  year: number
  month: number
}

// ── Budget ────────────────────────────────────────────────────────────────────
export interface BudgetResponse {
  id: number
  name: string
  year: number
  month: number
  value: number
  category: CategoryInfo
}

export interface BudgetCreate {
  name: string
  year: number
  month: number
  value?: number
  category_name: string
  category_type: CategoryType
}

export interface BudgetUpdate {
  name?: string
  year?: number
  month?: number
  value?: number
  category_name?: string
  category_type?: CategoryType
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface UserInfo {
  email: string
  name: string
  picture: string | null
}

export interface VerifyTokenResponse {
  valid: boolean
  user: UserInfo | null
}

// ── Health ────────────────────────────────────────────────────────────────────
export interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  database: 'connected' | 'disconnected'
  message: string | null
}
