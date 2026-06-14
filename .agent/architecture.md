# GeoFissura — Arquitetura do Sistema

## Visão Geral

O GeoFissura é uma plataforma SaaS multi-tenant para monitoramento de edificações utilizando sensores IoT baseados em ESP32. Composta por 4 módulos independentes que se comunicam via contratos bem definidos.

```
                    +---------------------+
                    |   GeoFissura Web    |
                    |   (Next.js/Vercel)  |
                    +---------+-----------+
                              |
                     REST API (HTTPS)
                              |
                    +---------+-----------+
                    |   Neon PostgreSQL   |
                    |  (Banco Central)    |
                    +---------+-----------+
                              ^
                              |
                    +---------+-----------+
                    |  Gateway MQTT (Node)|
                    |  (Docker Compose)   |
                    +---------+-----------+
                              ^
                              |
                       MQTT (Internet)
                              |
         +----------+---------+----------+----------+
         |          |         |          |          |
       ESP32      ESP32     ESP32      ESP32     ESP32
```

---

## Módulo 1 — GeoFissura Web

| Atributo | Detalhe |
|---|---|
| **Nome** | `geo.fissura` |
| **Função** | Frontend + API para gestão do sistema |
| **Stack** | Next.js 14, TypeScript, Tailwind, Drizzle ORM, NextAuth v4, shadcn/ui |
| **Hospedagem** | Vercel |
| **Domínio** | `https://geofissura.vercel.app` (ou próprio) |

### Responsabilidades

- Autenticação e autorização (NextAuth, roles SUPER/ADMIN/USER/VIEWER)
- Cadastro de construtoras, edificações, sensores, usuários
- Dashboards, gráficos, relatórios
- Notificações e alarmes (dashboard, email, WhatsApp, push)
- Gerenciamento de planos de dados e equipamentos
- Cobrança e relatórios financeiros
- **Nunca** se conecta ao MQTT ou ao Gateway

### Endpoints da API — Públicos

Estes endpoints são consumidos pelo Gateway MQTT e não exigem sessão de usuário, apenas **API Key** (`x-api-key`).

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/sensores/resolver?uuid={uuid}` | Retorna `{id, uuid, nome, tipoSensor}` de um sensor específico |
| `GET` | `/api/sensores/sincronizar` | Retorna todos os sensores ativos `{id, uuid, tipoSensor, edificacaoId}` |
| `POST` | `/api/sync` | Recebe lote de leituras `{leituras: [{sensor_uuid, valor, unidade, datahora}]}` e insere no Neon |
| `POST` | `/api/alertas` | Recebe eventos críticos do Gateway `{sensor_uuid, tipo, mensagem, valor, limite}` |

### Endpoints da API — Autenticados

Estes exigem sessão NextAuth (cookie/session).

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/sensores` | Lista sensores do cliente |
| `POST` | `/api/sensores` | Cria novo sensor |
| `GET` | `/api/sensores/[id]` | Detalhe do sensor |
| `PUT` | `/api/sensores/[id]` | Atualiza sensor |
| `DELETE` | `/api/sensores/[id]` | Desativa (soft) ou exclui (hard com `?force=true`) |
| ... | ... | Demais CRUDs (edificacoes, clientes, usuarios, etc.) |

---

## Módulo 2 — Gateway MQTT (Centralizado)

| Atributo | Detalhe |
|---|---|
| **Nome** | `gateway-mqtt` |
| **Função** | Ponte entre ESP32 e GeoFissura |
| **Stack** | Node.js, Mosquitto, PostgreSQL local |
| **Infra** | Docker Compose (Mosquitto + Gateway + PostgreSQL) |
| **Repositório** | `geofissura-gateway` (separado) |

### Arquitetura Interna

```
gateway-mqtt/
  mqtt.js        # Conexão com Mosquitto, subscribe geofissura/+
  postgres.js    # Acesso ao PostgreSQL local
  sync.js        # Worker de sincronização com Neon
  alerts.js      # Detecção e disparo de alertas
  config.js      # Configurações (env vars)
  api.js         # Endpoints locais para manutenção/diagnóstico
```

### Banco de Dados Local

#### `sensores`
Cache sincronizado do Neon via `GET /api/sensores/sincronizar`.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INTEGER | PK, igual ao Neon |
| `uuid` | VARCHAR(50) | UNIQUE, identificador do ESP32 (ex: GF-000001) |
| `tipo` | VARCHAR(50) | Tipo do sensor |
| `construtora_id` | INTEGER | FK |
| `edificacao_id` | INTEGER | FK |
| `ativo` | BOOLEAN | Se o sensor está ativo |

