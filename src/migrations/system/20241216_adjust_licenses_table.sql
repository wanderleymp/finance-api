-- Ajuste na tabela licenses
-- Versão: 1.0.0.11
-- Data: 2024-12-16
-- Descrição: Corrige o tipo da coluna status para ENUM e remove coluna active

-- Inicia transação para garantir atomicidade
BEGIN;

-- Verifica se a migração já foi aplicada
DO $$
DECLARE
    migration_exists BOOLEAN;
    current_version TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM migrations 
        WHERE migration_name = '20241216_adjust_licenses_table.sql'
        AND database_name = current_database()
    ) INTO migration_exists;

    IF migration_exists THEN
        RAISE EXCEPTION 'Migração já foi aplicada anteriormente';
    END IF;
END
$$;

-- Executa as alterações dentro de um bloco DO para capturar erros
DO $$ 
DECLARE 
    v_column_exists BOOLEAN;
    v_views_to_drop TEXT[] := ARRAY['vw_contract_groups', 'vw_payment_methods_details', 'vw_licenses'];
    v_view TEXT;
BEGIN
    -- Dropa as views dependentes
    FOREACH v_view IN ARRAY v_views_to_drop LOOP
        IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = v_view) THEN
            EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', v_view);
            RAISE NOTICE 'View % dropada', v_view;
        END IF;
    END LOOP;

    -- Verifica se a coluna active existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'licenses' 
        AND column_name = 'active'
    ) INTO v_column_exists;

    -- Remove a coluna active se existir
    IF v_column_exists THEN
        ALTER TABLE public.licenses DROP COLUMN active;
        RAISE NOTICE 'Coluna active removida';
    ELSE
        RAISE NOTICE 'Coluna active não existe, pulando remoção';
    END IF;

    -- Verifica se o ENUM license_status_enum existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'license_status_enum'
    ) THEN
        CREATE TYPE license_status_enum AS ENUM ('Ativa', 'Inativa', 'Suspensa', 'Cancelada');
        RAISE NOTICE 'ENUM license_status_enum criado';
    END IF;

    -- Altera o tipo da coluna status para o ENUM
    -- Primeiro, remove o valor padrão
    ALTER TABLE public.licenses 
    ALTER COLUMN status DROP DEFAULT;

    -- Converte os dados existentes
    UPDATE public.licenses 
    SET status = 
        CASE 
            WHEN status = 'Ativa' THEN 'Ativa'::license_status_enum
            WHEN status = 'Inativa' THEN 'Inativa'::license_status_enum
            WHEN status = 'Suspensa' THEN 'Suspensa'::license_status_enum
            WHEN status = 'Cancelada' THEN 'Cancelada'::license_status_enum
            ELSE 'Ativa'::license_status_enum
        END;

    -- Altera o tipo da coluna
    ALTER TABLE public.licenses 
    ALTER COLUMN status TYPE license_status_enum USING status::license_status_enum;

    -- Adiciona valor padrão
    ALTER TABLE public.licenses 
    ALTER COLUMN status SET DEFAULT 'Ativa'::license_status_enum;

    RAISE NOTICE 'Tipo da coluna status alterado para license_status_enum';

    -- Se chegou até aqui sem erros, registra a migração
    INSERT INTO migrations (migration_name, db_version, applied_at, database_name, description)
    VALUES (
        '20241216_adjust_licenses_table.sql',
        '1.0.0.11',
        CURRENT_TIMESTAMP,
        current_database(),
        'Ajuste no tipo da coluna status e remoção da coluna active'
    );

    -- Atualiza versão do banco
    UPDATE system_config 
    SET config_value = '1.0.0.11', 
        updated_at = NOW() 
    WHERE config_key = 'db_version';

    RAISE NOTICE 'Migração registrada com sucesso';

EXCEPTION WHEN OTHERS THEN
    -- Log do erro e propaga a exceção
    RAISE NOTICE 'Erro durante a migração: %', SQLERRM;
    RAISE;
END $$;

-- Commit da transação apenas se tudo deu certo
COMMIT;
