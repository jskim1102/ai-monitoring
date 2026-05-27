import React from "react";
import BboxOverlay from "./BboxOverlay";
import type { Detection } from "./BboxOverlay";
import type { ModelSettings } from "./ModelSettingsModal";

interface Props {
  imgSrc: string;
  detections: Detection[];
  connected: boolean;
  cameraName: string;
  streamKey: string;
  settings?: Record<string, ModelSettings>;
}

const S: Record<string, React.CSSProperties> = {
  stream: {
    position: "relative",
    background: "#06080b",
    border: "1px solid var(--hairline)",
    aspectRatio: "16/9",
    overflow: "hidden",
  },
  streamCrit: {
    borderColor: "rgba(248,113,113,0.4)",
  },
  scanline: {
    position: "absolute", inset: 0,
    background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px)",
    pointerEvents: "none" as const, zIndex: 1,
  },
  hud: {
    position: "absolute", zIndex: 4,
    display: "flex", gap: 6, alignItems: "center",
  },
  chip: {
    fontFamily: "var(--font-mono)", fontSize: 11,
    background: "rgba(8,10,14,0.7)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "4px 9px",
    color: "var(--text-primary)",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap" as const,
    lineHeight: 1.4,
  },
  chipOk: { color: "var(--ok)", borderColor: "rgba(74,222,128,0.3)" },
  noStream: {
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12,
    letterSpacing: "0.06em",
  },
};

function cornerStyle(pos: "tl" | "tr" | "bl" | "br"): React.CSSProperties {
  return {
    position: "absolute",
    width: 14, height: 14,
    borderColor: "var(--accent)", borderStyle: "solid", borderWidth: 0,
    zIndex: 3, opacity: 0.7,
    ...(pos === "tl" ? { top: 8, left: 8, borderTopWidth: 1, borderLeftWidth: 1 } : {}),
    ...(pos === "tr" ? { top: 8, right: 8, borderTopWidth: 1, borderRightWidth: 1 } : {}),
    ...(pos === "bl" ? { bottom: 8, left: 8, borderBottomWidth: 1, borderLeftWidth: 1 } : {}),
    ...(pos === "br" ? { bottom: 8, right: 8, borderBottomWidth: 1, borderRightWidth: 1 } : {}),
  };
}

export default function StreamViewer({ imgSrc, detections, connected, cameraName, streamKey, settings }: Props) {
  const hasAlert = detections.some((d) => d.conf > 0.8);

  return (
    <div style={{ ...S.stream, ...(hasAlert ? S.streamCrit : {}) }}>
      <span style={cornerStyle("tl")} />
      <span style={cornerStyle("tr")} />
      <span style={cornerStyle("bl")} />
      <span style={cornerStyle("br")} />
      <span style={S.scanline} />

      {imgSrc ? (
        <BboxOverlay
          imgSrc={imgSrc}
          alt={cameraName}
          detections={detections}
          settings={settings}
          imgStyle={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      ) : (
        <div style={S.noStream}>
          {connected ? "WAITING FOR FRAMES..." : "NO SIGNAL"}
        </div>
      )}

      <div style={{ ...S.hud, top: 14, left: 14 }}>
        <span style={{
          ...S.chip,
          ...(connected ? S.chipOk : { color: "var(--text-muted)" }),
        }}>
          <span style={{
            display: "inline-block", width: 6, height: 6,
            background: "currentColor", marginRight: 5,
            boxShadow: connected ? "0 0 5px currentColor" : "none",
          }} />
          {connected ? "LIVE" : "OFFLINE"}
        </span>
        <span style={S.chip}>{streamKey}</span>
      </div>

      <div style={{ ...S.hud, bottom: 14, left: 14 }}>
        <span style={S.chip}>{detections.length} detected</span>
      </div>

      <div style={{ ...S.hud, bottom: 14, right: 14, flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        {hasAlert && (
          <span style={{ ...S.chip, color: "var(--crit)", borderColor: "rgba(248,113,113,0.45)" }}>
            ALERT
          </span>
        )}
      </div>
    </div>
  );
}
