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

function rand(min, max, dec = 4) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec))
}

function gerar(tipo) {
  switch (tipo) {
    case "inclinometro": return { valor: rand(-5, 5), unidade: "graus" }
    case "fissurometro": return { valor: rand(0, 15), unidade: "mm" }
    case "termometro":   return { valor: rand(18, 42), unidade: "°C" }
    case "piezometro":   return { valor: rand(1, 25), unidade: "mca" }
    case "extensometro": return { valor: rand(-200, 800), unidade: "με" }
    default:             return { valor: rand(0, 100), unidade: "un" }
  }
}

async function main() {
  const sensores = await sql`SELECT id, cliente_id, tipo_sensor, nome FROM sensores ORDER BY id`
  let total = 0
  const now = Date.now()

  for (const sensor of sensores) {
    const baseOffset = (sensor.id - 1) * 45 * 60 * 1000 // 45 min offset para densificar
    // Adiciona mais 20 leituras intercaladas entre as existentes
    for (let i = 0; i < 20; i++) {
      const ts = new Date(now - baseOffset - i * 2 * 60 * 60 * 1000) // a cada 2 horas
      const leitura = gerar(sensor.tipo_sensor)
      await sql`
        INSERT INTO leituras (cliente_id, sensor_id, valor, unidade, lida_em)
        VALUES (${sensor.cliente_id}, ${sensor.id}, ${leitura.valor}, ${leitura.unidade}, ${ts})
      `
      total++
    }
  }

  console.log(`${total} leituras adicionadas para ${sensores.length} sensores`)
  await sql.end()
}

main().catch((err) => { console.error(err); process.exit(1) })
