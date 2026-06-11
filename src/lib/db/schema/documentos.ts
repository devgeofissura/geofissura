import { pgTable, serial, varchar, integer, timestamp, text } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"
import { edificacoes } from "./edificacoes"
import { usuarios } from "./usuarios"

export const documentos = pgTable("documentos", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  edificacaoId: integer("edificacao_id").notNull().references(() => edificacoes.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 1000 }).notNull(),
  descricao: text("descricao").notNull(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
})

export type Documento = typeof documentos.$inferSelect
export type NewDocumento = typeof documentos.$inferInsert
