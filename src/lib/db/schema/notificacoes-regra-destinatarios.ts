import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core"
import { notificacoesRegras } from "./notificacoes-regras"
import { usuarios } from "./usuarios"

export const notificacoesRegraDestinatarios = pgTable("notificacoes_regra_destinatarios", {
  id: serial("id").primaryKey(),
  regraId: integer("regra_id").notNull().references(() => notificacoesRegras.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 20 }).notNull().default("usuario"),
  usuarioId: integer("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
  email: varchar("email", { length: 255 }),
  emailAtivo: boolean("email_ativo").default(true),
  pushAtivo: boolean("push_ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

export type NotificacaoRegraDestinatario = typeof notificacoesRegraDestinatarios.$inferSelect
export type NewNotificacaoRegraDestinatario = typeof notificacoesRegraDestinatarios.$inferInsert
