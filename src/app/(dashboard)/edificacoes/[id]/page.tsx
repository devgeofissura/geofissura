import { getSession } from "@/lib/tenant"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { entidadesDaEdificacao } from "@/lib/db/schema/entidades-da-edificacao"
import { eq, and } from "drizzle-orm"
import { notFound } from "next/navigation"

interface Props {
  params: { id: string }
}

export default async function EdificacaoDetalhePage({ params }: Props) {
  const { session, tenantId, isSuper } = await getSession()
  if (!session) {
    return <p>Não autorizado</p>
  }

  const conditions1 = [eq(edificacoes.id, Number(params.id))]
  if (!isSuper) conditions1.push(eq(edificacoes.tenantId, tenantId!))
  const edificacao = await db.query.edificacoes.findFirst({
    where: and(...conditions1),
  })

  if (!edificacao) notFound()

  const conditions2 = [eq(entidadesDaEdificacao.edificacaoId, edificacao.id)]
  if (!isSuper) conditions2.push(eq(entidadesDaEdificacao.tenantId, tenantId!))
  const entidades = await db.select()
    .from(entidadesDaEdificacao)
    .where(and(...conditions2))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{edificacao.nome}</h1>
        {edificacao.endereco && (
          <p className="text-sm text-[var(--text-secondary)]">{edificacao.endereco}</p>
        )}
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Entidades Vinculadas</h2>
        {entidades.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Nenhuma entidade vinculada a esta edificação
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {entidades.map((ent) => (
              <div
                key={ent.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                    {ent.tipoEntidade}
                  </span>
                </div>
                <p className="font-medium">{ent.nome}</p>
                {ent.descricao && (
                  <p className="text-sm text-[var(--text-secondary)]">{ent.descricao}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
