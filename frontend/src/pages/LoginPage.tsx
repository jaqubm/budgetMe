import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { motion } from 'framer-motion'
import { LogoMark } from '@/components/ui/Logo'
import { verifyToken } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (response) => {
      setLoading(true)
      setError(null)
      try {
        const result = await verifyToken(response.access_token)
        if (result.valid && result.user) {
          setAuth(response.access_token, result.user)
          navigate('/budget')
        } else {
          setError('Could not verify your account. Please try again.')
        }
      } catch {
        setError('Authentication failed. Check your connection and retry.')
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      setError('Google sign-in was cancelled or failed.')
      setLoading(false)
    },
  })

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-bg relative overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(167,139,250,0.07) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-10 w-full max-w-sm px-6"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <LogoMark size={56} />
          </motion.div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              budget<span className="text-accent">Me</span>
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Personal finances — clear and simple.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-border" />

        {/* Sign-in block */}
        <div className="w-full flex flex-col gap-4">
          <GoogleSignInButton loading={loading} onClick={() => login()} />

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-expense text-center"
            >
              {error}
            </motion.p>
          )}

          <p className="text-xs text-text-dim text-center leading-relaxed">
            By signing in you agree to use this app&nbsp;responsibly.
          </p>
        </div>
      </motion.div>

      {/* Version watermark */}
      <span className="absolute bottom-6 text-xs text-text-dim font-mono select-none">
        v0.1.0
      </span>
    </div>
  )
}

// ── Custom Google Sign-In button ─────────────────────────────────────────────
interface GoogleSignInButtonProps {
  loading: boolean
  onClick: () => void
}

function GoogleSignInButton({ loading, onClick }: GoogleSignInButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={[
        'group w-full h-12 flex items-center gap-3 px-5',
        'bg-surface border border-border rounded-sm',
        'text-sm font-medium text-text tracking-tight',
        'hover:border-text-dim hover:bg-surface-raised',
        'active:scale-[0.99] transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'cursor-pointer',
      ].join(' ')}
    >
      {loading ? (
        <span className="size-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin flex-shrink-0" />
      ) : (
        <GoogleIcon />
      )}
      <span className="flex-1 text-left">
        {loading ? 'Signing in…' : 'Continue with Google'}
      </span>
      {!loading && (
        <span className="text-text-dim group-hover:text-text-muted transition-colors">→</span>
      )}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="flex-shrink-0">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
