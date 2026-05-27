import { useEffect, useState } from "react";
import { apiBase } from "../hooks/useApi";

function pad(n: number, w = 2): string {
  return String(n).padStart(w, "0");
}

const S: Record<string, React.CSSProperties> = {
  bar: {
    position: "fixed", top: 0, left: 0, right: 0,
    height: "var(--topbar-h)",
    background: "rgba(10, 12, 16, 0.85)",
    backdropFilter: "blur(10px) saturate(120%)",
    WebkitBackdropFilter: "blur(10px) saturate(120%)",
    borderBottom: "1px solid var(--hairline)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 var(--s-5)",
    zIndex: 90,
    fontSize: 11, color: "var(--text-secondary)", letterSpacing: "0.04em",
  },
  brand: {
    display: "flex", alignItems: "center", gap: "var(--s-3)",
    color: "var(--text-primary)",
    fontSize: 12, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase" as const,
  },
  mark: {
    width: 14, height: 14,
    border: "1px solid var(--accent)",
    position: "relative" as const,
    display: "inline-block",
  },
  markInner: {
    position: "absolute" as const, inset: 3,
    background: "var(--accent)", opacity: 0.85,
  },
  status: {
    display: "flex", alignItems: "center", gap: "var(--s-5)",
    fontFamily: "var(--font-mono)", fontSize: 11,
  },
  k: { color: "var(--text-muted)", letterSpacing: "0.06em" },
  v: { color: "var(--text-primary)" },
  sep: { width: 1, height: 12, background: "var(--hairline)" },
};

export default function Topbar() {
  const [clock, setClock] = useState("--:--:--");
  const [device, setDevice] = useState("auto");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch(`${apiBase()}/api/inference/config`)
      .then((r) => r.json())
      .then((d) => setDevice(d.device || "auto"))
      .catch(() => {});
  }, []);

  return (
    <header style={S.bar}>
      <div style={S.brand}>
        <span style={S.mark}><span style={S.markInner} /></span>
        <span>Tunnel &middot; Operations</span>
      </div>
      <div style={S.status}>
        <span><span style={S.k}>SYS </span><span style={S.v}>OPERATIONAL</span></span>
        <span style={S.sep} />
        <span><span style={S.k}>GPU </span><span style={S.v}>{device.toUpperCase()}</span></span>
        <span style={S.sep} />
        <span><span style={S.k}>UTC+9 </span><span style={S.v}>{clock}</span></span>
      </div>
    </header>
  );
}
