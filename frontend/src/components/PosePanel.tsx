import React from "react";
import type { PoseClass } from "../utils/poseClassifier";
import { POSE_COLORS } from "../utils/poseClassifier";

export interface PoseEvent {
  id: number;
  type: "fall";
  timestamp: number;
  cameraName: string;
}

interface Props {
  distribution: Record<PoseClass, number>;
  total: number;
  events: PoseEvent[];
}

const S: Record<string, React.CSSProperties> = {
  panel: {
    border: "1px solid var(--hairline)",
    background: "var(--bg-surface)",
    display: "flex", flexDirection: "column",
    minHeight: 0,
  },
  section: {
    padding: "var(--s-3) var(--s-4)",
    borderBottom: "1px solid var(--hairline)",
  },
  sectionTitle: {
    fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" as const,
    color: "var(--text-secondary)", fontWeight: 600, marginBottom: "var(--s-3)",
  },
  barRow: {
    display: "flex", alignItems: "center", gap: "var(--s-3)",
    marginBottom: "var(--s-2)",
  },
  barLabel: {
    fontFamily: "var(--font-mono)", fontSize: 10,
    letterSpacing: "0.08em", textTransform: "uppercase" as const,
    width: 72, flexShrink: 0,
  },
  barTrack: {
    flex: 1, height: 6, background: "rgba(255,255,255,0.04)",
    overflow: "hidden",
  },
  barCount: {
    fontFamily: "var(--font-mono)", fontSize: 11,
    color: "var(--text-muted)", width: 24, textAlign: "right" as const,
  },
  eventList: {
    display: "flex", flexDirection: "column" as const,
    overflowY: "auto" as const, flex: 1, maxHeight: 200,
  },
  eventRow: {
    padding: "var(--s-2) var(--s-4)",
    borderBottom: "1px solid var(--hairline)",
    display: "flex", alignItems: "center", gap: "var(--s-3)",
  },
  eventDot: {
    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
    background: "var(--crit)",
    boxShadow: "0 0 8px var(--crit-glow)",
    animation: "pulse 1.4s ease-in-out infinite",
  },
  eventText: {
    fontFamily: "var(--font-mono)", fontSize: 11,
    color: "var(--text-primary)", letterSpacing: "0.04em",
  },
  eventSub: {
    fontFamily: "var(--font-mono)", fontSize: 10,
    color: "var(--text-muted)", letterSpacing: "0.04em",
  },
  eventTime: {
    fontFamily: "var(--font-mono)", fontSize: 10,
    color: "var(--text-muted)", marginLeft: "auto",
  },
  foot: {
    padding: "var(--s-3) var(--s-4)",
    borderTop: "1px solid var(--hairline)",
    fontFamily: "var(--font-mono)", fontSize: 10,
    color: "var(--text-muted)", letterSpacing: "0.06em",
    display: "flex", justifyContent: "space-between",
  },
  empty: {
    padding: "var(--s-4) var(--s-4)",
    textAlign: "center" as const, color: "var(--text-muted)",
    fontFamily: "var(--font-mono)", fontSize: 11,
  },
};

const POSE_ORDER: PoseClass[] = ["standing", "sitting", "lying", "unknown"];

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export default function PosePanel({ distribution, total, events }: Props) {
  const max = Math.max(1, ...Object.values(distribution));

  return (
    <aside style={S.panel}>
      {/* Pose Distribution */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Pose Distribution</div>
        {POSE_ORDER.map((pose) => {
          const count = distribution[pose] ?? 0;
          const pct = (count / max) * 100;
          return (
            <div key={pose} style={S.barRow}>
              <span style={{ ...S.barLabel, color: POSE_COLORS[pose] }}>{pose}</span>
              <div style={S.barTrack}>
                <div style={{
                  width: `${pct}%`, height: "100%",
                  background: POSE_COLORS[pose], opacity: 0.8,
                  transition: "width .3s",
                }} />
              </div>
              <span style={S.barCount}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Event Log */}
      <div style={{ ...S.section, borderBottom: "none", flex: 1, display: "flex", flexDirection: "column", padding: 0 }}>
        <div style={{ ...S.sectionTitle, padding: "var(--s-3) var(--s-4) 0" }}>Event Log</div>
        <div style={S.eventList}>
          {events.length === 0 && (
            <div style={S.empty}>No events</div>
          )}
          {events.map((ev) => (
            <div key={ev.id} style={S.eventRow}>
              <span style={S.eventDot} />
              <div>
                <div style={S.eventText}>FALL DETECTED</div>
                <div style={S.eventSub}>{ev.cameraName}</div>
              </div>
              <span style={S.eventTime}>{formatTime(ev.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={S.foot}>
        <span>YOLO pose</span>
        <span>{total} tracked · {events.length} events</span>
      </div>
    </aside>
  );
}
