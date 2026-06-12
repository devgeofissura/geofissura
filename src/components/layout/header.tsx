"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, LogOut, Bell } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

export function Header() {
  const { theme, setTheme } = useTheme()

  const { data: notifData } = useQuery({
    queryKey: ["notificacoes-nao-lidas"],
    queryFn: () =>
      fetch("/api/notificacoes/nao-lidas").then((r) => r.json()) as Promise<{ naoLidas: number }>,
    refetchInterval: 30000,
  })

  const naoLidas = notifData?.naoLidas ?? 0

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)] px-6">
      <div />
      <div className="flex items-center gap-2">
        <Link href="/notificacoes">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {naoLidas > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {naoLidas > 9 ? "9+" : naoLidas}
              </span>
            )}
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
