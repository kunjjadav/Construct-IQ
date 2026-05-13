import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { requestMagicLink, loginWithPassword } from '../../api/auth'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { ArrowRight, KeyRound, Mail, Lock } from 'lucide-react'

type LoginMode = 'password' | 'magic' | 'sent'

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const setAuth = useAuthStore(state => state.setAuth)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    try {
      const res = await loginWithPassword(email, password)
      setAuth(res.access, res.user)
      toast('Login successful', 'success')
      navigate('/dashboard')
    } catch (error: unknown) {
      const axiosErr = error as { response?: { status?: number } }
      if (axiosErr?.response?.status === 429) {
        toast('Too many attempts. Please try again later.', 'error')
      } else {
        toast('Invalid email or password.', 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      await requestMagicLink(email)
      setMode('sent')
      toast('Magic link sent successfully.', 'success')
    } catch (error: unknown) {
      const axiosErr = error as { response?: { status?: number } }
      if (axiosErr?.response?.status === 429) {
        toast('Too many requests. Please wait a minute before trying again.', 'error')
      } else {
        setMode('sent') // Security: generic fallback prevents email enumeration
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-app)] relative overflow-hidden">

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(var(--color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="w-full max-w-sm px-6 relative z-10">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-12 h-12 bg-[var(--color-accent-blue)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <span className="text-white font-bold text-xl tracking-tighter">IQ</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            ConstructIQ
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Secure construction management platform.
          </p>
        </div>

        <Card variant="surface" padding="lg" className="w-full relative shadow-2xl">
          <AnimatePresence mode="wait">

            {mode === 'password' && (
              <motion.div key="pwd" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <form onSubmit={handlePasswordLogin} className="flex flex-col gap-5">
                  <Input
                    type="email"
                    label="Work Email Address"
                    placeholder="officer@construction.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                  <div className="relative">
                    <Input
                      type="password"
                      label="Password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      autoComplete="current-password"
                    />
                    <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute right-3 top-[38px] pointer-events-none" />
                  </div>
                  <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
                    Sign In <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
                <div className="mt-6 pt-6 border-t border-[var(--color-border-subtle)] flex flex-col gap-3">
                  <p className="text-xs text-center text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Alternative Login</p>
                  <Button variant="secondary" onClick={() => setMode('magic')} className="w-full text-sm">
                    <Mail className="w-4 h-4 mr-2" /> Use Secure Magic Link
                  </Button>
                </div>
              </motion.div>
            )}

            {mode === 'magic' && (
              <motion.div key="magic" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <form onSubmit={handleMagicLink} className="flex flex-col gap-5">
                  <Input
                    type="email"
                    label="Work Email Address"
                    placeholder="officer@construction.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                  <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
                    Send Magic Link <Mail className="w-4 h-4 ml-2" />
                  </Button>
                </form>
                <div className="mt-6 pt-6 border-t border-[var(--color-border-subtle)] flex flex-col gap-3">
                  <p className="text-xs text-center text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Alternative Login</p>
                  <Button variant="secondary" onClick={() => setMode('password')} className="w-full text-sm">
                    <KeyRound className="w-4 h-4 mr-2" /> Use Password Instead
                  </Button>
                </div>
              </motion.div>
            )}

            {mode === 'sent' && (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                  <Mail className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                  Check your inbox
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-8 leading-relaxed">
                  We sent a secure magic link to <br />
                  <strong className="text-[var(--color-text-primary)]">{email}</strong>
                </p>
                <Button variant="ghost" size="sm" onClick={() => setMode('magic')}>
                  Use a different email
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </Card>
      </div>
    </div>
  )
}
