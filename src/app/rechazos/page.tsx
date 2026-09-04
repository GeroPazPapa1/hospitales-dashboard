import { getSheetData } from "@/lib/sheets";
import { filtrarRegistros, rechazosPorDia, totales, turnosConRechazo } from "@/lib/metrics";
import { KpiCard } from "@/components/KpiCard";
import { TimeSeriesBarChart } from "@/components/TimeSeriesBarChart";
import { FiltersForm } from "@/components/FiltersForm";
import { HOSPITAL_ORDER } from "@/lib/colors";

export const dynamic = "force-dynamic";

export default async function RechazosPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; hospital?: string }>;
}) {
  const sp = await searchParams;
  const data = await getSheetData();
  const filtrados = filtrarRegistros(data.registrosHospitales, sp);
  const t = totales(filtrados);
  const serie = rechazosPorDia(filtrados);
  const conRechazo = turnosConRechazo(filtrados);

  const conRechazoOAlgunDato = filtrados.filter(
    (r) => r.qRechazaIntervencion > 0 || r.qAceptaEntrevistaRechazaRecursos > 0
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Personas que rechazan intervención</h1>
        <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--ink-secondary)" }}>
          La planilla diaria solo registra un <b>número</b> de rechazos por turno, no una lista de personas —
          justamente porque quienes rechazan suelen no dar sus datos, así que no se los puede volcar a Casos
          Únicos. Para ayudar a identificarlos igual, esta pantalla te deja filtrar por día/hospital y te muestra
          abajo el texto libre de esos turnos (Observaciones, Casos SM, detalle de casos nuevos), donde el equipo
          a veces sí anota un nombre suelto. Revisalo y cargalo a mano en Casos Únicos si corresponde.
        </p>
      </div>

      <FiltersForm action="/rechazos" desde={sp.desde} hasta={sp.hasta} hospital={sp.hospital} hospitales={HOSPITAL_ORDER} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <KpiCard
          label="Rechazos (eventos por turno)"
          value={t.rechazos}
          sublabel="Suma de 'Q Rechaza intervención'. No son personas únicas."
        />
        <KpiCard label="Turnos con ≥1 rechazo" value={conRechazo} sublabel="Cantidad de turnos distintos con algún rechazo" />
        <KpiCard
          label="Acepta entrevista, rechaza recursos"
          value={t.aceptaEntrevistaRechazaRecursos}
          sublabel="Eventos por turno (columna cargada a mano), no personas únicas"
        />
        <KpiCard
          label="Sin vacante disponible"
          value={t.sinVacante}
          sublabel="Eventos por turno (columna cargada a mano), no personas únicas"
        />
        <KpiCard
          label="Turnos en el rango"
          value={filtrados.length}
          sublabel="Turnos de la planilla diaria dentro del filtro de fecha/hospital elegido"
        />
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="text-sm font-medium">Rechazos por día</h2>
        <p className="mb-2 text-xs" style={{ color: "var(--ink-muted)" }}>
          Suma de &quot;Q Rechaza intervención&quot; por turno, agrupada por día (todos los hospitales del filtro elegido).
        </p>
        {serie.length > 0 ? (
          <TimeSeriesBarChart data={serie} />
        ) : (
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            No hay registros en el rango elegido.
          </p>
        )}
      </div>

      <div className="rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="p-4 pb-0 text-sm font-medium">Detalle por turno (para revisar nombres sueltos)</h2>
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr style={{ color: "var(--ink-muted)" }}>
                <th className="py-2 pr-3 font-medium">Fecha</th>
                <th className="py-2 pr-3 font-medium">Hospital</th>
                <th className="py-2 pr-3 font-medium">Turno</th>
                <th className="py-2 pr-3 font-medium">Rechaza</th>
                <th className="py-2 pr-3 font-medium">Acepta entrev./rechaza recursos</th>
                <th className="py-2 pr-3 font-medium">Casos SM</th>
                <th className="py-2 pr-3 font-medium">Observaciones generales</th>
              </tr>
            </thead>
            <tbody>
              {conRechazoOAlgunDato.map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--gridline)" }}>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.fecha}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.hospital}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.turno}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.qRechazaIntervencion}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.qAceptaEntrevistaRechazaRecursos}</td>
                  <td className="py-2 pr-3 max-w-[280px]" style={{ color: "var(--ink-secondary)" }}>
                    {r.casosSmTexto ?? "—"}
                  </td>
                  <td className="py-2 pr-3 max-w-[320px]" style={{ color: "var(--ink-secondary)" }}>
                    {r.observacionesGenerales ?? "—"}
                  </td>
                </tr>
              ))}
              {conRechazoOAlgunDato.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center" style={{ color: "var(--ink-muted)" }}>
                    Sin registros para este filtro.
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
