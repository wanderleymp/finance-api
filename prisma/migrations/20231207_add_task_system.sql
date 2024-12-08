-- Criar tabela de processos
CREATE TABLE IF NOT EXISTS processes (
    process_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de tipos de processo
CREATE TABLE IF NOT EXISTS processes_type (
    type_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    is_default BOOLEAN DEFAULT false
);

-- Criar tabela de status de tarefas
CREATE TABLE IF NOT EXISTS tasks_status (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    is_default BOOLEAN DEFAULT false
);

-- Criar tabela de modos de execução
CREATE TABLE IF NOT EXISTS tasks_execution_mode (
    execution_mode_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    is_default BOOLEAN DEFAULT false
);

-- Criar tabela de tarefas
CREATE TABLE IF NOT EXISTS tasks (
    task_id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL REFERENCES processes(process_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status_id INTEGER NOT NULL REFERENCES tasks_status(status_id),
    execution_mode_id INTEGER NOT NULL REFERENCES tasks_execution_mode(execution_mode_id),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    result JSONB
);

-- Inserir dados básicos

-- Tipos de processo
INSERT INTO processes_type (name, is_default) VALUES
('SYSTEM', true),
('USER', false)
ON CONFLICT (name) DO NOTHING;

-- Status de tarefas
INSERT INTO tasks_status (name, is_default) VALUES
('pending', true),
('scheduled', false),
('processing', false),
('completed', false),
('failed', false),
('cancelled', false)
ON CONFLICT (name) DO NOTHING;

-- Modos de execução
INSERT INTO tasks_execution_mode (name, is_default) VALUES
('immediate', true),
('scheduled', false),
('recurring', false)
ON CONFLICT (name) DO NOTHING;

-- Processos padrão
INSERT INTO processes (name, description, type_id)
SELECT 'Geração de Boleto', 'Processo para geração de boletos', pt.type_id
FROM processes_type pt
WHERE pt.name = 'SYSTEM'
ON CONFLICT DO NOTHING;
