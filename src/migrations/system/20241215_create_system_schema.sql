-- Criação do schema de sistema
-- Versão: 1.0.0.1
-- Data: 2024-12-15

DO $$
BEGIN
    -- Criar schema se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.schemata 
        WHERE schema_name = 'system'
    ) THEN
        EXECUTE 'CREATE SCHEMA system';
    END IF;

    -- Criar tabela system_config no schema system
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'system' 
        AND table_name = 'system_config'
    ) THEN
        CREATE TABLE system.system_config (
            id SERIAL PRIMARY KEY,
            config_key VARCHAR(255) NOT NULL UNIQUE,
            config_value TEXT,
            description TEXT DEFAULT '',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Inserir configuração inicial de versão
        INSERT INTO system.system_config (config_key, config_value, description)
        VALUES ('db_version', '1.0.0.1', 'Versão inicial do banco de dados');
    END IF;

    -- Criar tabela migrations no schema system
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'system' 
        AND table_name = 'migrations'
    ) THEN
        CREATE TABLE system.migrations (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            db_version VARCHAR(50) NOT NULL,
            database_name VARCHAR(100) NOT NULL,
            description TEXT DEFAULT ''
        );
    END IF;
END $$;
