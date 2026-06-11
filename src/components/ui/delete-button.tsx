"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface DeleteButtonProps {
  apiPath: string
  redirectTo: string
  label?: string
}

export function DeleteButton({ apiPath, redirectTo, label = "Excluir" }: DeleteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(apiPath, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Excluído com sucesso")
      router.push(redirectTo)
    } catch {
      toast.error("Erro ao excluir")
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
          {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Confirmar
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setConfirming(true)} className="text-red-600 border-red-200 hover:bg-red-50">
      <Trash2 className="mr-1 h-3 w-3" />
      {label}
    </Button>
  )
}
