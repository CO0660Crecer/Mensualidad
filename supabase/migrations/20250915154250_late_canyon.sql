/*
  # Add code column to participants table

  1. Changes
    - Add `code` column to `participants` table (text, unique, not null)
    - Update existing participants with temporary codes if any exist
    - Add unique constraint on code column

  2. Security
    - No changes to existing RLS policies
*/

-- Add the code column to participants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'code'
  ) THEN
    ALTER TABLE participants ADD COLUMN code text;
  END IF;
END $$;

-- Update existing participants with temporary codes if any exist
DO $$
DECLARE
  participant_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR participant_record IN 
    SELECT id FROM participants WHERE code IS NULL
  LOOP
    UPDATE participants 
    SET code = 'P' || LPAD(counter::text, 3, '0')
    WHERE id = participant_record.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Make code column NOT NULL and UNIQUE
DO $$
BEGIN
  -- First make sure all codes are filled
  IF NOT EXISTS (
    SELECT 1 FROM participants WHERE code IS NULL
  ) THEN
    -- Add NOT NULL constraint
    ALTER TABLE participants ALTER COLUMN code SET NOT NULL;
    
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'participants' 
      AND constraint_name = 'participants_code_key'
    ) THEN
      ALTER TABLE participants ADD CONSTRAINT participants_code_key UNIQUE (code);
    END IF;
  END IF;
END $$;