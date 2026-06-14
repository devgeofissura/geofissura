import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core"

export const tiposEquipamento = pgTable("tipos_equipamento", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull().unique(),
  descricao: text("descricao"),
  createdAt: timestamp("created_at").defaultNow(),
})

export type TipoEquipamento = typeof tiposEquipamento.$inferSelect
export type NewTipoEquipamento = typeof tiposEquipamento.$inferInsert
