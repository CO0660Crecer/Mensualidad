/*
  # Setup automatic profile creation for new users

  1. Database Function
    - Creates `handle_new_user()` function to automatically insert profile data
    - Extracts full_name from user metadata and creates profile record
    
  2. Database Trigger  
    - Creates trigger on auth.users table to call function after user creation
    - Ensures every new user gets a corresponding profile record
    
  3. Security
    - Sets proper function security and permissions
    - Ensures trigger works with Supabase auth system
*/

-- Create a function to handle new user creation and insert into profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that calls the handle_new_user function after a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public;