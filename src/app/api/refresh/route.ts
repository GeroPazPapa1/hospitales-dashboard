import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { SHEET_CACHE_TAG } from "@/lib/sheets";

export const dynamic = "force-dynamic";

// Fuerza una relectura del Google Sheet antes de que se cumpla el día de
// auto-revalidación. Lo llama el cron diario de Vercel (ver vercel.json) y
// también se puede abrir a mano en el navegador.
function handle(req: NextRequest) {
  // Si CRON_SECRET está definido, exigimos el header que manda Vercel Cron.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 });
  }

  revalidateTag(SHEET_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
