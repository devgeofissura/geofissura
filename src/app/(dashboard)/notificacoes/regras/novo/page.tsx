"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NovaRegraPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    sensorTipo: "",
    condicao: ">",
    valorMin: "",
    valorMax: "",
    prioridade: "media",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/notificacoes/regras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          valorMin: form.valorMin ? parseFloat(form.valorMin) : null,
          valorMax: form.valorMax ? parseFloat(form.valorMax) : null,
        }),
      })
      if (!res.ok) throw new Error("Erro ao criar regra")
      toast.success("Regra criada com sucesso!")
      router.push("/notificacoes/regras")
      router.refresh()
    } catch {
      toast.error("Erro ao criar regra")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/notificacoes/regras">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nova Regra</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Defina a condição para disparar notificações
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm p-6 space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome da Regra</Label>
          <Input id="nome" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="descricao">Descrição</Label>
          <textarea
            id="descricao"
            className="flex min-h-[80px] w-full rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sensorTipo">Tipo de Sensor</Label>
          <Input id="sensorTipo" placeholder="Deixe em branco para todos" value={form.sensorTipo} onChange={(e) => setForm((f) => ({ ...f, sensorTipo: e.target.value }))} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="condicao">Condição</Label>
            <select
              id="condicao"
              value={form.condicao}
              onChange={(e) => setForm((f) => ({ ...f, condicao: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            >
              <option value=">">{'Maior que (>)'}</option>
              <option value="<">{'Menor que (<)'}</option>
              <option value=">=">{'Maior ou igual (>=)'}</option>
              <option value="<=">{'Menor ou igual (<=)'}</option>
              <option value="=">Igual (=)</option>
              <option value="entre">Entre</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="valorMin">Valor Mínimo</Label>
            <Input id="valorMin" type="number" step="0.0001" value={form.valorMin} onChange={(e) => setForm((f) => ({ ...f, valorMin: e.target.value }))} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="valorMax">Valor Máximo</Label>
            <Input id="valorMax" type="number" step="0.0001" value={form.valorMax} onChange={(e) => setForm((f) => ({ ...f, valorMax: e.target.value }))} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="prioridade">Prioridade</Label>
          <select
            id="prioridade"
            value={form.prioridade}
            onChange={(e) => setForm((f) => ({ ...f, prioridade: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Criar Regra"}
        </Button>
      </form>
    </div>
  )
}
