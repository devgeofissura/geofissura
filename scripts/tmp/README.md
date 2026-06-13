# Scripts Auxiliares

Execute todos os comandos no terminal **PowerShell** ou **CMD** na raiz do projeto (`D:\Tiago\dev\geofissura`).

## Requisitos

- Node.js 18+
- `.env` na raiz com `DATABASE_URL` configurada

## Como Executar

### PowerShell (padrão)

```powershell
node scripts/seed-planos-equipamentos.js
node scripts/query-edificios.js        # lista edificações
node scripts/check-planos-equipamentos.js  # verifica dados inseridos
```

### CMD (caso PowerShell bloqueie execução)

```cmd
node scripts\seed-planos-equipamentos.js
node scripts\query-edificios.js
node scripts\check-planos-equipamentos.js
```

## Scripts Disponíveis

| Script | O que faz |
|--------|-----------|
| `seed-planos-equipamentos.js` | Insere plano Vivo (R$ 89,90) + Módulo C.A.S (R$ 1.499,90) em cada edificação |
| `query-edificios.js` | Lista todas as edificações com seus respectivos clientes |
| `check-planos-equipamentos.js` | Exibe os planos e equipamentos cadastrados no banco |

> Nota: `query-edificios.js` e `check-planos-equipamentos.js` são apenas consultas (não alteram dados).
