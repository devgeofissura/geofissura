-- Adiciona campo uuid aos sensores
ALTER TABLE sensores ADD COLUMN IF NOT EXISTS uuid UUID UNIQUE DEFAULT gen_random_uuid();

-- Preenche uuid para registros existentes que ficaram nulos
UPDATE sensores SET uuid = gen_random_uuid() WHERE uuid IS NULL;
