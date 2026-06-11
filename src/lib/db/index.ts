import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as tenants from "./schema/tenants"
import * as usuarios from "./schema/usuarios"
import * as edificacoes from "./schema/edificacoes"
import * as sensores from "./schema/sensores"
import * as leituras from "./schema/leituras"

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada")
}

const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, {
  schema: { ...tenants, ...usuarios, ...edificacoes, ...sensores, ...leituras },
})
