-- Add book_cover_path to settings table
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS book_cover_path TEXT DEFAULT '';
