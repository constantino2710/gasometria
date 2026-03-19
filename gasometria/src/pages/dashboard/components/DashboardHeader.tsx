import { Button } from '../../../components/ui'

type DashboardHeaderProps = {
  userEmail?: string
  onCreateAnimal: () => void
  onSignOut: () => Promise<void>
}

export function DashboardHeader({ userEmail, onCreateAnimal, onSignOut }: DashboardHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Animais</h1>
        <p className="text-sm text-slate-600">Usuario logado: {userEmail}</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={onCreateAnimal}>
          Novo animal
        </Button>
        <Button onClick={() => void onSignOut()}>Sair</Button>
      </div>
    </header>
  )
}
