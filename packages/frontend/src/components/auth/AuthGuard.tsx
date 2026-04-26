import { type ReactNode, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { LoginPage } from './LoginPage'

interface AuthGuardProps {
  children: ReactNode
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, guestUser, loading, initialize } = useAuthStore()
  const initRef = useRef(false)

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      initialize()
    }
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-surface)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent-primary)' }} />
          <p className="font-medium animate-pulse text-sm" style={{ color: 'var(--color-text-muted)' }}>Verifying Session...</p>
        </div>
      </div>
    )
  }

  if (!user && !guestUser) {
    return <LoginPage />
  }

  return <>{children}</>
}
