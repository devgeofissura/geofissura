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
  const edificacoes = await sql`SELECT id, nome FROM edificacoes ORDER BY id`
  for (const e of edificacoes) {
    const sens = await sql`SELECT id, nome, ativo FROM sensores WHERE edificacao_id = ${e.id}`
    const ativos = sens.filter(s => s.ativo === "S").length
    console.log(`Edificacao #${e.id} "${e.nome}": ${sens.length} sensores (${ativos} ativos)`)
    for (const s of sens) {
      console.log(`  Sensor #${s.id} ${s.nome} ativo=${s.ativo}`)
    }
  }
  await sql.end()
}

main().catch((err) => { console.error(err); process.exit(1) })
