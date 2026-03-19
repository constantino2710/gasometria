ALTER TABLE public.animals
ADD COLUMN sexo TEXT,
ADD COLUMN idade_anos INTEGER CHECK (idade_anos IS NULL OR idade_anos >= 0),
ADD COLUMN peso_kg NUMERIC(6,2) CHECK (peso_kg IS NULL OR peso_kg > 0),
ADD COLUMN observacoes TEXT;
