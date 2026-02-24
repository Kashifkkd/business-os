-- Allow users to create their own profile row if missing (e.g. trigger didn't run)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());
