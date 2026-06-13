"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function NovoSensorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [edificacoes, setEdificacoes] = useState<{ id: number; nome: string }[]>([])
  const [tipos, setTipos] = useState<{ id: number; nome: string }[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/edificacoes").then(r => r.json()),
      fetch("/api/tipos-sensor").then(r => r.json()),
    ]).then(([edData, tipoData]) => {
      setEdificacoes(edData)
      setTipos(tipoData)
    }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch("/api/sensores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edificacaoId: Number(form.get("edificacaoId")),
          tipoSensor: form.get("tipoSensor"),
          nome: form.get("nome"),
          descricao: form.get("descricao") || null,
          modelo: form.get("modelo") || null,
          unidade: form.get("unidade") || null,
          fabricante: form.get("fabricante") || null,
          valorMensal: form.get("valorMensal") || "0",
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      toast.success("Sensor cadastrado com sucesso")
      router.push("/sensores")
    } catch {
      toast.error("Erro ao cadastrar sensor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Novo Sensor</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Cadastre fissurômetros, inclinômetros, sensores de temperatura, umidade...
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edificacaoId">Edificação</Label>
          <select id="edificacaoId" name="edificacaoId" required className="flex h-9 w-full rounded-md border border-input bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-1 text-sm shadow-sm transition-colors">
            <option value="" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Selecione...</option>
            {edificacoes.map((ed) => (
              <option key={ed.id} value={ed.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{ed.nome}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoSensor">Tipo</Label>
          <select id="tipoSensor" name="tipoSensor" required className="flex h-9 w-full rounded-md border border-input bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-1 text-sm shadow-sm transition-colors">
            <option value="" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Selecione...</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.nome} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t.nome}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" placeholder="Nome do sensor" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input id="descricao" name="descricao" placeholder="Descrição opcional" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo</Label>
            <Input id="modelo" name="modelo" placeholder="GS-INC" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unidade">Unidade</Label>
            <Input id="unidade" name="unidade" placeholder="mm, °C, graus..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fabricante">Fabricante</Label>
            <Input id="fabricante" name="fabricante" placeholder="GeoSense" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valorMensal">Valor mensal (R$)</Label>
            <Input id="valorMensal" name="valorMensal" type="number" step="0.01" min="0" placeholder="0,00" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
