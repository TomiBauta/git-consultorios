-- Recrear la función del trigger con permisos correctos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'receptionist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Dar permisos explícitos al rol postgres para bypassear RLS en profiles
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
GRANT ALL ON public.profiles TO postgres;

-- Asegurar que el rol authenticator pueda usar la función
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
