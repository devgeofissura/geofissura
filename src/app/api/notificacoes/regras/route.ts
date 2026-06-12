import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notificacoesRegras } from "@/lib/db/schema/notificacoes-regras"
import { notificacoesRegraDestinatarios } from "@/lib/db/schema/notificacoes-regra-destinatarios"
import { getSession } from "@/lib/tenant"
import { eq, and, desc } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const { session, tenantId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = isSuper ? [] : [eq(notificacoesRegras.tenantId, tenantId!)]
    const dados = await db
      .select()
      .from(notificacoesRegras)
      .where(and(...conditions))
      .orderBy(desc(notificacoesRegras.createdAt))

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, tenantId } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { nome, descricao, sensorTipo, condicao, valorMin, valorMax, prioridade } = body

    const [nova] = await db
      .insert(notificacoesRegras)
      .values({
        tenantId: tenantId!,
        nome,
        descricao,
        sensorTipo,
        condicao,
        valorMin,
        valorMax,
        prioridade,
      })
      .returning()

    return NextResponse.json(nova, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
