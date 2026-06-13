"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Building2, Loader2, Save, FileText, Wifi, WifiOff, Signal, HardDrive } from "lucide-react"
import { toast } from "sonner"

interface SensorPreco {
  id: number
  nome: string
  tipoSensor: string
  ativo: string
  precoId: number | null
  valorMensal: string | null
}

interface PlanoDadosItem {
  id: number
  operadora: string
  descricao: string | null
  valorMensal: string
  ativo: string
}

interface EquipamentoItem {
  id: number
  tipo: string
  descricao: string | null
  quantidade: number
  valorUnitario: string
  ativo: string
}

interface EdificacaoComItems {
  id: number
  nome: string
  endereco: string | null
  sensores: SensorPreco[]
  planosDados: PlanoDadosItem[]
  equipamentos: EquipamentoItem[]
}

interface ClienteData {
  id: number
  nome: string
  slug: string
}

export default function CobrancaClientePage() {
  const params = useParams()
  const router = useRouter()
  const clienteId = params.clienteId as string

  const [cliente, setCliente] = useState<ClienteData | null>(null)
  const [edificacoes, setEdificacoes] = useState<EdificacaoComItems[]>([])
  const [totalSensores, setTotalSensores] = useState("0")
  const [totalPlanos, setTotalPlanos] = useState("0")
  const [totalEquipamentos, setTotalEquipamentos] = useState("0")
  const [totalMensal, setTotalMensal] = useState("0")
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<number, string>>({})

  useEffect(() => {
    fetch(`/api/cobranca/${clienteId}`)
      .then((r) => { if (r.status === 401) throw new Error(); return r.json() })
      .then((data) => {
        setCliente(data.cliente)
        setEdificacoes(data.edificacoes)
        setTotalSensores(data.totalSensores)
        setTotalPlanos(data.totalPlanos)
        setTotalEquipamentos(data.totalEquipamentos)
        setTotalMensal(data.totalMensal)
        const values: Record<number, string> = {}
        for (const ed of data.edificacoes) {
          for (const s of ed.sensores) {
            values[s.id] = s.valorMensal ?? ""
          }
        }
        setEditValues(values)
      })
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false))
  }, [clienteId, router])

  async function handleSave(sensorId: number) {
    setSavingId(sensorId)
    try {
      const res = await fetch("/api/cobranca/precos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sensorId, valorMensal: editValues[sensorId] || "0" }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Erro"); return }
      toast.success("Valor salvo")
      const totalRes = await fetch(`/api/cobranca/${clienteId}`).then(r => r.json())
      setTotalSensores(totalRes.totalSensores)
      setTotalPlanos(totalRes.totalPlanos)
      setTotalEquipamentos(totalRes.totalEquipamentos)
      setTotalMensal(totalRes.totalMensal)
    } catch { toast.error("Erro ao salvar") }
    finally { setSavingId(null) }
  }

  function fmt(v: string | number) {
    return (typeof v === "string" ? parseFloat(v) : v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  function sumPlanos(planos: PlanoDadosItem[]) {
    return planos.filter(p => p.ativo === "S").reduce((a, p) => a + (parseFloat(p.valorMensal) || 0), 0)
  }

  function sumEquipamentos(equips: EquipamentoItem[]) {
    return equips.filter(e => e.ativo === "S").reduce((a, e) => a + e.quantidade * (parseFloat(e.valorUnitario) || 0), 0)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" /></div>
  }

  if (!cliente) {
    return <div className="p-6 text-sm text-[var(--text-secondary)]">Cliente não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cobranca">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{cliente.nome}</h1>
          <p className="text-sm text-[var(--text-secondary)]">Precificação mensal</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">Sensores</p>
          <p className="text-md font-semibold">{fmt(totalSensores)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">Planos</p>
          <p className="text-md font-semibold">{fmt(totalPlanos)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">Equip.</p>
          <p className="text-md font-semibold">{fmt(totalEquipamentos)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">Total</p>
          <p className="text-xl font-bold text-[var(--brand)]">{fmt(totalMensal)}</p>
        </div>
        <Link href={`/cobranca/${clienteId}/relatorio`}>
          <Button variant="outline"><FileText className="mr-1 h-4 w-4" /> Relatório</Button>
        </Link>
      </div>

      {edificacoes.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 text-center text-sm text-[var(--text-secondary)]">
          Nenhuma edificação cadastrada para este cliente
        </div>
      ) : (
        edificacoes.map((ed) => {
          const totalEd = Object.values(editValues).reduce((a, v) => a + (parseFloat(v) || 0), 0)
          const pTotal = sumPlanos(ed.planosDados)
          const eTotal = sumEquipamentos(ed.equipamentos)
          return (
            <div key={ed.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
                <Building2 className="h-5 w-5 text-[var(--brand)]" />
                <div className="flex-1">
                  <p className="font-semibold">{ed.nome}</p>
                  {ed.endereco && <p className="text-xs text-[var(--text-secondary)]">{ed.endereco}</p>}
                </div>
                <span className="text-sm font-semibold text-[var(--brand)]">{fmt(pTotal + eTotal + totalEd)}</span>
              </div>

              {/* Sensores */}
              <div className="divide-y divide-[var(--border)]">
                {ed.sensores.length === 0 ? (
                  <div className="p-4 text-sm text-[var(--text-secondary)] text-center">Nenhum sensor</div>
                ) : (
                  ed.sensores.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {s.ativo === "S" ? (
                          <Wifi className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.nome}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{s.tipoSensor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValues[s.id] ?? ""}
                          onChange={(e) => setEditValues((v) => ({ ...v, [s.id]: e.target.value }))}
                          className="w-24 pl-2 text-sm"
                          placeholder="0,00"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSave(s.id)}
                          disabled={savingId === s.id}
                        >
                          {savingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Planos de Dados */}
              {ed.planosDados.length > 0 && (
                <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)]/20 px-5 py-2">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Planos de Dados</p>
                  {ed.planosDados.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <Signal className={`h-3 w-3 ${p.ativo === "S" ? "text-green-500" : "text-red-400"}`} />
                        <span className="text-xs">{p.operadora}{p.descricao ? ` — ${p.descricao}` : ""}</span>
                      </div>
                      <span className="text-xs font-medium">{fmt(p.valorMensal)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Equipamentos */}
              {ed.equipamentos.length > 0 && (
                <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)]/20 px-5 py-2">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Equipamentos</p>
                  {ed.equipamentos.map((e) => {
                    const total = e.quantidade * (parseFloat(e.valorUnitario) || 0)
                    return (
                      <div key={e.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <HardDrive className={`h-3 w-3 ${e.ativo === "S" ? "text-green-500" : "text-red-400"}`} />
                          <span className="text-xs">{e.tipo} {e.descricao ? `— ${e.descricao}` : ""} ({e.quantidade}x)</span>
                        </div>
                        <span className="text-xs font-medium">{fmt(total)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
