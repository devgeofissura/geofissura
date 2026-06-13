CREATE TABLE IF NOT EXISTS planos_dados (
  id              SERIAL PRIMARY KEY,
  edificacao_id   INTEGER NOT NULL REFERENCES edificacoes(id) ON DELETE CASCADE,
  operadora       VARCHAR(100) NOT NULL,
  descricao       TEXT,
  valor_mensal    NUMERIC(12,2) NOT NULL DEFAULT 0,
  ativo           VARCHAR(1) DEFAULT 'S',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipamentos (
  id              SERIAL PRIMARY KEY,
  edificacao_id   INTEGER NOT NULL REFERENCES edificacoes(id) ON DELETE CASCADE,
  tipo            VARCHAR(100) NOT NULL,
  descricao       TEXT,
  quantidade      INTEGER NOT NULL DEFAULT 1,
  valor_unitario  NUMERIC(12,2) NOT NULL DEFAULT 0,
  ativo           VARCHAR(1) DEFAULT 'S',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planos_dados_edificacao   ON planos_dados(edificacao_id);
CREATE INDEX IF NOT EXISTS idx_equipamentos_edificacao   ON equipamentos(edificacao_id);
