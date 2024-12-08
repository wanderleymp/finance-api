-- Adicionar apenas o processo de boleto se não existir
INSERT INTO processes (name, description, type_id)
SELECT 'Geração de Boleto', 'Processo para geração de boletos', pt.type_id
FROM processes_type pt
WHERE pt.name = 'automatic'
AND NOT EXISTS (
    SELECT 1 FROM processes 
    WHERE name = 'Geração de Boleto'
);
