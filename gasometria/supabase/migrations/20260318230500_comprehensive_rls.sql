-- Comprehensive Row Level Security for all domain tables

-- 1) Enable RLS on all tables
ALTER TABLE public.animal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

-- 2) Lookup tables: public read-only
DROP POLICY IF EXISTS "Public read animal types" ON public.animal_types;
CREATE POLICY "Public read animal types"
ON public.animal_types
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public read machines" ON public.machines;
CREATE POLICY "Public read machines"
ON public.machines
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public read exam types" ON public.exam_types;
CREATE POLICY "Public read exam types"
ON public.exam_types
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public read exam parameters" ON public.exam_parameters;
CREATE POLICY "Public read exam parameters"
ON public.exam_parameters
FOR SELECT
USING (true);

-- 3) Animals: owner-only full access
DROP POLICY IF EXISTS "Users read own animals" ON public.animals;
CREATE POLICY "Users read own animals"
ON public.animals
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own animals" ON public.animals;
CREATE POLICY "Users insert own animals"
ON public.animals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own animals" ON public.animals;
CREATE POLICY "Users update own animals"
ON public.animals
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own animals" ON public.animals;
CREATE POLICY "Users delete own animals"
ON public.animals
FOR DELETE
USING (auth.uid() = user_id);

-- 4) Exams: owner-only, must reference owner animal
DROP POLICY IF EXISTS "Users read own exams" ON public.exams;
CREATE POLICY "Users read own exams"
ON public.exams
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own exams" ON public.exams;
CREATE POLICY "Users insert own exams"
ON public.exams
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1
        FROM public.animals a
        WHERE a.id = animal_id
          AND a.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users update own exams" ON public.exams;
CREATE POLICY "Users update own exams"
ON public.exams
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1
        FROM public.animals a
        WHERE a.id = animal_id
          AND a.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users delete own exams" ON public.exams;
CREATE POLICY "Users delete own exams"
ON public.exams
FOR DELETE
USING (auth.uid() = user_id);

-- 5) Exam values: access only through owned exam
DROP POLICY IF EXISTS "Users read own exam values" ON public.exam_values;
CREATE POLICY "Users read own exam values"
ON public.exam_values
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.exams e
        WHERE e.id = exam_id
          AND e.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users insert own exam values" ON public.exam_values;
CREATE POLICY "Users insert own exam values"
ON public.exam_values
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.exams e
        WHERE e.id = exam_id
          AND e.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users update own exam values" ON public.exam_values;
CREATE POLICY "Users update own exam values"
ON public.exam_values
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.exams e
        WHERE e.id = exam_id
          AND e.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.exams e
        WHERE e.id = exam_id
          AND e.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users delete own exam values" ON public.exam_values;
CREATE POLICY "Users delete own exam values"
ON public.exam_values
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.exams e
        WHERE e.id = exam_id
          AND e.user_id = auth.uid()
    )
);

-- 6) Calculations: access only through owned exam
DROP POLICY IF EXISTS "Users read own calculations" ON public.calculations;
CREATE POLICY "Users read own calculations"
ON public.calculations
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.exams e
        WHERE e.id = exam_id
          AND e.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users insert own calculations" ON public.calculations;
CREATE POLICY "Users insert own calculations"
ON public.calculations
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.exams e
        WHERE e.id = exam_id
          AND e.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users update own calculations" ON public.calculations;
CREATE POLICY "Users update own calculations"
ON public.calculations
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.exams e
        WHERE e.id = exam_id
          AND e.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.exams e
        WHERE e.id = exam_id
          AND e.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users delete own calculations" ON public.calculations;
CREATE POLICY "Users delete own calculations"
ON public.calculations
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.exams e
        WHERE e.id = exam_id
          AND e.user_id = auth.uid()
    )
);
