-- Criar tabela de auditoria de login
CREATE TABLE IF NOT EXISTS login_audit (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_login_audit_user_id ON login_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_timestamp ON login_audit(attempt_timestamp);

-- Adicionar campos de 2FA e refresh token na tabela users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS enable_2fa BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS two_factor_secret_temp TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT;

-- Criar índice para busca por refresh token
CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token);

-- Adicionar campos de controle de tentativas de login
ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;
