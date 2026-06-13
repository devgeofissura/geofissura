import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sensores } from "@/lib/db/schema/sensores"
import { getSession } from "@/lib/cliente"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = [eq(sensores.id, Number(params.id))]
    if (!isSuper) conditions.push(eq(sensores.clienteId, clienteId!))
    const dado = await db.query.sensores.findFirst({
      where: and(...conditions),
    })

    if (!dado) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    }

    return NextResponse.json(dado)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const updConditions = [eq(sensores.id, Number(params.id))]
    if (!isSuper) updConditions.push(eq(sensores.clienteId, clienteId!))
    const [atualizado] = await db.update(sensores)
      .set(body)
      .where(and(...updConditions))
      .returning()

    return NextResponse.json(atualizado)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = [eq(sensores.id, Number(params.id))]
    if (!isSuper) conditions.push(eq(sensores.clienteId, clienteId!))

    const force = req.nextUrl.searchParams.get("force") === "true"

    if (force && isSuper) {
      await db.delete(sensores).where(and(...conditions))
    } else {
      await db.update(sensores).set({ ativo: "N" }).where(and(...conditions))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
