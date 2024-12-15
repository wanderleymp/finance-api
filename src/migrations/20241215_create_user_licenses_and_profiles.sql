DO $$
BEGIN

-- Verifica se a Tabela `user_licenses` Existe e está no padrão correto
IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_licenses'
) THEN
    -- Verifica se precisa atualizar as foreign keys
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'user_licenses' 
        AND constraint_name = 'user_license_user_id_fkey' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Adiciona a foreign key para users se não existir
        ALTER TABLE public.user_licenses 
        ADD CONSTRAINT user_license_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.users (user_id) 
        ON DELETE CASCADE;
    END IF;

    -- Adiciona coluna active se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns
        WHERE table_name = 'user_licenses' 
        AND column_name = 'active'
    ) THEN
        ALTER TABLE public.user_licenses 
        ADD COLUMN active BOOLEAN DEFAULT TRUE;
    END IF;
ELSE
    -- Cria a Tabela `user_licenses`  
    CREATE TABLE public.user_licenses (  
        user_license_id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,  
        user_id INTEGER NOT NULL,  
        license_id INTEGER NOT NULL,  
        active BOOLEAN DEFAULT TRUE,

        -- Chave Primária  
        CONSTRAINT user_license_pkey PRIMARY KEY (user_license_id),  

        -- Chaves Estrangeiras  
        CONSTRAINT user_license_license_id_fkey FOREIGN KEY (license_id)  
            REFERENCES public.licenses (license_id) ON DELETE CASCADE,  

        CONSTRAINT user_license_user_id_fkey FOREIGN KEY (user_id)  
            REFERENCES public.users (user_id) ON DELETE CASCADE  
    );  

    -- Índices de Performance  
    CREATE INDEX IF NOT EXISTS idx_user_license_license_id  
    ON public.user_licenses (license_id);  

    CREATE INDEX IF NOT EXISTS idx_user_license_user_id  
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

-- Registro na tabela de migrações
INSERT INTO migrations (migration_name, db_version, applied_at)
VALUES ('20241215_create_user_licenses_and_profiles.sql', '1.0.1.7', CURRENT_TIMESTAMP);

-- Atualiza a versão do banco no system_config
UPDATE system_config
SET value = '1.0.1.7'
WHERE key = 'db_version';

END $$;
