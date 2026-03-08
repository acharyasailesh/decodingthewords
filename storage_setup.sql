-- Create assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 'assets' bucket
-- 1. Allow public select access to all files
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

-- 2. Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assets');

-- 3. Allow service role/admin full access
CREATE POLICY "Service Role Full Access"
ON storage.objects FOR ALL
USING (bucket_id = 'assets' AND (auth.role() = 'service_role'));

-- 4. Allow users to update/delete their own uploads if we want, but for admin assets, we focus on service role
-- Since the admin panel uses service role key (or is authenticated as admin), we ensure it can delete.
CREATE POLICY "Full access for authenticated admins"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'assets')
WITH CHECK (bucket_id = 'assets');
