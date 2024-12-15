-- Criação e Ajuste da Tabela user_licenses
-- Versão: 1.0.1.6
-- Data: 2024-12-15
-- Descrição: Cria ou atualiza a tabela user_licenses e user_profiles com constraints corretas

DO $$
DECLARE
    migration_exists BOOLEAN;
BEGIN
    -- Verifica se a migração já foi aplicada
    SELECT EXISTS (
        SELECT 1 FROM migrations 
        WHERE migration_name = '20241215_create_user_licenses_and_profiles.sql'
        AND database_name = current_database()
    ) INTO migration_exists;

    IF migration_exists THEN
        RAISE EXCEPTION 'Migração já foi aplicada anteriormente';
    END IF;

    -- Recria a tabela system_config se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_config'
    ) THEN
        CREATE TABLE public.system_config (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            value VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Insere configurações padrão
        INSERT INTO public.system_config (name, value, description) VALUES 
        ('db_version', '1.0.0.1', 'Versão atual do banco de dados');
    END IF;

    -- Verifica se a Tabela `user_licenses` Existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_licenses'
    ) THEN
        -- Cria a tabela user_licenses se não existir
        CREATE TABLE public.user_licenses (
            license_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            license_type VARCHAR(50) NOT NULL,
            start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            end_date TIMESTAMP WITH TIME ZONE,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- Remove constraints antigas ou inválidas
    PERFORM 
        format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
            tc.table_schema, 
            tc.constraint_name
        )
    FROM 
        information_schema.table_constraints tc
    WHERE 
        tc.table_schema = 'public' 
        AND tc.table_name = 'user_licenses' 
        AND (
            tc.constraint_name = 'user_license_user_id_fkey_old' OR
            tc.constraint_name = 'user_license_user_id_fkey' OR
            tc.constraint_name LIKE '%user_accounts%'
        );

    -- Adiciona nova constraint referenciando users
    BEGIN
        ALTER TABLE public.user_licenses 
        ADD CONSTRAINT user_license_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.users (user_id) 
        ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
        -- Se a constraint já existir, simplesmente ignora
        NULL;
    END;

    -- Adiciona índice para melhorar performance
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'user_licenses' 
        AND indexname = 'idx_user_licenses_user_id'
    ) THEN
        CREATE INDEX idx_user_licenses_user_id 
        ON public.user_licenses (user_id);
    END IF;

    -- Criação da tabela de perfis de usuário
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
    ) THEN
        CREATE TABLE public.user_profiles (
            user_profile_id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

            -- Chave Primária
            CONSTRAINT user_profile_pkey PRIMARY KEY (user_profile_id),

            -- Restrição de nome único
            CONSTRAINT unique_user_profile_name UNIQUE (name)
        );

        -- Índice para melhorar performance de busca por nome
        CREATE INDEX IF NOT EXISTS idx_user_profiles_name 
        ON public.user_profiles (name);

        -- Inserir perfis padrão
        INSERT INTO public.user_profiles (name, description, active) VALUES 
        ('Admin', 'Administrador com acesso total ao sistema', TRUE),
        ('Usuário', 'Usuário padrão com acesso limitado', TRUE),
        ('Gerente', 'Usuário com permissões de gerenciamento', TRUE);
    ELSE
        -- Adiciona coluna active se não existir
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns
            WHERE table_name = 'user_profiles' 
            AND column_name = 'active'
        ) THEN
            ALTER TABLE public.user_profiles 
            ADD COLUMN active BOOLEAN DEFAULT TRUE;
        END IF;
    END IF;

    -- Adiciona coluna de perfil na tabela de usuários, se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns
        WHERE table_name = 'users' 
        AND column_name = 'user_profile_id'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN user_profile_id INTEGER;

        ALTER TABLE public.users 
        ADD CONSTRAINT users_user_profile_id_fkey 
        FOREIGN KEY (user_profile_id) 
        REFERENCES public.user_profiles (user_profile_id);
    END IF;

    -- Atualiza a versão do banco no system_config
    UPDATE public.system_config 
    SET value = '1.0.1.7', updated_at = CURRENT_TIMESTAMP
    WHERE name = 'db_version';

    -- Registra a migração como concluída
    INSERT INTO migrations (
        migration_name, 
        database_name, 
        applied_at
    ) VALUES (
        '20241215_create_user_licenses_and_profiles.sql',
        current_database(),
        CURRENT_TIMESTAMP
    );

    RAISE NOTICE 'Migração user_licenses e user_profiles concluída com sucesso';
END $$;
