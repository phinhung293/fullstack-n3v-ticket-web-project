CREATE TABLE IF NOT EXISTS roles (
                                     id BIGSERIAL PRIMARY KEY,
                                     name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
    );

INSERT INTO roles (name, description)
VALUES
    ('ROLE_USER', 'Người dùng thường'),
    ('ROLE_ADMIN', 'Quản trị viên')
    ON CONFLICT (name) DO NOTHING;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10),
    ADD COLUMN IF NOT EXISTS code_expiry TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS role_id BIGINT;

UPDATE users
SET role_id = (
    SELECT id FROM roles WHERE name = 'ROLE_USER'
)
WHERE role_id IS NULL;

ALTER TABLE users
    ALTER COLUMN role_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_role'
    ) THEN
ALTER TABLE users
    ADD CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id);
END IF;
END $$;