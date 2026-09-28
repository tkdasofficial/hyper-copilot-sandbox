ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS scenes jsonb,
  ADD COLUMN IF NOT EXISTS qa_report jsonb,
  ADD COLUMN IF NOT EXISTS sources jsonb,
  ADD COLUMN IF NOT EXISTS direction jsonb;