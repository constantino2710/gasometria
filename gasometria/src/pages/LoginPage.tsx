import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export function LoginPage() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'

  if (user) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    const result = await signIn(email, password)

    setIsSubmitting(false)

    if (result.error) {
      setError('Nao foi possivel entrar. Verifique email e senha.')
      return
    }

    navigate(redirectTo, { replace: true })
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="grid w-full max-w-sm gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-slate-900">Login</h1>
        <p className="text-sm text-slate-600">Entre com o usuario cadastrado no banco.</p>

        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />

        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
