import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { ReactNode } from 'react'
import LoginPage from '@/pages/LoginPage'
import BudgetPage from '@/pages/BudgetPage'

/** Redirect to /login if no token in store */
function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Redirect to /budget if already authenticated */
function RedirectIfAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  if (isAuthenticated) return <Navigate to="/budget" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RedirectIfAuth>
        <LoginPage />
      </RedirectIfAuth>
    ),
  },
  {
    path: '/budget',
    element: (
      <RequireAuth>
        <BudgetPage />
      </RequireAuth>
    ),
  },
  {
    path: '/',
    element: <Navigate to="/budget" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/budget" replace />,
  },
])
