"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, HelpCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Config {
  id: number
  smtpHost: string | null
  smtpPort: number | null
  smtpUser: string | null
  smtpPass: string | null
  smtpFrom: string | null
  pushAtivo: boolean
  emailAtivo: boolean
}

export default function NotificacoesConfigPage() {
  const queryClient = useQueryClient()
  const { data: config, isLoading } = useQuery<Config>({
    queryKey: ["notificacoes-config"],
    queryFn: () => fetch("/api/notificacoes/config").then((r) => r.json()),
  })

  const [form, setForm] = useState<Partial<Config>>({})

  const mutation = useMutation({
    mutationFn: (data: Partial<Config>) =>
      fetch("/api/notificacoes/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes-config"] })
      toast.success("Configuração salva com sucesso!")
    },
    onError: () => toast.error("Erro ao salvar configuração"),
  })

  const values = { ...config, ...form }

  if (isLoading) return <div className="p-6 text-sm text-[var(--text-secondary)]">Carregando...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/notificacoes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Configuração de Email</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Configure o SMTP do Google para enviar notificações por email
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-sm text-blue-800 dark:text-blue-200">
          <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Use uma{" "}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              senha de app do Google
            </a>{" "}
            (ativo em 2 fatores). O email remetente pode ser o mesmo do usuário.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="smtpHost">Servidor SMTP</Label>
            <Input
              id="smtpHost"
              value={values.smtpHost ?? "smtp.gmail.com"}
              onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="smtpPort">Porta</Label>
            <Input
              id="smtpPort"
              type="number"
              value={values.smtpPort ?? 587}
              onChange={(e) => setForm((f) => ({ ...f, smtpPort: parseInt(e.target.value) }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="smtpUser">Usuário (email Google)</Label>
            <Input
              id="smtpUser"
              placeholder="seuemail@gmail.com"
              value={values.smtpUser ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, smtpUser: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="smtpPass">Senha de App</Label>
            <Input
              id="smtpPass"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx"
              value={values.smtpPass ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, smtpPass: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="smtpFrom">Email de remetente</Label>
            <Input
              id="smtpFrom"
              placeholder="noreply@seudominio.com"
              value={values.smtpFrom ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, smtpFrom: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="emailAtivo"
              checked={values.emailAtivo ?? false}
              onChange={(e) => setForm((f) => ({ ...f, emailAtivo: e.target.checked }))}
              className="h-4 w-4"
            />
            <Label htmlFor="emailAtivo">Enviar notificações por email</Label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="pushAtivo"
              checked={values.pushAtivo ?? true}
              onChange={(e) => setForm((f) => ({ ...f, pushAtivo: e.target.checked }))}
              className="h-4 w-4"
            />
            <Label htmlFor="pushAtivo">Notificações no sistema (push)</Label>
          </div>
        </div>

        <Button
          onClick={() => mutation.mutate(values)}
          disabled={mutation.isPending}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          {mutation.isPending ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </div>
    </div>
  )
}
