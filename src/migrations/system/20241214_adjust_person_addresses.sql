DO $$
BEGIN
    -- Remove a restrição única antiga
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'person_addresses'
    ) THEN
        ALTER TABLE public.person_addresses DROP CONSTRAINT IF EXISTS addresses_person_id_unique;
    END IF;
END $$;

-- Registro Automático na Tabela de Migrações
INSERT INTO migrations (migration_name, db_version, applied_at, database_name, description)
VALUES (
    '20241214_adjust_person_addresses.sql', 
    '1.0.1.1', 
    CURRENT_TIMESTAMP, 
    current_database(),
    'Ajuste na tabela de endereços de pessoas'
);
