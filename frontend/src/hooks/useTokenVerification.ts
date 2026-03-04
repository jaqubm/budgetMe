import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { verifyToken } from '@/api/auth'

type Status = 'pending' | 'done'

/**
 * On first mount, if a token exists in the store, verifies it against
 * POST /auth/verify. Clears auth state (logs out) if the token is invalid
 * or the request fails. Returns 'pending' while the check is in flight so
 * the UI can show a loading state instead of flashing the wrong page.
 */
export function useTokenVerification(): Status {
  const token = useAuthStore((s) => s.token)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const [status, setStatus] = useState<Status>(token ? 'pending' : 'done')
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true

    if (!token) {
      setStatus('done')
      return
    }

    verifyToken(token)
      .then((result) => {
        if (!result.valid) clearAuth()
      })
      .catch(() => {
        // Network error or 401 — treat as expired
        clearAuth()
      })
      .finally(() => {
        setStatus('done')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return status
}
