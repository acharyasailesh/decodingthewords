-- ============================================================
-- FULL DATABASE REPAIR: Run This in Supabase SQL Editor
-- This script fixes all missing columns, RLS policies, and storage
-- ============================================================

-- 1. FIX: Ensure all settings columns exist
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
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. FIX: Ensure book_content table has all required columns
ALTER TABLE public.book_content
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS chapter_id TEXT,
  ADD COLUMN IF NOT EXISTS section_id TEXT DEFAULT 'SECTION-1',
  ADD COLUMN IF NOT EXISTS title_english TEXT,
  ADD COLUMN IF NOT EXISTS title_nepali TEXT,
  ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. FIX: Ensure submissions table has all required columns
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

-- 4. FIX: Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_value INTEGER NOT NULL,
    discount_type TEXT DEFAULT 'flat', -- 'flat' or 'percent'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS and add basic policies
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Submissions Insert Policy
DROP POLICY IF EXISTS "Anyone can submit proof" ON public.submissions;
CREATE POLICY "Anyone can submit proof" 
  ON public.submissions FOR INSERT WITH CHECK (true);

-- Settings Public Read Policy
DROP POLICY IF EXISTS "Settings public read" ON public.settings;
CREATE POLICY "Settings public read" ON public.settings FOR SELECT USING (true);

-- Coupons Public Read Policy
DROP POLICY IF EXISTS "Public can verify coupons" ON public.coupons;
CREATE POLICY "Public can verify coupons" ON public.coupons FOR SELECT USING (is_active = true);

-- 6. Storage Permissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('screenshots', 'screenshots', false), ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can upload screenshot" ON storage.objects;
CREATE POLICY "Anyone can upload screenshot"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'screenshots');

DROP POLICY IF EXISTS "Anyone can view assets" ON storage.objects;
CREATE POLICY "Anyone can view assets"
  ON storage.objects FOR SELECT USING (bucket_id = 'assets');

-- DONE! Re-run this now, then refresh your website.
