-- Renomear tabela entidades_da_edificacao para sensores
ALTER TABLE entidades_da_edificacao RENAME TO sensores;

-- Renomear coluna tipo_entidade para tipo_sensor
ALTER TABLE sensores RENAME COLUMN tipo_entidade TO tipo_sensor;

-- Renomear FK column em leituras
ALTER TABLE leituras RENAME COLUMN entidade_id TO sensor_id;

-- Recriar FK constraint
ALTER TABLE leituras DROP CONSTRAINT IF EXISTS leituras_entidade_id_fkey;
ALTER TABLE leituras ADD CONSTRAINT leituras_sensor_id_fkey
  FOREIGN KEY (sensor_id) REFERENCES sensores(id) ON DELETE CASCADE;

-- Renomear indexes
DROP INDEX IF EXISTS idx_entidades_tenant;
DROP INDEX IF EXISTS idx_entidades_edificacao;
DROP INDEX IF EXISTS idx_entidades_tipo;
DROP INDEX IF EXISTS idx_leituras_entidade;

CREATE INDEX IF NOT EXISTS idx_sensores_tenant ON sensores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sensores_edificacao ON sensores(edificacao_id);
CREATE INDEX IF NOT EXISTS idx_sensores_tipo ON sensores(tipo_sensor);
CREATE INDEX IF NOT EXISTS idx_leituras_sensor ON leituras(sensor_id);
