-- Início da transação
BEGIN;

-- Criar tabela para tokens de recuperação de senha
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'password_reset_tokens') THEN
        CREATE TABLE password_reset_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id),
            token TEXT NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Criar índices
        CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
        CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
        CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
        
        RAISE NOTICE 'Tabela password_reset_tokens criada com sucesso';
    END IF;

    -- Criar tabela para histórico de senhas
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'password_history') THEN
        CREATE TABLE password_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id),
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Criar índice
        CREATE INDEX idx_password_history_user ON password_history(user_id);
        
        RAISE NOTICE 'Tabela password_history criada com sucesso';
    END IF;

    -- Adicionar colunas de segurança na tabela users
    IF NOT EXISTS (SELECT FROM pg_attribute 
                  WHERE attrelid = 'users'::regclass 
                  AND attname = 'password_changed_at' 
                  AND NOT attisdropped) THEN
        ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna password_changed_at adicionada';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_attribute 
                  WHERE attrelid = 'users'::regclass 
                  AND attname = 'password_expires_at' 
                  AND NOT attisdropped) THEN
        ALTER TABLE users ADD COLUMN password_expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna password_expires_at adicionada';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_attribute 
                  WHERE attrelid = 'users'::regclass 
                  AND attname = 'require_password_change' 
                  AND NOT attisdropped) THEN
        ALTER TABLE users ADD COLUMN require_password_change BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna require_password_change adicionada';
    END IF;
END $$;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para password_reset_tokens
DROP TRIGGER IF EXISTS update_password_reset_tokens_updated_at ON password_reset_tokens;
CREATE TRIGGER update_password_reset_tokens_updated_at
    BEFORE UPDATE ON password_reset_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verificar estrutura
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('password_reset_tokens', 'password_history', 'users')
ORDER BY table_name, ordinal_position;
