-- Criar schema messages se não existir
CREATE SCHEMA IF NOT EXISTS messages;

-- Criar tabela de tracking de emails
CREATE TABLE IF NOT EXISTS messages.email_tracking (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    chat_message_id VARCHAR(255),
    recipient_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_email_tracking_message_id ON messages.email_tracking(message_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_recipient_email ON messages.email_tracking(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_tracking_status ON messages.email_tracking(status);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION messages.update_email_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_email_tracking_updated_at ON messages.email_tracking;
CREATE TRIGGER update_email_tracking_updated_at
    BEFORE UPDATE ON messages.email_tracking
    FOR EACH ROW
    EXECUTE FUNCTION messages.update_email_tracking_updated_at();
