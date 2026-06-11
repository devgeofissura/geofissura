"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

interface Leitura {
  id: number
  sensorId: number
  valor: string | null
  unidade: string | null
  lidaEm: Date | null
  topicoMqtt: string | null
}

export function ReadingsChart({ data, sensorNomes }: { data: Leitura[]; sensorNomes: Record<number, string> }) {
  const cores = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"]
  const sensores = Array.from(new Set(data.map((d) => d.sensorId)))

  const chartData = data
    .sort((a, b) => new Date(a.lidaEm ?? 0).getTime() - new Date(b.lidaEm ?? 0).getTime())
    .map((d) => ({
      time: d.lidaEm
        ? new Date(d.lidaEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
        : "",
      ...Object.fromEntries(sensores.map((sid) => [`v${sid}`, d.sensorId === sid ? Number(d.valor) : null])),
    }))

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm">
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Leituras ao Longo do Tempo</h2>
      {data.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] text-center py-8">
          Nenhuma leitura registrada ainda
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="var(--text-secondary)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--text-secondary)" />
            <Tooltip
              contentStyle={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend
              formatter={(value: string) => sensorNomes[Number(value.replace("v", ""))] ?? value}
            />
            {sensores.map((sid, i) => (
              <Line
                key={sid}
                type="monotone"
                dataKey={`v${sid}`}
                stroke={cores[i % cores.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: cores[i % cores.length] }}
                connectNulls={true}
                name={String(sid)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
