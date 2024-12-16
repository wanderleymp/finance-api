-- Migração para criar tabela de tipos de movimentação
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'movement_types') THEN
        CREATE TABLE movement_types (
            movement_type_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            category VARCHAR(50) NOT NULL,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Inserir tipos de movimentação padrão
        INSERT INTO movement_types (name, description, category) VALUES
        ('Receita Fixa', 'Rendimentos recorrentes', 'RECEITA'),
        ('Receita Variável', 'Rendimentos não recorrentes', 'RECEITA'),
        ('Despesa Fixa', 'Gastos recorrentes', 'DESPESA'),
        ('Despesa Variável', 'Gastos não recorrentes', 'DESPESA'),
        ('Investimento', 'Aplicações financeiras', 'INVESTIMENTO');
    END IF;
END $$;
