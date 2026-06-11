"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function EditarEdificacaoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    fetch(`/api/edificacoes/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        const form = document.getElementById("form") as HTMLFormElement
        if (!form) return
        ;(form.elements.namedItem("nome") as HTMLInputElement).value = data.nome
        ;(form.elements.namedItem("endereco") as HTMLInputElement).value = data.endereco ?? ""
        setLoadingData(false)
      })
      .catch(() => {
        toast.error("Erro ao carregar dados")
        router.push("/edificacoes")
      })
  }, [params.id, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch(`/api/edificacoes/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.get("nome"),
          endereco: form.get("endereco"),
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      toast.success("Edificação atualizada com sucesso")
      router.push(`/edificacoes/${params.id}`)
    } catch {
      toast.error("Erro ao atualizar edificação")
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
        <h1 className="text-2xl font-bold">Editar Edificação</h1>
      </div>
      <form id="form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Input id="endereco" name="endereco" />
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
