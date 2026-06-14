"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Pencil, Cpu, Building2, User, Calendar, Ruler, Hash, Package, Factory, DollarSign, AlertTriangle, Trash2, Loader2, Fingerprint } from "lucide-react"
import { SensorReadingsChart } from "./sensor-chart"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

export default function SensorDetalhePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [sensor, setSensor] = useState<any>(null)
  const [edificacao, setEdificacao] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [leituras, setLeituras] = useState<any[]>([])
  const [loadingAction, setLoadingAction] = useState(false)

  const role = (session?.user as any)?.role ?? ""
  const canEdit = role === "SUPER" || role === "ADMIN"
  const canHardDelete = role === "SUPER"

  useEffect(() => {
    async function load() {
      try {
        const [sensorRes, leiturasRes] = await Promise.all([
          fetch(`/api/sensores/${params.id}`),
          fetch(`/api/sensores/${params.id}/leituras`),
        ])
        if (!sensorRes.ok) { router.push("/sensores"); return }
        const s = await sensorRes.json()
        setSensor(s)
        const l = await leiturasRes.json()
        setLeituras(l)
        try {
          const eRes = await fetch(`/api/edificacoes/${s.edificacaoId}`)
          if (eRes.ok) setEdificacao(await eRes.json())
        } catch {}
        try {
          const cRes = await fetch(`/api/clientes/${s.clienteId}`)
          if (cRes.ok) setCliente(await cRes.json())
        } catch {}
      } catch {
        router.push("/sensores")
      }
    }
    load()
  }, [params.id, router])

  async function handleDesativar() {
    if (!confirm("Desativar este sensor?")) return
    setLoadingAction(true)
    try {
      const res = await fetch(`/api/sensores/${params.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Sensor desativado")
      const updated = await res.json()
      setSensor((prev: any) => ({ ...prev, ativo: "N" }))
    } catch {
      toast.error("Erro ao desativar sensor")
    } finally {
      setLoadingAction(false)
    }
  }

  async function handleReativar() {
    setLoadingAction(true)
    try {
      const res = await fetch(`/api/sensores/${params.id}/reativar`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast.success("Sensor reativado")
      setSensor((prev: any) => ({ ...prev, ativo: "S" }))
    } catch {
      toast.error("Erro ao reativar sensor")
    } finally {
      setLoadingAction(false)
    }
  }

  async function handleExcluirPermanente() {
    if (!confirm("Tem certeza? Esta ação não pode ser desfeita.")) return
    setLoadingAction(true)
    try {
      const res = await fetch(`/api/sensores/${params.id}?force=true`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Sensor excluído permanentemente")
      router.push("/sensores")
    } catch {
      toast.error("Erro ao excluir sensor")
    } finally {
      setLoadingAction(false)
    }
  }

  if (!sensor) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
      </div>
    )
  }

  const dadosArray = toArray(sensor.dados)

  return (
    <div className="space-y-6">
      {sensor.ativo === "N" && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-medium">Este sensor está inativo</p>
          </div>
          {canEdit && (
            <Button size="sm" onClick={handleReativar} disabled={loadingAction}>
              {loadingAction && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Reativar
            </Button>
          )}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--brand)]/10 p-2">
            <Cpu className="h-6 w-6 text-[var(--brand)]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                {sensor.tipoSensor}
              </span>
              <span className={`text-xs ${sensor.ativo === "S" ? "text-emerald-600" : "text-amber-600"}`}>
                {sensor.ativo === "S" ? "Ativo" : "Inativo"}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{sensor.nome}</h1>
            {sensor.descricao && (
              <p className="text-sm text-[var(--text-secondary)]">{sensor.descricao}</p>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <a href={`/sensores/${params.id}/editar`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-3 w-3" />
                Editar
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={handleDesativar} disabled={loadingAction || sensor.ativo === "N"}>
              {loadingAction && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Desativar
            </Button>
            {canHardDelete && sensor.ativo === "N" && (
              <Button variant="destructive" size="sm" onClick={handleExcluirPermanente} disabled={loadingAction}>
                <Trash2 className="mr-1 h-3 w-3" />
                Excluir
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={Hash} label="ID" value={`#${sensor.id}`} />
        <InfoCard icon={Fingerprint} label="UUID" value={sensor.uuid ?? "-"} />
        <InfoCard icon={Building2} label="Edificação" value={edificacao?.nome ?? "-"} />
        <InfoCard icon={User} label="Cliente" value={cliente?.nome ?? "-"} />
        <InfoCard icon={Calendar} label="Instalação" value={sensor.createdAt ? new Date(sensor.createdAt).toLocaleDateString("pt-BR") : "-"} />
        {sensor.modelo && <InfoCard icon={Package} label="Modelo" value={sensor.modelo} />}
        {sensor.unidade && <InfoCard icon={Ruler} label="Unidade" value={sensor.unidade} />}
        {sensor.fabricante && <InfoCard icon={Factory} label="Fabricante" value={sensor.fabricante} />}
        <InfoCard icon={DollarSign} label="Valor Mensal" value={sensor.valorMensal ? `R$ ${Number(sensor.valorMensal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"} />
      </div>

      {dadosArray.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">Dados do Sensor</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {dadosArray.filter(([k]) => !["modelo", "unidade", "fabricante", "instalacao"].includes(k)).map(([chave, valor]) => (
              <div key={chave} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{chave}</span>
                <span className="text-sm text-[var(--text-secondary)]">{String(valor)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <SensorReadingsChart data={leituras} />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-medium text-[var(--text-secondary)]">Últimas Leituras</h2>
        </div>
        {leituras.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Nenhuma leitura registrada</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {leituras.map((leitura: any) => (
              <div key={leitura.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-lg font-bold">
                    {String(leitura.valor)} {leitura.unidade}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-secondary)]">
                    {leitura.lidaEm ? new Date(leitura.lidaEm).toLocaleString("pt-BR") : ""}
                  </p>
                  {leitura.topicoMqtt && (
                    <p className="text-xs text-[var(--text-secondary)] truncate max-w-[200px]">
                      {leitura.topicoMqtt}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function toArray(dados: unknown): [string, unknown][] {
  if (typeof dados !== "object" || dados === null || Array.isArray(dados)) return []
  return Object.entries(dados)
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-sm">
      <div className="rounded-lg bg-[var(--bg-secondary)] p-2">
        <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
      </div>
      <div>
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className="font-medium text-sm">{value}</p>
      </div>
    </div>
  )
}


