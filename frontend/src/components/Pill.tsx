type Status = "ok" | "warn" | "crit" | "off" | "default";

interface Props {
  status?: Status;
  children: React.ReactNode;
  dot?: boolean;
  style?: React.CSSProperties;
}

const pillBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "3px 8px", borderRadius: 2,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--hairline)",
  fontSize: 11, fontFamily: "var(--font-mono)",
  letterSpacing: "0.04em", textTransform: "uppercase" as const,
  color: "var(--text-secondary)", whiteSpace: "nowrap" as const,
};

const statusColors: Record<Status, React.CSSProperties> = {
  ok: { color: "var(--ok)" },
  warn: { color: "var(--warn)" },
  crit: { color: "var(--crit)" },
  off: {},
  default: {},
};

const dotColors: Record<Status, React.CSSProperties> = {
  ok: { background: "var(--ok)", boxShadow: "0 0 6px var(--ok)" },
  warn: { background: "var(--warn)" },
  crit: { background: "var(--crit)", boxShadow: "0 0 8px var(--crit-glow)", animation: "pulse 1.4s ease-in-out infinite" },
  off: { background: "var(--text-muted)" },
  default: { background: "var(--text-muted)" },
};

export default function Pill({ status = "default", children, dot = true, style }: Props) {
  return (
    <span style={{ ...pillBase, ...statusColors[status], ...style }}>
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, ...dotColors[status] }} />
      )}
      {children}
    </span>
  );
}
