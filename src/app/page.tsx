import { getSheetData } from "@/lib/sheets";
import {
  buildOverview,
  egresosPorHospitalDesdeCasosUnicos,
  ingresosCisPorHospital,
  intervencionesPorHospital,
  rechazosPorHospital,
  turnosPorHospital,
} from "@/lib/metrics";
import { KpiCard } from "@/components/KpiCard";
import { CategoryBarChart } from "@/components/CategoryBarChart";
import { HOSPITAL_ORDER } from "@/lib/colors";

// Se renderiza por request (no en el build), así una caída puntual del Sheet
// nunca rompe el deploy. La lectura del Sheet en sí está cacheada 1 día en lib/sheets.ts.
export const dynamic = "force-dynamic";

function toChartData(record: Record<string, number>, meta?: Record<string, string>): { name: string; value: number; meta?: string }[] {
  const conocidos: { name: string; value: number; meta?: string }[] = HOSPITAL_ORDER.filter((h) => h in record).map((h) => ({
    name: h,
    value: record[h],
    meta: meta?.[h],
  }));
  const otros = Object.entries(record)
    .filter(([h]) => !(HOSPITAL_ORDER as readonly string[]).includes(h))
    .map(([name, value]) => ({ name, value, meta: meta?.[name] }));
  return conocidos.concat(otros);
}

export default async function OverviewPage() {
  const data = await getSheetData();
  const ov = buildOverview(data);

  const turnos = turnosPorHospital(data.registrosHospitales);
  const turnosMeta = Object.fromEntries(
    Object.entries(turnos).map(([h, n]) => [h, `${n} turno${n === 1 ? "" : "s"} registrado${n === 1 ? "" : "s"}`])
  );
  const intervenciones = toChartData(intervencionesPorHospital(data.registrosHospitales), turnosMeta);
  const ingresos = toChartData(ingresosCisPorHospital(data.registrosHospitales));
  const egresos = toChartData(egresosPorHospitalDesdeCasosUnicos(data.casosUnicos));
  const rechazos = toChartData(rechazosPorHospital(data.registrosHospitales), turnosMeta);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Resumen general</h1>
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          Datos leídos en vivo desde el Google Sheet · última lectura{" "}
          {new Date(ov.fetchedAt).toLocaleString("es-AR")} · se actualiza solo 1 vez por día (botón &quot;Actualizar
          ahora&quot; arriba a la derecha para forzarlo)
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--ink-secondary)" }}>
          Casos únicos — mismo criterio que el reporte semanal a Ministerio
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label="Detectados (Jul + Ago)"
            value={ov.casosUnicosTotal.detectados}
            sublabel="Personas contactadas, incluye pérdida de paradero"
          />
          <KpiCard
            label="Pérdida de paradero"
            value={ov.casosUnicosTotal.perdidaDeParadero}
            sublabel="No se las pudo volver a contactar"
          />
          <KpiCard
            label="Casos únicos julio"
            value={ov.casosUnicos.JUL.reales}
            sublabel={`${ov.casosUnicos.JUL.detectados} detectados − ${ov.casosUnicos.JUL.perdidaDeParadero} pérdida de paradero`}
          />
          <KpiCard
            label="Casos únicos agosto"
            value={ov.casosUnicos.AGO.reales}
            sublabel={`${ov.casosUnicos.AGO.detectados} detectados − ${ov.casosUnicos.AGO.perdidaDeParadero} pérdida de paradero`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard label="Intervenciones" value={ov.intervenciones} sublabel="Planilla diaria, todos los hospitales" />
        <KpiCard label="Ingresos a CIS" value={ov.ingresosCis} sublabel="Planilla diaria" />
        <KpiCard label="Egresos de CIS" value={ov.egresos} sublabel="Casos Únicos, detectado por texto 'egreso'" />
        <KpiCard
          label="Rechazos (eventos por turno)"
          value={ov.rechazos}
          sublabel="No son personas únicas: la misma persona puede rechazar varios días — ver pestaña Rechazos"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCard label="Casos de salud mental — agosto" value={ov.casosSaludMentalAgo} sublabel="Estrategia = ASIC-DGSAM" />
        <KpiCard label="Casos de salud mental — julio" value={ov.casosSaludMentalJul} sublabel="Estrategia = ASIC-DGSAM" />
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Intervenciones por hospital"
          data={intervenciones}
          note="Suma de 'Q PSC contactadas' por turno. Un hospital bajo puede ser menos turnos registrados, no menos actividad — pasá el mouse por la barra para ver cuántos turnos cargó cada uno."
        />
        <ChartCard title="Ingresos a CIS/DiPA por hospital" data={ingresos} />
        <ChartCard title="Egresos de CIS por hospital (Casos Únicos)" data={egresos} />
        <ChartCard
          title="Rechazos de intervención por hospital"
          data={rechazos}
          note="Eventos por turno, no personas únicas (ver nota arriba)."
        />
      </section>
    </div>
  );
}

function ChartCard({
  title,
  data,
  note,
}: {
  title: string;
  data: { name: string; value: number; meta?: string }[];
  note?: string;
}) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <h2 className="mb-2 text-sm font-medium">{title}</h2>
      <CategoryBarChart data={data} />
      {note ? (
        <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
