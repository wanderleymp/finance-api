-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS messages;

-- Definir permissões do schema
GRANT USAGE ON SCHEMA messages TO public;
ALTER DEFAULT PRIVILEGES IN SCHEMA messages GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO public;
ALTER DEFAULT PRIVILEGES IN SCHEMA messages GRANT USAGE, SELECT ON SEQUENCES TO public;

-- Criar tabela de tracking de emails
CREATE TABLE IF NOT EXISTS messages.email_tracking (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    chat_message_id INTEGER REFERENCES chat.messages(id),
    recipient_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    last_status_update TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    bounce_info JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_email_tracking_message UNIQUE(message_id, recipient_email)
);

-- Criar tabela de subscriptions do Graph
CREATE TABLE IF NOT EXISTS messages.graph_subscriptions (
    id SERIAL PRIMARY KEY,
    subscription_id VARCHAR(255) NOT NULL UNIQUE,
    resource VARCHAR(255) NOT NULL,
    change_type VARCHAR(255) NOT NULL,
    notification_url TEXT NOT NULL,
    expiration_date TIMESTAMP NOT NULL,
    client_state VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_email_tracking_status ON messages.email_tracking(status);
CREATE INDEX IF NOT EXISTS idx_email_tracking_message_id ON messages.email_tracking(message_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_chat_message ON messages.email_tracking(chat_message_id);
CREATE INDEX IF NOT EXISTS idx_graph_subscriptions_status ON messages.graph_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_graph_subscriptions_expiration ON messages.graph_subscriptions(expiration_date) WHERE status = 'active';

-- Criar funções para updated_at
CREATE OR REPLACE FUNCTION messages.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers
DROP TRIGGER IF EXISTS update_email_tracking_updated_at ON messages.email_tracking;
CREATE TRIGGER update_email_tracking_updated_at
    BEFORE UPDATE ON messages.email_tracking
    FOR EACH ROW
    EXECUTE FUNCTION messages.update_updated_at();

DROP TRIGGER IF EXISTS update_graph_subscriptions_updated_at ON messages.graph_subscriptions;
CREATE TRIGGER update_graph_subscriptions_updated_at
    BEFORE UPDATE ON messages.graph_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION messages.update_updated_at();

-- Comentários
COMMENT ON SCHEMA messages IS 'Schema para funcionalidades relacionadas a mensagens e notificações';

COMMENT ON TABLE messages.email_tracking IS 'Rastreamento de status de emails enviados';
COMMENT ON COLUMN messages.email_tracking.message_id IS 'ID único da mensagem no provedor de email';
COMMENT ON COLUMN messages.email_tracking.chat_message_id IS 'Referência para mensagem no chat';
COMMENT ON COLUMN messages.email_tracking.status IS 'Status do email: PENDING, QUEUED, DELIVERED, READ, FAILED, BOUNCED, SPAM';

COMMENT ON TABLE messages.graph_subscriptions IS 'Subscriptions do Microsoft Graph API para notificações';
COMMENT ON COLUMN messages.graph_subscriptions.subscription_id IS 'ID único da subscription no Microsoft Graph';
COMMENT ON COLUMN messages.graph_subscriptions.resource IS 'Recurso sendo monitorado';
COMMENT ON COLUMN messages.graph_subscriptions.change_type IS 'Tipos de mudança monitorados';

-- Permissões específicas se necessário
GRANT ALL ON ALL TABLES IN SCHEMA messages TO public;
GRANT ALL ON ALL SEQUENCES IN SCHEMA messages TO public;
