# GeoFissuras — Base de Conhecimento

## Sobre o Projeto

**GeoFissuras** é uma plataforma SaaS que monitora edificações com equipamentos inteligentes (ESP32, sensores) e inteligência artificial. Construtoras (clientes/tenants) cadastram edificações, cada edificação pode ter engenheiros, arquitetos, equipamentos, monitores de fissura, sensores, laudos técnicos — sistema extensível para novos tipos sem reestruturar o banco.

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 14 (App Router)** |
| Linguagem | **TypeScript 5 (strict)** |
| Banco | **PostgreSQL (Neon)** |
| ORM | **Drizzle ORM** |
| Auth | **NextAuth.js v4** |
| UI | **shadcn/ui + Tailwind CSS** |
| Formulários | **React Hook Form + Zod** |
| Cache / Server State | **TanStack Query** |
| Tabelas | **TanStack Table** |
| Gráficos | **Recharts** |
| PDF | **jsPDF + jspdf-autotable** |
| Upload | **Vercel Blob + react-dropzone** |
| Notificações | **Sonner** |
| Email | **Nodemailer (SMTP)** |
| MQTT Broker | **EMQX** |
| WebSocket | **Socket.IO** |
| Tema | **next-themes** |
| Deploy | **Vercel** (web) + **VPS/Docker** (MQTT broker) |
| Ícones | **Lucide React** |

## Arquitetura de Dados

### Multi-Tenancy
Cada cliente = um **tenant**. Isolamento por `tenant_id` em todas as tabelas. Sessão contém `tenantId` e toda query filtra por ele.

### Modelo Extensível
`sensores` com `tipo_sensor` (VARCHAR) + `dados` (JSONB) permite qualquer tipo de sensor sem criar tabelas novas:
- Engenheiro → `{ "crea": "12345", "especialidade": "estrutural" }`
- Monitor → `{ "modelo": "ESP32", "firmware": "v2.1", "topico_mqtt": "..." }`
- Equipamento → `{ "fabricante": "Hilti", "num_serie": "..." }`
- Laudo → `{ "responsavel": "Dr. Silva", "data": "2026-01-15", "anexo_url": "..." }`

### Tabelas Principais
- `tenants` — clientes do SaaS
- `usuarios` — usuários com `tenant_id`
- `edificacoes` — edificações por tenant
- `sensores` — sensores extensíveis (JSONB)
- `leituras` — dados temporais dos sensores

### Convenção MQTT
Tópicos: `pdm/{tenant_slug}/{edificacao_id}/{sensor_id}/leitura`

## Padrões de Código

- Props tipadas com `interface` (nunca `type` para props)
- Nomes em português (UI visível), código em inglês (lógica)
- Arquivos em **kebab-case**
- SQL em **snake_case**, TypeScript em **camelCase** (Drizzle mapeia)
- Toda tabela de domínio: `tenant_id`, `id`, `created_at`, `updated_at`
- Caminhos absolutos com `@/`
- Componentes reutilizáveis SEM `export default` — só nomeado
- Páginas (app router) SEM `export default` nomeado — só `export default`
- Nunca usar `any`

## Estrutura de Diretórios

```
src/
├── app/
│   ├── (auth)/           # Login, registro, recover
│   ├── (dashboard)/      # Grupo protegido (requer sessão + tenant)
│   │   ├── modulo-x/
│   │   ├── layout.tsx    # Dashboard shell (sidebar + header)
│   │   └── page.tsx      # Dashboard principal
│   └── api/
│       ├── modulo-x/
│       └── auth/
├── components/
│   ├── ui/               # shadcn/ui
│   ├── layout/           # Sidebar, Header, DashboardShell
│   ├── forms/
│   └── modulo-x/
├── lib/
│   ├── db/
│   │   ├── schema/       # Tabelas Drizzle (1 arquivo por tabela)
│   │   ├── migrations/   # SQL de migração (ordem numérica)
│   │   └── index.ts      # Conexão com banco
│   ├── auth.ts           # Config NextAuth
│   ├── utils.ts
│   ├── validation.ts     # Schemas Zod
│   └── api-error.ts
├── middleware.ts         # Proteção de rotas
└── types/
    ├── index.ts
    └── next-auth.d.ts    # Extensão dos tipos da sessão
```

## Regras de Engenharia

1. Cada tecnologia resolve um problema específico. Se não resolve, não use.
2. Migrations SQL: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, idempotentes
3. Toda query de domínio filtra por `tenant_id`
4. Senhas com bcrypt, dados sensíveis com AES-256-GCM
5. API externa sempre via API Route (nunca do client direto)
6. shadcn/ui como base de componentes
7. Dashboard responsivo: desktop (sidebar fixa), tablet (colapsável), mobile (bottom nav)
8. Tema claro/escuro com next-themes, classes `dark:` do Tailwind
9. Error handler padrão: `apiError()` no backend, `toast.error()` no frontend
10. Feedback com Sonner toast para sucesso/erro

## Banco de Dados

**Neon PostgreSQL** — connection string em `variaveis.md` (ignorado no git).

### Migrations
```bash
pnpm db:migrate    # Executa scripts SQL em ordem numérica
pnpm db:seed       # Cria tenant, admin e dados de exemplo
```

### Seed (Desenvolvimento)
- Tenant: Construtora ABC
- Admin: admin@geofissuras.com / admin123
- Edificação: Edifício Comercial ABC

### Tabelas (Neon - sa-east-1)
- `tenants`, `usuarios`, `edificacoes`, `entidades_da_edificacao`, `leituras`
- Criadas via migration `0001_estrutura_inicial.sql`
- Todas com `tenant_id`, índices e chaves estrangeiras
