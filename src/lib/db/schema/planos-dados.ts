import { pgTable, serial, varchar, integer, numeric, text, timestamp } from "drizzle-orm/pg-core"
import { edificacoes } from "./edificacoes"

export const planosDados = pgTable("planos_dados", {
  id: serial("id").primaryKey(),
  edificacaoId: integer("edificacao_id").notNull().references(() => edificacoes.id, { onDelete: "cascade" }),
  operadora: varchar("operadora", { length: 100 }).notNull(),
  descricao: text("descricao"),
  valorMensal: numeric("valor_mensal", { precision: 12, scale: 2 }).notNull().default("0"),
  ativo: varchar("ativo", { length: 1 }).default("S"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type PlanoDados = typeof planosDados.$inferSelect
export type NewPlanoDados = typeof planosDados.$inferInsert
