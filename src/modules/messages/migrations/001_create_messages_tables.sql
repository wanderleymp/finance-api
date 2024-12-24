-- Drop tables if they exist (in reverse order due to foreign keys)
DROP TRIGGER IF EXISTS chat_update_timestamp ON chat_chats;
DROP FUNCTION IF EXISTS chat_update_timestamp();
DROP TABLE IF EXISTS chat_message_status;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_chats CASCADE;

-- Chats (conversas)
CREATE TABLE chat_chats (
    chat_id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES persons(person_id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_message_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    CONSTRAINT chat_chats_status_check CHECK (status IN ('ACTIVE', 'CLOSED', 'ARCHIVED'))
);

-- Mensagens do Chat
CREATE TABLE chat_messages (
    message_id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chat_chats(chat_id),
    direction VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chat_messages_direction_check CHECK (direction IN ('INBOUND', 'OUTBOUND'))
);

-- Status das Mensagens
CREATE TABLE chat_message_status (
    status_id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES chat_messages(message_id),
    status VARCHAR(20) NOT NULL,
    occurred_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chat_message_status_check CHECK (status IN ('SENT', 'DELIVERED', 'READ'))
);

-- Índices
CREATE INDEX chat_chats_person_idx ON chat_chats(person_id);
CREATE INDEX chat_messages_chat_idx ON chat_messages(chat_id);
CREATE INDEX chat_message_status_idx ON chat_message_status(message_id);

-- Trigger para atualizar updated_at do chat
CREATE OR REPLACE FUNCTION chat_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER chat_update_timestamp
    BEFORE UPDATE ON chat_chats
    FOR EACH ROW
    EXECUTE FUNCTION chat_update_timestamp();
