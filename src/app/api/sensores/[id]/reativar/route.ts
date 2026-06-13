import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sensores } from "@/lib/db/schema/sensores"
import { getSession } from "@/lib/cliente"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = [eq(sensores.id, Number(params.id))]
    if (!isSuper) conditions.push(eq(sensores.clienteId, clienteId!))
    await db.update(sensores)
      .set({ ativo: "S" })
      .where(and(...conditions))

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
