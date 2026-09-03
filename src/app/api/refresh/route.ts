import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Refresco manual: pega este endpoint (GET o POST) para forzar una relectura
// del Google Sheet antes de que se cumpla la hora de auto-revalidación.
export async function GET() {
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}

export async function POST() {
  return GET();
}
