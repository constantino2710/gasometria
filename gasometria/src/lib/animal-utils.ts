import type { Animal, AnimalTypeRelation } from '../types/animals'

export function getAnimalTypeName(relation: AnimalTypeRelation) {
  if (!relation) {
    return 'Nao informado'
  }

  if (Array.isArray(relation)) {
    return relation[0]?.nome ?? 'Nao informado'
  }

  return relation.nome
}

export function isAnimalsLegacySchemaError(message: string) {
  return (
    message.includes('column') &&
    (message.includes('sexo') ||
      message.includes('idade_anos') ||
      message.includes('peso_kg') ||
      message.includes('observacoes'))
  )
}

export function normalizeAnimal(data: Partial<Animal> & { id: string; nome: string }): Animal {
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
