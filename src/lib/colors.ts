export const HOSPITAL_ORDER = ["ARGERICH", "DURAND", "RAMOS MEJÍA", "PIROVANO"] as const;

const SLOTS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)", "var(--series-6)"];

export function colorForHospital(hospital: string): string {
  const idx = HOSPITAL_ORDER.indexOf(hospital as (typeof HOSPITAL_ORDER)[number]);
  if (idx >= 0) return SLOTS[idx];
  // hospital no listado (ej. uno nuevo): le asigna el siguiente slot libre de forma estable por hash
  let hash = 0;
  for (let i = 0; i < hospital.length; i++) hash = (hash * 31 + hospital.charCodeAt(i)) >>> 0;
  return SLOTS[HOSPITAL_ORDER.length + (hash % (SLOTS.length - HOSPITAL_ORDER.length))];
}
