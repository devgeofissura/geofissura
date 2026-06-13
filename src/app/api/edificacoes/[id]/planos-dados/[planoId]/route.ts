import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { planosDados } from "@/lib/db/schema/planos-dados"
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

export async function PUT(req: NextRequest, { params }: { params: { id: string; planoId: string } }) {
  try {
    if (!await authorize(Number(params.id)))
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()
    const [plano] = await db.update(planosDados)
      .set({
        operadora: body.operadora,
        descricao: body.descricao ?? null,
        valorMensal: String(body.valorMensal ?? 0),
        ativo: body.ativo ?? "S",
        updatedAt: new Date(),
      })
      .where(eq(planosDados.id, Number(params.planoId)))
      .returning()
    if (!plano) return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 })
    return NextResponse.json(plano)
  } catch (err) { return apiError(err) }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; planoId: string } }) {
  try {
    if (!await authorize(Number(params.id)))
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const [plano] = await db.delete(planosDados)
      .where(eq(planosDados.id, Number(params.planoId)))
      .returning()
    if (!plano) return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) { return apiError(err) }
}
