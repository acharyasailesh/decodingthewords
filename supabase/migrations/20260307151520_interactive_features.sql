-- Create user_reflections table
CREATE TABLE IF NOT EXISTS public.user_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- index for fast lookups by user and chapter
CREATE INDEX IF NOT EXISTS user_reflections_user_id_chapter_id_idx ON public.user_reflections(user_id, chapter_id);

-- RLS for user_reflections
ALTER TABLE public.user_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own reflections."
ON public.user_reflections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reflections."
ON public.user_reflections FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections."
ON public.user_reflections FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reflections."
ON public.user_reflections FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create din_actions table
CREATE TABLE IF NOT EXISTS public.din_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter_id TEXT NOT NULL,
    action_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- index
CREATE INDEX IF NOT EXISTS din_actions_user_id_chapter_id_idx ON public.din_actions(user_id, chapter_id);

-- RLS for din_actions
ALTER TABLE public.din_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own actions."
ON public.din_actions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own actions."
ON public.din_actions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own actions."
ON public.din_actions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own actions."
ON public.din_actions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create challenge_progress table
CREATE TABLE IF NOT EXISTS public.challenge_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, day_number)
);

-- index
CREATE INDEX IF NOT EXISTS challenge_progress_user_id_idx ON public.challenge_progress(user_id);

-- RLS for challenge_progress
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own challenge records."
ON public.challenge_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own challenge records."
ON public.challenge_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge records."
ON public.challenge_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenge records."
ON public.challenge_progress FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
