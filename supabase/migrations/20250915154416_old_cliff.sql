/*
  # Fix RLS policies for participants table

  1. Security Changes
    - Allow anonymous access to participants table for reading
    - Allow anonymous access for inserting participants
    - Allow anonymous access for updating participants
    - This is needed because the app uses local authentication instead of Supabase auth

  2. Tables affected
    - `participants` - Update RLS policies to allow anonymous access
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can manage participants" ON participants;
DROP POLICY IF EXISTS "Authenticated users can read participants" ON participants;
DROP POLICY IF EXISTS "Tutora can insert participants" ON participants;

-- Create new policies that allow anonymous access
CREATE POLICY "Allow anonymous read access to participants"
  ON participants
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert access to participants"
  ON participants
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to participants"
  ON participants
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous delete access to participants"
  ON participants
  FOR DELETE
  TO anon
  USING (true);

-- Also allow authenticated users (in case Supabase auth is used later)
CREATE POLICY "Allow authenticated read access to participants"
  ON participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert access to participants"
  ON participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to participants"
  ON participants
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete access to participants"
  ON participants
  FOR DELETE
  TO authenticated
  USING (true);