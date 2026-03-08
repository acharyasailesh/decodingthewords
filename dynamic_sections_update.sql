-- ============================================================
-- 🚀 COMPREHENSIVE REPAIR: Run This in Supabase SQL Editor
-- This script fixes all missing columns to solve your errors!
-- ============================================================

-- 1. FIX: Ensure all settings columns exist (fixes the author_image_path error)
ALTER TABLE public.settings 
  ADD COLUMN IF NOT EXISTS author_details JSONB,
  ADD COLUMN IF NOT EXISTS book_sections JSONB,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT 'https://facebook.com/ersaileshacharya',
  ADD COLUMN IF NOT EXISTS author_email TEXT DEFAULT 'ersaileshacharya@gmail.com',
  ADD COLUMN IF NOT EXISTS author_website TEXT DEFAULT 'https://saileshacharya.com.np',
  ADD COLUMN IF NOT EXISTS book_cover_path TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS author_image_path TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS qr_code_path TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT 'Decoding the Words — शब्दले संसार बदल्छ',
  ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT 'Motivational Nepali book by Er. Sailesh Acharya.',
  ADD COLUMN IF NOT EXISTS google_analytics_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_search_console_tag TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS fb_pixel_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS announcement_bar TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS announcement_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set defaults for Author & Sections if they are null
UPDATE public.settings 
SET author_details = '{
  "name": "Er. Sailesh Acharya", 
  "experience": "15+ Years", 
  "roles": [
    "Chairman, RKD Holdings Ltd.", 
    "Director, BizBazar Ltd.", 
    "Director, Tourism Investment Fund"
  ], 
  "description": "Decoding the Words is rooted in over a decade and a half of practical experience in technology, entrepreneurship, and continuous learning. The principles shared are not just theory—they are the exact disciplined steps used to build multiple successful ventures."
}'::jsonb
WHERE author_details IS NULL;

UPDATE public.settings 
SET book_sections = '[
  {"id": "SECTION-1", "titleEn": "Social Trap", "titleNp": "सामाजिक जालो"},
  {"id": "SECTION-2", "titleEn": "The W-O-R-D Framework", "titleNp": "W-O-R-D ढाँचा"},
  {"id": "SECTION-3", "titleEn": "Procrastination & Persistence", "titleNp": "ढिलाइ र परिश्रम"},
  {"id": "SECTION-4", "titleEn": "WORLD Equation", "titleNp": "WORLD समीकरण"},
  {"id": "SPECIAL", "titleEn": "Additional Sections", "titleNp": "थप खण्डहरू"}
]'::jsonb
WHERE book_sections IS NULL;


-- 2. FIX: Ensure submissions table has all required columns (fixes the Submit Proof error)
--    We convert final_amount to NUMERIC to handle decimal percentage discounts!
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT,
    phone TEXT,
    message TEXT,
    screenshot_path TEXT,
    reference_number TEXT,
    status TEXT DEFAULT 'pending',
    coupon_used TEXT,
    final_amount NUMERIC DEFAULT 499,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- Add missing columns individually if table already existed
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS coupon_used TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS final_amount NUMERIC DEFAULT 499;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Ensure RLS is enabled for submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to SUBMIT (Insert)
DROP POLICY IF EXISTS "Anyone can submit proof" ON public.submissions;
CREATE POLICY "Anyone can submit proof" 
  ON public.submissions FOR INSERT 
  WITH CHECK (true);

-- Policy to allow admins to VIEW
DROP POLICY IF EXISTS "Admins can read all submissions" ON public.submissions;
CREATE POLICY "Admins can read all submissions" 
  ON public.submissions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Policy to allow admins to UPDATE (Approve/Reject)
DROP POLICY IF EXISTS "Admins can update submissions" ON public.submissions;
CREATE POLICY "Admins can update submissions" 
  ON public.submissions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));


-- 3. FIX: Storage Permissions (ensure users can upload to screenshots)
--    Assumes 'screenshots' bucket already exists, but we ensure it here too
INSERT INTO storage.buckets (id, name, public) 
VALUES ('screenshots', 'screenshots', false) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can upload screenshot" ON storage.objects;
CREATE POLICY "Anyone can upload screenshot"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'screenshots');

-- ============================================================
-- DONE! Re-run this now, then refresh your website.
-- ============================================================
