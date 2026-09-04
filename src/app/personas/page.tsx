import { getSheetData } from "@/lib/sheets";
import { filtrarCasosUnicos } from "@/lib/metrics";
import { KpiCard } from "@/components/KpiCard";
import { HOSPITAL_ORDER } from "@/lib/colors";
import type { MesCasos } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PersonasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; hospital?: string }>;
}) {
  const sp = await searchParams;
  const mes = (sp.mes === "JUL" ? "JUL" : sp.mes === "AGO" ? "AGO" : null) as MesCasos | null;
  const data = await getSheetData();
  const casos = filtrarCasosUnicos(data.casosUnicos, mes, sp.hospital || null).sort((a, b) =>
    a.hospital === b.hospital ? a.nombre.localeCompare(b.nombre) : a.hospital.localeCompare(b.hospital)
  );

  const totalIntervenciones = casos.reduce((acc, c) => acc + (c.qIntervenciones.value ?? 0), 0);
  const sinDato = casos.filter((c) => c.qIntervenciones.value === null).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Casos únicos — intervenciones por persona</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-secondary)" }}>
          Una fila por persona (DNI único), tomado de las pestañas &quot;Casos Únicos AGO/JUL&quot;.
        </p>
      </div>

      <form action="/personas" className="flex flex-wrap items-end gap-3 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--ink-muted)" }}>Mes</label>
          <select name="mes" defaultValue={mes ?? ""} className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
            <option value="">Ambos</option>
            <option value="AGO">Agosto</option>
            <option value="JUL">Julio</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--ink-muted)" }}>Hospital</label>
          <select name="hospital" defaultValue={sp.hospital ?? ""} className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
            <option value="">Todos</option>
            {HOSPITAL_ORDER.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-md px-3 py-1.5 text-sm font-medium text-white" style={{ background: "var(--series-1)" }}>
          Filtrar
        </button>
        <a href="/personas" className="text-sm underline" style={{ color: "var(--ink-secondary)" }}>Limpiar</a>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Personas" value={casos.length} />
        <KpiCard label="Intervenciones (suma)" value={totalIntervenciones} sublabel={sinDato ? `${sinDato} sin dato de Q Intervenciones` : undefined} />
        <KpiCard label="En situación de calle" value={casos.filter((c) => c.enSituacionDeCalle).length} />
        <KpiCard
          label="Pérdida de paradero"
          value={casos.filter((c) => c.perdidaDeParadero).length}
          sublabel="No se las pudo volver a contactar"
        />
      </div>

      <div className="rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr style={{ color: "var(--ink-muted)" }}>
                <th className="py-2 pr-3 font-medium">Mes</th>
                <th className="py-2 pr-3 font-medium">Hospital</th>
                <th className="py-2 pr-3 font-medium">Nombre</th>
                <th className="py-2 pr-3 font-medium">DNI</th>
                <th className="py-2 pr-3 font-medium">Edad</th>
                <th className="py-2 pr-3 font-medium">Estrategia</th>
                <th className="py-2 pr-3 font-medium">Criticidad</th>
                <th className="py-2 pr-3 font-medium">Q Intervenciones</th>
                <th className="py-2 pr-3 font-medium">Egreso CIS</th>
              </tr>
            </thead>
            <tbody>
              {casos.map((c, i) => (
                <tr
                  key={i}
                  className="border-t"
                  style={{ borderColor: "var(--gridline)", opacity: c.perdidaDeParadero ? 0.55 : 1 }}
                  title={c.perdidaDeParadero ? "Pérdida de paradero: no cuenta como caso único real" : undefined}
                >
                  <td className="py-2 pr-3">{c.mes}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{c.hospital}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{c.nombre}</td>
                  <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{c.dni ?? "—"}</td>
                  <td className="py-2 pr-3 tabular-nums">{c.edad ?? "—"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{c.estrategia ?? "—"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{c.criticidad ?? "—"}</td>
                  <td className="py-2 pr-3 tabular-nums">
                    {c.qIntervenciones.value === null
                      ? "sin dato"
                      : c.qIntervenciones.exact
                      ? c.qIntervenciones.value
                      : `${c.qIntervenciones.value}+`}
                  </td>
                  <td className="py-2 pr-3">{c.esEgreso ? "Sí" : "No"}</td>
                </tr>
              ))}
              {casos.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center" style={{ color: "var(--ink-muted)" }}>
                    Sin resultados para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
