-- Run this once against the production PostgreSQL database before deploying
-- the passkey-enabled backend. The application uses ddl-auto=validate.
ALTER TABLE users ADD COLUMN IF NOT EXISTS passkey_user_handle VARCHAR(256);
CREATE UNIQUE INDEX IF NOT EXISTS users_passkey_user_handle_uq
    ON users (passkey_user_handle);

CREATE TABLE IF NOT EXISTS passkey_credentials (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id VARCHAR(1024) NOT NULL UNIQUE,
    user_handle VARCHAR(256) NOT NULL,
    public_key_cose TEXT NOT NULL,
    signature_count BIGINT NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    backup_eligible BOOLEAN NOT NULL,
    backed_up BOOLEAN NOT NULL,
    created_at BIGINT NOT NULL,
    last_used_at BIGINT
);
CREATE INDEX IF NOT EXISTS passkey_credentials_user_id_idx
    ON passkey_credentials (user_id);
CREATE INDEX IF NOT EXISTS passkey_credentials_user_handle_idx
    ON passkey_credentials (user_handle);

CREATE TABLE IF NOT EXISTS webauthn_challenges (
    id VARCHAR(36) PRIMARY KEY,
    purpose VARCHAR(20) NOT NULL,
    user_id BIGINT,
    request_json TEXT NOT NULL,
    expires_at BIGINT NOT NULL
);
