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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Verifying Session...</p>
        </div>
      </div>
    )
  }

  if (!user && !guestUser) {
    return <LoginPage />
  }

  return <>{children}</>
}
