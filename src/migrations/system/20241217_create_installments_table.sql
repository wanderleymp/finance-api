-- Migração para criação da tabela installments e triggers relacionados

-- Função para definir status da parcela
CREATE OR REPLACE FUNCTION public.trg_set_installment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Definir status baseado na data de vencimento e saldo
    IF NEW.balance = 0 THEN
        NEW.status = 'PAID';
    ELSIF NEW.due_date < CURRENT_DATE THEN
        NEW.status = 'OVERDUE';
    ELSE
        NEW.status = 'PENDING';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para definir data esperada
CREATE OR REPLACE FUNCTION public.set_expected_date_installment()
RETURNS TRIGGER AS $$
BEGIN
    -- Definir data esperada como a data de vencimento
    NEW.expected_date = NEW.due_date;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar tabela installments
CREATE TABLE IF NOT EXISTS public.installments
(
    installment_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    payment_id integer NOT NULL,
    installment_number character varying(10) COLLATE pg_catalog."default" NOT NULL,
    due_date date NOT NULL,
    amount numeric(10,2) NOT NULL,
    balance numeric(10,2) NOT NULL,
    status character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT 'PENDING',
    account_entry_id integer NOT NULL,
    expected_date date,
    CONSTRAINT installments_pkey PRIMARY KEY (installment_id),
    CONSTRAINT fk_account_entry FOREIGN KEY (account_entry_id)
        REFERENCES public.account_entries (account_entry_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
)
TABLESPACE pg_default;

-- Alterar proprietário da tabela
ALTER TABLE IF EXISTS public.installments
    OWNER to postgres;

-- Trigger para definir status da parcela
CREATE OR REPLACE TRIGGER trg_installment_status
    BEFORE INSERT OR UPDATE 
    ON public.installments
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_set_installment_status();

-- Trigger para definir data esperada
CREATE OR REPLACE TRIGGER trg_set_expected_date
    BEFORE INSERT OR UPDATE OF due_date
    ON public.installments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_expected_date_installment();

-- Registrar versão da migração
INSERT INTO system_config (config_key, config_value, description)
VALUES ('db_version', '1.0.0.11', 'Versão da migração da tabela installments')
ON CONFLICT (config_key) DO UPDATE 
SET config_value = '1.0.0.11', updated_at = NOW();
