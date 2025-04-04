/*
  # Add profile insert policy
  
  1. Changes
    - Add policy to allow authenticated users to insert their own profile
    - Add policy to allow unauthenticated users to insert profiles during signup
  
  2. Security
    - Users can only insert their own profile (id must match auth.uid())
    - Signup flow is enabled by allowing inserts for new users
*/

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow profile creation during signup
CREATE POLICY "Enable profile insert during signup"
  ON profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);
