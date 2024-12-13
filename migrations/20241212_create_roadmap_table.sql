-- Migração para criar tabela roadmap
CREATE TABLE IF NOT EXISTS roadmap (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pendente',
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índice para melhorar performance de busca por status
CREATE INDEX idx_roadmap_status ON roadmap(status);
