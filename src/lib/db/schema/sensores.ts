import { pgTable, serial, varchar, integer, timestamp, text, jsonb, numeric } from "drizzle-orm/pg-core"
import { clientes } from "./clientes"
import { edificacoes } from "./edificacoes"

export const sensores = pgTable("sensores", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  edificacaoId: integer("edificacao_id").notNull().references(() => edificacoes.id, { onDelete: "cascade" }),
  tipoSensor: varchar("tipo_sensor", { length: 50 }).notNull(),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: text("descricao"),
  modelo: varchar("modelo", { length: 200 }),
  unidade: varchar("unidade", { length: 50 }),
  fabricante: varchar("fabricante", { length: 200 }),
  valorMensal: numeric("valor_mensal", { precision: 12, scale: 2 }).notNull().default("0"),
  dados: jsonb("dados").notNull().default({}),
  ativo: varchar("ativo", { length: 1 }).default("S"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Sensor = typeof sensores.$inferSelect
export type NewSensor = typeof sensores.$inferInsert
