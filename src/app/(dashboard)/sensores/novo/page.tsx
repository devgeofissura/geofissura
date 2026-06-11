"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function NovoSensorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const data = {
      edificacaoId: Number(form.get("edificacaoId")),
      tipoSensor: form.get("tipoSensor") as string,
      nome: form.get("nome") as string,
      descricao: form.get("descricao") as string,
    }

    try {
      const res = await fetch("/api/sensores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
          <Label htmlFor="edificacaoId">ID da Edificação</Label>
          <Input id="edificacaoId" name="edificacaoId" type="number" placeholder="1" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoSensor">Tipo</Label>
          <Input
            id="tipoSensor"
            name="tipoSensor"
            placeholder="Fissura, Inclinacao, Temperatura, Umidade..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" placeholder="Nome do sensor" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input id="descricao" name="descricao" placeholder="Descrição opcional" />
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
