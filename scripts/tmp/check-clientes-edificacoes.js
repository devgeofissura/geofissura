const { readFileSync, existsSync } = require("fs")
const { resolve } = require("path")

const envPath = resolve(__dirname, "..", "..", ".env")
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

const postgres = require("postgres")
const sql = postgres(process.env.DATABASE_URL, { prepare: false })

async function main() {
  const r = await sql`
    SELECT e.id, e.nome, e.cliente_id, c.nome as cliente_nome
    FROM edificacoes e
    LEFT JOIN clientes c ON c.id = e.cliente_id
    ORDER BY e.id
  `
  for (const row of r) {
    console.log(`Edif #${row.id} "${row.nome}" cliente_id=${row.cliente_id} "${row.cliente_nome}"`)
  }
  await sql.end()
}

main().catch((err) => { console.error(err); process.exit(1) })
