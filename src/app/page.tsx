import { getSheetData } from "@/lib/sheets";
import {
  buildOverview,
  egresosPorHospitalDesdeCasosUnicos,
  ingresosCisPorHospital,
  intervencionesPorHospital,
  rechazosPorHospital,
} from "@/lib/metrics";
import { KpiCard } from "@/components/KpiCard";
import { CategoryBarChart } from "@/components/CategoryBarChart";
import { HOSPITAL_ORDER } from "@/lib/colors";

// Se renderiza por request (no en el build), así una caída puntual del Sheet
// nunca rompe el deploy. La lectura del Sheet en sí está cacheada 1 día en lib/sheets.ts.
export const dynamic = "force-dynamic";

function toChartData(record: Record<string, number>): { name: string; value: number }[] {
  const conocidos: { name: string; value: number }[] = HOSPITAL_ORDER.filter((h) => h in record).map((h) => ({
    name: h,
    value: record[h],
  }));
  const otros = Object.entries(record)
    .filter(([h]) => !(HOSPITAL_ORDER as readonly string[]).includes(h))
    .map(([name, value]) => ({ name, value }));
  return conocidos.concat(otros);
}

export default async function OverviewPage() {
  const data = await getSheetData();
  const ov = buildOverview(data);

  const intervenciones = toChartData(intervencionesPorHospital(data.registrosHospitales));
  const ingresos = toChartData(ingresosCisPorHospital(data.registrosHospitales));
  const egresos = toChartData(egresosPorHospitalDesdeCasosUnicos(data.casosUnicos));
  const rechazos = toChartData(rechazosPorHospital(data.registrosHospitales));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Resumen general</h1>
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          Datos leídos en vivo desde el Google Sheet · última lectura{" "}
          {new Date(ov.fetchedAt).toLocaleString("es-AR")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="DNIs únicos agosto" value={ov.dnisUnicosAgo} sublabel="Casos Únicos AGO" />
        <KpiCard label="DNIs únicos julio" value={ov.dnisUnicosJul} sublabel="Casos Únicos JUL" />
        <KpiCard label="Intervenciones" value={ov.intervenciones} sublabel="Planilla diaria, todos los hospitales" />
        <KpiCard label="Ingresos a CIS" value={ov.ingresosCis} sublabel="Planilla diaria" />
        <KpiCard label="Egresos de CIS" value={ov.egresos} sublabel="Casos Únicos, detectado por texto 'egreso'" />
        <KpiCard label="Rechazan intervención" value={ov.rechazos} sublabel="Sin DNI — ver pestaña Rechazos" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCard label="Casos de salud mental — agosto" value={ov.casosSaludMentalAgo} sublabel="Estrategia = ASIC-DGSAM" />
        <KpiCard label="Casos de salud mental — julio" value={ov.casosSaludMentalJul} sublabel="Estrategia = ASIC-DGSAM" />
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Intervenciones por hospital" data={intervenciones} />
        <ChartCard title="Ingresos a CIS/DiPA por hospital" data={ingresos} />
        <ChartCard title="Egresos de CIS por hospital (Casos Únicos)" data={egresos} />
        <ChartCard title="Rechazos de intervención por hospital" data={rechazos} />
      </section>
    </div>
  );
}

function ChartCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <h2 className="mb-2 text-sm font-medium">{title}</h2>
      <CategoryBarChart data={data} />
    </div>
  );
}
