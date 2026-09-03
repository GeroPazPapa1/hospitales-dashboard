import type { ReactNode } from "react";

export function FiltersForm({
  action,
  desde,
  hasta,
  hospital,
  hospitales,
  extra,
}: {
  action: string;
  desde?: string;
  hasta?: string;
  hospital?: string;
  hospitales: readonly string[];
  extra?: ReactNode;
}) {
  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-xl border p-3"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: "var(--ink-muted)" }}>
          Desde
        </label>
        <input
          type="date"
          name="desde"
          defaultValue={desde}
          className="rounded-md border px-2 py-1 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--background)" }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: "var(--ink-muted)" }}>
          Hasta
        </label>
        <input
          type="date"
          name="hasta"
          defaultValue={hasta}
          className="rounded-md border px-2 py-1 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--background)" }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: "var(--ink-muted)" }}>
          Hospital
        </label>
        <select
          name="hospital"
          defaultValue={hospital ?? ""}
          className="rounded-md border px-2 py-1 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--background)" }}
        >
          <option value="">Todos</option>
          {hospitales.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>
      {extra}
      <button
        type="submit"
        className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
        style={{ background: "var(--series-1)" }}
      >
        Filtrar
      </button>
      <a href={action} className="text-sm underline" style={{ color: "var(--ink-secondary)" }}>
        Limpiar
      </a>
    </form>
  );
}
