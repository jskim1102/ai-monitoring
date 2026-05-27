import React from "react";

interface Camera {
  id: number;
  name: string;
  stream_key: string;
  status: "ok" | "crit" | "off";
}

interface Props {
  cameras: Camera[];
  activeKey: string | null;
  onSelect: (streamKey: string) => void;
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    border: "1px solid var(--hairline)",
    background: "var(--bg-surface)",
    marginBottom: "var(--s-5)",
    overflowX: "auto",
  },
  tab: {
    flex: 1,
    display: "flex", alignItems: "center", gap: "var(--s-3)",
    padding: "12px var(--s-4)",
    borderRight: "1px solid var(--hairline)",
    color: "var(--text-secondary)", fontSize: 12,
    cursor: "pointer", background: "transparent",
    border: "none", borderBottom: "none", textAlign: "left" as const,
    whiteSpace: "nowrap" as const, fontFamily: "inherit",
    position: "relative" as const,
    transition: "background .15s, color .15s",
  },
  tabActive: {
    color: "var(--text-primary)",
    background: "rgba(94,234,212,0.04)",
  },
  activeBar: {
    position: "absolute" as const, bottom: 0, left: 0, right: 0, height: 2,
    background: "var(--accent)",
  },
  lblId: {
    fontFamily: "var(--font-mono)", fontSize: 10,
    color: "var(--text-muted)", letterSpacing: "0.1em",
  },
  lblIdActive: { color: "var(--accent)" },
  lblName: { fontWeight: 500 },
};

function dotStyle(status: Camera["status"]): React.CSSProperties {
  return {
    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
    background: status === "ok" ? "var(--ok)" : status === "crit" ? "var(--crit)" : "var(--text-muted)",
    boxShadow: status === "ok" ? "0 0 6px var(--ok)" : status === "crit" ? "0 0 8px var(--crit-glow)" : "none",
    ...(status === "crit" ? { animation: "pulse 1.4s ease-in-out infinite" } : {}),
  };
}

export default function CameraTabs({ cameras, activeKey, onSelect }: Props) {
  return (
    <div style={S.wrap}>
      {cameras.map((cam) => {
        const active = cam.stream_key === activeKey;
        return (
          <button
            key={cam.stream_key}
            style={{ ...S.tab, ...(active ? S.tabActive : {}) }}
            onClick={() => onSelect(cam.stream_key)}
          >
            <span style={dotStyle(cam.status)} />
            <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ ...S.lblId, ...(active ? S.lblIdActive : {}) }}>
                CAM-{String(cam.id).padStart(2, "0")}
              </span>
              <span style={S.lblName}>{cam.name}</span>
            </span>
            {active && <span style={S.activeBar} />}
          </button>
        );
      })}
    </div>
  );
}

export type { Camera };
