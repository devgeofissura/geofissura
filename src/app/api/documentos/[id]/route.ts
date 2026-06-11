import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { documentos } from "@/lib/db/schema/documentos"
import { getSession } from "@/lib/tenant"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, tenantId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const delConditions = [eq(documentos.id, Number(params.id))]
    if (!isSuper) delConditions.push(eq(documentos.tenantId, tenantId!))

    await db.delete(documentos).where(and(...delConditions))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
