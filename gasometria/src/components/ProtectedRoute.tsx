import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import type { ReactNode } from 'react'

type ProtectedRouteProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <p className="p-8 text-slate-700">Carregando sessao...</p>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
