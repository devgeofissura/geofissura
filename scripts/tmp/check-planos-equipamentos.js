const { readFileSync, existsSync } = require("fs")
const { resolve } = require("path")
const postgres = require("postgres")

const envPath = resolve(__dirname, "..", ".env")
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8").split("\n")
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i === -1) continue
    const k = t.slice(0, i)
    let v = t.slice(i + 1)
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[k]) process.env[k] = v
  }
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false })

  const planos = await sql`
    SELECT ed.nome AS edificio, pd.operadora, pd.descricao, pd.valor_mensal
    FROM planos_dados pd
    JOIN edificacoes ed ON ed.id = pd.edificacao_id
    ORDER BY ed.nome
  `
  console.log("=== PLANOS DE DADOS ===")
  console.table(planos)

  const equipamentos = await sql`
    SELECT ed.nome AS edificio, eq.tipo, eq.descricao, eq.quantidade, eq.valor_unitario
    FROM equipamentos eq
    JOIN edificacoes ed ON ed.id = eq.edificacao_id
    ORDER BY ed.nome
  `
  console.log("\n=== EQUIPAMENTOS ===")
  console.table(equipamentos)

  await sql.end()
}

main().catch(err => { console.error(err); process.exit(1) })
