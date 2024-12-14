-- Ajuste e Migração da Tabela person_documents
-- Versão: 1.0.0.7
-- Data: 2024-12-14
-- Descrição: Remove a tabela document_types e substitui por ENUM na tabela person_documents

-- Inicia transação para garantir atomicidade
BEGIN;

-- Verifica se a migração já foi aplicada
DO $$
DECLARE
    migration_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM migrations 
        WHERE migration_name = '20241214_adjust_person_documents.sql'
    ) INTO migration_exists;

    IF migration_exists THEN
        RAISE EXCEPTION 'Migração já foi aplicada anteriormente';
    END IF;
END $$;

-- Cria o ENUM fora da transação principal (PostgreSQL não permite CREATE TYPE em transação)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type_enum') THEN
        CREATE TYPE document_type_enum AS ENUM ('CPF', 'CNPJ', 'RG', 'CNH', 'OUTROS');
        RAISE NOTICE 'ENUM document_type_enum criado';
    END IF;
END $$;

-- Executa as alterações dentro de um bloco DO para capturar erros
DO $$ 
DECLARE
    has_document_type_id BOOLEAN;
    has_document_type BOOLEAN;
BEGIN
    -- Verifica estado atual
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'person_documents' 
        AND column_name = 'document_type_id'
    ) INTO has_document_type_id;

    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'person_documents' 
        AND column_name = 'document_type'
    ) INTO has_document_type;

    -- Log do estado atual
    RAISE NOTICE 'Estado inicial:';
    RAISE NOTICE 'Coluna document_type_id existe: %', has_document_type_id;
    RAISE NOTICE 'Coluna document_type existe: %', has_document_type;

    -- 1. Adiciona coluna active em persons se não existir
    BEGIN
        ALTER TABLE public.persons
        ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Coluna active adicionada em persons';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Coluna active já existe em persons';
    END;

    -- 2. Ajusta a tabela person_documents
    IF NOT has_document_type THEN
        -- Adiciona nova coluna
        ALTER TABLE public.person_documents 
        ADD COLUMN document_type document_type_enum;
        RAISE NOTICE 'Coluna document_type adicionada';

        -- Migra dados se houver coluna antiga
        IF has_document_type_id THEN
            RAISE NOTICE 'Migrando dados de document_type_id para document_type';
            UPDATE public.person_documents 
            SET document_type = CASE document_type_id
                WHEN 1 THEN 'CPF'::document_type_enum
                WHEN 2 THEN 'CNPJ'::document_type_enum
                WHEN 3 THEN 'RG'::document_type_enum
                WHEN 4 THEN 'CNH'::document_type_enum
                ELSE 'OUTROS'::document_type_enum
            END;

            -- Remove constraints e coluna antiga
            ALTER TABLE public.person_documents 
            DROP CONSTRAINT IF EXISTS person_documents_document_type_id_fkey;
            
            ALTER TABLE public.person_documents 
            DROP COLUMN document_type_id;
            RAISE NOTICE 'Coluna document_type_id removida';
        ELSE
            -- Se não tem coluna antiga, infere pelo formato
            RAISE NOTICE 'Inferindo tipos de documento pelo formato';
            UPDATE public.person_documents 
            SET document_type = CASE 
                WHEN document_value ~ '^[0-9]{11}$' THEN 'CPF'::document_type_enum
                WHEN document_value ~ '^[0-9]{14}$' THEN 'CNPJ'::document_type_enum
                ELSE 'OUTROS'::document_type_enum
            END
            WHERE document_type IS NULL;
        END IF;

        -- Define NOT NULL após migração
        ALTER TABLE public.person_documents 
        ALTER COLUMN document_type SET NOT NULL;
        RAISE NOTICE 'Coluna document_type definida como NOT NULL';
    ELSE
        RAISE NOTICE 'Coluna document_type já existe, pulando migração';
    END IF;

    -- 3. Recria índice
    DROP INDEX IF EXISTS person_documents_unique_idx;
    CREATE UNIQUE INDEX person_documents_unique_idx 
    ON public.person_documents (person_id, document_type, document_value);
    RAISE NOTICE 'Índice person_documents_unique_idx recriado';

    -- 4. Remove tabelas antigas
    DROP TABLE IF EXISTS person_type_document_type;
    DROP TABLE IF EXISTS document_types;
    RAISE NOTICE 'Tabelas antigas removidas';

EXCEPTION WHEN OTHERS THEN
    -- Log do erro e propaga a exceção
    RAISE NOTICE 'Erro durante a migração: %', SQLERRM;
    RAISE;
END $$;

-- Se chegou até aqui, a migração foi bem sucedida
-- Registra a migração
INSERT INTO migrations (migration_name, db_version, applied_at, database_name, description)
VALUES (
    '20241214_adjust_person_documents.sql',
    '1.0.0.7',
    CURRENT_TIMESTAMP,
    current_database(),
    'Migração para substituir document_types por ENUM e adicionar coluna active em persons'
);

-- Atualiza versão do banco
UPDATE system_config 
SET config_value = '1.0.0.7', 
    updated_at = NOW() 
WHERE config_key = 'db_version';

-- Commit da transação apenas se tudo deu certo
COMMIT;
