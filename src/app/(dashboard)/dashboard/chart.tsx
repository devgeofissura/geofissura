"use client"

import { useState, useMemo } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { Modal } from "@/components/ui/modal"

interface Leitura {
  id: number
  sensorId: number
  valor: string | null
  unidade: string | null
  lidaEm: Date | null
  topicoMqtt: string | null
}

interface SensorInfo {
  id: number
  nome: string
  edificacaoId: number
}

interface EdificacaoInfo {
  id: number
  nome: string
}

const cores = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"]

export function ReadingsChart({
  data,
  sensorNomes,
  sensores,
  edificacoes,
}: {
  data: Leitura[]
  sensorNomes: Record<number, string>
  sensores: SensorInfo[]
  edificacoes: EdificacaoInfo[]
}) {
  const [selectedEdificacaoId, setSelectedEdificacaoId] = useState<number | null>(null)
  const [modalSensorId, setModalSensorId] = useState<number | null>(null)

  const todosSensorIds = useMemo(() => {
    const ids = new Set(data.map((d) => d.sensorId))
    return Array.from(ids)
  }, [data])

  const sensorIdsVisiveis = useMemo(() => {
    if (!selectedEdificacaoId) return todosSensorIds
    const idsNaEdificacao = new Set(
      sensores.filter((s) => s.edificacaoId === selectedEdificacaoId).map((s) => s.id)
    )
    return todosSensorIds.filter((id) => idsNaEdificacao.has(id))
  }, [selectedEdificacaoId, todosSensorIds, sensores])

  const chartData = useMemo(() => {
    if (sensorIdsVisiveis.length === 0) return []
    const sorted = [...data].sort(
      (a, b) => new Date(a.lidaEm ?? 0).getTime() - new Date(b.lidaEm ?? 0).getTime()
    )
    return sorted.map((d) => ({
      time: d.lidaEm
        ? new Date(d.lidaEm).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      ...Object.fromEntries(
        sensorIdsVisiveis.map((sid) => [`v${sid}`, d.sensorId === sid ? Number(d.valor) : null])
      ),
    }))
  }, [data, sensorIdsVisiveis])

  const modalChartData = useMemo(() => {
    if (!modalSensorId) return []
    const sorted = data
      .filter((d) => d.sensorId === modalSensorId)
      .sort(
        (a, b) =>
          new Date(a.lidaEm ?? 0).getTime() - new Date(b.lidaEm ?? 0).getTime()
      )
    return sorted.map((d) => ({
      time: d.lidaEm
        ? new Date(d.lidaEm).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      valor: Number(d.valor),
    }))
  }, [modalSensorId, data])

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[var(--text-secondary)]">
            Leituras ao Longo do Tempo
          </h2>
          <select
            value={selectedEdificacaoId ?? ""}
            onChange={(e) =>
              setSelectedEdificacaoId(e.target.value ? Number(e.target.value) : null)
            }
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="">Todas as edificações</option>
            {edificacoes.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.nome}
              </option>
            ))}
          </select>
        </div>

        {data.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-8">
            Nenhuma leitura registrada ainda
          </p>
        ) : sensorIdsVisiveis.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-8">
            Nenhum sensor encontrado para esta edificação
          </p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  stroke="#d1d5db"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  stroke="#d1d5db"
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    sensorNomes[Number(name.replace("v", ""))] ?? name,
                  ]}
                />
                <Legend
                  formatter={(value: string) =>
                    sensorNomes[Number(value.replace("v", ""))] ?? value
                  }
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                {sensorIdsVisiveis.map((sid, i) => (
                  <Line
                    key={sid}
                    type="monotone"
                    dataKey={`v${sid}`}
                    stroke={cores[i % cores.length]}
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy } = props
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={cx != null ? 3 : 0}
                          fill={cores[i % cores.length]}
                          style={{ cursor: "pointer" }}
                          onClick={() => setModalSensorId(sid)}
                        />
                      )
                    }}
                    connectNulls={true}
                    name={String(sid)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <Modal
        open={modalSensorId !== null}
        onClose={() => setModalSensorId(null)}
        title={modalSensorId ? sensorNomes[modalSensorId] ?? `Sensor #${modalSensorId}` : ""}
      >
        {modalSensorId && (
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Leituras individuais do sensor
            </p>
            {modalChartData.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-8">
                Nenhuma leitura para este sensor
              </p>
            ) : (
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={modalChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      stroke="#d1d5db"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      stroke="#d1d5db"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#10b981" }}
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
