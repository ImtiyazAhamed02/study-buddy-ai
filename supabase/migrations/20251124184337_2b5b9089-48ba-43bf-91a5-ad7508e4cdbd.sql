-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_quizzes_taken INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Ingests table (uploaded materials)
CREATE TABLE public.ingests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  domain TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'text' or 'pdf'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ingests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ingests"
  ON public.ingests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ingests"
  ON public.ingests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Summaries table
CREATE TABLE public.summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingest_id UUID NOT NULL REFERENCES public.ingests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('topper', 'pass')),
  summary_text TEXT NOT NULL,
  highlights JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries"
  ON public.summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
  ON public.summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Question packs table
CREATE TABLE public.question_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingest_id UUID NOT NULL REFERENCES public.ingests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('topper', 'pass')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.question_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own question packs"
  ON public.question_packs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question packs"
  ON public.question_packs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id UUID NOT NULL REFERENCES public.question_packs(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'short', 'analytical')),
  prompt TEXT NOT NULL,
  options JSONB, -- for MCQs
  answer TEXT NOT NULL,
  rationale TEXT NOT NULL,
  supporting_span TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view questions from own packs"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.question_packs
      WHERE id = pack_id AND user_id = auth.uid()
    )
  );

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id UUID NOT NULL REFERENCES public.question_packs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  total_score INTEGER,
  weak_spots JSONB
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quizzes"
  ON public.quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes"
  ON public.quizzes FOR UPDATE
  USING (auth.uid() = user_id);

-- Quiz responses table
CREATE TABLE public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER NOT NULL, -- seconds
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz responses"
  ON public.quiz_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE id = quiz_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own quiz responses"
  ON public.quiz_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE id = quiz_id AND user_id = auth.uid()
    )
  );