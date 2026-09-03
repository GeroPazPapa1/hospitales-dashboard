import { google } from "googleapis";
import pkg from "@next/env";
const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

function uniq(arr, max = 30) {
  const s = [...new Set(arr.filter((v) => v !== undefined && v !== "").map((v) => String(v).trim()))];
  return { count: s.length, sample: s.slice(0, max) };
}

async function getTab(title) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${title}'!A1:AI1000`,
  });
  return res.data.values || [];
}

// ---- Casos Únicos: only non-identifying categorical columns ----
const SAFE_COLS = [
  "EFECTOR DE SALUD",
  "EN SIT DE CALLE",
  "PERMEABILIDAD",
  "EVALUACIÓN CIS",
  "ESTRATEGIA",
  "CRITICIDAD",
  "NIVEL DE CRONICIDAD",
  "Q INTERVENCIONES",
  "CANTIDAD \nDE CONTACTOS",
  "CONTACTADOS EN AGOSTO",
];

for (const tab of ["Casos Únicos AGO", "Casos Únicos JUL"]) {
  const rows = await getTab(tab);
  const headers = rows[0].map((h) => h.trim());
  console.log(`\n\n########## ${tab} (${rows.length - 1} filas) ##########`);
  headers.forEach((h, idx) => {
    if (SAFE_COLS.some((c) => h.replace(/\s+/g, " ").trim() === c.replace(/\s+/g, " ").trim())) {
      const colVals = rows.slice(1).map((r) => r[idx]);
      const u = uniq(colVals);
      console.log(`\n[${h}] -> ${u.count} valores únicos:`);
      console.log(u.sample);
    }
  });
  // Sample of the free-text CIS ingresos column, truncated, to see vocabulary (no name/DNI attached in output)
  const hIdx = headers.findIndex((h) => h.includes("INGRESOS A CIS"));
  if (hIdx >= 0) {
    const vals = rows.slice(1).map((r) => r[hIdx]).filter(Boolean);
    console.log(`\n[INGRESOS A CIS/DiPA] -> ${vals.length} valores no vacíos, primeros 15 (truncados a 70 chars):`);
    console.log(vals.slice(0, 15).map((v) => String(v).slice(0, 70)));
  }
}

// ---- Hospital tabs: full operational data (no names/DNI columns exist here) ----
for (const tab of ["ARGERICH", "RAMOS MEJÍA", "DURAND", "PIROVANO"]) {
  const rows = await getTab(tab);
  const headers = rows[0].map((h) => (h || "").trim());
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c && String(c).trim() !== ""));
  console.log(`\n\n########## ${tab} (${dataRows.length} filas con datos) ##########`);
  headers.forEach((h, idx) => {
    if (!h) return;
    const colVals = dataRows.map((r) => r[idx]);
    if (h.toLowerCase().includes("detalle") || h.toLowerCase().includes("observaciones")) {
      const nonEmpty = colVals.filter(Boolean);
      console.log(`\n[${h}] -> ${nonEmpty.length} no vacíos, ejemplos (truncados a 80 chars):`);
      console.log(nonEmpty.slice(0, 5).map((v) => String(v).slice(0, 80)));
    } else {
      const u = uniq(colVals);
      console.log(`\n[${h}] -> ${u.count} valores únicos:`);
      console.log(u.sample);
    }
  });
}
