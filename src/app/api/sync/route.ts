import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sensores } from "@/lib/db/schema/sensores"
import { leituras } from "@/lib/db/schema/leituras"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.leituras || !Array.isArray(body.leituras) || body.leituras.length === 0) {
      return NextResponse.json({ error: "campo 'leituras' é obrigatório" }, { status: 400 })
    }

    const uuids = Array.from(new Set(body.leituras.map((l: any) => l.sensor_uuid).filter(Boolean))) as string[]
    if (uuids.length === 0) {
      return NextResponse.json({ error: "nenhuma leitura com sensor_uuid válido" }, { status: 400 })
    }

    const found = await db.select({ uuid: sensores.uuid, id: sensores.id, clienteId: sensores.clienteId })
      .from(sensores)
      .where(eq(sensores.ativo, "S"))
    const sensorMap = new Map(found.map((s) => [s.uuid, { id: s.id, clienteId: s.clienteId }]))

    const results: { sensor_uuid: string; status: string; error?: string }[] = []
    const batch: typeof leituras.$inferInsert[] = []

    for (const leitura of body.leituras) {
      const sensor = sensorMap.get(leitura.sensor_uuid)
      if (!sensor) {
        results.push({ sensor_uuid: leitura.sensor_uuid, status: "erro", error: "sensor não encontrado ou inativo" })
        continue
      }

      batch.push({
        sensorId: sensor.id,
        clienteId: sensor.clienteId,
        valor: String(leitura.valor ?? ""),
        unidade: leitura.unidade ?? null,
        topicoMqtt: leitura.topico_mqtt ?? null,
        metadata: leitura.metadata ?? {},
        lidaEm: leitura.datahora ? new Date(leitura.datahora) : new Date(),
      })

      results.push({ sensor_uuid: leitura.sensor_uuid, status: "ok" })
    }

    if (batch.length > 0) {
      await db.insert(leituras).values(batch)
    }

    return NextResponse.json({ resultados: results, inseridas: batch.length })
  } catch (err) {
    return apiError(err)
  }
}
