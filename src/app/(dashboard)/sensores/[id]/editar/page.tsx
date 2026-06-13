"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function EditarSensorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [tipos, setTipos] = useState<{ id: number; nome: string }[]>([])
  const [form, setForm] = useState({
    tipoSensor: "",
    nome: "",
    descricao: "",
    modelo: "",
    unidade: "",
    fabricante: "",
    valorMensal: "",
  })

  useEffect(() => {
    fetch(`/api/sensores/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((sensor) => {
        setForm({
          tipoSensor: sensor.tipoSensor ?? "",
          nome: sensor.nome ?? "",
          descricao: sensor.descricao ?? "",
          modelo: sensor.modelo ?? "",
          unidade: sensor.unidade ?? "",
          fabricante: sensor.fabricante ?? "",
          valorMensal: sensor.valorMensal ?? "0",
        })
        setLoadingData(false)
      })
      .catch(() => {
        toast.error("Erro ao carregar dados")
        router.push("/sensores")
      })
    fetch("/api/tipos-sensor")
      .then((r) => { if (r.ok) return r.json(); throw new Error() })
      .then(setTipos)
      .catch(() => {})
  }, [params.id, router])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/sensores/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error(await res.text())

      toast.success("Sensor atualizado com sucesso")
      router.push(`/sensores/${params.id}`)
    } catch {
      toast.error("Erro ao atualizar sensor")
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Editar Sensor</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tipoSensor">Tipo</Label>
          <select
            id="tipoSensor"
            value={form.tipoSensor}
            onChange={(e) => set("tipoSensor", e.target.value)}
            required
            className="flex h-9 w-full rounded-md border border-input bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-1 text-sm shadow-sm transition-colors"
          >
            <option value="" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Selecione...</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.nome} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t.nome}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input id="descricao" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo</Label>
            <Input id="modelo" value={form.modelo} onChange={(e) => set("modelo", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unidade">Unidade</Label>
            <Input id="unidade" value={form.unidade} onChange={(e) => set("unidade", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fabricante">Fabricante</Label>
            <Input id="fabricante" value={form.fabricante} onChange={(e) => set("fabricante", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valorMensal">Valor mensal (R$)</Label>
            <Input id="valorMensal" type="number" step="0.01" min="0" value={form.valorMensal} onChange={(e) => set("valorMensal", e.target.value)} />
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
