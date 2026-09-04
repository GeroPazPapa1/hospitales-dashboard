"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { colorForHospital } from "@/lib/colors";

interface CategoryDatum {
  name: string;
  value: number;
  /** Texto extra para el tooltip, ej. "11 turnos registrados" — da contexto a números que dependen de cuánto se cargó. */
  meta?: string;
}

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CategoryDatum }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        fontSize: 12,
        color: "var(--foreground)",
        padding: "6px 10px",
      }}
    >
      <div style={{ fontWeight: 600 }}>{d.name}</div>
      <div>{d.value}</div>
      {d.meta ? (
        <div style={{ color: "var(--ink-muted)", marginTop: 2 }}>{d.meta}</div>
      ) : null}
    </div>
  );
}

export function CategoryBarChart({
  data,
  height = 260,
}: {
  data: CategoryDatum[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--gridline)" />
        <XAxis
          dataKey="name"
          tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--baseline)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip cursor={{ fill: "rgba(128,128,128,0.08)" }} content={<CategoryTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((d) => (
            <Cell key={d.name} fill={colorForHospital(d.name)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
