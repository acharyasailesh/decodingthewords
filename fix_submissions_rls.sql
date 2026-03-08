-- ============================================================
-- FIX: Submissions table RLS — Allow public INSERT
-- Run this in: https://supabase.com/dashboard/project/dqyehjadfybvyowvyael/sql/new
-- ============================================================

-- Step 1: Check current state
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'submissions';

-- Step 2: Add missing INSERT policy (allows anyone to submit their payment proof)
DROP POLICY IF EXISTS "Anyone can submit proof" ON public.submissions;
CREATE POLICY "Anyone can submit proof"
  ON public.submissions FOR INSERT WITH CHECK (true);

-- Step 3: Make sure admin SELECT policy exists
DROP POLICY IF EXISTS "Admins can read all submissions" ON public.submissions;
CREATE POLICY "Admins can read all submissions"
  ON public.submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Step 4: Make sure admin UPDATE policy exists
DROP POLICY IF EXISTS "Admins can update submissions" ON public.submissions;
CREATE POLICY "Admins can update submissions"
  ON public.submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Step 5: Verify — should now show 3 policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'submissions';
