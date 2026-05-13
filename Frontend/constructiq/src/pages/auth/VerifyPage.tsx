import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyMagicLink } from '../../api/auth'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from '../../components/ui/Toast' // Fix casing later
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'

export default function VerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore(state => state.setAuth)
  const token = searchParams.get('token')

  const [error, setError] = useState<string | null>(
    !token ? "No authentication token found in the URL. Please request a new link." : null
  )

  const hasAttempted = useRef(false)

  useEffect(() => {
    if (!token) {
      return
    }

    if (hasAttempted.current) return
    hasAttempted.current = true

    const authenticateToken = async () => {
      try {
        const data = await verifyMagicLink(token)

        setAuth(data.access, data.user)

        toast(`Welcome back, ${data.user.first_name}!`, 'success')

        switch (data.user.role) {
          case 'CLIENT':
            navigate('/client', { replace: true })
            break
          case 'SITE_OFFICER':
            navigate('/field', { replace: true })
            break
          case 'AGENT':
          case 'ADMIN':
          default:
            navigate('/dashboard', { replace: true })
            break
        }
      } catch (err: unknown) {
        console.error("Token verification failed", err)
        setError("This magic link is invalid or has expired. Please request a new one.")
      }
    }

    authenticateToken()
  }, [token, navigate, setAuth])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-app)]">
      {error ? (
        <div role="alert" aria-live="assertive" className="flex flex-col items-center justify-center text-center p-8 max-w-sm">
          <div className="w-16 h-16 bg-[var(--color-accent-red-dim)] rounded-full flex items-center justify-center mb-6">
            <svg aria-hidden="true" focusable="false" className="w-8 h-8 text-[var(--color-accent-red)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-2">Link Expired</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8">{error}</p>
          <Button variant="primary" onClick={() => navigate('/login', { replace: true })}>
            Back to Login
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <Spinner size="lg" />
          <p className="text-[var(--color-text-muted)] animate-pulse font-medium tracking-wide text-sm uppercase">
            Securing Connection...
          </p>
        </div>
      )}
    </div>
  )
}
