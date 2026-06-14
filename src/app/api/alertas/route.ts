import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sensores } from "@/lib/db/schema/sensores"
import { usuarios } from "@/lib/db/schema/usuarios"
import { notificacoes } from "@/lib/db/schema/notificacoes"
import { eq, and, inArray } from "drizzle-orm"
import { apiError } from "@/lib/api-error"
import { checkGatewayAuth } from "@/lib/gateway-auth"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const auth = checkGatewayAuth(req)
  if (auth) return auth

  try {
    const body = await req.json()
    const { sensor_uuid, tipo, mensagem, valor, unidade, limite, datahora } = body

    if (!sensor_uuid || !tipo || !mensagem) {
      return NextResponse.json({ error: "campos obrigatórios: sensor_uuid, tipo, mensagem" }, { status: 400 })
    }

    const sensor = await db.query.sensores.findFirst({
      where: eq(sensores.uuid, sensor_uuid),
      columns: { id: true, clienteId: true, nome: true, tipoSensor: true },
    })

    if (!sensor) {
      return NextResponse.json({ error: "Sensor não encontrado" }, { status: 404 })
    }

    const admins = await db.select({ id: usuarios.id })
      .from(usuarios)
      .where(and(
        eq(usuarios.clienteId, sensor.clienteId),
        inArray(usuarios.role, ["SUPER", "ADMIN"]),
      ))
      .limit(5)

    const titulo = `Alerta: ${sensor.nome} — ${tipo}`
    const detalhes = [
      mensagem,
      valor ? `Valor: ${valor} ${unidade ?? ""}` : null,
      limite ? `Limite: ${limite} ${unidade ?? ""}` : null,
      datahora ? `Data: ${new Date(datahora).toLocaleString("pt-BR")}` : null,
    ].filter(Boolean).join("\n")

    const notificacoesData = admins.map((u) => ({
      clienteId: sensor.clienteId,
      usuarioId: u.id,
      titulo,
      mensagem: detalhes,
      prioridade: "alta",
    }))

    const [notificacao] = notificacoesData.length > 0
      ? await db.insert(notificacoes).values(notificacoesData).returning({ id: notificacoes.id })
      : [{ id: null }]

    return NextResponse.json({
      alerta_id: notificacao?.id,
      status: "registrado",
      notificacoes_criadas: notificacoesData.length,
    })
  } catch (err) {
    return apiError(err)
  }
}
