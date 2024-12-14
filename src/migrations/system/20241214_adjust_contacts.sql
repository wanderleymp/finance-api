-- Ajuste e Migração da Tabela contacts
-- Versão: 1.0.0.7
-- Data: 2024-12-14
-- Descrição: Remove a tabela contact_types e substitui por ENUM na tabela contacts

-- Inicia transação para garantir atomicidade
BEGIN;

-- Verifica se a migração já foi aplicada
DO $$
DECLARE
    migration_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM migrations 
        WHERE migration_name = '20241214_adjust_contacts.sql'
    ) INTO migration_exists;

    IF migration_exists THEN
        RAISE EXCEPTION 'Migração já foi aplicada anteriormente';
    END IF;
END $$;

-- Cria o ENUM fora da transação principal (PostgreSQL não permite CREATE TYPE em transação)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_type_enum') THEN
        CREATE TYPE contact_type_enum AS ENUM ('email', 'telefone', 'whatsapp', 'fax', 'outros');
        RAISE NOTICE 'ENUM contact_type_enum criado';
    END IF;
END $$;

-- Executa as alterações dentro de um bloco DO para capturar erros
DO $$ 
DECLARE
    has_contact_type_id BOOLEAN;
    has_contact_type BOOLEAN;
    constraint_record RECORD;
BEGIN
    -- Verifica estado atual
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contacts' 
        AND column_name = 'contact_type_id'
    ) INTO has_contact_type_id;

    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contacts' 
        AND column_name = 'contact_type'
    ) INTO has_contact_type;

    -- Adiciona nova coluna contact_type se não existir
    IF NOT has_contact_type THEN
        ALTER TABLE public.contacts
        ADD COLUMN contact_type contact_type_enum DEFAULT 'outros'::contact_type_enum;
        RAISE NOTICE 'Coluna contact_type adicionada';
    END IF;

    -- Migra os dados existentes se necessário
    IF has_contact_type_id THEN
        UPDATE public.contacts
        SET contact_type = CASE
            WHEN contact_type_id = 1 THEN 'email'::contact_type_enum
            WHEN contact_type_id = 2 THEN 'telefone'::contact_type_enum
            WHEN contact_type_id = 3 THEN 'whatsapp'::contact_type_enum
            WHEN contact_type_id = 4 THEN 'fax'::contact_type_enum
            ELSE 'outros'::contact_type_enum
        END;
        RAISE NOTICE 'Dados migrados para contact_type';
    END IF;

    -- Remove todas as foreign keys que dependem da coluna contact_type_id
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'contacts'::regclass
        AND contype = 'f'
        AND EXISTS (
            SELECT 1
            FROM pg_attribute
            WHERE attrelid = 'contacts'::regclass
            AND attnum = ANY(conkey)
            AND attname = 'contact_type_id'
        )
    LOOP
        EXECUTE format('ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
        RAISE NOTICE 'Removida foreign key % da tabela contacts', constraint_record.conname;
    END LOOP;

    -- Remove a coluna antiga se existir
    IF has_contact_type_id THEN
        ALTER TABLE public.contacts
        DROP COLUMN IF EXISTS contact_type_id CASCADE;
        RAISE NOTICE 'Coluna contact_type_id removida';
    END IF;

    -- Remove a tabela antiga se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'contact_types'
    ) THEN
        DROP TABLE public.contact_types CASCADE;
        RAISE NOTICE 'Tabela contact_types removida';
    END IF;

    -- Cria índice único
    CREATE UNIQUE INDEX contacts_unique_idx
    ON public.contacts (lower(contact_value), contact_type);
    RAISE NOTICE 'Índice único criado';

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro durante migração: %', SQLERRM;
END $$;

-- Registra a migração
INSERT INTO migrations (migration_name, db_version, applied_at, description, database_name)
VALUES (
    '20241214_adjust_contacts.sql',
    '1.0.0.7',
    CURRENT_TIMESTAMP,
    'Ajusta a tabela contacts para usar ENUM contact_type_enum no lugar de contact_type_id',
    'FinanceDev'
);

-- Atualiza a versão do banco
UPDATE system_config
SET config_value = '1.0.0.7'
WHERE config_key = 'db_version';

-- Se chegou até aqui, commit da transação
COMMIT;
