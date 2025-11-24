-- Add INSERT policy for questions table
CREATE POLICY "Users can insert questions for own packs"
  ON public.questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.question_packs
      WHERE id = pack_id AND user_id = auth.uid()
    )
  );