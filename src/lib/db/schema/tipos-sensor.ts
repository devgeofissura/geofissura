import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core"

export const tiposSensor = pgTable("tipos_sensor", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 50 }).notNull().unique(),
  descricao: text("descricao"),
  createdAt: timestamp("created_at").defaultNow(),
})

export type TipoSensor = typeof tiposSensor.$inferSelect
export type NewTipoSensor = typeof tiposSensor.$inferInsert
