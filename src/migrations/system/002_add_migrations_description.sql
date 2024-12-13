-- Adicionar coluna description à tabela migrations
ALTER TABLE migrations ADD COLUMN description TEXT DEFAULT '';
