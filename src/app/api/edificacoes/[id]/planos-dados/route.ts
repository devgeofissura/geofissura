import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { planosDados } from "@/lib/db/schema/planos-dados"
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
      .from(planosDados)
      .where(eq(planosDados.edificacaoId, id))
      .orderBy(planosDados.createdAt)
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
    if (!body.operadora) return NextResponse.json({ error: "Operadora é obrigatória" }, { status: 400 })

    const [plano] = await db.insert(planosDados).values({
      edificacaoId: id,
      operadora: body.operadora,
      descricao: body.descricao || null,
      valorMensal: String(body.valorMensal ?? 0),
    }).returning()
    return NextResponse.json(plano)
  } catch (err) { return apiError(err) }
}
