DO $$
BEGIN
CREATE TYPE IF NOT EXISTS contact_type_enum AS ENUM ('email', 'telefone', 'whatsapp', 'fax', 'outros');
DO $$  
BEGIN  
    BEGIN  
        ALTER TABLE public.contacts  
        ADD COLUMN contact_type contact_type_enum DEFAULT 'outros'::contact_type_enum;  
    EXCEPTION  
        WHEN duplicate_column THEN   
            RAISE NOTICE 'Coluna `contact_type` já existe.';  
    END;  
END $$;  

UPDATE public.contacts  
SET contact_type = CASE  
    WHEN contact_type_id = 1 THEN 'email'  
    WHEN contact_type_id = 2 THEN 'telefone'  
    WHEN contact_type_id = 3 THEN 'whatsapp'  
    WHEN contact_type_id = 4 THEN 'fax'  
    ELSE 'outros'  
END;  

IF EXISTS (  
    SELECT 1 FROM information_schema.constraint_column_usage   
    WHERE table_name = 'contacts'   
    AND column_name = 'contact_type_id'  
) THEN  
    ALTER TABLE public.contacts   
    DROP CONSTRAINT IF EXISTS fk_contact_type,  
    DROP COLUMN IF EXISTS contact_type_id;  
END IF;  

IF EXISTS (  
    SELECT 1 FROM information_schema.tables   
    WHERE table_schema = 'public'   
    AND table_name = 'contact_types'  
) THEN  
    DROP TABLE public.contact_types;  
END IF;  

CREATE UNIQUE INDEX IF NOT EXISTS contacts_unique_idx  
ON public.contacts (lower(contact_value), contact_type);  
END $$;

INSERT INTO migrations (migration_name, db_version, applied_at)
VALUES ('20241214_adjust_contacts.sql', '1.0.0.7', CURRENT_TIMESTAMP);

UPDATE system_config
SET value = '1.0.0.7'
WHERE key = 'db_version';
