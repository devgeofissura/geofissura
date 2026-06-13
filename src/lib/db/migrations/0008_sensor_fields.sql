-- Adiciona colunas de fabricante, modelo, unidade e valor_mensal diretamente na tabela sensores
ALTER TABLE sensores ADD COLUMN IF NOT EXISTS modelo VARCHAR(200);
ALTER TABLE sensores ADD COLUMN IF NOT EXISTS unidade VARCHAR(50);
ALTER TABLE sensores ADD COLUMN IF NOT EXISTS fabricante VARCHAR(200);
ALTER TABLE sensores ADD COLUMN IF NOT EXISTS valor_mensal NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Migra dados do JSONB dados para as novas colunas
UPDATE sensores
SET modelo = COALESCE(dados->>'modelo', ''),
    unidade = COALESCE(dados->>'unidade', ''),
    fabricante = COALESCE(dados->>'fabricante', '');

-- Migra precos_sensor para sensores.valor_mensal
UPDATE sensores s
SET valor_mensal = p.valor_mensal
FROM precos_sensor p
WHERE p.sensor_id = s.id;

-- Remove tabela precos_sensor
DROP TABLE IF EXISTS precos_sensor;
