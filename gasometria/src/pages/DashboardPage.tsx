import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

type AnimalType = {
  id: number
  nome: string
}

type Animal = {
  id: string
  nome: string
  animal_type_id: number | null
  sexo: string | null
  idade_anos: number | null
  peso_kg: number | null
  observacoes: string | null
  created_at: string
  animal_types: { nome: string } | { nome: string }[] | null
}

type AnimalFormState = {
  nome: string
  animal_type_id: string
  sexo: string
  idade_anos: string
  peso_kg: string
  observacoes: string
}

const initialFormState: AnimalFormState = {
  nome: '',
  animal_type_id: '',
  sexo: '',
  idade_anos: '',
  peso_kg: '',
  observacoes: '',
}

function getAnimalTypeName(animal: Animal) {
  if (!animal.animal_types) {
    return 'Nao informado'
  }

  if (Array.isArray(animal.animal_types)) {
    return animal.animal_types[0]?.nome ?? 'Nao informado'
  }

  return animal.animal_types.nome
}

function isMissingColumnError(message: string) {
  return (
    message.includes('column') &&
    (message.includes('sexo') || message.includes('idade_anos') || message.includes('peso_kg') || message.includes('observacoes'))
  )
}

function normalizeAnimal(data: Partial<Animal> & { id: string; nome: string }): Animal {
  return {
    id: data.id,
    nome: data.nome,
    animal_type_id: data.animal_type_id ?? null,
    sexo: data.sexo ?? null,
    idade_anos: data.idade_anos ?? null,
    peso_kg: data.peso_kg ?? null,
    observacoes: data.observacoes ?? null,
    created_at: data.created_at ?? new Date(0).toISOString(),
    animal_types: data.animal_types ?? null,
  }
}

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [animals, setAnimals] = useState<Animal[]>([])
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [form, setForm] = useState<AnimalFormState>(initialFormState)
  const [isLegacySchema, setIsLegacySchema] = useState(false)

  const formattedAnimals = useMemo(() => {
    return animals.map((animal) => ({
      ...animal,
      especie: getAnimalTypeName(animal),
    }))
  }, [animals])

  useEffect(() => {
    void loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setIsLoading(true)
    setErrorMessage(null)

    const [animalsResult, typesResult] = await Promise.all([
      supabase
        .from('animals')
        .select(
          'id, nome, animal_type_id, sexo, idade_anos, peso_kg, observacoes, created_at, animal_types(nome)',
        )
        .order('created_at', { ascending: false }),
      supabase.from('animal_types').select('id, nome').order('nome', { ascending: true }),
    ])

    if (animalsResult.error) {
      if (isMissingColumnError(animalsResult.error.message)) {
        const fallbackAnimals = await supabase
          .from('animals')
          .select('id, nome, animal_type_id, created_at, animal_types(nome)')
          .order('created_at', { ascending: false })

        if (fallbackAnimals.error) {
          setErrorMessage(fallbackAnimals.error.message)
        } else {
          setAnimals((fallbackAnimals.data ?? []).map((item) => normalizeAnimal(item as Animal)))
          setIsLegacySchema(true)
          setErrorMessage(
            'Banco desatualizado: aplique as migracoes novas para salvar sexo, idade, peso e observacoes.',
          )
        }
      } else {
        setErrorMessage(animalsResult.error.message)
      }
    } else {
      setAnimals((animalsResult.data ?? []).map((item) => normalizeAnimal(item as Animal)))
      setIsLegacySchema(false)
    }

    if (typesResult.error) {
      setErrorMessage(typesResult.error.message)
    } else {
      setAnimalTypes(typesResult.data ?? [])
    }

    setIsLoading(false)
  }

  function openModal() {
    setForm(initialFormState)
    setErrorMessage(null)
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSaving) {
      return
    }

    setIsModalOpen(false)
  }

  async function handleCreateAnimal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user) {
      setErrorMessage('Usuario nao autenticado.')
      return
    }

    if (!form.nome.trim() || !form.animal_type_id) {
      setErrorMessage('Preencha nome e especie para cadastrar o animal.')
      return
    }

    if (!form.sexo) {
      setErrorMessage('Selecione o sexo do animal.')
      return
    }

    if (isLegacySchema) {
      setErrorMessage(
        'Nao foi possivel salvar: o banco ainda nao tem os campos novos. Rode as migracoes do Supabase e tente novamente.',
      )
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    const idadeAnos = form.idade_anos ? Number(form.idade_anos) : null
    const pesoKg = form.peso_kg ? Number(form.peso_kg) : null

    const { error } = await supabase.from('animals').insert({
      nome: form.nome.trim(),
      animal_type_id: Number(form.animal_type_id),
      sexo: form.sexo.trim() || null,
      idade_anos: Number.isNaN(idadeAnos) ? null : idadeAnos,
      peso_kg: Number.isNaN(pesoKg) ? null : pesoKg,
      observacoes: form.observacoes.trim() || null,
      user_id: user.id,
    })

    if (error) {
      setErrorMessage(error.message)
      setIsSaving(false)
      return
    }

    await loadDashboardData()
    setIsSaving(false)
    setIsModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Animais</h1>
            <p className="text-sm text-slate-600">Usuario logado: {user?.email}</p>
        </div>

          <div className="flex items-center gap-3">
            <button
              className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
              onClick={openModal}
            >
            Novo animal
          </button>
            <button
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={signOut}
            >
            Sair
          </button>
        </div>
        </header>

        {errorMessage ? (
          <p className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? <p className="text-slate-700">Carregando animais...</p> : null}

        {!isLoading && formattedAnimals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-slate-600">
            <p>Nenhum animal cadastrado ainda.</p>
            <p>Clique em "Novo animal" para criar o primeiro card.</p>
          </div>
        ) : null}

        {!isLoading && formattedAnimals.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {formattedAnimals.map((animal) => (
              <button
                key={animal.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
                onClick={() => navigate(`/animals/${animal.id}`)}
                title={`Abrir ${animal.nome}`}
              >
                <p className="text-lg font-bold text-slate-900">{animal.nome}</p>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p>Especie: {animal.especie}</p>
                  <p>Sexo: {animal.sexo || 'Nao informado'}</p>
                  <p>Idade: {animal.idade_anos ? `${animal.idade_anos} ano(s)` : 'Nao informada'}</p>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/55 p-4" onClick={closeModal}>
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="mb-4 text-xl font-bold text-slate-900">Cadastrar novo animal</h2>

            <form onSubmit={handleCreateAnimal}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="animal-nome">Nome *</label>
                  <input
                    id="animal-nome"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={form.nome}
                    onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
                    placeholder="Ex.: Thor"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="animal-especie">Especie *</label>
                  <select
                    id="animal-especie"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={form.animal_type_id}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        animal_type_id: event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Selecione</option>
                    {animalTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="animal-sexo">Sexo</label>
                  <select
                    id="animal-sexo"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={form.sexo}
                    onChange={(event) => setForm((prev) => ({ ...prev, sexo: event.target.value }))}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="Macho">Macho</option>
                    <option value="Femea">Femea</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="animal-idade">Idade (anos)</label>
                  <input
                    id="animal-idade"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    type="number"
                    min={0}
                    step={1}
                    value={form.idade_anos}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        idade_anos: event.target.value,
                      }))
                    }
                    placeholder="Ex.: 3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="animal-peso">Peso (kg)</label>
                  <input
                    id="animal-peso"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    type="number"
                    min={0}
                    step={0.1}
                    value={form.peso_kg}
                    onChange={(event) => setForm((prev) => ({ ...prev, peso_kg: event.target.value }))}
                    placeholder="Ex.: 12.5"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="animal-observacoes">Observacoes</label>
                  <textarea
                    id="animal-observacoes"
                    className="min-h-28 w-full resize-y rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={form.observacoes}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        observacoes: event.target.value,
                      }))
                    }
                    placeholder="Informacoes clinicas relevantes..."
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Salvar animal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
