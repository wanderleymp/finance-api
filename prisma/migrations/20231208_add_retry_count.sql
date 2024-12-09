-- Adiciona a coluna retry_count à tabela tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
