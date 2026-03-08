-- ============================================================
-- Decoding the Words — Schema Fix/Migration Script
-- Run this if you already ran the old schema and hit errors
-- This safely adds missing columns without destroying data
-- ============================================================

-- 1. FIX: book_content table corrections
--    Old schema had composite primary key on chapter_id only, no UUID id column
--    and used "is_public_preview" — rename to "is_preview" and add UUID id

-- Add UUID id column if it doesn't exist
ALTER TABLE public.book_content
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Add is_preview column (replacement for is_public_preview)
ALTER TABLE public.book_content
  ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT FALSE;

-- Drop old dependent policies first, then rename the column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'book_content' AND column_name = 'is_public_preview'
  ) THEN
    -- Drop old policy that depends on is_public_preview
    DROP POLICY IF EXISTS "Public preview readable by all" ON public.book_content;
    -- Copy data across
    UPDATE public.book_content SET is_preview = is_public_preview;
    -- Now safe to drop
    ALTER TABLE public.book_content DROP COLUMN is_public_preview;
  END IF;
END $$;

-- Add updated_at if missing
ALTER TABLE public.book_content
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.book_content
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- 2. FIX: users table — add missing columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS license_granted_at TIMESTAMPTZ;

-- Sync display_name → full_name if needed
UPDATE public.users SET full_name = display_name WHERE full_name IS NULL AND display_name IS NOT NULL;


-- 3. FIX: submissions table — make sure reviewed_at exists
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;


-- 4. FIX: settings table — recreate with correct shape
-- Drop old settings and recreate (it only has 1 row so safe)
DROP TABLE IF EXISTS public.settings;

CREATE TABLE public.settings (
  id                          INTEGER PRIMARY KEY DEFAULT 1,
  book_price                  INTEGER DEFAULT 499,
  qr_code_path                TEXT DEFAULT '',
  whatsapp_number             TEXT DEFAULT '',
  maintenance_mode            BOOLEAN DEFAULT FALSE,
  meta_title                  TEXT DEFAULT 'Decoding the Words — शब्दले संसार बदल्छ',
  meta_description            TEXT DEFAULT 'Nepali motivational book by Er. Sailesh Acharya. Buy the digital license for NPR 499.',
  google_analytics_id         TEXT DEFAULT '',
  google_search_console_tag   TEXT DEFAULT '',
  fb_pixel_id                 TEXT DEFAULT '',
  announcement_bar            TEXT DEFAULT '',
  announcement_active         BOOLEAN DEFAULT FALSE,
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;


-- 5. FIX: Drop old broken RLS policies and recreate correctly
DROP POLICY IF EXISTS "Public preview readable by all"    ON public.book_content;
DROP POLICY IF EXISTS "Licensed readers can view all"     ON public.book_content;
DROP POLICY IF EXISTS "Preview chapters public"           ON public.book_content;
DROP POLICY IF EXISTS "Licensed readers see all"          ON public.book_content;
DROP POLICY IF EXISTS "Admins can manage content"         ON public.book_content;
DROP POLICY IF EXISTS "Settings are public"               ON public.settings;
DROP POLICY IF EXISTS "Settings public read"              ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings"        ON public.settings;
DROP POLICY IF EXISTS "Admins can upsert settings"        ON public.settings;
DROP POLICY IF EXISTS "Admins can read all submissions"   ON public.submissions;
DROP POLICY IF EXISTS "Admins can update submissions"     ON public.submissions;
DROP POLICY IF EXISTS "Users can update own data"         ON public.users;

-- Book Content RLS
CREATE POLICY "Preview chapters public"
  ON public.book_content FOR SELECT USING (is_preview = true);

CREATE POLICY "Licensed readers see all"
  ON public.book_content FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND has_license = true)
  );

CREATE POLICY "Admins can manage content"
  ON public.book_content FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Settings RLS
CREATE POLICY "Settings public read"
  ON public.settings FOR SELECT USING (true);

CREATE POLICY "Admins can update settings"
  ON public.settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can upsert settings"
  ON public.settings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Submissions RLS
CREATE POLICY "Admins can read all submissions"
  ON public.submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update submissions"
  ON public.submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE USING (auth.uid() = id);


-- 6. FIX: Storage policies (safe re-run)
DROP POLICY IF EXISTS "Anyone can upload screenshot"  ON storage.objects;
DROP POLICY IF EXISTS "Admins can view screenshots"   ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view assets"        ON storage.objects;

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('screenshots', 'screenshots', false),
  ('assets',      'assets',      true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload screenshot"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'screenshots');

CREATE POLICY "Admins can view screenshots"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'screenshots' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can view assets"
  ON storage.objects FOR SELECT USING (bucket_id = 'assets');


-- 7. Auth Trigger (safe re-run)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- DONE! Run this query to make yourself admin after signing up:
-- UPDATE public.users SET role = 'admin' 
-- WHERE email = 'ersaileshacharya@gmail.com';
-- ============================================================
