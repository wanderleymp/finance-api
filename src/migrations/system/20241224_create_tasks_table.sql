-- Migração para criar tabela de tasks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tasks') THEN
        -- Criar tabela de tasks
        CREATE TABLE tasks (
            id SERIAL PRIMARY KEY,
            task_type VARCHAR(50) NOT NULL,
            task_status VARCHAR(20) NOT NULL DEFAULT 'pending',
            payload JSONB,
            priority INTEGER DEFAULT 0,
            scheduled_for TIMESTAMP WITH TIME ZONE,
            max_retries INTEGER DEFAULT 3,
            retry_count INTEGER DEFAULT 0,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Criar índices
        CREATE INDEX idx_tasks_status ON tasks(task_status);
        CREATE INDEX idx_tasks_type ON tasks(task_type);
        CREATE INDEX idx_tasks_created_at ON tasks(created_at);
        CREATE INDEX idx_tasks_scheduled_for ON tasks(scheduled_for);

        -- Comentários da tabela
        COMMENT ON TABLE tasks IS 'Tabela para armazenar tasks assíncronas do sistema';
        COMMENT ON COLUMN tasks.task_type IS 'Tipo da task (ex: boleto, nfse, message)';
        COMMENT ON COLUMN tasks.task_status IS 'Status da task (pending, processing, completed, failed)';
        COMMENT ON COLUMN tasks.payload IS 'Dados específicos da task em formato JSON';
        COMMENT ON COLUMN tasks.priority IS 'Prioridade da task (maior número = maior prioridade)';
        COMMENT ON COLUMN tasks.scheduled_for IS 'Data/hora agendada para execução da task';
        COMMENT ON COLUMN tasks.max_retries IS 'Número máximo de tentativas de execução';
        COMMENT ON COLUMN tasks.retry_count IS 'Número atual de tentativas de execução';
        COMMENT ON COLUMN tasks.error_message IS 'Mensagem de erro caso a task falhe';
    END IF;
END $$;
