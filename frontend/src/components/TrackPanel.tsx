import React from "react";
import type { Detection } from "./BboxOverlay";

interface Props {
  detections: Detection[];
}

const S: Record<string, React.CSSProperties> = {
  panel: {
    border: "1px solid var(--hairline)",
    background: "var(--bg-surface)",
    display: "flex", flexDirection: "column",
    minHeight: 0,
  },
  head: {
    padding: "var(--s-3) var(--s-4)",
    borderBottom: "1px solid var(--hairline)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  title: {
    fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" as const,
    color: "var(--text-secondary)", fontWeight: 600,
  },
  count: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" },
  list: { display: "flex", flexDirection: "column" as const, overflowY: "auto" as const, flex: 1 },
  row: {
    display: "grid", gridTemplateColumns: "28px 1fr auto",
    gap: "var(--s-3)", padding: "var(--s-3) var(--s-4)",
    borderBottom: "1px solid var(--hairline)",
    alignItems: "center", cursor: "pointer",
    transition: "background .15s",
  },
  id: {
    width: 28, height: 28,
    border: "1px solid var(--hairline-strong)",
    display: "grid", placeItems: "center",
    fontFamily: "var(--font-mono)", fontSize: 11,
    color: "var(--text-secondary)", letterSpacing: "0.04em",
  },
  name: { fontSize: 12, color: "var(--text-primary)" },
  conf: {
    fontFamily: "var(--font-mono)", fontSize: 11,
    color: "var(--text-secondary)", letterSpacing: "0.04em",
  },
  foot: {
    padding: "var(--s-3) var(--s-4)",
    borderTop: "1px solid var(--hairline)",
    fontFamily: "var(--font-mono)", fontSize: 10,
    color: "var(--text-muted)", letterSpacing: "0.06em",
    display: "flex", justifyContent: "space-between",
  },
};

export default function TrackPanel({ detections }: Props) {
  return (
    <aside style={S.panel}>
      <div style={S.head}>
        <span style={S.title}>Detected Objects</span>
        <span style={S.count}>{detections.length} active</span>
      </div>
      <div style={S.list}>
        {detections.map((d, i) => (
          <div key={i} style={S.row}>
            <span style={S.id}>{d.class_id}</span>
            <div>
              <div style={S.name}>
                {d.name}
                {d.model && (
                  <span style={{
                    fontSize: 10, marginLeft: 6, padding: "1px 5px",
                    fontFamily: "var(--font-mono)", letterSpacing: "0.06em",
                    border: "1px solid var(--hairline-strong)",
                    color: "var(--text-muted)",
                  }}>
                    {d.model}
                  </span>
                )}
              </div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 10,
                color: "var(--text-muted)", letterSpacing: "0.04em", marginTop: 2,
              }}>
                bbox {d.xyxy.map(Math.round).join(", ")}
              </div>
            </div>
            <span style={S.conf}>{d.conf.toFixed(2)}</span>
          </div>
        ))}
        {detections.length === 0 && (
          <div style={{
            padding: "var(--s-5) var(--s-4)",
            textAlign: "center", color: "var(--text-muted)",
            fontFamily: "var(--font-mono)", fontSize: 11,
          }}>
            No detections
          </div>
        )}
      </div>
      <div style={S.foot}>
        <span>YOLO detection</span>
      </div>
    </aside>
  );
}
