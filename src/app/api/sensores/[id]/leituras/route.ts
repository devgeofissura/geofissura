import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leituras } from "@/lib/db/schema/leituras"
import { getSession } from "@/lib/cliente"
import { eq, and, desc } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = [eq(leituras.sensorId, Number(params.id))]
    if (!isSuper) conditions.push(eq(leituras.clienteId, clienteId!))

    const rows = await db.select()
      .from(leituras)
      .where(and(...conditions))
      .orderBy(desc(leituras.lidaEm))
      .limit(50)

    return NextResponse.json(rows)
  } catch (err) {
    return apiError(err)
  }
}
