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
  const rows = await sql`
    SELECT e.id, e.nome AS edificio, c.nome AS cliente
    FROM edificacoes e
    JOIN clientes c ON c.id = e.cliente_id
    ORDER BY c.nome, e.nome
  `
  console.log(JSON.stringify(rows, null, 2))
  await sql.end()
}

main().catch(err => { console.error(err); process.exit(1) })
