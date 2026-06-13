import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tiposSensor } from "@/lib/db/schema/tipos-sensor"
import { getSession } from "@/lib/cliente"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const tipo = await db
      .select()
      .from(tiposSensor)
      .where(eq(tiposSensor.id, Number(params.id)))
      .then((r) => r[0] ?? null)

    if (!tipo) {
      return NextResponse.json({ error: "Tipo não encontrado" }, { status: 404 })
    }

    return NextResponse.json(tipo)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { nome, descricao } = body

    const [atualizado] = await db
      .update(tiposSensor)
      .set({ nome, descricao })
      .where(eq(tiposSensor.id, Number(params.id)))
      .returning()

    if (!atualizado) {
      return NextResponse.json({ error: "Tipo não encontrado" }, { status: 404 })
    }

    return NextResponse.json(atualizado)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    await db
      .delete(tiposSensor)
      .where(eq(tiposSensor.id, Number(params.id)))

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
