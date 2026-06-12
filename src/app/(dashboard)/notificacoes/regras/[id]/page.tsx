"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Trash2, Plus, Mail } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Regra {
  id: number
  nome: string
  descricao: string | null
  sensorTipo: string | null
  condicao: string
  valorMin: string | null
  valorMax: string | null
  prioridade: string
  ativo: boolean
}

interface Destinatario {
  id: number
  tipo: string
  usuarioId: number | null
  email: string | null
  emailAtivo: boolean
  pushAtivo: boolean
}

export default function RegraDetalhePage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const regraId = parseInt(params.id)

  const { data: regra, isLoading } = useQuery<Regra>({
    queryKey: ["regra", regraId],
    queryFn: () => fetch(`/api/notificacoes/regras/${regraId}`).then((r) => r.json()),
  })

  const { data: destinatarios } = useQuery<Destinatario[]>({
    queryKey: ["destinatarios", regraId],
    queryFn: () => fetch(`/api/notificacoes/regras/${regraId}/destinatarios`).then((r) => r.json()),
  })

  const [form, setForm] = useState<Partial<Regra>>({})
  const [novoEmail, setNovoEmail] = useState("")

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Regra>) =>
      fetch(`/api/notificacoes/regras/${regraId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regra", regraId] })
      toast.success("Regra atualizada!")
    },
    onError: () => toast.error("Erro ao atualizar regra"),
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/notificacoes/regras/${regraId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Regra excluída")
      router.push("/notificacoes/regras")
    },
    onError: () => toast.error("Erro ao excluir regra"),
  })

  const addDestinatarioMutation = useMutation({
    mutationFn: (email: string) =>
      fetch(`/api/notificacoes/regras/${regraId}/destinatarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "email", email, emailAtivo: true, pushAtivo: false }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinatarios", regraId] })
      setNovoEmail("")
      toast.success("Destinatário adicionado!")
    },
    onError: () => toast.error("Erro ao adicionar destinatário"),
  })

  if (isLoading) return <div className="p-6 text-sm text-[var(--text-secondary)]">Carregando...</div>
  if (!regra) return <div className="p-6 text-sm text-[var(--text-secondary)]">Regra não encontrada</div>

  const values = { ...regra, ...form }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/notificacoes/regras">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{regra.nome}</h1>
          <p className="text-sm text-[var(--text-secondary)]">Editar regra de notificação</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => { if (confirm("Excluir esta regra?")) deleteMutation.mutate() }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm p-6 space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" value={values.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="descricao">Descrição</Label>
          <textarea
            id="descricao"
            className="flex min-h-[80px] w-full rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            value={values.descricao ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sensorTipo">Tipo Sensor</Label>
            <Input id="sensorTipo" value={values.sensorTipo ?? ""} onChange={(e) => setForm((f) => ({ ...f, sensorTipo: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="condicao">Condição</Label>
            <select
              id="condicao"
              value={values.condicao}
              onChange={(e) => setForm((f) => ({ ...f, condicao: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            >
              <option value=">">{'>'}</option>
              <option value="<">{'<'}</option>
              <option value=">=">{'>='}</option>
              <option value="<=">{'<='}</option>
              <option value="=">=</option>
              <option value="entre">Entre</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prioridade">Prioridade</Label>
            <select
              id="prioridade"
              value={values.prioridade}
              onChange={(e) => setForm((f) => ({ ...f, prioridade: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="ativo"
            checked={values.ativo ?? true}
            onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
            className="h-4 w-4"
          />
          <Label htmlFor="ativo">Regra ativa</Label>
        </div>
        <Button onClick={() => updateMutation.mutate(values)} disabled={updateMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm p-6 space-y-4">
        <h2 className="font-semibold">Destinatários</h2>

        <div className="flex gap-2">
          <Input
            placeholder="email@exemplo.com"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => addDestinatarioMutation.mutate(novoEmail)}
            disabled={!novoEmail || addDestinatarioMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {(!destinatarios || destinatarios.length === 0) ? (
          <p className="text-sm text-[var(--text-secondary)]">Nenhum destinatário cadastrado</p>
        ) : (
          <div className="space-y-2">
            {destinatarios.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span className="text-sm">{d.email ?? `Usuário #${d.usuarioId}`}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
