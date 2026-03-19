import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type AnimalDetails = {
  id: string
  nome: string
  sexo: string | null
  idade_anos: number | null
  peso_kg: number | null
  observacoes: string | null
  created_at: string
  animal_types: { nome: string } | { nome: string }[] | null
}

function isMissingColumnError(message: string) {
  return (
    message.includes('column') &&
    (message.includes('sexo') || message.includes('idade_anos') || message.includes('peso_kg') || message.includes('observacoes'))
  )
}

function normalizeAnimal(data: Partial<AnimalDetails> & { id: string; nome: string }): AnimalDetails {
  return {
    id: data.id,
    nome: data.nome,
    sexo: data.sexo ?? null,
    idade_anos: data.idade_anos ?? null,
    peso_kg: data.peso_kg ?? null,
    observacoes: data.observacoes ?? null,
    created_at: data.created_at ?? new Date(0).toISOString(),
    animal_types: data.animal_types ?? null,
  }
}

function getSpeciesName(animal: AnimalDetails | null) {
  if (!animal?.animal_types) {
    return 'Nao informado'
  }

  if (Array.isArray(animal.animal_types)) {
    return animal.animal_types[0]?.nome ?? 'Nao informado'
  }

  return animal.animal_types.nome
}

export function AnimalDetailsPage() {
  const { animalId } = useParams()
  const navigate = useNavigate()
  const [animal, setAnimal] = useState<AnimalDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadAnimal()
  }, [animalId])

  async function loadAnimal() {
    if (!animalId) {
      setErrorMessage('Animal invalido.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    const { data, error } = await supabase
      .from('animals')
      .select('id, nome, sexo, idade_anos, peso_kg, observacoes, created_at, animal_types(nome)')
      .eq('id', animalId)
      .maybeSingle()

    if (error) {
      if (isMissingColumnError(error.message)) {
        const fallback = await supabase
          .from('animals')
          .select('id, nome, created_at, animal_types(nome)')
          .eq('id', animalId)
          .maybeSingle()

        if (fallback.error) {
          setErrorMessage(fallback.error.message)
          setAnimal(null)
          setIsLoading(false)
          return
        }

        if (!fallback.data) {
          setErrorMessage('Animal nao encontrado.')
          setAnimal(null)
          setIsLoading(false)
          return
        }

        setAnimal(normalizeAnimal(fallback.data as AnimalDetails))
        setErrorMessage(
          'Banco desatualizado: aplique as migracoes novas para visualizar sexo, idade, peso e observacoes.',
        )
        setIsLoading(false)
        return
      }

      setErrorMessage(error.message)
      setAnimal(null)
      setIsLoading(false)
      return
    }

    if (!data) {
      setErrorMessage('Animal nao encontrado.')
      setAnimal(null)
      setIsLoading(false)
      return
    }

    setAnimal(normalizeAnimal(data as AnimalDetails))
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalhes do animal</h1>
            <p className="text-sm text-slate-600">Area pronta para adicionar mais funcionalidades em seguida.</p>
        </div>

          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={() => navigate('/dashboard')}
          >
          Voltar
        </button>
      </div>

        {isLoading ? <p className="text-slate-700">Carregando...</p> : null}
        {errorMessage ? (
          <p className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {!isLoading && !errorMessage && animal ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">{animal.nome}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p>Especie</p>
                <p className="font-semibold text-slate-800">{getSpeciesName(animal)}</p>
            </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p>Sexo</p>
                <p className="font-semibold text-slate-800">{animal.sexo || 'Nao informado'}</p>
            </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p>Idade</p>
                <p className="font-semibold text-slate-800">
                  {animal.idade_anos ? `${animal.idade_anos} ano(s)` : 'Nao informada'}
                </p>
            </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p>Peso</p>
                <p className="font-semibold text-slate-800">{animal.peso_kg ? `${animal.peso_kg} kg` : 'Nao informado'}</p>
            </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p>Observacoes</p>
                <p className="font-semibold text-slate-800">{animal.observacoes || 'Sem observacoes'}</p>
            </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p>ID</p>
                <p className="break-all font-semibold text-slate-800">{animal.id}</p>
            </div>
          </div>

            <p className="mt-4 text-sm text-slate-600">
              Proximo passo: nesta pagina podemos incluir exames, historico e calculos do animal.
            </p>
          </section>
        ) : null}

        <p className="mt-4">
          <Link className="font-medium text-blue-700 hover:text-blue-800 hover:underline" to="/dashboard">
            Ir para lista de animais
          </Link>
        </p>
      </div>
    </div>
  )
}
