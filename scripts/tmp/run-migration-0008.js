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
const migPath = resolve(__dirname, "..", "..", "src", "lib", "db", "migrations", "0008_sensor_fields.sql")
const sqlScript = readFileSync(migPath, "utf-8")

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "carregada" : "NAO CARREGADA")
console.log("URL:", (process.env.DATABASE_URL || "").slice(0, 50) + "...")

sql.unsafe(sqlScript)
  .then(() => { console.log("Migration 0008 executada com sucesso"); return sql.end() })
  .catch((e) => { console.error("Erro:", e.message); process.exit(1) })
