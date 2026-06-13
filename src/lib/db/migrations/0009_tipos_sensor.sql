-- Cria tabela de tipos de sensor
CREATE TABLE IF NOT EXISTS tipos_sensor (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insere todos os tipos de sensor existentes
INSERT INTO tipos_sensor (nome, descricao) VALUES
  ('inclinometro', 'Mede inclinação e rotação do solo/estrutura'),
  ('fissurometro', 'Monitora abertura de fissuras em estruturas'),
  ('termometro', 'Mede temperatura ambiente ou do solo'),
  ('piezometro', 'Mede pressão da água no solo (nível freático)'),
  ('extensometro', 'Mede deformação/extensão em estruturas'),
  ('Fissura', 'Monitoramento de fissuras em estruturas'),
  ('Inclinacao', 'Medição de inclinação do solo/estrutura'),
  ('Pressao', 'Medição de pressão'),
  ('Sismo', 'Monitoramento sísmico e vibrações'),
  ('Temperatura', 'Medição de temperatura'),
  ('Umidade', 'Medição de umidade')
ON CONFLICT (nome) DO NOTHING;
