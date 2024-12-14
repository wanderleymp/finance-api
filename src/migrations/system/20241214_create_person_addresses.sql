DO $$
BEGIN
    -- Verifica se a tabela já existe
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'person_addresses'
    ) THEN
        -- Verifica se a tabela antiga existe
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'addresses'
        ) THEN
            -- Renomeia a tabela existente
            ALTER TABLE public.addresses RENAME TO person_addresses;
        ELSE
            -- Cria a Tabela `person_addresses`  
            CREATE TABLE public.person_addresses (
                address_id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY (INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1),
                person_id INTEGER NOT NULL,
                street VARCHAR(100) NOT NULL,
                "number" VARCHAR(20) NOT NULL,
                complement VARCHAR(50),
                neighborhood VARCHAR(50),
                city VARCHAR(50) NOT NULL,
                state VARCHAR(2) NOT NULL,
                postal_code VARCHAR(10) NOT NULL,
                country VARCHAR(50) DEFAULT 'Brasil',
                reference VARCHAR(100),
                ibge INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                -- Restrições  
                CONSTRAINT person_addresses_pkey PRIMARY KEY (address_id),
                CONSTRAINT person_addresses_person_id_fkey FOREIGN KEY (person_id)
                    REFERENCES public.persons (person_id) ON DELETE CASCADE
            );

            -- Índice de Unicidade  
            CREATE UNIQUE INDEX IF NOT EXISTS person_addresses_unique_idx
            ON public.person_addresses (person_id, street, "number", city, state, postal_code);
        END IF;

        -- Comentários para documentação
        COMMENT ON TABLE public.person_addresses IS 'Tabela de endereços de pessoas';
        COMMENT ON COLUMN public.person_addresses.street IS 'Logradouro do endereço';
        COMMENT ON COLUMN public.person_addresses.number IS 'Número do endereço';
        COMMENT ON COLUMN public.person_addresses.complement IS 'Complemento do endereço';
        COMMENT ON COLUMN public.person_addresses.neighborhood IS 'Bairro do endereço';
        COMMENT ON COLUMN public.person_addresses.city IS 'Cidade do endereço';
        COMMENT ON COLUMN public.person_addresses.state IS 'Estado do endereço (UF)';
        COMMENT ON COLUMN public.person_addresses.postal_code IS 'Código postal do endereço';
        COMMENT ON COLUMN public.person_addresses.country IS 'País do endereço';
        COMMENT ON COLUMN public.person_addresses.reference IS 'Referência do endereço';
        COMMENT ON COLUMN public.person_addresses.ibge IS 'Código IBGE da localidade';
    END IF;
END $$;

-- Registro Automático na Tabela de Migrações
INSERT INTO migrations (migration_name, db_version, applied_at, database_name, description)
VALUES (
    '20241214_create_person_addresses.sql', 
    '1.0.1.0', 
    CURRENT_TIMESTAMP, 
    'finance_api',
    'Criação da tabela de endereços de pessoas'
);
