-- Migração para criar as tabelas do sistema de tasks

-- Remover tabelas antigas se existirem
DROP TABLE IF EXISTS public.task_logs CASCADE;
DROP TABLE IF EXISTS public.task_dependencies CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.task_types CASCADE;
DROP TABLE IF EXISTS public.tasks_queue CASCADE;
DROP TABLE IF EXISTS public.tasks_execution_mode CASCADE;
DROP TABLE IF EXISTS public.tasks_status CASCADE;
DROP TABLE IF EXISTS public.tasks_types CASCADE;

-- Criar tabela de tipos de tasks
CREATE TABLE task_types (
    type_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    max_retries INTEGER NOT NULL DEFAULT 3,
    retry_delay_seconds INTEGER NOT NULL DEFAULT 300,
    timeout_seconds INTEGER,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela principal de tasks
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    type_id INTEGER NOT NULL REFERENCES task_types(type_id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority INTEGER NOT NULL DEFAULT 0,
    payload JSONB NOT NULL DEFAULT '{}',
    resource_id INTEGER,
    scheduled_for TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'waiting_dependency'))
);

-- Criar tabela de dependências
CREATE TABLE task_dependencies (
    dependency_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    depends_on_task_id INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_dependency UNIQUE(task_id, depends_on_task_id)
);

-- Criar tabela de logs
CREATE TABLE task_logs (
    log_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    execution_time_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para otimização
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_type_status ON tasks(type_id, status);
CREATE INDEX idx_tasks_next_retry ON tasks(next_retry_at) WHERE status = 'failed';
CREATE INDEX idx_tasks_scheduled ON tasks(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_task_logs_created_at ON task_logs(created_at);
CREATE INDEX idx_tasks_resource ON tasks(resource_id);

-- Criar função de atualização do updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualização automática do updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_types_updated_at
    BEFORE UPDATE ON task_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir tipos básicos de tasks
INSERT INTO task_types (name, description, max_retries, retry_delay_seconds, timeout_seconds)
VALUES 
    ('boleto', 'Processamento de boletos bancários', 3, 300, 600),
    ('nfse', 'Processamento de notas fiscais', 3, 300, 600),
    ('email', 'Envio de emails', 3, 300, 300),
    ('backup', 'Backup do sistema', 2, 600, 3600),
    ('sync', 'Sincronização de dados', 3, 300, 1800);

-- Comentários nas tabelas
COMMENT ON TABLE tasks IS 'Tabela principal para gerenciamento de tasks assíncronas';
COMMENT ON TABLE task_types IS 'Tipos de tasks suportados pelo sistema';
COMMENT ON TABLE task_dependencies IS 'Dependências entre tasks';
COMMENT ON TABLE task_logs IS 'Log de execução das tasks';
