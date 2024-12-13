-- Migração para ajuste da tabela persons (Versão 1.0.0.1)

-- Criar tipo ENUM para person_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'person_type_enum'
    ) THEN
        CREATE TYPE person_type_enum AS ENUM ('PF', 'PJ', 'PR', 'OT');
    END IF;
END $$;

-- Criar ou ajustar tabela persons
DO $$
BEGIN
    -- Verificar se a tabela persons existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'persons'
    ) THEN
        -- Criar tabela se não existir
        CREATE TABLE public.persons (
            person_id SERIAL PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            birth_date DATE,
            person_type person_type_enum DEFAULT 'PJ'::person_type_enum,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            fantasy_name VARCHAR(255),
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        -- Remover colunas antigas, se existirem
        BEGIN
            ALTER TABLE public.persons 
            DROP COLUMN IF EXISTS social_capital,
            DROP COLUMN IF EXISTS person_type_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao remover colunas antigas';
        END;

        -- Adicionar coluna person_type se não existir
        BEGIN
            ALTER TABLE public.persons 
            ADD COLUMN IF NOT EXISTS person_type person_type_enum DEFAULT 'PJ'::person_type_enum;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao adicionar coluna person_type';
        END;
    END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_persons_fantasy_name ON public.persons (fantasy_name);
CREATE INDEX IF NOT EXISTS idx_persons_full_name ON public.persons (full_name);
CREATE INDEX IF NOT EXISTS idx_persons_upper_full_name ON public.persons (upper(full_name));

-- Atualizar versão do banco de dados
INSERT INTO system_config (config_key, config_value, description)
VALUES ('db_version', '1.0.0.1', 'Versão da migração da tabela persons')
ON CONFLICT (config_key) DO UPDATE 
SET config_value = '1.0.0.1', updated_at = NOW();
