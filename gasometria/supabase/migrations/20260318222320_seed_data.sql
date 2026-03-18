-- Seeds de configuração
INSERT INTO public.animal_types (nome) VALUES ('Cão'), ('Gato'), ('Cavalo');

INSERT INTO public.exam_parameters (nome, sigla, unidade) VALUES 
('Potencial Hidrogeniônico', 'pH', NULL),
('Pressão Parcial de CO2', 'pCO2', 'mmHg'),
('Pressão Parcial de O2', 'pO2', 'mmHg'),
('Excesso de Base', 'BE', 'mmol/L'),
('Bicarbonato', 'HCO3', 'mmol/L'),
('Sódio', 'Na', 'mmol/L'),
('Potássio', 'K', 'mmol/L'),
('Glicose', 'Glu', 'mg/dL');

INSERT INTO public.machines (nome) VALUES ('i-STAT'), ('ABL800 Flex');
INSERT INTO public.exam_types (nome) VALUES ('Hemogasometria');