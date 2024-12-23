-- Migração para criar tabela de itens de movimentação
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'movement_items') THEN
        -- Criar tabela de itens de movimentação
        CREATE TABLE movement_items (
            movement_item_id SERIAL PRIMARY KEY,
            movement_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
            unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
            total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_movement FOREIGN KEY (movement_id)
                REFERENCES movements (movement_id)
                ON DELETE CASCADE,
            CONSTRAINT fk_item FOREIGN KEY (item_id)
                REFERENCES items (item_id)
                ON DELETE RESTRICT
        );

        -- Índices para melhorar performance
        CREATE INDEX idx_movement_items_movement_id ON movement_items(movement_id);
        CREATE INDEX idx_movement_items_item_id ON movement_items(item_id);

        -- Trigger para atualizar updated_at
        CREATE TRIGGER update_movement_items_modtime
            BEFORE UPDATE ON movement_items
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;
