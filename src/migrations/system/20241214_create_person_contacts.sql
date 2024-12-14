DO $$
BEGIN
    -- Verifica se a tabela já existe
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'person_contacts'
    ) THEN
        -- Cria a Tabela `person_contacts`  
        CREATE TABLE public.person_contacts (
            person_contact_id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY (INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1),
            person_id INTEGER NOT NULL,
            contact_id INTEGER NOT NULL,
            is_main BOOLEAN DEFAULT false,
            active BOOLEAN DEFAULT true,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

            -- Chaves Primária e Unicidade  
            CONSTRAINT person_contacts_pkey PRIMARY KEY (person_contact_id),
            CONSTRAINT person_contacts_unique_idx UNIQUE (person_id, contact_id),

            -- Chaves Estrangeiras  
            CONSTRAINT fk_contact FOREIGN KEY (contact_id)  
                REFERENCES public.contacts (contact_id) ON DELETE CASCADE,  
            CONSTRAINT fk_person FOREIGN KEY (person_id)  
                REFERENCES public.persons (person_id) ON DELETE CASCADE  
        );

        -- Comentários para documentação
        COMMENT ON TABLE public.person_contacts IS 'Tabela de associação entre pessoas e contatos';
        COMMENT ON COLUMN public.person_contacts.is_main IS 'Indica se este é o contato principal';
        COMMENT ON COLUMN public.person_contacts.active IS 'Indica se o contato está ativo';
    END IF;
END $$;
