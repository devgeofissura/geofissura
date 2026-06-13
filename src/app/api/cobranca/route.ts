import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { sensores } from "@/lib/db/schema/sensores"
import { precosSensor } from "@/lib/db/schema/precos-sensor"
import { planosDados } from "@/lib/db/schema/planos-dados"
import { equipamentos } from "@/lib/db/schema/equipamentos"
import { getSession } from "@/lib/cliente"
import { eq, sql } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const dados = await db.select({
      id: clientes.id,
      nome: clientes.nome,
      slug: clientes.slug,
      totalSensores: sql<number>`count(distinct ${sensores.id})`,
      sensoresAtivos: sql<number>`count(distinct case when ${sensores.ativo} = 'S' then ${sensores.id} end)`,
      totalSensoresValor: sql<string>`coalesce(sum(${precosSensor.valorMensal}), 0)`,
    })
      .from(clientes)
      .leftJoin(edificacoes, eq(edificacoes.clienteId, clientes.id))
      .leftJoin(sensores, eq(sensores.edificacaoId, edificacoes.id))
      .leftJoin(precosSensor, eq(precosSensor.sensorId, sensores.id))
      .groupBy(clientes.id)
      .orderBy(clientes.nome)

    const enriched = await Promise.all(dados.map(async (c) => {
      const totalPlanos = await db.select({
        total: sql<string>`coalesce(sum(${planosDados.valorMensal}), 0)`,
      })
        .from(planosDados)
        .innerJoin(edificacoes, eq(edificacoes.id, planosDados.edificacaoId))
        .where(sql`${edificacoes.clienteId} = ${c.id} and ${planosDados.ativo} = 'S'`)
        .then(r => r[0]?.total ?? "0")

      const equipRows = await db.select({
        total: sql<string>`coalesce(sum(${equipamentos.quantidade} * ${equipamentos.valorUnitario}), 0)`,
      })
        .from(equipamentos)
        .innerJoin(edificacoes, eq(edificacoes.id, equipamentos.edificacaoId))
        .where(sql`${edificacoes.clienteId} = ${c.id} and ${equipamentos.ativo} = 'S'`)
        .then(r => r[0]?.total ?? "0")

      return {
        ...c,
        totalPlanos,
        totalEquipamentos: equipRows,
        totalMensal: (parseFloat(c.totalSensoresValor) + parseFloat(totalPlanos) + parseFloat(equipRows)).toFixed(2),
      }
    }))

    return NextResponse.json(enriched)
  } catch (err) {
    return apiError(err)
  }
}
