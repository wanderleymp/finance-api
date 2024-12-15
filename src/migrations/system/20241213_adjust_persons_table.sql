-- Migração para ajuste da tabela persons (Versão 1.0.0.1)

-- Remover dependências da tabela persons

-- Dropar views e materialized views dependentes
DROP VIEW IF EXISTS vw_cr_payments CASCADE;
DROP VIEW IF EXISTS vw_cr_pending CASCADE;
DROP VIEW IF EXISTS vw_contracts_movements CASCADE;
DROP VIEW IF EXISTS vw_installment CASCADE;
DROP MATERIALIZED VIEW IF EXISTS vw_persons_complete_mat CASCADE;
DROP VIEW IF EXISTS vw_persons_complete CASCADE;

-- Views específicas que dependem da coluna social_capital
DROP VIEW IF EXISTS person_details_view CASCADE;
DROP VIEW IF EXISTS contact_shared_view CASCADE;
DROP VIEW IF EXISTS vw_user_details CASCADE;

-- Dropar funções que dependem das views
DROP FUNCTION IF EXISTS fn_persons_search(text) CASCADE;
DROP FUNCTION IF EXISTS fn_persons_search_by_user(text, integer) CASCADE;

-- Dropar tipo ENUM existente
DROP TYPE IF EXISTS person_type_enum CASCADE;

-- Recriar tipo ENUM
CREATE TYPE person_type_enum AS ENUM ('PF', 'PJ', 'PR', 'OT');

-- Criar ou ajustar tabela persons
CREATE TABLE IF NOT EXISTS public.persons (
    person_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE,
    person_type person_type_enum DEFAULT 'PJ'::person_type_enum,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fantasy_name VARCHAR(255),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Remover colunas antigas se existirem e adicionar nova coluna
DO $$
DECLARE 
    v_column_exists BOOLEAN;
BEGIN
    -- Verificar e dropar colunas específicas
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'persons' 
        AND column_name = 'person_type_id'
    ) INTO v_column_exists;

    IF v_column_exists THEN
        EXECUTE 'ALTER TABLE public.persons DROP COLUMN person_type_id';
    END IF;

    -- Verificar e dropar colunas específicas
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'persons' 
        AND column_name = 'social_capital'
    ) INTO v_column_exists;

    IF v_column_exists THEN
        EXECUTE 'ALTER TABLE public.persons DROP COLUMN social_capital';
    END IF;

    -- Adicionar coluna person_type se não existir
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'persons' 
        AND column_name = 'person_type'
    ) INTO v_column_exists;

    IF NOT v_column_exists THEN
        EXECUTE 'ALTER TABLE public.persons ADD COLUMN person_type person_type_enum DEFAULT ''PJ''::person_type_enum';
    END IF;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao manipular colunas: %', SQLERRM;
END $$;

-- Dropar triggers existentes
DROP TRIGGER IF EXISTS trigger_format_person_full_name ON persons;
DROP FUNCTION IF EXISTS fn_format_person_full_name() CASCADE;

-- Recriar índices
CREATE INDEX IF NOT EXISTS idx_persons_fantasy_name ON public.persons (fantasy_name);
CREATE INDEX IF NOT EXISTS idx_persons_full_name ON public.persons (full_name);
CREATE INDEX IF NOT EXISTS idx_persons_upper_full_name ON public.persons (upper(full_name));

-- Verificar e recriar views com tratamento de erro
DO $$
BEGIN
    -- Verificar se a coluna person_type existe antes de criar views
    PERFORM column_name 
    FROM information_schema.columns 
    WHERE table_name = 'persons' AND column_name = 'person_type';

    -- Criar views somente se a coluna existir
    EXECUTE 'CREATE OR REPLACE VIEW vw_persons_complete AS
    SELECT 
        p.person_id,
        p.full_name,
        p.fantasy_name,
        p.birth_date,
        p.person_type,
        p.created_at,
        p.updated_at
    FROM 
        public.persons p';

    EXECUTE 'CREATE OR REPLACE VIEW person_details_view AS
    SELECT 
        p.person_id,
        p.full_name,
        p.fantasy_name,
        p.person_type,
        p.birth_date,
        p.created_at
    FROM 
        public.persons p';

    EXECUTE 'CREATE OR REPLACE VIEW contact_shared_view AS
    SELECT 
        p.person_id,
        p.full_name,
        p.person_type
    FROM 
        public.persons p';

    EXECUTE 'CREATE OR REPLACE VIEW vw_user_details AS
    SELECT 
        p.person_id,
        p.full_name,
        p.person_type
    FROM 
        public.persons p';

EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar views: %', SQLERRM;
END $$;

-- Exemplo de função de busca
CREATE OR REPLACE FUNCTION fn_persons_search(search_term text)
RETURNS TABLE (
    person_id INTEGER,
    full_name VARCHAR(255),
    person_type person_type_enum
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        p.person_id, 
        p.full_name, 
        p.person_type
    FROM 
        public.persons p
    WHERE 
        p.full_name ILIKE '%' || search_term || '%'
        OR p.fantasy_name ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;

-- Atualizar versão do banco de dados
INSERT INTO system_config (config_key, config_value, description)
VALUES ('db_version', '1.0.0.1', 'Versão da migração da tabela persons')
ON CONFLICT (config_key) DO UPDATE 
SET config_value = '1.0.0.1', updated_at = NOW();
