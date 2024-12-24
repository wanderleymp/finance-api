-- Remover tabela antiga se existir
DROP TABLE IF EXISTS chats CASCADE;

-- Criar nova tabela de chats
CREATE TABLE chats (
    chat_id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    direction VARCHAR(50) NOT NULL,
    "from" VARCHAR(255) NOT NULL,
    "to" JSONB NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX chats_type_idx ON chats(type);
CREATE INDEX chats_direction_idx ON chats(direction);
CREATE INDEX chats_from_idx ON chats("from");

-- Trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER chat_update_timestamp
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
