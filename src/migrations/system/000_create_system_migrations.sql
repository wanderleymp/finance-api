-- Criar tabela de migrações se não existir
CREATE TABLE IF NOT EXISTS system_migrations (
    migration_file VARCHAR(255) NOT NULL,
    database_name VARCHAR(100) NOT NULL,
    migration_version VARCHAR(50),
    status TEXT,
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (migration_file, database_name)
);
