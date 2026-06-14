import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tiposEquipamento } from "@/lib/db/schema/tipos-equipamento"
import { getSession } from "@/lib/cliente"
import { desc } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const { session } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const dados = await db
      .select()
      .from(tiposEquipamento)
      .orderBy(desc(tiposEquipamento.createdAt))

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { nome, descricao } = body

    if (!nome) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const [novo] = await db
      .insert(tiposEquipamento)
      .values({ nome, descricao })
      .returning()

    return NextResponse.json(novo, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
