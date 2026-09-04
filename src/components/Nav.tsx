import Link from "next/link";
import { RefreshButton } from "./RefreshButton";

const LINKS = [
  { href: "/", label: "Resumen" },
  { href: "/personas", label: "Casos únicos" },
  { href: "/rechazos", label: "Rechazos" },
  { href: "/salud-mental", label: "Salud mental" },
];

export function Nav() {
  return (
    <header className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="text-sm font-semibold tracking-tight">Relevamiento Hospitales — PSC</div>
        <nav className="flex flex-wrap gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
              style={{ color: "var(--ink-secondary)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <RefreshButton />
      </div>
    </header>
  );
}
