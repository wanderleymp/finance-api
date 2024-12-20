-- Adicionar coluna response_data na tabela boletos
BEGIN;

-- Verificar se a coluna já não existe antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='boletos' AND column_name='response_data'
    ) THEN
        ALTER TABLE boletos 
        ADD COLUMN response_data JSONB;
    END IF;
END $$;

-- Adicionar comentário para documentação
COMMENT ON COLUMN boletos.response_data IS 'Dados de resposta da emissão do boleto (por exemplo, resposta do serviço de emissão)';

COMMIT;
