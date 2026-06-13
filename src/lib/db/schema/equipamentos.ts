import { pgTable, serial, varchar, integer, numeric, text, timestamp } from "drizzle-orm/pg-core"
import { edificacoes } from "./edificacoes"

export const equipamentos = pgTable("equipamentos", {
  id: serial("id").primaryKey(),
  edificacaoId: integer("edificacao_id").notNull().references(() => edificacoes.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 100 }).notNull(),
  descricao: text("descricao"),
  quantidade: integer("quantidade").notNull().default(1),
  valorUnitario: numeric("valor_unitario", { precision: 12, scale: 2 }).notNull().default("0"),
  ativo: varchar("ativo", { length: 1 }).default("S"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Equipamento = typeof equipamentos.$inferSelect
export type NewEquipamento = typeof equipamentos.$inferInsert
