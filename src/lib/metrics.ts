import type { CasoUnico, MesCasos, RegistroHospitalDia, SheetData } from "./types";
import { inRange } from "./dates";

export interface Filtro {
  desde?: string | null; // yyyy-MM-dd (input date HTML)
  hasta?: string | null;
  hospital?: string | null;
}

function toDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

export function filtrarRegistros(registros: RegistroHospitalDia[], f: Filtro): RegistroHospitalDia[] {
  const desde = toDate(f.desde);
  const hasta = toDate(f.hasta);
  return registros.filter((r) => {
    if (f.hospital && r.hospital !== f.hospital) return false;
    return inRange(r.fecha, desde, hasta);
  });
}

function sumBy<T>(items: T[], group: (i: T) => string, value: (i: T) => number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = group(item);
    out[k] = (out[k] || 0) + value(item);
  }
  return out;
}

export function dnisUnicosPorMes(casosUnicos: CasoUnico[]) {
  const porMes: Record<MesCasos, { total: number; conDni: number }> = {
    AGO: { total: 0, conDni: 0 },
    JUL: { total: 0, conDni: 0 },
  };
  for (const c of casosUnicos) {
    porMes[c.mes].total += 1;
    if (c.dni) porMes[c.mes].conDni += 1;
  }
  return porMes;
}

export interface ResumenCasosUnicos {
  /** Filas en Casos Únicos (personas distintas contactadas), incluye pérdida de paradero. */
  detectados: number;
  /** De esas, a cuántas no se las pudo volver a contactar (Estrategia = "Pérdida de paradero"). */
  perdidaDeParadero: number;
  /** detectados - perdidaDeParadero: el número que se reporta como "casos únicos". */
  reales: number;
}

function resumen(casos: CasoUnico[]): ResumenCasosUnicos {
  const detectados = casos.length;
  const perdidaDeParadero = casos.filter((c) => c.perdidaDeParadero).length;
  return { detectados, perdidaDeParadero, reales: detectados - perdidaDeParadero };
}

/**
 * Reproduce el criterio del reporte semanal a Ministerio: "casos únicos" excluye
 * las personas con pérdida de paradero (no se las pudo volver a contactar).
 */
export function resumenCasosUnicosPorMes(casosUnicos: CasoUnico[]): Record<MesCasos, ResumenCasosUnicos> {
  return {
    AGO: resumen(casosUnicos.filter((c) => c.mes === "AGO")),
    JUL: resumen(casosUnicos.filter((c) => c.mes === "JUL")),
  };
}

export function resumenCasosUnicosTotal(casosUnicos: CasoUnico[]): ResumenCasosUnicos {
  return resumen(casosUnicos);
}

export function intervencionesPorHospital(registros: RegistroHospitalDia[]) {
  return sumBy(registros, (r) => r.hospital, (r) => r.qPscContactadas);
}

export function ingresosCisPorHospital(registros: RegistroHospitalDia[]) {
  return sumBy(registros, (r) => r.hospital, (r) => r.qIngresosCis);
}

export function egresosPorHospital(registros: RegistroHospitalDia[]) {
  return sumBy(registros, (r) => r.hospital, (r) => r.qEgresos);
}

/**
 * Los egresos casi no se mencionan en la planilla diaria por hospital: viven,
 * en la práctica, en el texto de "Ingresos a CIS/DiPA" de Casos Únicos. Por
 * eso el conteo "real" de egresos por hospital sale de ahí, no de la planilla diaria.
 */
export function egresosPorHospitalDesdeCasosUnicos(casosUnicos: CasoUnico[]) {
  const out: Record<string, number> = {};
  for (const c of casosUnicos) {
    if (!c.esEgreso) continue;
    out[c.hospital] = (out[c.hospital] || 0) + 1;
  }
  return out;
}

export function rechazosPorHospital(registros: RegistroHospitalDia[]) {
  return sumBy(registros, (r) => r.hospital, (r) => r.qRechazaIntervencion);
}

/** Cantidad de turnos (filas) cargados por hospital — para contextualizar sumas que dependen de cuánto se registró. */
export function turnosPorHospital(registros: RegistroHospitalDia[]) {
  return sumBy(registros, (r) => r.hospital, () => 1);
}

