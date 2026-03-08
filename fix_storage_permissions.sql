-- Fix Storage Permissions for Assets Bucket
-- Only admins should be able to upload or modify assets (like QR codes)

-- 1. Enable Insert for Admins
DROP POLICY IF EXISTS "Admins can upload assets" ON storage.objects;
CREATE POLICY "Admins can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'assets' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 2. Enable Update for Admins
DROP POLICY IF EXISTS "Admins can update assets" ON storage.objects;
CREATE POLICY "Admins can update assets"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'assets' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 3. Enable Delete for Admins (useful for cleanup)
DROP POLICY IF EXISTS "Admins can delete assets" ON storage.objects;
CREATE POLICY "Admins can delete assets"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'assets' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);
