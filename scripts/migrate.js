const { readdirSync, readFileSync, existsSync } = require("fs")
const { join, resolve } = require("path")
const postgres = require("postgres")

// Carrega variaveis do .env manualmente
const envPath = resolve(__dirname, "..", ".env")
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8").split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx)
    let val = trimmed.slice(eqIdx + 1)
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não encontrada no .env")
    process.exit(1)
  }
  const sql = postgres(process.env.DATABASE_URL, { prepare: false })

  const migrationsDir = join(__dirname, "..", "src", "lib", "db", "migrations")
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()

  for (const file of files) {
    console.log(`Executando ${file}...`)
    const sqlContent = readFileSync(join(migrationsDir, file), "utf-8")
    await sql.unsafe(sqlContent)
    console.log(`  ✔ ${file} executado com sucesso`)
  }

  await sql.end()
  console.log("Migrações concluídas!")
}

migrate().catch((err) => {
  console.error("Erro na migração:", err)
  process.exit(1)
})
