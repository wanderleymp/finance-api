-- Criar tabela de boletos
CREATE TABLE IF NOT EXISTS boletos (
    boleto_id SERIAL PRIMARY KEY,
    installment_id INTEGER,
    boleto_number VARCHAR(50) UNIQUE,
    boleto_url TEXT,
    status VARCHAR(20) DEFAULT 'Pendente',
    codigo_barras VARCHAR(100),
    linha_digitavel VARCHAR(100),
    pix_copia_e_cola TEXT,
    external_boleto_id VARCHAR(50),
    last_status_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_boletos_installment_id ON boletos(installment_id);
CREATE INDEX IF NOT EXISTS idx_boletos_status ON boletos(status);
CREATE INDEX IF NOT EXISTS idx_boletos_external_id ON boletos(external_boleto_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_boletos_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_boletos_modtime
BEFORE UPDATE ON boletos
FOR EACH ROW
EXECUTE FUNCTION update_boletos_modified_column();
