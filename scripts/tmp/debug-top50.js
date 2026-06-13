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
  // Top 50 leituras mais recentes
  const top50 = await sql`
    SELECT l.id, l.sensor_id, l.lida_em, s.edificacao_id, s.nome as sensor_nome
    FROM leituras l
    JOIN sensores s ON s.id = l.sensor_id
    ORDER BY l.lida_em DESC
    LIMIT 50
  `
  console.log("Top 50 leituras:")
  const uniqueSensorIds = new Set()
  for (const r of top50) {
    console.log(`  leitura #${r.id} sensor #${r.sensor_id} (${r.sensor_nome}) edificacao_id=${r.edificacao_id} ${r.lida_em}`)
    uniqueSensorIds.add(r.sensor_id)
  }
  console.log(`\nSensores unicos no top 50: ${Array.from(uniqueSensorIds).join(", ")}`)
  console.log(`Sensores do edificio 7 (33-37) presentes: ${[33,34,35,36,37].every(id => uniqueSensorIds.has(id))}`)

  // Verifica sensores do edificio 7
  const sensEd7 = await sql`SELECT id, nome, edificacao_id FROM sensores WHERE edificacao_id = 7`
  console.log(`\nSensores da edificacao 7:`)
  console.log(sensEd7.map(s => `  #${s.id} ${s.nome} edificacao_id=${s.edificacao_id}`).join("\n"))

  await sql.end()
}

main().catch((err) => { console.error(err); process.exit(1) })
