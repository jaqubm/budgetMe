import axios from 'axios'

const BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

/** Attach the Google Bearer token from localStorage on every request */
apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('budgetme-auth')
  if (raw) {
    try {
      const { state } = JSON.parse(raw) as { state?: { token?: string } }
      if (state?.token) {
        config.headers['Authorization'] = `Bearer ${state.token}`
      }
    } catch {
      // ignore malformed storage
    }
  }
  return config
})
