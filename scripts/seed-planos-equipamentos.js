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

  const edificios = await sql`SELECT id, nome FROM edificacoes ORDER BY id`

  for (const ed of edificios) {
    const existemPlanos = await sql`SELECT id FROM planos_dados WHERE edificacao_id = ${ed.id}`
    if (existemPlanos.length === 0) {
      await sql`
        INSERT INTO planos_dados (edificacao_id, operadora, descricao, valor_mensal, ativo)
        VALUES (${ed.id}, 'Vivo', 'Plano 4G empresarial 50GB', 89.90, 'S')
      `
    }

    const existemEquips = await sql`SELECT id FROM equipamentos WHERE edificacao_id = ${ed.id} AND tipo = 'Módulo C.A.S'`
    if (existemEquips.length === 0) {
      await sql`
        INSERT INTO equipamentos (edificacao_id, tipo, descricao, quantidade, valor_unitario, ativo)
        VALUES (${ed.id}, 'Módulo C.A.S', 'Módulo de Controle e Aquisição de Sinais', 1, 1499.90, 'S')
      `
    }

    console.log(`  ✔ ${ed.nome}`)
  }

  await sql.end()
  console.log("\nSeed concluído!")
}

main().catch(err => { console.error(err); process.exit(1) })
