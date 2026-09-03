import "server-only";
import { google } from "googleapis";
import type { CasoUnico, MesCasos, RegistroHospitalDia, SheetData } from "./types";

const HOSPITAL_TABS = ["ARGERICH", "RAMOS MEJÍA", "DURAND", "PIROVANO"] as const;
const CASOS_UNICOS_TABS: { tab: string; mes: MesCasos }[] = [
  { tab: "Casos Únicos AGO", mes: "AGO" },
  { tab: "Casos Únicos JUL", mes: "JUL" },
];

function getClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!email || !key || !spreadsheetId) {
    throw new Error(
      "Faltan variables de entorno GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_SHEET_ID"
    );
  }
  const auth = new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return { sheets: google.sheets({ version: "v4", auth }), spreadsheetId };
}

async function fetchTab(tab: string): Promise<string[][]> {
  const { sheets, spreadsheetId } = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tab}'!A1:AI2000`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  return (res.data.values || []) as string[][];
}

function normalizeHeader(h: unknown): string {
  return String(h ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function findCol(headers: string[], ...candidates: string[]): number {
  const norm = headers.map(normalizeHeader);
  for (const c of candidates) {
    const target = normalizeHeader(c);
    const exact = norm.findIndex((h) => h === target);
    if (exact >= 0) return exact;
  }
  for (const c of candidates) {
    const target = normalizeHeader(c);
    const partial = norm.findIndex((h) => h.includes(target));
    if (partial >= 0) return partial;
  }
  return -1;
}

function cell(row: string[], idx: number): string | null {
  if (idx < 0) return null;
  const v = row[idx];
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === "" || s === "-" || s === "—" || s.toUpperCase() === "S/D") return null;
  return s;
}

function numCell(row: string[], idx: number): number {
  if (idx < 0) return 0;
  const v = row[idx];
  if (typeof v === "number") return v;
  const s = cell(row, idx);
  if (!s) return 0;
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function boolCell(row: string[], idx: number): boolean | null {
  const s = cell(row, idx);
  if (!s) return null;
  const up = s.toUpperCase();
  if (up.startsWith("S")) return true; // "Si" / "Sí"
  if (up.startsWith("N")) return false; // "No"
  return null;
}

function parseIntervencionesRaw(raw: string | null): { value: number | null; exact: boolean; raw: string | null } {
  if (!raw) return { value: null, exact: true, raw: null };
  const asNum = Number(raw);
  if (Number.isFinite(asNum)) return { value: asNum, exact: true, raw };
  const match = raw.match(/M[ÁA]S\s*DE\s*(\d+)/i);
  if (match) return { value: Number(match[1]), exact: false, raw };
  return { value: null, exact: true, raw };
}

/** Filas "eco" de encabezado, pegadas en medio de los datos cuando arman una tabla nueva abajo. */
function isHeaderEchoRow(row: string[], headers: string[]): boolean {
  const a = normalizeHeader(row[0]);
  const b = normalizeHeader(headers[0]);
  if (!a || !b) return false;
  return a === b;
}

function isEmptyRow(row: string[]): boolean {
  return !row || row.every((c) => c === undefined || c === null || String(c).trim() === "");
}

function parseCasosUnicos(rawRows: string[][], mes: MesCasos): CasoUnico[] {
  if (rawRows.length === 0) return [];
  const headers = rawRows[0].map((h) => String(h ?? ""));
  const idx = {
    hospital: findCol(headers, "EFECTOR DE SALUD"),
    nombre: findCol(headers, "APELLIDO Y NOMBRE"),
    enCalle: findCol(headers, "EN SIT DE CALLE"),
    dni: findCol(headers, "DNI"),
    edad: findCol(headers, "EDAD"),
    fNac: findCol(headers, "FECHA DE NAC"),
    ingresosCis: findCol(headers, "INGRESOS A CIS/DIPA", "INGRESOS A CIS"),
    fechasContacto: findCol(headers, "FECHAS DE CONTACTO"),
    ultimoContacto: findCol(headers, "ÚLTIMO CONTACTO", "ULTIMO CONTACTO"),
    cantContactos: findCol(headers, "CANTIDAD DE CONTACTOS"),
    permeabilidad: findCol(headers, "PERMEABILIDAD"),
    observaciones: findCol(headers, "OBSERVACIONES"),
    evalCis: findCol(headers, "EVALUACIÓN CIS", "EVALUACION CIS"),
    estrategia: findCol(headers, "ESTRATEGIA"),
    criticidad: findCol(headers, "CRITICIDAD"),
    cronicidad: findCol(headers, "NIVEL DE CRONICIDAD"),
    qIntervenciones: findCol(headers, "Q INTERVENCIONES"),
    contactadosAgosto: findCol(headers, "CONTACTADOS EN AGOSTO"),
  };

  const out: CasoUnico[] = [];
  for (const row of rawRows.slice(1)) {
    if (isEmptyRow(row) || isHeaderEchoRow(row, headers)) continue;
    if (!cell(row, idx.dni) && !cell(row, idx.nombre)) continue;

    const ingresosCisTexto = cell(row, idx.ingresosCis);
    const estrategia = cell(row, idx.estrategia);

    out.push({
      mes,
      hospital: cell(row, idx.hospital) ?? "Sin hospital",
      nombre: cell(row, idx.nombre) ?? "",
      enSituacionDeCalle: boolCell(row, idx.enCalle),
      dni: cell(row, idx.dni),
      edad: idx.edad >= 0 ? Number(cell(row, idx.edad)) || null : null,
      fechaNacimiento: cell(row, idx.fNac),
      ingresosCisTexto,
      esEgreso: !!ingresosCisTexto && /egres/i.test(ingresosCisTexto),
      fechasContacto: cell(row, idx.fechasContacto),
      ultimoContacto: cell(row, idx.ultimoContacto),
      cantidadContactos: idx.cantContactos >= 0 ? Number(cell(row, idx.cantContactos)) || null : null,
      permeabilidad: cell(row, idx.permeabilidad),
      observaciones: cell(row, idx.observaciones),
      evaluacionCis: cell(row, idx.evalCis),
      estrategia,
      esSaludMental: !!estrategia && /DGSAM/i.test(estrategia),
      criticidad: cell(row, idx.criticidad),
      nivelCronicidad: cell(row, idx.cronicidad),
      qIntervenciones: parseIntervencionesRaw(cell(row, idx.qIntervenciones)),
      contactadosEnAgosto: idx.contactadosAgosto >= 0 ? boolCell(row, idx.contactadosAgosto) : null,
    });
  }
  return out;
}

function parseHospitalTab(rawRows: string[][], hospital: string): RegistroHospitalDia[] {
  if (rawRows.length === 0) return [];
  const headers = rawRows[0].map((h) => String(h ?? ""));
  const idx = {
    fecha: findCol(headers, "FECHA"),
    turno: findCol(headers, "TURNO"),
    qPsc: findCol(headers, "Q PSC CONTACTADAS"),
    casosConocidos: findCol(headers, "CASOS CONOCIDOS"),
    qCasosNuevos: findCol(headers, "Q CASOS NUEVOS"),
    detalleCasosNuevos: findCol(headers, "DETALLE CASOS NUEVOS", "DETALLE"),
    qIngresosCis: findCol(headers, "Q INGRESOS A CIS"),
    detalleIngresosCis: findCol(headers, "DETALLE INGRESOS A CIS", "DETALLE INGRESOS"),
    qSinVacante: findCol(headers, "Q SIN VACANTE"),
    qRechaza: findCol(headers, "Q RECHAZA"),
    qAceptaEntrevista: findCol(headers, "Q ACEPTA ENTREVISTA"),
    casosSm: findCol(headers, "CASOS SM"),
    observaciones: findCol(headers, "OBSERVACIONES GENERALES", "OBSERVACIONES"),
  };

  const out: RegistroHospitalDia[] = [];
  for (const row of rawRows.slice(1)) {
    if (isEmptyRow(row) || isHeaderEchoRow(row, headers)) continue;
    const fecha = cell(row, idx.fecha);
    if (!fecha) continue; // fila sin fecha: no es un registro válido de turno

    const detalleIngresosCis = cell(row, idx.detalleIngresosCis);
    out.push({
      hospital,
      fecha,
      turno: cell(row, idx.turno),
      qPscContactadas: numCell(row, idx.qPsc),
      casosConocidos: numCell(row, idx.casosConocidos),
      qCasosNuevos: numCell(row, idx.qCasosNuevos),
      detalleCasosNuevos: cell(row, idx.detalleCasosNuevos),
      qIngresosCis: numCell(row, idx.qIngresosCis),
      detalleIngresosCis,
      qEgresos: detalleIngresosCis ? (detalleIngresosCis.match(/egres/gi) || []).length : 0,
      qSinVacante: numCell(row, idx.qSinVacante),
      qRechazaIntervencion: numCell(row, idx.qRechaza),
      qAceptaEntrevistaRechazaRecursos: numCell(row, idx.qAceptaEntrevista),
      casosSmTexto: cell(row, idx.casosSm),
      observacionesGenerales: cell(row, idx.observaciones),
    });
  }
  return out;
}

export async function getSheetData(): Promise<SheetData> {
  const [casosUnicosResults, hospitalResults] = await Promise.all([
    Promise.all(CASOS_UNICOS_TABS.map(async ({ tab, mes }) => parseCasosUnicos(await fetchTab(tab), mes))),
    Promise.all(HOSPITAL_TABS.map(async (h) => parseHospitalTab(await fetchTab(h), h))),
  ]);

  return {
    casosUnicos: casosUnicosResults.flat(),
    registrosHospitales: hospitalResults.flat(),
    fetchedAt: new Date().toISOString(),
  };
}

export const HOSPITALES = HOSPITAL_TABS;
