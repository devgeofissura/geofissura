import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { entidadesDaEdificacao } from "@/lib/db/schema/entidades-da-edificacao"
import { getSession } from "@/lib/tenant"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const { session, tenantId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = []
    if (!isSuper) conditions.push(eq(entidadesDaEdificacao.tenantId, tenantId!))
    const dados = await db.select().from(entidadesDaEdificacao).where(and(...conditions))

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
    const [novo] = await db.insert(entidadesDaEdificacao)
      .values({ ...body, tenantId: session.user.tenantId })
      .returning()

    return NextResponse.json(novo, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
