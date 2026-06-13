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

export async function GET(_req: Request, { params }: { params: { clienteId: string } }) {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const clienteId = Number(params.clienteId)

    const cliente = await db.select().from(clientes).where(eq(clientes.id, clienteId)).then(r => r[0] ?? null)
    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const edificios = await db.select().from(edificacoes).where(eq(edificacoes.clienteId, clienteId)).orderBy(edificacoes.nome)

    const result = await Promise.all(edificios.map(async (ed) => {
      const sensoresList = await db.select({
        id: sensores.id,
        nome: sensores.nome,
        tipoSensor: sensores.tipoSensor,
        ativo: sensores.ativo,
        precoId: precosSensor.id,
        valorMensal: precosSensor.valorMensal,
      })
        .from(sensores)
        .leftJoin(precosSensor, eq(precosSensor.sensorId, sensores.id))
        .where(eq(sensores.edificacaoId, ed.id))
        .orderBy(sensores.nome)

      const planosList = await db.select()
        .from(planosDados)
        .where(eq(planosDados.edificacaoId, ed.id))
        .orderBy(planosDados.createdAt)

      const equipList = await db.select()
        .from(equipamentos)
        .where(eq(equipamentos.edificacaoId, ed.id))
        .orderBy(equipamentos.createdAt)

      return { ...ed, sensores: sensoresList, planosDados: planosList, equipamentos: equipList }
    }))

    const totalSensores = await db.select({
      total: sql<string>`coalesce(sum(${precosSensor.valorMensal}), 0)`,
    })
      .from(precosSensor)
      .innerJoin(sensores, eq(sensores.id, precosSensor.sensorId))
      .innerJoin(edificacoes, eq(edificacoes.id, sensores.edificacaoId))
      .where(eq(edificacoes.clienteId, clienteId))
      .then(r => r[0]?.total ?? "0")

    const totalPlanos = await db.select({
      total: sql<string>`coalesce(sum(${planosDados.valorMensal}), 0)`,
    })
      .from(planosDados)
      .innerJoin(edificacoes, eq(edificacoes.id, planosDados.edificacaoId))
      .where(sql`${edificacoes.clienteId} = ${clienteId} and ${planosDados.ativo} = 'S'`)
      .then(r => r[0]?.total ?? "0")

    const totalEquipamentos = await db.select({
      total: sql<string>`coalesce(sum(${equipamentos.quantidade} * ${equipamentos.valorUnitario}), 0)`,
    })
      .from(equipamentos)
      .innerJoin(edificacoes, eq(edificacoes.id, equipamentos.edificacaoId))
      .where(sql`${edificacoes.clienteId} = ${clienteId} and ${equipamentos.ativo} = 'S'`)
      .then(r => r[0]?.total ?? "0")

    const totalMensal = (parseFloat(totalSensores) + parseFloat(totalPlanos) + parseFloat(totalEquipamentos)).toFixed(2)

    return NextResponse.json({
      cliente,
      edificacoes: result,
      totalSensores,
      totalPlanos,
      totalEquipamentos,
      totalMensal,
    })
  } catch (err) {
    return apiError(err)
  }
}
