-- V2 introduced roles(id, name) + users.role_id (FK, NOT NULL) as the
-- normalized way to store a user's role.
-- The old users.role VARCHAR column is now redundant and unused by the
-- application code, so we drop it here to avoid two sources of truth.

ALTER TABLE users
    DROP COLUMN IF EXISTS role;
