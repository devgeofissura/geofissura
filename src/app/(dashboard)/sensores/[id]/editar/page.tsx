"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

const tiposSensor = [
  "inclinometro",
  "fissurometro",
  "termometro",
  "piezometro",
  "extensometro",
]

export default function EditarSensorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    fetch(`/api/sensores/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        const form = document.getElementById("form") as HTMLFormElement
        if (!form) return
        ;(form.elements.namedItem("tipoSensor") as HTMLInputElement).value = data.tipoSensor
        ;(form.elements.namedItem("nome") as HTMLInputElement).value = data.nome
        ;(form.elements.namedItem("descricao") as HTMLInputElement).value = data.descricao ?? ""
        ;(form.elements.namedItem("modelo") as HTMLInputElement).value = data.modelo ?? ""
        ;(form.elements.namedItem("unidade") as HTMLInputElement).value = data.unidade ?? ""
        ;(form.elements.namedItem("fabricante") as HTMLInputElement).value = data.fabricante ?? ""
        ;(form.elements.namedItem("valorMensal") as HTMLInputElement).value = data.valorMensal ?? "0"
        setLoadingData(false)
      })
      .catch(() => {
        toast.error("Erro ao carregar dados")
        router.push("/sensores")
      })
  }, [params.id, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch(`/api/sensores/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      <form id="form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tipoSensor">Tipo</Label>
          <select id="tipoSensor" name="tipoSensor" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors">
            {tiposSensor.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input id="descricao" name="descricao" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo</Label>
            <Input id="modelo" name="modelo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unidade">Unidade</Label>
            <Input id="unidade" name="unidade" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fabricante">Fabricante</Label>
            <Input id="fabricante" name="fabricante" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valorMensal">Valor mensal (R$)</Label>
            <Input id="valorMensal" name="valorMensal" type="number" step="0.01" min="0" />
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