#### `leituras_local`
Leituras recebidas via MQTT, ainda não sincronizadas.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | SERIAL | PK local |
| `sensor_uuid` | VARCHAR(50) | UUID do sensor (não o ID interno) |
| `valor` | NUMERIC | Valor da leitura |
| `unidade` | VARCHAR(20) | Unidade de medida |
| `datahora` | TIMESTAMP | Momento da leitura |
| `sincronizado` | BOOLEAN | `false` até confirmação do Neon |

#### `sync_queue`
Fila de sincronização com controle de retry.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | SERIAL | PK |
| `leitura_id` | INTEGER | FK → leituras_local.id |
| `status` | VARCHAR(20) | `PENDENTE`, `ENVIANDO`, `ERRO`, `SINCRONIZADO` |
| `tentativas` | INTEGER | Número de tentativas |
| `ultima_tentativa` | TIMESTAMP | Última tentativa de envio |

### Fluxo de Operação

```
ESP32 → MQTT → Mosquitto → Gateway → leituras_local → sync_queue → Worker → POST /api/sync → Neon
```

### Worker de Sincronização

- Executa em loop contínuo
- Seleciona lotes de `leituras_local` com `sincronizado=false`
- Agrupa em batches configuráveis (100, 200, 500 registros)
- Envia `POST /api/sync` para o GeoFissura
- Marca como sincronizado após confirmação
- Em caso de erro: incrementa tentativas, reenvia depois

### Eventos Críticos

- Durante a recepção MQTT, o Gateway verifica regras (ex: fissura > 1.5mm)
- Se crítica: envia `POST /api/alertas` imediatamente (não espera sync)

---

## Módulo 3 — ESP32 Firmware

| Atributo | Detalhe |
|---|---|
| **Nome** | `esp32-firmware` |
| **Função** | Leitura de sensores físicos e publicação MQTT |
| **Stack** | Arduino framework / ESP-IDF |
| **Repositório** | `geofissura-esp32` (separado) |

### Interface Web de Configuração

Campos de configuração acessíveis via browser no ESP32:

| Campo | Exemplo |
|---|---|
| SSID WiFi | `Construtora-Alfa` |
| Senha WiFi | `********` |
| Broker MQTT | `mqtt.geofissura.com.br` |
| Porta MQTT | `1883` |
| Usuário MQTT | `gf_gateway` |
| Senha MQTT | `********` |
| UUID do Sensor | `GF-000001` |
| Intervalo de envio | `720` (minutos) |

### Comportamento

- Conecta ao WiFi
- Conecta ao Mosquitto
- Publica no tópico `geofissura/{UUID}` no intervalo configurado
- Payload: `{"valor": 0.52, "unidade": "mm"}`
- Opera independentemente: se perder conexão, armazena localmente e reenvia quando reconectar

---

## Módulo 4 — Mosquitto Broker

| Atributo | Detalhe |
|---|---|
| **Função** | Transporte MQTT |
| **Stack** | Eclipse Mosquitto |
| **Infra** | Container Docker no mesmo host do Gateway |

### Tópicos

| Tópico | Direção | Descrição |
|---|---|---|
| `geofissura/+` | ESP32 → Gateway | Wildcard que o Gateway subscribe |
| `geofissura/GF-000001` | ESP32 → Broker | Leitura de cada sensor específico |

### Responsabilidades

- Apenas entrega mensagens. Sem regras de negócio, sem histórico.
- Configurado com autenticação (usuário/senha) para evitar connects indevidos.

---

## Contratos entre os Módulos

### Contrato 1: Gateway → GeoFissura (Sincronizar Sensores)

```
GET /api/sensores/sincronizar
Headers:
  x-api-key: {GATEWAY_API_KEY}

Response 200:
[
  {
    "id": 15,
    "uuid": "GF-000001",
    "tipoSensor": "fissurometro",
    "edificacaoId": 3
  }
]
```

O Gateway chama periodicamente e faz UPSERT no banco local.

---

### Contrato 2: Gateway → GeoFissura (Sync Leituras)

```
POST /api/sync
Headers:
  x-api-key: {GATEWAY_API_KEY}
  Content-Type: application/json

Body:
{
  "leituras": [
    {
      "sensor_uuid": "GF-000001",
      "valor": 0.52,
      "unidade": "mm",
      "datahora": "2026-06-14T08:00:00"
    }
  ]
}

Response 200:
{
  "resultados": [
    { "sensor_uuid": "GF-000001", "status": "ok" }
  ],
  "inseridas": 1
}
```

