import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sensores } from "@/lib/db/schema/sensores"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const uuid = req.nextUrl.searchParams.get("uuid")
    if (!uuid) {
      return NextResponse.json({ error: "uuid é obrigatório" }, { status: 400 })
    }

    const sensor = await db.query.sensores.findFirst({
      where: eq(sensores.uuid, uuid),
      columns: { id: true, uuid: true, nome: true, tipoSensor: true },
    })

    if (!sensor) {
      return NextResponse.json({ error: "Sensor não encontrado" }, { status: 404 })
    }

    return NextResponse.json(sensor)
  } catch (err) {
    console.error("Erro ao resolver UUID:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
