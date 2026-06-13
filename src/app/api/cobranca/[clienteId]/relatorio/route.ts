import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { sensores } from "@/lib/db/schema/sensores"
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
        createdAt: sensores.createdAt,
        valorMensal: sensores.valorMensal,
      })
        .from(sensores)
        .where(eq(sensores.edificacaoId, ed.id))
        .orderBy(sensores.nome)

      const planosList = await db.select({
        id: planosDados.id,
        operadora: planosDados.operadora,
        descricao: planosDados.descricao,
        valorMensal: planosDados.valorMensal,
        ativo: planosDados.ativo,
        createdAt: planosDados.createdAt,
      })
        .from(planosDados)
        .where(eq(planosDados.edificacaoId, ed.id))
        .orderBy(planosDados.createdAt)

      const equipList = await db.select({
        id: equipamentos.id,
        tipo: equipamentos.tipo,
        descricao: equipamentos.descricao,
        quantidade: equipamentos.quantidade,
        valorUnitario: equipamentos.valorUnitario,
        ativo: equipamentos.ativo,
      })
        .from(equipamentos)
        .where(eq(equipamentos.edificacaoId, ed.id))
        .orderBy(equipamentos.createdAt)

      const totalSensores = sensoresList.reduce((acc, s) => acc + (parseFloat(s.valorMensal as string) || 0), 0)
      const totalPlanos = planosList.reduce((acc, p) => acc + (parseFloat(p.valorMensal as string) || 0), 0)
      const totalEquipamentos = equipList.reduce((acc, e) => acc + (e.quantidade * (parseFloat(e.valorUnitario as string) || 0)), 0)
      const totalEdificacao = totalSensores + totalPlanos + totalEquipamentos

      return { ...ed, sensores: sensoresList, planosDados: planosList, equipamentos: equipList, totalEdificacao }
    }))

    const totalGeral = result.reduce((acc, ed) => acc + ed.totalEdificacao, 0)

    const totalSensoresAtivos = await db
      .select({ count: sql<number>`count(*)` })
      .from(sensores)
      .innerJoin(edificacoes, eq(edificacoes.id, sensores.edificacaoId))
      .where(sql`${edificacoes.clienteId} = ${clienteId} and ${sensores.ativo} = 'S'`)
      .then(r => r[0]?.count ?? 0)

    return NextResponse.json({
      cliente,
      emitidoEm: new Date().toISOString(),
      edificacoes: result,
      totalGeral,
      totalSensoresAtivos,
    })
  } catch (err) {
    return apiError(err)
  }
}
