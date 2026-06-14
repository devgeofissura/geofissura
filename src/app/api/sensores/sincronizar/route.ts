import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sensores } from "@/lib/db/schema/sensores"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"
import { checkGatewayAuth } from "@/lib/gateway-auth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = checkGatewayAuth(req)
  if (auth) return auth
  try {
    const dados = await db.select({
      id: sensores.id,
      uuid: sensores.uuid,
      tipoSensor: sensores.tipoSensor,
      edificacaoId: sensores.edificacaoId,
    })
      .from(sensores)
      .where(eq(sensores.ativo, "S"))

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}