- `sensor_uuid` é a única chave compartilhada — IDs locais do Gateway nunca vazam
- Campo `topico_mqtt` e `metadata` são opcionais
- O GeoFissura resolve `sensor_uuid` → `sensor_id` → INSERT no Neon

---

### Contrato 3: Gateway → GeoFissura (Alertas Críticos)

```
POST /api/alertas
Headers:
  x-api-key: {GATEWAY_API_KEY}
  Content-Type: application/json

Body:
{
  "sensor_uuid": "GF-000001",
  "tipo": "fissura_critica",
  "mensagem": "Fissura ultrapassou limite de 1.5mm",
  "valor": 2.34,
  "unidade": "mm",
  "limite": 1.5,
  "datahora": "2026-06-14T08:00:00"
}

Response 200:
{
  "alerta_id": 42,
  "status": "registrado"
}
```

O Gateway envia **imediatamente** ao detectar um evento crítico, sem esperar o sync periódico.

---

### Contrato 4: ESP32 → Mosquitto (Publicação MQTT)

```
Topic: geofissura/GF-000001

Payload:
{
  "valor": 0.52,
  "unidade": "mm"
}
```

---

### Contrato 5: GeoFissura → Gateway (Resolver UUID)

```
GET /api/sensores/resolver?uuid=GF-000001
Headers:
  x-api-key: {GATEWAY_API_KEY}

Response 200:
{
  "id": 15,
  "uuid": "GF-000001",
  "nome": "Fissurômetro Torre A",
  "tipoSensor": "fissurometro"
}
```

Endpoint auxiliar para o Gateway consultar um sensor específico.

---

## Segurança

### API Key

Todos os endpoints consumidos pelo Gateway usam o header:

```
x-api-key: {GATEWAY_API_KEY}
```

A chave é configurada via variável de ambiente `GATEWAY_API_KEY` no GeoFissura (Vercel) e no Gateway.

Sem chave válida: `401 Unauthorized`.

### Autenticação MQTT

O Mosquitto exige usuário e senha para publish/subscribe.

### Sessões Web

O GeoFissura usa NextAuth com credenciais (bcrypt) e JWT.

---

## Variáveis de Ambiente — GeoFissura (Vercel)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão Neon PostgreSQL |
| `NEXTAUTH_SECRET` | Chave JWT |
| `NEXTAUTH_URL` | URL da aplicação |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Servidor de email |
| `GATEWAY_API_KEY` | Chave compartilhada com o Gateway MQTT |

## Variáveis de Ambiente — Gateway (Docker)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL local |
| `NEON_API_URL` | URL do GeoFissura (ex: `https://geofissura.vercel.app`) |
| `GATEWAY_API_KEY` | Chave compartilhada |
| `MQTT_BROKER` | Host do Mosquitto |
| `MQTT_PORT` | Porta do Mosquitto |
| `MQTT_USER` | Usuário MQTT |
| `MQTT_PASS` | Senha MQTT |
| `SYNC_BATCH_SIZE` | Tamanho do lote de sync (ex: 100) |
| `SYNC_INTERVAL_MS` | Intervalo entre ciclos do worker |

---

## Roadmap de Implementação

### Fase 1 — GeoFissura (atual)
- [x] Cadastro de construtoras, edificações, sensores
- [x] UUID field em sensores
- [x] `GET /api/sensores/resolver`
- [x] `GET /api/sensores/sincronizar`
- [x] `POST /api/sync`
- [ ] `POST /api/alertas`
- [ ] API Key validation nos endpoints do Gateway

### Fase 2 — Gateway MQTT
- [ ] Repositório `geofissura-gateway`
- [ ] Docker Compose (Mosquitto + Gateway + PostgreSQL)
- [ ] Módulo MQTT (subscribe `geofissura/+`)
- [ ] Módulo PostgreSQL local
- [ ] Módulo Sync Worker
- [ ] Módulo Alertas
- [ ] Módulo de Configuração
- [ ] API local de diagnóstico

### Fase 3 — ESP32 Firmware
- [ ] Repositório `geofissura-esp32`
- [ ] Interface Web de configuração
- [ ] Cliente MQTT
- [ ] Leitura de sensores
- [ ] Publicação periódica no tópico `geofissura/{UUID}`
