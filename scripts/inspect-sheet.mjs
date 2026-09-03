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

const meta = await sheets.spreadsheets.get({ spreadsheetId });
const tabs = meta.data.sheets.map((s) => ({
  title: s.properties.title,
  rows: s.properties.gridProperties.rowCount,
  cols: s.properties.gridProperties.columnCount,
}));

console.log("=== PESTAÑAS ===");
console.table(tabs);

for (const tab of tabs) {
  const range = `'${tab.title}'!A1:Z2`;
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const values = res.data.values || [];
    console.log(`\n=== ${tab.title} ===`);
    console.log("Headers:", JSON.stringify(values[0] || []));
    console.log("Sample row (anonymized lengths only):", (values[1] || []).map(v => v ? `[${String(v).length} chars]` : "-"));
  } catch (e) {
    console.log(`\n=== ${tab.title} === ERROR: ${e.message}`);
  }
}
