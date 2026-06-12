import { pgTable, serial, integer, varchar, boolean, timestamp, text } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"
import { notificacoesRegras } from "./notificacoes-regras"
import { usuarios } from "./usuarios"

export const notificacoes = pgTable("notificacoes", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  regraId: integer("regra_id").references(() => notificacoesRegras.id, { onDelete: "set null" }),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  titulo: varchar("titulo", { length: 300 }).notNull(),
  mensagem: text("mensagem"),
  prioridade: varchar("prioridade", { length: 20 }).default("media"),
  lida: boolean("lida").default(false),
  lidaEm: timestamp("lida_em"),
  createdAt: timestamp("created_at").defaultNow(),
})

export type Notificacao = typeof notificacoes.$inferSelect
export type NewNotificacao = typeof notificacoes.$inferInsert
