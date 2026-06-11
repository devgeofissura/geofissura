"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Shield, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

interface Usuario {
  id: number
  nome: string
  email: string
  role: string
  createdAt: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  function loadUsuarios() {
    setLoading(true)
    fetch("/api/usuarios")
      .then((r) => {
        if (r.status === 401) throw new Error("Unauthorized")
        return r.json()
      })
      .then((data) => setUsuarios(data))
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsuarios() }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.get("nome"),
          email: form.get("email"),
          password: form.get("password"),
          role: form.get("role"),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Usuário cadastrado com sucesso")
      setShowForm(false)
      loadUsuarios()
    } catch {
      toast.error("Erro ao cadastrar usuário")
    } finally {
      setSaving(false)
    }
  }

  async function handleRoleChange(id: number, role: string) {
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Papel atualizado")
      loadUsuarios()
    } catch {
      toast.error("Erro ao atualizar papel")
    }
  }

  async function handleDelete(id: number, nome: string) {
    if (!confirm(`Excluir usuário "${nome}"?`)) return
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Usuário excluído")
      loadUsuarios()
    } catch {
      toast.error("Erro ao excluir usuário")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administração</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Gerencie usuários do sistema
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold">Cadastrar Usuário</h2>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Papel</Label>
            <select
              id="role"
              name="role"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
              defaultValue="USER"
            >
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
              <option value="VIEWER">Visualizador</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
            Nenhum usuário cadastrado
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-xs font-bold text-[var(--brand)] shrink-0">
                    {u.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{u.nome}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 text-xs"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    u.role === "ADMIN" || u.role === "SUPER"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {u.role === "ADMIN" || u.role === "SUPER"
                      ? <ShieldCheck className="h-3 w-3" />
                      : <Shield className="h-3 w-3" />
                    }
                    {u.role}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(u.id, u.nome)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
