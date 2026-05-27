import React from "react";

interface Props {
  sourceFps: number;
  inferenceFps: number;
}

const S: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: "var(--s-3)",
    padding: "var(--s-3) var(--s-4)",
    border: "1px solid var(--hairline)",
    borderTop: "none",
    background: "var(--bg-surface)",
    fontFamily: "var(--font-mono)", fontSize: 11,
    color: "var(--text-muted)", letterSpacing: "0.04em",
    marginTop: -1,
  },
  side: { display: "flex", gap: "var(--s-4)", alignItems: "center" },
  k: { color: "var(--text-muted)", marginRight: 4 },
  v: { color: "var(--text-primary)" },
};

export default function StreamControls({ sourceFps, inferenceFps }: Props) {
  return (
    <div style={S.bar}>
      <div style={S.side}>
        <span><span style={S.k}>SRC FPS</span><span style={S.v}>{sourceFps.toFixed(1)}</span></span>
        <span><span style={S.k}>INF FPS</span><span style={S.v}>{inferenceFps.toFixed(1)}</span></span>
      </div>
      <div style={S.side}>
        <span><span style={S.k}>CODEC</span><span style={S.v}>JPEG/WS</span></span>
      </div>
    </div>
  );
}
