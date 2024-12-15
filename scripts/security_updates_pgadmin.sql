-- Primeiro, vamos verificar a estrutura da tabela users
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) as users_table_exists;

-- Início da transação
BEGIN;

DO $$ 
DECLARE
    column_exists boolean;
BEGIN
    -- Criar tabela de auditoria de login se não existir
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'login_audit') THEN
        CREATE TABLE login_audit (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            success BOOLEAN NOT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Criar índices para a tabela login_audit
        CREATE INDEX idx_login_audit_user_id ON login_audit(user_id);
        CREATE INDEX idx_login_audit_timestamp ON login_audit(attempt_timestamp);
        
        -- Adicionar a foreign key separadamente
        ALTER TABLE login_audit
        ADD CONSTRAINT fk_login_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id);
        
        RAISE NOTICE 'Tabela login_audit criada com sucesso';
    END IF;

    -- Adicionar colunas na tabela users se não existirem
    -- 2FA
    IF NOT EXISTS (SELECT FROM pg_attribute 
                  WHERE attrelid = 'users'::regclass 
                  AND attname = 'enable_2fa' 
                  AND NOT attisdropped) THEN
        ALTER TABLE users ADD COLUMN enable_2fa BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna enable_2fa adicionada';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_attribute 
                  WHERE attrelid = 'users'::regclass 
                  AND attname = 'two_factor_secret' 
                  AND NOT attisdropped) THEN
        ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
        RAISE NOTICE 'Coluna two_factor_secret adicionada';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_attribute 
                  WHERE attrelid = 'users'::regclass 
                  AND attname = 'two_factor_secret_temp' 
                  AND NOT attisdropped) THEN
        ALTER TABLE users ADD COLUMN two_factor_secret_temp TEXT;
        RAISE NOTICE 'Coluna two_factor_secret_temp adicionada';
    END IF;

    -- Refresh Token
    IF NOT EXISTS (SELECT FROM pg_attribute 
                  WHERE attrelid = 'users'::regclass 
                  AND attname = 'refresh_token' 
                  AND NOT attisdropped) THEN
        ALTER TABLE users ADD COLUMN refresh_token TEXT;
        RAISE NOTICE 'Coluna refresh_token adicionada';
    END IF;

    -- Controle de tentativas de login
    IF NOT EXISTS (SELECT FROM pg_attribute 
                  WHERE attrelid = 'users'::regclass 
                  AND attname = 'failed_login_attempts' 
                  AND NOT attisdropped) THEN
        ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna failed_login_attempts adicionada';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_attribute 
                  WHERE attrelid = 'users'::regclass 
                  AND attname = 'last_failed_attempt' 
                  AND NOT attisdropped) THEN
        ALTER TABLE users ADD COLUMN last_failed_attempt TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna last_failed_attempt adicionada';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_attribute 
                  WHERE attrelid = 'users'::regclass 
                  AND attname = 'account_locked_until' 
                  AND NOT attisdropped) THEN
        ALTER TABLE users ADD COLUMN account_locked_until TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna account_locked_until adicionada';
    END IF;

    -- Criar índice para refresh_token se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE schemaname = 'public' 
                  AND tablename = 'users' 
                  AND indexname = 'idx_users_refresh_token') THEN
        CREATE INDEX idx_users_refresh_token ON users(refresh_token);
        RAISE NOTICE 'Índice idx_users_refresh_token criado';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro durante a execução: %', SQLERRM;
    RAISE EXCEPTION 'Falha na execução: %', SQLERRM;
END $$;

-- Commit da transação
COMMIT;

-- Verificar estrutura atualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
