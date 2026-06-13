"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Pencil, X, HardDrive, WifiOff } from "lucide-react"
import { toast } from "sonner"

interface Equipamento {
  id: number
  tipo: string
  descricao: string | null
  quantidade: number
  valorUnitario: string
  ativo: string
  createdAt: string | null
}

const tiposEquipamento = [
  "Módulo WiFi",
  "Antena WiFi",
  "Roteador",
  "Fonte",
  "Cabo de Rede",
  "Sensor Repetidor",
  "Gateway",
  "Painel Solar",
  "Bateria",
  "Outro",
]

export function EquipamentosSection({ edificacaoId, isSuper }: { edificacaoId: number; isSuper: boolean }) {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  function load() {
    setLoading(true)
    fetch(`/api/edificacoes/${edificacaoId}/equipamentos`)
      .then(r => r.json())
      .then(setEquipamentos)
      .catch(() => toast.error("Erro ao carregar equipamentos"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/edificacoes/${edificacaoId}/equipamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: form.get("tipo"),
          descricao: form.get("descricao"),
          quantidade: form.get("quantidade") || "1",
          valorUnitario: form.get("valorUnitario") || "0",
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Equipamento adicionado")
      setShowForm(false)
      load()
    } catch { toast.error("Erro ao adicionar equipamento") }
    finally { setSaving(false) }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/edificacoes/${edificacaoId}/equipamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: form.get("tipo"),
          descricao: form.get("descricao"),
          quantidade: form.get("quantidade") || "1",
          valorUnitario: form.get("valorUnitario") || "0",
          ativo: form.get("ativo") || "S",
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Equipamento atualizado")
      setEditingId(null)
      load()
    } catch { toast.error("Erro ao atualizar equipamento") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este equipamento?")) return
    try {
      const res = await fetch(`/api/edificacoes/${edificacaoId}/equipamentos/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Equipamento excluído")
      load()
    } catch { toast.error("Erro ao excluir") }
  }

  function totalItem(eqp: Equipamento) {
    return eqp.quantidade * (parseFloat(eqp.valorUnitario) || 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Equipamentos</h2>
        {isSuper && (
          <Button variant="outline" size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null) }}>
            <Plus className="mr-1 h-3 w-3" /> Adicionar Equipamento
          </Button>
        )}
      </div>

      {isSuper && showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-sm space-y-3">
          <div className="space-y-1">
            <Label htmlFor="tipo">Tipo</Label>
<select id="tipo" name="tipo" required className="flex h-9 w-full rounded-md border border-input bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-1 text-sm shadow-sm transition-colors">
            <option value="" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Selecione...</option>
            {tiposEquipamento.map(t => <option key={t} value={t} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" placeholder="Antena externa 2.4GHz 15dBi" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input id="quantidade" name="quantidade" type="number" min="1" step="1" defaultValue="1" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="valorUnitario">Valor Unitário (R$)</Label>
              <Input id="valorUnitario" name="valorUnitario" type="number" step="0.01" min="0" placeholder="199,90" />
            </div>
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
        ) : equipamentos.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Nenhum equipamento cadastrado</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {equipamentos.map((eqp) => (
              editingId === eqp.id ? (
                <form key={eqp.id} onSubmit={(e) => handleUpdate(e, eqp.id)} className="p-4 space-y-3">
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <select name="tipo" defaultValue={eqp.tipo} required className="flex h-9 w-full rounded-md border border-input bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-1 text-sm shadow-sm transition-colors">
                      {tiposEquipamento.map(t => <option key={t} value={t} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Descrição</Label>
                    <Input name="descricao" defaultValue={eqp.descricao ?? ""} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Quantidade</Label>
                      <Input name="quantidade" type="number" min="1" step="1" defaultValue={eqp.quantidade} />
                    </div>
                    <div className="space-y-1">
                      <Label>Valor Unitário (R$)</Label>
                      <Input name="valorUnitario" type="number" step="0.01" min="0" defaultValue={eqp.valorUnitario} />
                    </div>
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
                <div key={eqp.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {eqp.ativo === "S" ? (
                      <HardDrive className="h-8 w-8 shrink-0 text-[var(--brand)]" />
                    ) : (
                      <WifiOff className="h-8 w-8 shrink-0 text-red-400" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">{eqp.tipo}</p>
                      {eqp.descricao && <p className="text-xs text-[var(--text-secondary)]">{eqp.descricao}</p>}
                      <p className="text-xs text-[var(--text-secondary)]">
                        {eqp.quantidade}x {parseFloat(eqp.valorUnitario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        {" = "}
                        <span className="text-[var(--brand)] font-semibold">
                          {totalItem(eqp).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </p>
                    </div>
                  </div>
                  {isSuper && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(eqp.id); setShowForm(false) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(eqp.id)} className="text-red-500 hover:text-red-700">
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
