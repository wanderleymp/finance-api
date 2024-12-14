-- Renomeação da tabela user_accounts para users
-- Versão: 1.0.1.6
-- Data: 2024-12-15
-- Descrição: Renomeia user_accounts para users e ajusta dependências

-- Inicia transação para garantir atomicidade
BEGIN;

-- Verifica se a Tabela `user_accounts` Existe  
DO $$
DECLARE
    migration_exists BOOLEAN;
BEGIN
    -- Verifica se a migração já foi aplicada
    SELECT EXISTS (
        SELECT 1 FROM migrations 
        WHERE migration_name = '20241215_rename_user_accounts_to_users.sql'
        AND database_name = current_database()
    ) INTO migration_exists;

    IF migration_exists THEN
        RAISE EXCEPTION 'Migração já foi aplicada anteriormente';
    END IF;

    -- Verifica se a tabela user_accounts existe
    IF EXISTS (  
        SELECT 1 FROM information_schema.tables   
        WHERE table_schema = 'public'   
        AND table_name = 'user_accounts'  
    ) THEN  
        -- Remove todas as constraints, triggers e validações
        BEGIN
            -- Drop all foreign key constraints
            PERFORM 
                format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                    tc.table_schema, 
                    tc.constraint_name
                )
            FROM 
                information_schema.table_constraints tc
            WHERE 
                tc.table_schema = 'public' 
                AND tc.table_name = 'user_accounts' 
                AND tc.constraint_type = 'FOREIGN KEY';

            -- Drop all triggers
            PERFORM 
                format('DROP TRIGGER IF EXISTS %I ON %I', 
                    trigger_name, 
                    event_object_table
                )
            FROM 
                information_schema.triggers
            WHERE 
                event_object_schema = 'public' 
                AND event_object_table = 'user_accounts';

            -- Drop the active column if it exists
            IF EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'user_accounts' 
                AND column_name = 'active'
            ) THEN
                ALTER TABLE public.user_accounts DROP COLUMN active;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao remover constraints, triggers ou coluna active: %', SQLERRM;
        END;

        -- Renomeia a Tabela  
        ALTER TABLE public.user_accounts RENAME TO users;  

        -- Recria as Chaves Estrangeiras  
        ALTER TABLE public.users  
        ADD CONSTRAINT users_person_id_fkey FOREIGN KEY (person_id)  
        REFERENCES public.persons (person_id) ON DELETE CASCADE,
        ADD CONSTRAINT users_profile_id_fkey FOREIGN KEY (profile_id)  
        REFERENCES public.profiles (profile_id) ON DELETE CASCADE;  

        -- Recria Índice de Unicidade  
        CREATE UNIQUE INDEX IF NOT EXISTS unique_person_user  
        ON public.users (person_id);  

        -- Registra a migração
        INSERT INTO migrations (
            migration_name, 
            db_version, 
            applied_at, 
            database_name, 
            description
        ) VALUES (
            '20241215_rename_user_accounts_to_users.sql',
            '1.0.1.6',
            CURRENT_TIMESTAMP,
            current_database(),
            'Renomeação da tabela user_accounts para users'
        );

        -- Atualiza versão do banco
        UPDATE system_config 
        SET config_value = '1.0.1.6', 
            updated_at = NOW() 
        WHERE config_key = 'db_version';

        RAISE NOTICE 'Migração concluída com sucesso';
    ELSE
        RAISE NOTICE 'Tabela user_accounts não existe';
    END IF;
END $$;

-- Commit da transação
COMMIT;
