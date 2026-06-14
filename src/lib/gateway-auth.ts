import { NextRequest, NextResponse } from "next/server"

export function checkGatewayAuth(req: NextRequest): NextResponse | null {
  const apiKey = process.env.GATEWAY_API_KEY
  if (!apiKey) return null

  const header = req.headers.get("x-api-key")
  if (header !== apiKey) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  return null
}
