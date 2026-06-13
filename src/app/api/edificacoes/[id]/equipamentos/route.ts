import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { equipamentos } from "@/lib/db/schema/equipamentos"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { getSession } from "@/lib/cliente"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = Number(params.id)
    const cond = [eq(edificacoes.id, id)]
    if (!isSuper) cond.push(eq(edificacoes.clienteId, clienteId!))
    const exists = await db.query.edificacoes.findFirst({ where: and(...cond) })
    if (!exists) return NextResponse.json({ error: "Edificação não encontrada" }, { status: 404 })

    const list = await db.select()
      .from(equipamentos)
      .where(eq(equipamentos.edificacaoId, id))
      .orderBy(equipamentos.createdAt)
    return NextResponse.json(list)
  } catch (err) { return apiError(err) }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = Number(params.id)
    const cond = [eq(edificacoes.id, id)]
    if (!isSuper) cond.push(eq(edificacoes.clienteId, clienteId!))
    const exists = await db.query.edificacoes.findFirst({ where: and(...cond) })
    if (!exists) return NextResponse.json({ error: "Edificação não encontrada" }, { status: 404 })

    const body = await req.json()
    if (!body.tipo) return NextResponse.json({ error: "Tipo é obrigatório" }, { status: 400 })

    const [eqp] = await db.insert(equipamentos).values({
      edificacaoId: id,
      tipo: body.tipo,
      descricao: body.descricao || null,
      quantidade: Number(body.quantidade) || 1,
      valorUnitario: String(body.valorUnitario ?? 0),
    }).returning()
    return NextResponse.json(eqp)
  } catch (err) { return apiError(err) }
}
