-- Criar tabela de NFSe
CREATE TABLE IF NOT EXISTS nfses (
    nfse_id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL,
    integration_nfse_id VARCHAR(50),
    service_value DECIMAL(10,2) NOT NULL,
    iss_value DECIMAL(10,2) NOT NULL,
    aliquota_service DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice FOREIGN KEY (invoice_id)
        REFERENCES invoices (id) ON DELETE CASCADE
);

-- Criar índices
CREATE INDEX idx_nfses_invoice_id ON nfses(invoice_id);
CREATE INDEX idx_nfses_integration_nfse_id ON nfses(integration_nfse_id);

-- Registrar migração
INSERT INTO migrations (migration_name, db_version, description)
VALUES ('20250123_create_nfse_table.sql', '1.0.0.6', 'Criação da tabela de NFSe');
