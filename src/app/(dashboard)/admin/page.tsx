import { getSession } from "@/lib/tenant"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const { session, role } = await getSession()

  if (role !== "ADMIN" && role !== "SUPER") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administração</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Gerencie usuários e integrações do sistema
        </p>
      </div>
    </div>
  )
}
