-- Remover triggers e constraints existentes
DROP TRIGGER IF EXISTS chat_update_timestamp ON chat_chats;

-- Remover índices existentes
DROP INDEX IF EXISTS chat_chats_person_idx;

-- Remover constraints de chave estrangeira que referenciam chat_chats
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_chat_id_fkey;

-- Renomear a tabela
ALTER TABLE IF EXISTS chat_chats RENAME TO chats;

-- Recriar índices com novos nomes
CREATE INDEX IF NOT EXISTS chats_person_idx ON chats(person_id);

-- Recriar chaves estrangeiras
ALTER TABLE chat_messages
    ADD CONSTRAINT chat_messages_chat_id_fkey 
    FOREIGN KEY (chat_id) 
    REFERENCES chats(chat_id);

-- Recriar trigger de atualização de timestamp
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
