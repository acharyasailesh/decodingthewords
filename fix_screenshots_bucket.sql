-- Make the screenshots bucket public so getPublicUrl works
UPDATE storage.buckets 
SET public = true 
WHERE id = 'screenshots';

-- Also ensure public can read for getPublicUrl to work without auth headers
DROP POLICY IF EXISTS "Public can view screenshots" ON storage.objects;
CREATE POLICY "Public can view screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'screenshots');
