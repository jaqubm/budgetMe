import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useTokenVerification } from '@/hooks/useTokenVerification'

function AuthGate() {
  const status = useTokenVerification()

  if (status === 'pending') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <span className="size-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <RouterProvider router={router} />
}

export default function App() {
  return <AuthGate />
}
