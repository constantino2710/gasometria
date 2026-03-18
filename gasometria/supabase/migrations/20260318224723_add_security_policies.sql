-- 1. Ativa a segurança na tabela (O cadeado fecha)
ALTER TABLE public.animal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

-- 2. Cria uma regra de leitura (Ex: Todos podem ver os tipos de animais)
CREATE POLICY "Permitir leitura pública de tipos de animais" 
ON public.animal_types FOR SELECT USING (true);

-- 3. Cria uma regra restrita (Ex: Usuário só vê os próprios animais)
-- O auth.uid() verifica o ID de quem está logado no seu App
CREATE POLICY "Usuários podem ver apenas seus próprios animais" 
ON public.animals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios animais" 
ON public.animals FOR INSERT 
WITH CHECK (auth.uid() = user_id);