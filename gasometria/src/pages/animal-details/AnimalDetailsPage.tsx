import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { AlertMessage, Button, PageContainer } from '../../components/ui'
import { getAnimalTypeName, isAnimalsLegacySchemaError, normalizeAnimal } from '../../lib/animal-utils'
import { supabase } from '../../lib/supabase'
import type { Animal } from '../../types/animals'
import { AnimalInfoItem } from './components/AnimalInfoItem'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

type ExtractedExamValues = {
  ph: number | null
  pco2: number | null
  po2: number | null
  be: number | null
  hco3: number | null
  tco2: number | null
  so2: number | null
  na: number | null
  k: number | null
  ica: number | null
  glicose: number | null
  hematocrito: number | null
  hemoglobina: number | null
  temperatura: number | null
  fio2: number | null
}

type LatestExamRecord = {
  extractedValues: ExtractedExamValues
  updatedAt: string
  sourceFileName: string | null
}

const EMPTY_EXTRACTED_VALUES: ExtractedExamValues = {
  ph: null,
  pco2: null,
  po2: null,
  be: null,
  hco3: null,
  tco2: null,
  so2: null,
  na: null,
  k: null,
  ica: null,
  glicose: null,
  hematocrito: null,
  hemoglobina: null,
  temperatura: null,
  fio2: null,
}

const EXAM_PARAMETER_FIELDS: Array<{ key: keyof ExtractedExamValues; label: string }> = [
  { key: 'ph', label: 'pH' },
  { key: 'pco2', label: 'pCO2' },
  { key: 'po2', label: 'pO2' },
  { key: 'be', label: 'BE' },
  { key: 'hco3', label: 'HCO3' },
  { key: 'tco2', label: 'tCO2' },
  { key: 'so2', label: 'sO2' },
  { key: 'na', label: 'Sodio (Na)' },
  { key: 'k', label: 'Potassio (K)' },
  { key: 'ica', label: 'iCa' },
  { key: 'glicose', label: 'Glicose' },
  { key: 'hematocrito', label: 'Hematocrito' },
  { key: 'hemoglobina', label: 'Hemoglobina' },
  { key: 'temperatura', label: 'Temperatura' },
  { key: 'fio2', label: 'FIO2' },
]

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function normalizeExtractedValues(raw: unknown): ExtractedExamValues {
  const input = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}

  return {
    ph: normalizeNumber(input.ph),
    pco2: normalizeNumber(input.pco2),
    po2: normalizeNumber(input.po2),
    be: normalizeNumber(input.be),
    hco3: normalizeNumber(input.hco3),
    tco2: normalizeNumber(input.tco2),
    so2: normalizeNumber(input.so2),
    na: normalizeNumber(input.na),
    k: normalizeNumber(input.k),
    ica: normalizeNumber(input.ica),
    glicose: normalizeNumber(input.glicose),
    hematocrito: normalizeNumber(input.hematocrito),
    hemoglobina: normalizeNumber(input.hemoglobina),
    temperatura: normalizeNumber(input.temperatura),
    fio2: normalizeNumber(input.fio2),
  }
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString('pt-BR')
}

