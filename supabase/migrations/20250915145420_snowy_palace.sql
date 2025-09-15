/*
  # Sistema de Gestión de Pagos

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `role` (text, 'tutora' or 'admin')
      - `full_name` (text)
      - `created_at` (timestamp)
    
    - `participants`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `phone` (text)
      - `parent_name` (text)
      - `monthly_fee` (numeric)
      - `is_active` (boolean)
      - `created_at` (timestamp)
    
    - `payments`
      - `id` (uuid, primary key)
      - `participant_id` (uuid, references participants)
      - `month` (text, formato 'YYYY-MM')
      - `amount` (numeric)
      - `payment_date` (date)
      - `receipt_number` (text)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('tutora', 'admin')) DEFAULT 'tutora',
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  parent_name text,
  monthly_fee numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  month text NOT NULL, -- Format: 'YYYY-MM'
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  receipt_number text NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant_id, month)
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Participants policies
CREATE POLICY "Authenticated users can read participants"
  ON participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage participants"
  ON participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Tutora can insert participants"
  ON participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('tutora', 'admin')
    )
  );

-- Payments policies
CREATE POLICY "Authenticated users can read payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Tutora and admin can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('tutora', 'admin')
    )
  );

CREATE POLICY "Admin can manage all payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Tutora can update own payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'tutora'
    )
  );

-- Insert sample data
INSERT INTO participants (full_name, phone, parent_name, monthly_fee) VALUES
  ('Ana García López', '555-1234', 'María López', 150.00),
  ('Carlos Rodríguez', '555-2345', 'Pedro Rodríguez', 150.00),
  ('Sofía Martínez', '555-3456', 'Carmen Martínez', 150.00),
  ('Diego Hernández', '555-4567', 'Luis Hernández', 150.00),
  ('Isabella Torres', '555-5678', 'Rosa Torres', 150.00);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario'), 'tutora');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();