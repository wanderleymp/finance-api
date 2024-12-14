-- Criação da Tabela licenses
-- Versão: 1.0.0.10
-- Data: 2024-12-15
-- Descrição: Criação da tabela de licenças com suas restrições e índices

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
        WHERE migration_name = '20241215_create_licenses.sql'
        AND database_name = current_database()
    ) INTO migration_exists;

    IF migration_exists THEN
        RAISE EXCEPTION 'Migração já foi aplicada anteriormente';
    END IF;
END
$$;

-- Cria o ENUM para status de licença fora da transação principal
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'license_status_enum') THEN
        CREATE TYPE license_status_enum AS ENUM ('Ativa', 'Inativa', 'Suspensa', 'Cancelada');
        RAISE NOTICE 'ENUM license_status_enum criado';
    END IF;
END $$;

-- Executa as alterações dentro de um bloco DO para capturar erros
DO $$ 
BEGIN
    -- Faz backup da tabela se ela existir
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'licenses') THEN
        CREATE TABLE public.licenses_backup AS SELECT * FROM public.licenses;
        RAISE NOTICE 'Backup da tabela licenses criado';
    END IF;

    -- Remove a tabela se existir
    DROP TABLE IF EXISTS public.licenses;
    RAISE NOTICE 'Tabela licenses removida (se existia)';

    -- Cria a nova tabela
    CREATE TABLE public.licenses (  
        license_id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY (INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1),
        person_id INTEGER NOT NULL,  
        license_name VARCHAR(100) NOT NULL,  
        start_date DATE NOT NULL,  
        end_date DATE,  
        status license_status_enum NOT NULL DEFAULT 'Ativa',  
        timezone VARCHAR(50),  
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        -- Restrições  
        CONSTRAINT licenses_pkey PRIMARY KEY (license_id),  
        CONSTRAINT licenses_license_id_unique UNIQUE (license_id),  
        CONSTRAINT fk_person FOREIGN KEY (person_id)  
            REFERENCES public.persons (person_id) ON DELETE CASCADE  
    );
    RAISE NOTICE 'Tabela licenses criada';

    -- Cria os índices
    CREATE UNIQUE INDEX IF NOT EXISTS idx_license_person  
    ON public.licenses (person_id);  

    CREATE UNIQUE INDEX IF NOT EXISTS licenses_unique_active  
    ON public.licenses (person_id, license_name)  
    WHERE end_date IS NULL;
    RAISE NOTICE 'Índices criados';

    -- Comentários para documentação
    COMMENT ON TABLE public.licenses IS 'Tabela de licenças associadas a pessoas';
    COMMENT ON COLUMN public.licenses.license_name IS 'Nome da licença';
    COMMENT ON COLUMN public.licenses.start_date IS 'Data de início da licença';
    COMMENT ON COLUMN public.licenses.end_date IS 'Data de término da licença (null para licenças ativas)';
    COMMENT ON COLUMN public.licenses.status IS 'Status da licença (Ativa, Inativa, etc)';
    COMMENT ON COLUMN public.licenses.timezone IS 'Fuso horário da licença';
    COMMENT ON COLUMN public.licenses.active IS 'Indica se a licença está ativa no sistema';
    RAISE NOTICE 'Comentários adicionados';

EXCEPTION WHEN OTHERS THEN
    -- Log do erro e propaga a exceção
    RAISE NOTICE 'Erro durante a migração: %', SQLERRM;
    RAISE;
END $$;

-- Se chegou até aqui, a migração foi bem sucedida
-- Registra a migração
INSERT INTO migrations (migration_name, db_version, applied_at, database_name, description)
VALUES (
    '20241215_create_licenses.sql',
    '1.0.0.10',
    CURRENT_TIMESTAMP,
    current_database(),
    'Criação da tabela de licenças com suas restrições e índices'
);

-- Atualiza versão do banco
UPDATE system_config 
SET config_value = '1.0.0.10', 
    updated_at = NOW() 
WHERE config_key = 'db_version';

-- Commit da transação apenas se tudo deu certo
COMMIT;
