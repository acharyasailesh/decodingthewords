-- Add announcement_link column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS announcement_link TEXT;
