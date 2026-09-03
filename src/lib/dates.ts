import { parse, isValid } from "date-fns";

/** El sheet guarda las fechas como texto dd/MM/yyyy. */
export function parseFechaSheet(fecha: string | null): Date | null {
  if (!fecha) return null;
  const d = parse(fecha, "dd/MM/yyyy", new Date());
  return isValid(d) ? d : null;
}

export function inRange(fecha: string | null, from: Date | null, to: Date | null): boolean {
  if (!from && !to) return true;
  const d = parseFechaSheet(fecha);
  if (!d) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}
