-- Adicionar coluna description à tabela migrations de forma segura
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'migrations' AND column_name = 'description'
  ) THEN
    ALTER TABLE migrations ADD COLUMN description TEXT DEFAULT '';
  END IF;
END $$;
