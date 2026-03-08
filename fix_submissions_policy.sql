-- Add INSERT policy for submissions so anyone can submit a payment proof
CREATE POLICY "Anyone can insert submission"
  ON public.submissions FOR INSERT WITH CHECK (true);