export function AnimalDetailsPage() {
  const { animalId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isSendingToAi, setIsSendingToAi] = useState(false)
  const [extractedValues, setExtractedValues] = useState<ExtractedExamValues | null>(null)
  const [latestExam, setLatestExam] = useState<LatestExamRecord | null>(null)

  useEffect(() => {
    void loadAnimal()
    void loadLatestExam()
  }, [animalId, user?.id])

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
      if (isAnimalsLegacySchemaError(error.message)) {
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

        setAnimal(normalizeAnimal(fallback.data as Animal))
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

    setAnimal(normalizeAnimal(data as Animal))
    setIsLoading(false)
  }

  async function loadLatestExam() {
    if (!animalId || !user) {
      setLatestExam(null)
      return
    }

    const { data, error } = await supabase
      .from('animal_latest_exams')
      .select('extracted_values, updated_at, source_file_name')
      .eq('animal_id', animalId)
      .maybeSingle()

    if (error) {
      setLatestExam(null)
      return
    }

    if (!data) {
      setLatestExam(null)
      return
    }

    const normalizedValues = normalizeExtractedValues(data.extracted_values)

    setLatestExam({
      extractedValues: normalizedValues,
      updatedAt: data.updated_at,
      sourceFileName: data.source_file_name ?? null,
    })
    setExtractedValues(normalizedValues)
  }

  async function saveLatestExam(values: ExtractedExamValues, sourceFileName: string | null) {
    if (!animalId || !user) {
      return
    }

    const payload = {
      animal_id: animalId,
      user_id: user.id,
      source_file_name: sourceFileName,
      extracted_values: values,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('animal_latest_exams')
      .upsert(payload, { onConflict: 'animal_id' })
      .select('updated_at, source_file_name')
      .single()

    if (error) {
      throw new Error(`Falha ao salvar ultimo exame: ${error.message}`)
    }

    setLatestExam({
      extractedValues: values,
      updatedAt: data.updated_at,
      sourceFileName: data.source_file_name ?? null,
    })
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setExtractedValues(null)

    if (!file) {
      setSelectedFile(null)
      setFileError(null)
      setExtractedValues(latestExam?.extractedValues ?? null)
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null)
      setFileError('Arquivo muito grande. Envie no maximo 10MB.')
      return
    }

    if (!SUPPORTED_MIME_TYPES.has(file.type.toLowerCase())) {
      setSelectedFile(null)
      setFileError('Formato invalido. Use PDF, JPG, PNG ou WEBP.')
      return
    }

    setSelectedFile(file)
    setFileError(null)
  }

  async function convertFileToBase64(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Falha ao ler o arquivo.'))
          return
        }

        const [, base64 = ''] = reader.result.split(',')
        resolve(base64)
      }

      reader.onerror = () => reject(new Error('Falha ao converter o arquivo para base64.'))
      reader.readAsDataURL(file)
    })
  }

  async function handleSendToAi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!animal) {
      setFileError('Animal nao encontrado.')
      return
    }

    if (!selectedFile) {
      setFileError('Selecione um arquivo PDF ou imagem antes de enviar.')
      return
    }

    setFileError(null)
    setExtractedValues(null)
    setIsSendingToAi(true)

    try {
      const fileBase64 = await convertFileToBase64(selectedFile)

      const { data, error } = await supabase.functions.invoke('interpret-animal-document', {
        body: {
          animalId: animal.id,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileBase64,
        },
      })

      if (error) {
        let detailedMessage = error.message
        const response = (error as { context?: Response }).context

        if (response) {
          const errorPayload = await response.json().catch(() => null)
          const maybeMessage =
            typeof errorPayload?.error === 'string'
              ? errorPayload.error
              : typeof errorPayload?.message === 'string'
                ? errorPayload.message
                : null

          if (maybeMessage) {
            detailedMessage = maybeMessage
          }
        }

        throw new Error(detailedMessage)
      }

      const normalizedValues = normalizeExtractedValues(data?.extracted ?? EMPTY_EXTRACTED_VALUES)
      setExtractedValues(normalizedValues)
      await saveLatestExam(normalizedValues, selectedFile.name)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar documento para a IA.'
      setFileError(message)
    } finally {
      setIsSendingToAi(false)
    }
  }

  return (
    <PageContainer maxWidthClassName="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalhes do animal</h1>
          <p className="text-sm text-slate-600">Area pronta para adicionar mais funcionalidades em seguida.</p>
        </div>

        <Button onClick={() => navigate('/dashboard')}>Voltar</Button>
      </div>

      {isLoading ? <p className="text-slate-700">Carregando...</p> : null}
      {errorMessage ? <AlertMessage message={errorMessage} /> : null}

      {!isLoading && !errorMessage && animal ? (
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">{animal.nome}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimalInfoItem label="Especie" value={getAnimalTypeName(animal.animal_types)} />
              <AnimalInfoItem label="Sexo" value={animal.sexo || 'Nao informado'} />
              <AnimalInfoItem
                label="Idade"
                value={animal.idade_anos ? `${animal.idade_anos} ano(s)` : 'Nao informada'}
              />
              <AnimalInfoItem label="Peso" value={animal.peso_kg ? `${animal.peso_kg} kg` : 'Nao informado'} />
              <AnimalInfoItem label="Observacoes" value={animal.observacoes || 'Sem observacoes'} />
              <AnimalInfoItem label="ID" value={animal.id} breakAll />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Enviar documento para IA (Gemini)</h3>
            <p className="mt-1 text-sm text-slate-600">Selecione uma foto ou PDF para analise com prompt fixo.</p>

            <form className="mt-4 space-y-4" onSubmit={handleSendToAi}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="animal-document">
                  Documento (PDF ou imagem)
                </label>
                <input
                  id="animal-document"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:font-medium hover:file:bg-slate-300"
                />
                <p className="mt-1 text-xs text-slate-500">Tamanho maximo: 10MB.</p>
              </div>

              <Button type="submit" disabled={isSendingToAi}>
                {isSendingToAi ? 'Enviando...' : 'Enviar para Gemini'}
              </Button>
            </form>

            {fileError ? <p className="mt-3 text-sm text-red-700">{fileError}</p> : null}
            {extractedValues ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="text-sm font-semibold text-emerald-900">
                  {latestExam ? 'Ultimo exame salvo' : 'Valores extraidos do exame'}
                </h4>
                {latestExam ? (
                  <p className="mt-1 text-xs text-emerald-800">
                    Ultimo exame: {formatDateTime(latestExam.updatedAt)}
                    {latestExam.sourceFileName ? ` - arquivo: ${latestExam.sourceFileName}` : ''}
                  </p>
                ) : null}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {EXAM_PARAMETER_FIELDS.map((field) => (
                    <div key={field.key} className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">{field.label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {extractedValues[field.key] === null ? 'Nao encontrado' : extractedValues[field.key]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      <p className="mt-4">
        <Link className="font-medium text-blue-700 hover:text-blue-800 hover:underline" to="/dashboard">
          Ir para lista de animais
        </Link>
      </p>
    </PageContainer>
  )
}
