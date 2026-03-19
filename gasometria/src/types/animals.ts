export type AnimalTypeRelation = { nome: string } | { nome: string }[] | null

export type AnimalType = {
  id: number
  nome: string
}

export type Animal = {
  id: string
  nome: string
  animal_type_id: number | null
  sexo: string | null
  idade_anos: number | null
  peso_kg: number | null
  observacoes: string | null
  created_at: string
  animal_types: AnimalTypeRelation
}

export type AnimalFormState = {
  nome: string
  animal_type_id: string
  sexo: string
  idade_anos: string
  peso_kg: string
  observacoes: string
}

export const initialAnimalFormState: AnimalFormState = {
  nome: '',
  animal_type_id: '',
  sexo: '',
  idade_anos: '',
  peso_kg: '',
  observacoes: '',
}
