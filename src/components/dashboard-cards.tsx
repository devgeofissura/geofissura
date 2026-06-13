"use client"

import { useState } from "react"
import { Building2, Cpu, Activity, AlertTriangle, ExternalLink } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import Link from "next/link"

interface CardConfig {
  label: string
  icon: any
  color: string
  apiPath: string
  basePath: string
  labelKey: string
  hasDetail: boolean
}

const cardsConfig: CardConfig[] = [
  { label: "Edificações", icon: Building2, color: "text-emerald-500", apiPath: "/api/edificacoes", basePath: "/edificacoes", labelKey: "nome", hasDetail: true },
  { label: "Sensores", icon: Cpu, color: "text-blue-500", apiPath: "/api/sensores", basePath: "/sensores", labelKey: "nome", hasDetail: true },
  { label: "Leituras", icon: Activity, color: "text-violet-500", apiPath: "/api/leituras", basePath: "/leituras", labelKey: "topicoMqtt", hasDetail: false },
  { label: "Alertas", icon: AlertTriangle, color: "text-amber-500", apiPath: "/api/notificacoes", basePath: "/notificacoes", labelKey: "titulo", hasDetail: false },
]

export function DashboardCards({ counts }: { counts: Record<string, number> }) {
  const [loadingCard, setLoadingCard] = useState<string | null>(null)
  const [modal, setModal] = useState<{ title: string; items: any[]; basePath: string; labelKey: string; hasDetail: boolean } | null>(null)

  async function handleCardClick(card: CardConfig) {
    setLoadingCard(card.label)
    try {
      const res = await fetch(card.apiPath)
      const items = await res.json()
      const list = Array.isArray(items) ? items.slice(0, 50) : []
      setModal({ title: card.label, items: list, basePath: card.basePath, labelKey: card.labelKey, hasDetail: card.hasDetail })
    } catch {
      setModal({ title: card.label, items: [], basePath: card.basePath, labelKey: card.labelKey, hasDetail: card.hasDetail })
    } finally {
      setLoadingCard(null)
    }
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cardsConfig.map((card) => {
          const Icon = card.icon
          const count = counts[card.label] ?? 0
          return (
            <button
              key={card.label}
              onClick={() => handleCardClick(card)}
              disabled={loadingCard !== null}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm text-left transition-colors hover:bg-[var(--bg-secondary)] cursor-pointer disabled:opacity-70"
            >
              <div className="flex items-center gap-3">
                <div className={card.color}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
                  <p className="text-3xl font-bold">{count}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
      >
        {modal && (
          <div className="space-y-2">
            <Link
              href={modal.basePath}
              onClick={() => setModal(null)}
              className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] p-2 text-xs text-[var(--brand)] hover:bg-[var(--bg-secondary)] transition-colors mb-3"
            >
              <ExternalLink className="h-3 w-3" />
              Ver todos na página de {modal.title.toLowerCase()}
            </Link>
            {modal.items.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Nenhum item encontrado</p>
            ) : (
              modal.items.map((item: any) => {
                const label = item[modal.labelKey] ?? item.nome ?? `#${item.id}`
                const content = (
                  <div className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-sm transition-colors">
                    <span className="truncate">{label}</span>
                    {modal.hasDetail && <ExternalLink className="h-3 w-3 shrink-0 text-[var(--text-secondary)] ml-2" />}
                  </div>
                )
                return modal.hasDetail ? (
                  <Link
                    key={item.id}
                    href={`${modal.basePath}/${item.id}`}
                    onClick={() => setModal(null)}
                    className="block hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={item.id} className="block rounded-lg">
                    {content}
                  </div>
                )
              })
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
