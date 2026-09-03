export function KpiCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
        {label}
      </div>
      <div className="mt-1 text-3xl font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sublabel ? (
        <div className="mt-0.5 text-xs" style={{ color: "var(--ink-secondary)" }}>
          {sublabel}
        </div>
      ) : null}
    </div>
  );
}
