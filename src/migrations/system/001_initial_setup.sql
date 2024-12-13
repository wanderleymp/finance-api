-- Migração inicial para o banco de sistema
-- Cria tabelas de controle, configurações e estruturas básicas

-- Criar tabela de migrações para rastrear versões e migrações aplicadas
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    db_version VARCHAR(50) NOT NULL,
    database_name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT ''
);

-- Criar tabela de configuração do sistema
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL UNIQUE,
    config_value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração inicial de versão do banco de dados
INSERT INTO system_config (config_key, config_value, description) 
VALUES 
    ('db_version', '1.0.0', 'Versão inicial do banco de dados do sistema'),
    ('app_version', '1.1.0', 'Versão inicial da aplicação')
ON CONFLICT (config_key) DO NOTHING;

-- Criar esquemas padrão se não existirem
CREATE SCHEMA IF NOT EXISTS agiledatabase;
CREATE SCHEMA IF NOT EXISTS public;
