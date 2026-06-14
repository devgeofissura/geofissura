-- Cria tabela de tipos de equipamento
CREATE TABLE IF NOT EXISTS tipos_equipamento (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insere tipos de equipamento
INSERT INTO tipos_equipamento (nome, descricao) VALUES
  ('Módulo C.A.S', 'Módulo de aquisição de dados C.A.S'),
  ('Módulo WiFi', 'Módulo de comunicação WiFi'),
  ('Antena WiFi', 'Antena para transmissão de dados'),
  ('Roteador', 'Roteador de rede'),
  ('Fonte', 'Fonte de alimentação'),
  ('Cabo de Rede', 'Cabo de rede ethernet'),
  ('Sensor Repetidor', 'Repetidor de sinal de sensor'),
  ('Gateway', 'Gateway de comunicação')
ON CONFLICT (nome) DO NOTHING;
