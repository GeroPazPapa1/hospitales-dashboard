import { getSheetData } from "@/lib/sheets";
import { casosConIndicadorSmEnCalle, casosSaludMentalPorMes } from "@/lib/metrics";
import { KpiCard } from "@/components/KpiCard";

export const dynamic = "force-dynamic";

export default async function SaludMentalPage() {
  const data = await getSheetData();
  const porMes = casosSaludMentalPorMes(data.casosUnicos);
  const casosDgsam = data.casosUnicos.filter((c) => c.esSaludMental);
  const indiciosEnCalle = casosConIndicadorSmEnCalle(data.registrosHospitales);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Casos de salud mental</h1>
        <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--ink-secondary)" }}>
          Casos ya derivados formalmente: filas de Casos Únicos donde la columna <b>Estrategia</b> es
          &quot;ASIC - DGSAM&quot; (DGSAM = Dirección Gral. de Salud Mental). Abajo también se listan
          &quot;indicadores&quot; de salud mental detectados en calle por los equipos (columna &quot;Casos SM&quot; de
          la planilla diaria), que todavía pueden no estar formalmente derivados.
        </p>
        <p
          className="mt-2 max-w-3xl rounded-md border px-3 py-2 text-xs"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink-secondary)" }}
        >
          ⚠️ Estos dos números <b>no se pueden cruzar automáticamente</b>: la planilla diaria no registra DNI, así
          que no hay forma de saber si un &quot;indicador en calle&quot; es una persona que ya figura en la tabla de
          derivados o no. Nunca los sumes como si fueran casos distintos — pueden repetirse. Si en Casos Únicos se
          agrega una columna que marque &quot;ya derivado a DGSAM: sí/no&quot;, este dashboard puede separar
          &quot;casos nuevos para derivar&quot; de los ya en seguimiento.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label="Salud mental — agosto" value={porMes.AGO} sublabel="Casos Únicos AGO, Estrategia=DGSAM" />
        <KpiCard label="Salud mental — julio" value={porMes.JUL} sublabel="Casos Únicos JUL, Estrategia=DGSAM" />
        <KpiCard
          label="Indicadores en calle"
          value={indiciosEnCalle.length}
          sublabel="Turnos con texto en 'Casos SM' — no confirmados como derivación"
        />
      </div>

      <div className="rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="p-4 pb-0 text-sm font-medium">Casos derivados a DGSAM</h2>
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr style={{ color: "var(--ink-muted)" }}>
                <th className="py-2 pr-3 font-medium">Mes</th>
                <th className="py-2 pr-3 font-medium">Hospital</th>
                <th className="py-2 pr-3 font-medium">Nombre</th>
                <th className="py-2 pr-3 font-medium">DNI</th>
                <th className="py-2 pr-3 font-medium">Criticidad</th>
                <th className="py-2 pr-3 font-medium">Evaluación CIS</th>
              </tr>
            </thead>
            <tbody>
              {casosDgsam.map((c, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--gridline)" }}>
                  <td className="py-2 pr-3">{c.mes}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{c.hospital}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{c.nombre}</td>
                  <td className="py-2 pr-3 tabular-nums">{c.dni ?? "—"}</td>
                  <td className="py-2 pr-3">{c.criticidad ?? "—"}</td>
                  <td className="py-2 pr-3 max-w-[320px]" style={{ color: "var(--ink-secondary)" }}>{c.evaluacionCis ?? "—"}</td>
                </tr>
              ))}
              {casosDgsam.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center" style={{ color: "var(--ink-muted)" }}>Sin casos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="p-4 pb-0 text-sm font-medium">Indicadores en calle (planilla diaria)</h2>
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr style={{ color: "var(--ink-muted)" }}>
                <th className="py-2 pr-3 font-medium">Fecha</th>
                <th className="py-2 pr-3 font-medium">Hospital</th>
                <th className="py-2 pr-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {indiciosEnCalle.map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--gridline)" }}>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.fecha}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.hospital}</td>
                  <td className="py-2 pr-3" style={{ color: "var(--ink-secondary)" }}>{r.casosSmTexto}</td>
                </tr>
              ))}
              {indiciosEnCalle.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center" style={{ color: "var(--ink-muted)" }}>Sin registros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
