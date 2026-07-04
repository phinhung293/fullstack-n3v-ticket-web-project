-- Chay file nay tren Supabase/PostgreSQL neu DB cua ban da import N3Vticket.sql
-- nhung chua co bang roles / cot role_id / avatar_url / verification_code.

CREATE TABLE IF NOT EXISTS public.roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

INSERT INTO public.roles (name, description)
VALUES
    ('ROLE_USER', 'Người dùng thường'),
    ('ROLE_ADMIN', 'Quản trị viên')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10),
    ADD COLUMN IF NOT EXISTS code_expiry TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS role_id BIGINT;

UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'ROLE_USER')
WHERE role_id IS NULL;

ALTER TABLE public.users
    ALTER COLUMN role_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_role'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT fk_users_role
            FOREIGN KEY (role_id) REFERENCES public.roles(id);
    END IF;
END $$;

ALTER TABLE public.users
    DROP COLUMN IF EXISTS role;
