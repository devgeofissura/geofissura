"use client"

import { useRouter } from "next/navigation"
import { Check } from "lucide-react"

function formatarData(d: Date | string) {
  const date = new Date(d)
  return date.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

interface Notificacao {
  id: number
  titulo: string
  mensagem: string | null
  prioridade: string | null
  lida: boolean | null
  createdAt: Date | string | null
}

export function NotificacaoList({ data }: { data: Notificacao[] }) {
  const router = useRouter()

  async function marcarLida(id: number) {
    await fetch(`/api/notificacoes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lida: true }),
    })
    router.refresh()
  }

  const prioridadeCores: Record<string, string> = {
    alta: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    media: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    baixa: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  }

  function isLida(n: Notificacao) { return n.lida === true }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-12 text-center shadow-sm">
        <p className="text-sm text-[var(--text-secondary)]">Nenhuma notificação</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.map((n) => (
        <div
          key={n.id}
          className={`rounded-xl border shadow-sm transition-colors ${
            isLida(n)
              ? "border-[var(--border)] bg-[var(--bg-primary)]"
              : "border-[var(--brand)]/30 bg-[var(--brand)]/5"
          }`}
        >
          <div className="flex items-start justify-between gap-4 p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {!isLida(n) && (
                  <span className="h-2 w-2 rounded-full bg-[var(--brand)] flex-shrink-0" />
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prioridadeCores[n.prioridade ?? "media"]}`}>
                  {n.prioridade ?? "media"}
                </span>
              </div>
              <p className="font-medium text-sm">{n.titulo}</p>
              {n.mensagem && (
                <p className="text-sm text-[var(--text-secondary)] mt-1">{n.mensagem}</p>
              )}
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                {n.createdAt ? formatarData(n.createdAt) : "-"}
              </p>
            </div>
            {!isLida(n) && (
              <button
                onClick={() => marcarLida(n.id)}
                className="flex items-center gap-1 text-xs text-[var(--brand)] hover:underline whitespace-nowrap"
              >
                <Check className="h-3 w-3" />
                Marcar lida
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