/** Turnos donde se registró al menos 1 rechazo (a diferencia de la suma de eventos, no cuenta 2 veces un turno con "3 rechazan"). */
export function turnosConRechazo(registros: RegistroHospitalDia[]) {
  return registros.filter((r) => r.qRechazaIntervencion > 0).length;
}

export function rechazosPorDia(registros: RegistroHospitalDia[]) {
  // agrupa por fecha (sumando todos los hospitales), ordenado cronológicamente
  const porFecha = sumBy(registros, (r) => r.fecha ?? "Sin fecha", (r) => r.qRechazaIntervencion);
  return Object.entries(porFecha)
    .map(([fecha, total]) => ({ fecha, total }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function totales(registros: RegistroHospitalDia[]) {
  return registros.reduce(
    (acc, r) => {
      acc.intervenciones += r.qPscContactadas;
      acc.casosNuevos += r.qCasosNuevos;
      acc.ingresosCis += r.qIngresosCis;
      acc.egresos += r.qEgresos;
      acc.rechazos += r.qRechazaIntervencion;
      acc.sinVacante += r.qSinVacante;
      acc.aceptaEntrevistaRechazaRecursos += r.qAceptaEntrevistaRechazaRecursos;
      return acc;
    },
    {
      intervenciones: 0,
      casosNuevos: 0,
      ingresosCis: 0,
      egresos: 0,
      rechazos: 0,
      sinVacante: 0,
      aceptaEntrevistaRechazaRecursos: 0,
    }
  );
}

export function casosSaludMentalPorMes(casosUnicos: CasoUnico[]) {
  const out: Record<MesCasos, number> = { AGO: 0, JUL: 0 };
  for (const c of casosUnicos) if (c.esSaludMental) out[c.mes] += 1;
  return out;
}

export function casosConIndicadorSmEnCalle(registros: RegistroHospitalDia[]) {
  return registros.filter((r) => !!r.casosSmTexto);
}

export function filtrarCasosUnicos(casosUnicos: CasoUnico[], mes?: MesCasos | null, hospital?: string | null) {
  return casosUnicos.filter((c) => (mes ? c.mes === mes : true) && (hospital ? c.hospital === hospital : true));
}

const STOPWORDS = new Set(["para", "desde", "hasta", "tiene", "sobre", "sin", "esta", "este"]);

function sinAcentos(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Palabras "identificatorias" del nombre (>=4 letras, sin stopwords) para buscarlas en texto libre. */
function tokensDeNombre(nombre: string): string[] {
  return sinAcentos(nombre)
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));
}

/**
 * Cuántos turnos de la planilla diaria (mismo hospital) mencionan el nombre de esta
 * persona en algún campo de texto libre (detalle de casos nuevos, ingresos a CIS,
 * observaciones, casos SM). Es una estimación por texto, no un cruce por DNI —
 * sirve para chequear la columna "Q Intervenciones" cargada a mano, no para reemplazarla.
 */
export function mencionesEnPlanillaDiaria(caso: CasoUnico, registros: RegistroHospitalDia[]): number {
  const tokens = tokensDeNombre(caso.nombre);
  if (tokens.length === 0) return 0;
  const regexes = tokens.map((t) => new RegExp(`\\b${t}\\b`));

  let count = 0;
  for (const r of registros) {
    if (r.hospital !== caso.hospital) continue;
    const texto = sinAcentos(
      [r.detalleCasosNuevos, r.detalleIngresosCis, r.observacionesGenerales, r.casosSmTexto].filter(Boolean).join(" ")
    );
    if (texto && regexes.some((re) => re.test(texto))) count++;
  }
  return count;
}

export function buildOverview(data: SheetData) {
  const t = totales(data.registrosHospitales);
  const sm = casosSaludMentalPorMes(data.casosUnicos);
  const egresos = data.casosUnicos.filter((c) => c.esEgreso).length;
  const casosUnicos = resumenCasosUnicosPorMes(data.casosUnicos);
  const casosUnicosTotal = resumenCasosUnicosTotal(data.casosUnicos);
  return {
    casosUnicos,
    casosUnicosTotal,
    intervenciones: t.intervenciones,
    ingresosCis: t.ingresosCis,
    egresos,
    rechazos: t.rechazos,
    casosSaludMentalAgo: sm.AGO,
    casosSaludMentalJul: sm.JUL,
    fetchedAt: data.fetchedAt,
  };
}
