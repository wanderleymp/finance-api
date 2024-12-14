-- Script para verificar a estrutura atual
DO $$
DECLARE
    has_document_type_id BOOLEAN;
    has_document_type BOOLEAN;
    has_document_type_enum BOOLEAN;
BEGIN
    -- Verifica se o ENUM existe
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'document_type_enum'
    ) INTO has_document_type_enum;

    -- Verifica se a coluna document_type_id existe
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'person_documents' 
        AND column_name = 'document_type_id'
    ) INTO has_document_type_id;

    -- Verifica se a coluna document_type existe
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'person_documents' 
        AND column_name = 'document_type'
    ) INTO has_document_type;

    RAISE NOTICE 'Estado atual:';
    RAISE NOTICE 'ENUM document_type_enum existe: %', has_document_type_enum;
    RAISE NOTICE 'Coluna document_type_id existe: %', has_document_type_id;
    RAISE NOTICE 'Coluna document_type existe: %', has_document_type;

    -- Se o ENUM não existe mas a coluna document_type sim, temos um problema
    IF NOT has_document_type_enum AND has_document_type THEN
        RAISE EXCEPTION 'Coluna document_type existe mas ENUM não existe';
    END IF;

    -- Se ambas as colunas existem, temos um problema
    IF has_document_type_id AND has_document_type THEN
        RAISE EXCEPTION 'Ambas as colunas document_type_id e document_type existem';
    END IF;
END $$;
