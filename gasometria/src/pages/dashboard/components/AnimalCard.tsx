type AnimalCardProps = {
  id: string
  nome: string
  especie: string
  sexo: string | null
  idadeAnos: number | null
  onOpen: (animalId: string) => void
}

export function AnimalCard({ id, nome, especie, sexo, idadeAnos, onOpen }: AnimalCardProps) {
  return (
    <button
      className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
      onClick={() => onOpen(id)}
      title={`Abrir ${nome}`}
    >
      <p className="text-lg font-bold text-slate-900">{nome}</p>
      <div className="mt-3 space-y-1 text-sm text-slate-600">
        <p>Especie: {especie}</p>
        <p>Sexo: {sexo || 'Nao informado'}</p>
        <p>Idade: {idadeAnos ? `${idadeAnos} ano(s)` : 'Nao informada'}</p>
      </div>
    </button>
  )
}
