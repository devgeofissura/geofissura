-- Cria tabela de tipos de sensor
CREATE TABLE IF NOT EXISTS tipos_sensor (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insere tipos de sensor existentes
INSERT INTO tipos_sensor (nome, descricao) VALUES
  ('inclinometro', 'Mede inclinação e rotação do solo/estrutura'),
  ('fissurometro', 'Monitora abertura de fissuras em estruturas'),
  ('termometro', 'Mede temperatura ambiente ou do solo'),
  ('piezometro', 'Mede pressão da água no solo (nível freático)'),
  ('extensometro', 'Mede deformação/extensão em estruturas')
ON CONFLICT (nome) DO NOTHING;
