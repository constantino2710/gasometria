import type { FormEvent } from 'react'
import { Button, FormField, SelectInput, TextAreaInput, TextInput } from '../../../components/ui'
import type { AnimalFormState, AnimalType } from '../../../types/animals'

type CreateAnimalModalProps = {
  form: AnimalFormState
  animalTypes: AnimalType[]
  isSaving: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onFormChange: (field: keyof AnimalFormState, value: string) => void
}

export function CreateAnimalModal({
  form,
  animalTypes,
  isSaving,
  onClose,
  onSubmit,
  onFormChange,
}: CreateAnimalModalProps) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/55 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-bold text-slate-900">Cadastrar novo animal</h2>

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField id="animal-nome" label="Nome *">
              <TextInput
                id="animal-nome"
                value={form.nome}
                onChange={(event) => onFormChange('nome', event.target.value)}
                placeholder="Ex.: Thor"
                required
              />
            </FormField>

            <FormField id="animal-especie" label="Especie *">
              <SelectInput
                id="animal-especie"
                value={form.animal_type_id}
                onChange={(event) => onFormChange('animal_type_id', event.target.value)}
                required
              >
                <option value="">Selecione</option>
                {animalTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nome}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <FormField id="animal-sexo" label="Sexo *">
              <SelectInput
                id="animal-sexo"
                value={form.sexo}
                onChange={(event) => onFormChange('sexo', event.target.value)}
                required
              >
                <option value="">Selecione</option>
                <option value="Macho">Macho</option>
                <option value="Femea">Femea</option>
              </SelectInput>
            </FormField>

            <FormField id="animal-idade" label="Idade (anos)">
              <TextInput
                id="animal-idade"
                type="number"
                min={0}
                step={1}
                value={form.idade_anos}
                onChange={(event) => onFormChange('idade_anos', event.target.value)}
                placeholder="Ex.: 3"
              />
            </FormField>

            <FormField id="animal-peso" label="Peso (kg)">
              <TextInput
                id="animal-peso"
                type="number"
                min={0}
                step={0.1}
                value={form.peso_kg}
                onChange={(event) => onFormChange('peso_kg', event.target.value)}
                placeholder="Ex.: 12.5"
              />
            </FormField>

            <FormField id="animal-observacoes" label="Observacoes" className="space-y-1.5 md:col-span-2">
              <TextAreaInput
                id="animal-observacoes"
                value={form.observacoes}
                onChange={(event) => onFormChange('observacoes', event.target.value)}
                placeholder="Informacoes clinicas relevantes..."
              />
            </FormField>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar animal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
