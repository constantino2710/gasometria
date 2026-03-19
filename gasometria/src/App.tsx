import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './auth/AuthProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AnimalDetailsPage } from './pages/AnimalDetailsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'

type PublicRouteProps = {
  children: ReactNode
}

function PublicRoute({ children }: PublicRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <p className="p-8 text-slate-700">Carregando sessao...</p>
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/animals/:animalId"
        element={
          <ProtectedRoute>
            <AnimalDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
