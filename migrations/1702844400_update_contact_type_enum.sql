-- Alterar o enum de tipos de contato para incluir 'other'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'contact_type_enum' 
        AND enumlabel = 'other'
    ) THEN
        ALTER TYPE contact_type_enum ADD VALUE 'other';
    END IF;
END $$;
