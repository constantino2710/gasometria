ALTER TABLE public.animals
DROP CONSTRAINT IF EXISTS animals_sexo_check;

ALTER TABLE public.animals
ADD CONSTRAINT animals_sexo_check
CHECK (sexo IS NULL OR sexo IN ('Macho', 'Femea'));
