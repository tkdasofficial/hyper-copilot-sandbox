ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS visual_type text NOT NULL DEFAULT 'Stock footage',
  ADD COLUMN IF NOT EXISTS edit_template text NOT NULL DEFAULT 'Dynamic',
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Documentary';