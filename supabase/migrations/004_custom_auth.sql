-- The app uses its own email/password auth (bcrypt + JWT), not Supabase Auth.
-- 001 created public.users with id REFERENCES auth.users and no password column,
-- which makes every sign-up insert fail. This migration adapts the table.
-- Safe to run more than once.

-- 1. Drop any foreign key from public.users to auth.users
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND contype = 'f'
      AND confrelid = 'auth.users'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

-- 2. Let the database generate ids, and store password hashes
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
