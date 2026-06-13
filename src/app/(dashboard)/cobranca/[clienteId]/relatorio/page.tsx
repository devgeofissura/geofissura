"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2, Loader2, Printer, Wifi, WifiOff, Signal, HardDrive } from "lucide-react"

interface SensorReport {
  id: number
  nome: string
  tipoSensor: string
  ativo: string
  createdAt: string | null
  valorMensal: string | null
}

interface PlanoReport {
  id: number
  operadora: string
  descricao: string | null
  valorMensal: string
  ativo: string
  createdAt: string | null
}

interface EquipamentoReport {
  id: number
  tipo: string
  descricao: string | null
  quantidade: number
  valorUnitario: string
  ativo: string
}

interface EdificacaoReport {
  id: number
  nome: string
  endereco: string | null
  sensores: SensorReport[]
  planosDados: PlanoReport[]
  equipamentos: EquipamentoReport[]
  totalEdificacao: number
}

interface ReportData {
  cliente: { id: number; nome: string; slug: string }
  emitidoEm: string
  edificacoes: EdificacaoReport[]
  totalGeral: number
  totalSensoresAtivos: number
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function RelatorioCobrancaPage() {
  const params = useParams()
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const clienteId = params.clienteId as string

  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/cobranca/${clienteId}/relatorio`)
      .then((r) => { if (r.status === 401) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false))
  }, [clienteId, router])

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" /></div>
  }

  if (!data) {
    return <div className="p-6 text-sm text-[var(--text-secondary)]">Relatório não disponível</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 print:hidden">
        <Link href={`/cobranca/${clienteId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Relatório de Cobrança</h1>
          <p className="text-sm text-[var(--text-secondary)]">{data.cliente.nome}</p>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </div>

      <div ref={printRef} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm p-8 space-y-8">
        {/* Cabeçalho */}
        <div className="text-center border-b border-[var(--border)] pb-6">
          <h2 className="text-xl font-bold">GeoFissura</h2>
          <p className="text-sm text-[var(--text-secondary)]">Relatório Mensal de Cobrança</p>
          <div className="mt-4">
            <p className="text-lg font-semibold">{data.cliente.nome}</p>
            <p className="text-sm text-[var(--text-secondary)]">Emitido em {formatDate(data.emitidoEm)}</p>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-[var(--bg-secondary)] p-4 text-center">
            <p className="text-2xl font-bold text-[var(--brand)]">{formatCurrency(data.totalGeral)}</p>
            <p className="text-xs text-[var(--text-secondary)]">Total Mensal</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-secondary)] p-4 text-center">
            <p className="text-2xl font-bold">{data.edificacoes.length}</p>
            <p className="text-xs text-[var(--text-secondary)]">Edificações</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-secondary)] p-4 text-center">
            <p className="text-2xl font-bold">{data.totalSensoresAtivos}</p>
            <p className="text-xs text-[var(--text-secondary)]">Sensores Ativos</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-secondary)] p-4 text-center">
            <p className="text-2xl font-bold">
              {data.edificacoes.reduce((a, e) => a + e.equipamentos.filter(eq => eq.ativo === "S").length, 0)}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">Equipamentos</p>
          </div>
        </div>

        {/* Edificações */}
        {data.edificacoes.map((ed) => (
          <div key={ed.id} className="space-y-2">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
              <Building2 className="h-4 w-4 text-[var(--brand)]" />
              <p className="font-semibold">{ed.nome}</p>
              {ed.endereco && <span className="text-xs text-[var(--text-secondary)]">— {ed.endereco}</span>}
            </div>

            {/* Sensores */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-secondary)]">
                  <th className="pb-2 font-medium">Sensor</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Valor Mensal</th>
                </tr>
              </thead>
              <tbody>
                {ed.sensores.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border)]/50">
                    <td className="py-2">{s.nome}</td>
                    <td className="py-2 text-[var(--text-secondary)]">{s.tipoSensor}</td>
                    <td className="py-2">
                      {s.ativo === "S" ? (
                        <span className="flex items-center gap-1 text-green-600"><Wifi className="h-3 w-3" />Ativo</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400"><WifiOff className="h-3 w-3" />Inativo</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {parseFloat(s.valorMensal as string) > 0
                        ? formatCurrency(parseFloat(s.valorMensal as string))
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Planos de Dados */}
            {ed.planosDados.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                  <Signal className="h-3 w-3" /> Planos de Dados
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-secondary)]">
                      <th className="pb-1 font-medium">Operadora</th>
                      <th className="pb-1 font-medium">Descrição</th>
                      <th className="pb-1 font-medium text-right">Valor Mensal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ed.planosDados.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--border)]/50">
                        <td className="py-1">{p.operadora}</td>
                        <td className="py-1 text-[var(--text-secondary)]">{p.descricao ?? "—"}</td>
                        <td className="py-1 text-right font-medium">
                          {p.ativo === "S" ? formatCurrency(parseFloat(p.valorMensal)) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Equipamentos */}
            {ed.equipamentos.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                  <HardDrive className="h-3 w-3" /> Equipamentos
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-secondary)]">
                      <th className="pb-1 font-medium">Tipo</th>
                      <th className="pb-1 font-medium">Descrição</th>
                      <th className="pb-1 font-medium text-right">Qtd</th>
                      <th className="pb-1 font-medium text-right">Valor Unit.</th>
                      <th className="pb-1 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ed.equipamentos.map((e) => {
                      const total = e.quantidade * (parseFloat(e.valorUnitario) || 0)
                      return (
                        <tr key={e.id} className="border-b border-[var(--border)]/50">
                          <td className="py-1">{e.tipo}</td>
                          <td className="py-1 text-[var(--text-secondary)]">{e.descricao ?? "—"}</td>
                          <td className="py-1 text-right">{e.ativo === "S" ? e.quantidade : "—"}</td>
                          <td className="py-1 text-right">
                            {e.ativo === "S" ? formatCurrency(parseFloat(e.valorUnitario)) : "—"}
                          </td>
                          <td className="py-1 text-right font-medium">
                            {e.ativo === "S" ? formatCurrency(total) : "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total da edificação */}
            <div className="text-right font-semibold pt-2 border-t border-[var(--border)]">
              <span className="text-sm">Total da edificação: </span>
              <span className="text-[var(--brand)]">{formatCurrency(ed.totalEdificacao)}</span>
            </div>
          </div>
        ))}

        {/* Total geral */}
        <div className="border-t border-[var(--border)] pt-4 flex justify-between items-center">
          <p className="text-lg font-bold">Total Geral Mensal</p>
          <p className="text-2xl font-bold text-[var(--brand)]">{formatCurrency(data.totalGeral)}</p>
        </div>

        <div className="text-xs text-[var(--text-secondary)] text-center pt-4 border-t border-[var(--border)]">
          GeoFissura — Sistema de Monitoramento de Estruturas<br />
          Este relatório é gerado automaticamente e serve como referência de cobrança.
        </div>
      </div>
    </div>
  )
}
