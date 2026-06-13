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
  const sensores = await sql`SELECT id, nome, dados FROM sensores ORDER BY id LIMIT 5`
  console.log("Sample sensor dados:")
  for (const s of sensores) {
    console.log(`  #${s.id} ${s.nome}: ${JSON.stringify(s.dados)}`)
  }
  const precos = await sql`SELECT * FROM precos_sensor`
  console.log(`\nPrecos sensor: ${precos.length} registros`)
  for (const p of precos) {
    console.log(`  sensor_id=${p.sensor_id} valor=${p.valor_mensal}`)
  }
  await sql.end()
}

main().catch(err => { console.error(err); process.exit(1) })
