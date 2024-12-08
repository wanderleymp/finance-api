-- Inserir dados básicos apenas se não existirem

-- Status de tarefas
INSERT INTO tasks_status (name, is_default)
SELECT 'pending', true
WHERE NOT EXISTS (SELECT 1 FROM tasks_status WHERE name = 'pending');

INSERT INTO tasks_status (name, is_default)
SELECT 'scheduled', false
WHERE NOT EXISTS (SELECT 1 FROM tasks_status WHERE name = 'scheduled');

INSERT INTO tasks_status (name, is_default)
SELECT 'processing', false
WHERE NOT EXISTS (SELECT 1 FROM tasks_status WHERE name = 'processing');

INSERT INTO tasks_status (name, is_default)
SELECT 'completed', false
WHERE NOT EXISTS (SELECT 1 FROM tasks_status WHERE name = 'completed');

INSERT INTO tasks_status (name, is_default)
SELECT 'failed', false
WHERE NOT EXISTS (SELECT 1 FROM tasks_status WHERE name = 'failed');

INSERT INTO tasks_status (name, is_default)
SELECT 'cancelled', false
WHERE NOT EXISTS (SELECT 1 FROM tasks_status WHERE name = 'cancelled');

-- Modos de execução
INSERT INTO tasks_execution_mode (name, is_default)
SELECT 'immediate', true
WHERE NOT EXISTS (SELECT 1 FROM tasks_execution_mode WHERE name = 'immediate');

INSERT INTO tasks_execution_mode (name, is_default)
SELECT 'scheduled', false
WHERE NOT EXISTS (SELECT 1 FROM tasks_execution_mode WHERE name = 'scheduled');

INSERT INTO tasks_execution_mode (name, is_default)
SELECT 'recurring', false
WHERE NOT EXISTS (SELECT 1 FROM tasks_execution_mode WHERE name = 'recurring');

-- Tipos de processo (se não existir)
INSERT INTO processes_type (name, is_default)
SELECT 'SYSTEM', true
WHERE NOT EXISTS (SELECT 1 FROM processes_type WHERE name = 'SYSTEM');

INSERT INTO processes_type (name, is_default)
SELECT 'USER', false
WHERE NOT EXISTS (SELECT 1 FROM processes_type WHERE name = 'USER');

-- Processo de boleto (apenas se não existir)
INSERT INTO processes (name, description, type_id)
SELECT 'Geração de Boleto', 'Processo para geração de boletos', pt.type_id
FROM processes_type pt
WHERE pt.name = 'SYSTEM'
AND NOT EXISTS (
    SELECT 1 FROM processes 
    WHERE name = 'Geração de Boleto'
);
