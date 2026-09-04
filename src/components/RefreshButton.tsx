"use client";

import { useState } from "react";

/**
 * Botón para forzar la relectura del Google Sheet sin esperar al cron diario.
 * Responde a la pregunta "si edito algo en el Sheet, ¿se ve al toque en el dashboard?":
 * con este botón sí, al instante; si no se apreta, se actualiza solo 1 vez por día.
 */
export function RefreshButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleClick() {
    setState("loading");
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
      window.location.reload();
    } catch {
      setState("error");
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-60"
      style={{ borderColor: "var(--border)", color: "var(--ink-secondary)" }}
      title="Vuelve a leer el Google Sheet ahora mismo, sin esperar la actualización automática diaria"
    >
      {state === "loading" ? "Actualizando…" : state === "error" ? "Error, reintentar" : "Actualizar ahora"}
    </button>
  );
}
