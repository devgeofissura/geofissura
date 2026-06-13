import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { equipamentos } from "@/lib/db/schema/equipamentos"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { getSession } from "@/lib/cliente"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

async function authorize(id: number) {
  const { session, clienteId, isSuper } = await getSession()
  if (!session) return null
  const cond = [eq(edificacoes.id, id)]
  if (!isSuper) cond.push(eq(edificacoes.clienteId, clienteId!))
  return (await db.query.edificacoes.findFirst({ where: and(...cond) })) ?? null
}

export async function PUT(req: NextRequest, { params }: { params: { id: string; equipId: string } }) {
  try {
    if (!await authorize(Number(params.id)))
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()
    const [eqp] = await db.update(equipamentos)
      .set({
        tipo: body.tipo,
        descricao: body.descricao ?? null,
        quantidade: Number(body.quantidade) || 1,
        valorUnitario: String(body.valorUnitario ?? 0),
        ativo: body.ativo ?? "S",
        updatedAt: new Date(),
      })
      .where(eq(equipamentos.id, Number(params.equipId)))
      .returning()
    if (!eqp) return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    return NextResponse.json(eqp)
  } catch (err) { return apiError(err) }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; equipId: string } }) {
  try {
    if (!await authorize(Number(params.id)))
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const [eqp] = await db.delete(equipamentos)
      .where(eq(equipamentos.id, Number(params.equipId)))
      .returning()
    if (!eqp) return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) { return apiError(err) }
}
