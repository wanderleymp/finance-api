-- Ajuste e Migração da Tabela person_documents
-- Versão: 1.0.0.5
-- Data: 2024-12-14
-- Descrição: Remove a tabela document_types e substitui por ENUM na tabela person_documents

-- Cria o ENUM para Tipos de Documentos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type_enum') THEN
        CREATE TYPE document_type_enum AS ENUM ('CPF', 'CNPJ', 'RG', 'CNH', 'OUTROS');
    END IF;
END $$;

-- Adiciona coluna active em persons
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.persons
        ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
    EXCEPTION
        WHEN duplicate_column THEN
            NULL;
    END;
END $$;

-- Remove todas as dependências da tabela document_types
DO $$
BEGIN
    -- Remove triggers se existirem
    DROP TRIGGER IF EXISTS update_document_types_timestamp ON document_types;
    
    -- Remove FKs que apontam para document_types
    ALTER TABLE IF EXISTS person_type_document_type
    DROP CONSTRAINT IF EXISTS fk_document_type;
    
    -- Remove outras possíveis FKs
    ALTER TABLE IF EXISTS person_documents
    DROP CONSTRAINT IF EXISTS person_documents_document_type_id_fkey;
END $$;

-- Ajusta a tabela person_documents
DO $$
BEGIN
    -- Remove FK primeiro para evitar conflitos
    ALTER TABLE public.person_documents 
    DROP CONSTRAINT IF EXISTS person_documents_document_type_id_fkey;
    
    -- Adiciona nova coluna e migra dados
    ALTER TABLE public.person_documents 
    ADD COLUMN IF NOT EXISTS document_type document_type_enum;
    
    -- Migra dados baseado no ID
    UPDATE public.person_documents 
    SET document_type = CASE document_type_id
        WHEN 1 THEN 'CPF'::document_type_enum
        WHEN 2 THEN 'CNPJ'::document_type_enum
        WHEN 3 THEN 'RG'::document_type_enum
        WHEN 4 THEN 'CNH'::document_type_enum
        ELSE 'OUTROS'::document_type_enum
    END;
    
    -- Define NOT NULL após migração
    ALTER TABLE public.person_documents 
    ALTER COLUMN document_type SET NOT NULL;
    
    -- Remove coluna antiga
    ALTER TABLE public.person_documents 
    DROP COLUMN IF EXISTS document_type_id;
    
    -- Recria índice com nova coluna
    DROP INDEX IF EXISTS person_documents_unique_idx;
    CREATE UNIQUE INDEX person_documents_unique_idx 
    ON public.person_documents (person_id, document_type, document_value);
END $$;

-- Remove tabela antiga e suas dependências
DROP TABLE IF EXISTS person_type_document_type;
DROP TABLE IF EXISTS document_types;

-- Registro na tabela de migrações
INSERT INTO migrations (migration_name, db_version, applied_at, database_name, description)
VALUES (
    '20241214_adjust_person_documents.sql',
    '1.0.0.5',
    CURRENT_TIMESTAMP,
    current_database(),
    'Migração para substituir document_types por ENUM e adicionar coluna active em persons'
);

-- Atualiza versão do banco
INSERT INTO system_config (config_key, config_value, description)
VALUES ('db_version', '1.0.0.5', 'Versão após ajuste da tabela person_documents')
ON CONFLICT (config_key) DO UPDATE 
SET config_value = '1.0.0.5', updated_at = NOW();
