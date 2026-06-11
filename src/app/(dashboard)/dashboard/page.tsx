import { getSession } from "@/lib/tenant"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { leituras } from "@/lib/db/schema/leituras"
import { eq, and } from "drizzle-orm"

export default async function DashboardPage() {
  const { session, tenantId, isSuper } = await getSession()
  if (!session) {
    return <p>Não autorizado</p>
  }

  const conditions1 = []
  if (!isSuper) conditions1.push(eq(edificacoes.tenantId, tenantId!))
  const totalEdificacoes = await db.select({ count: edificacoes.id })
    .from(edificacoes)
    .where(and(...conditions1))

  const conditions2 = []
  if (!isSuper) conditions2.push(eq(leituras.tenantId, tenantId!))
  const ultimasLeituras = await db.select()
    .from(leituras)
    .where(and(...conditions2))
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Bem-vindo ao GeoFissura
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm">
          <p className="text-sm text-[var(--text-secondary)]">Edificações</p>
          <p className="text-3xl font-bold">{totalEdificacoes[0]?.count ?? 0}</p>
        </div>
      </div>
    </div>
  )
}
