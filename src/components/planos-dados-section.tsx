"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Pencil, X, Signal, WifiOff } from "lucide-react"
import { toast } from "sonner"

interface PlanoDados {
  id: number
  operadora: string
  descricao: string | null
  valorMensal: string
  ativo: string
  createdAt: string | null
}

export function PlanosDadosSection({ edificacaoId, isSuper }: { edificacaoId: number; isSuper: boolean }) {
  const [planos, setPlanos] = useState<PlanoDados[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  function load() {
    setLoading(true)
    fetch(`/api/edificacoes/${edificacaoId}/planos-dados`)
      .then(r => r.json())
      .then(setPlanos)
      .catch(() => toast.error("Erro ao carregar planos"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/edificacoes/${edificacaoId}/planos-dados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operadora: form.get("operadora"),
          descricao: form.get("descricao"),
          valorMensal: form.get("valorMensal") || "0",
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Plano adicionado")
      setShowForm(false)
      load()
    } catch { toast.error("Erro ao adicionar plano") }
    finally { setSaving(false) }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/edificacoes/${edificacaoId}/planos-dados/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operadora: form.get("operadora"),
          descricao: form.get("descricao"),
          valorMensal: form.get("valorMensal") || "0",
          ativo: form.get("ativo") || "S",
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Plano atualizado")
      setEditingId(null)
      load()
    } catch { toast.error("Erro ao atualizar plano") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este plano de dados?")) return
    try {
      const res = await fetch(`/api/edificacoes/${edificacaoId}/planos-dados/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Plano excluído")
      load()
    } catch { toast.error("Erro ao excluir") }
  }

  const operadoras = ["Vivo", "Claro", "TIM", "Oi", "Algar", "Outra"]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Planos de Dados</h2>
        {isSuper && (
          <Button variant="outline" size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null) }}>
            <Plus className="mr-1 h-3 w-3" /> Adicionar Plano
          </Button>
        )}
      </div>

      {isSuper && showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-sm space-y-3">
          <div className="space-y-1">
            <Label htmlFor="operadora">Operadora</Label>
            <select id="operadora" name="operadora" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors">
              <option value="">Selecione...</option>
              {operadoras.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" placeholder="Plano 4G empresarial 50GB" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="valorMensal">Valor Mensal (R$)</Label>
            <Input id="valorMensal" name="valorMensal" type="number" step="0.01" min="0" placeholder="89,90" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Salvar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" /></div>
        ) : planos.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Nenhum plano de dados cadastrado</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {planos.map((plano) => (
              editingId === plano.id ? (
                <form key={plano.id} onSubmit={(e) => handleUpdate(e, plano.id)} className="p-4 space-y-3">
                  <div className="space-y-1">
                    <Label>Operadora</Label>
                    <select name="operadora" defaultValue={plano.operadora} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors">
                      {operadoras.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Descrição</Label>
                    <Input name="descricao" defaultValue={plano.descricao ?? ""} />
                  </div>
                  <div className="space-y-1">
                    <Label>Valor Mensal (R$)</Label>
                    <Input name="valorMensal" type="number" step="0.01" min="0" defaultValue={plano.valorMensal} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving}>
                      {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Salvar
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                      <X className="mr-1 h-3 w-3" /> Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div key={plano.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {plano.ativo === "S" ? (
                      <Signal className="h-8 w-8 shrink-0 text-[var(--brand)]" />
                    ) : (
                      <WifiOff className="h-8 w-8 shrink-0 text-red-400" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">{plano.operadora}</p>
                      {plano.descricao && <p className="text-xs text-[var(--text-secondary)]">{plano.descricao}</p>}
                      <p className="text-xs text-[var(--brand)] font-semibold">
                        {parseFloat(plano.valorMensal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                  </div>
                  {isSuper && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(plano.id); setShowForm(false) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(plano.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
