export type MesCasos = "AGO" | "JUL";

export interface CasoUnico {
  mes: MesCasos;
  hospital: string;
  nombre: string;
  enSituacionDeCalle: boolean | null;
  dni: string | null;
  edad: number | null;
  fechaNacimiento: string | null;
  ingresosCisTexto: string | null;
  esEgreso: boolean;
  fechasContacto: string | null;
  ultimoContacto: string | null;
  cantidadContactos: number | null;
  permeabilidad: string | null;
  observaciones: string | null;
  evaluacionCis: string | null;
  estrategia: string | null;
  esSaludMental: boolean;
  /** Estrategia = "Pérdida de paradero": no se pudo volver a contactar a la persona. Se excluye del conteo de "casos únicos" real. */
  perdidaDeParadero: boolean;
  criticidad: string | null;
  nivelCronicidad: string | null;
  qIntervenciones: { value: number | null; exact: boolean; raw: string | null };
  contactadosEnAgosto: boolean | null; // sólo tiene sentido en el mes JUL
}

export interface RegistroHospitalDia {
  hospital: string;
  fecha: string | null; // dd/MM/yyyy tal cual viene del sheet
  turno: string | null;
  qPscContactadas: number;
  casosConocidos: number;
  qCasosNuevos: number;
  detalleCasosNuevos: string | null;
  qIngresosCis: number;
  detalleIngresosCis: string | null;
  qEgresos: number; // derivado por texto ("egreso") en detalleIngresosCis
  qSinVacante: number;
  qRechazaIntervencion: number;
  qAceptaEntrevistaRechazaRecursos: number;
  casosSmTexto: string | null;
  observacionesGenerales: string | null;
}

export interface SheetData {
  casosUnicos: CasoUnico[];
  registrosHospitales: RegistroHospitalDia[];
  fetchedAt: string;
}
