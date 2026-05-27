interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  width?: number;
  height?: number;
}

export default function SegmentedToggle({ enabled, onChange, disabled = false, width = 92, height = 32 }: Props) {
  const thumbW = width / 2;

  return (
    <div style={{
      display: "inline-flex", position: "relative",
      width, height, borderRadius: "var(--r-2)",
      background: "var(--bg-base)",
      border: "1px solid var(--hairline-strong)",
      overflow: "hidden",
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? "none" : "auto",
      cursor: "pointer",
    }}>
      <div style={{
        position: "absolute", top: 2, left: enabled ? 2 : thumbW,
        width: thumbW - 4, height: height - 6,
        background: enabled ? "var(--ok)" : "var(--text-muted)",
        borderRadius: "var(--r-1)",
        transition: "left .18s ease, background .18s ease",
      }} />
      <button
        onClick={() => !disabled && onChange(true)}
        style={{
          flex: 1, background: "transparent", border: "none",
          color: enabled ? "#fff" : "var(--text-muted)",
          fontFamily: "var(--font-mono)", fontSize: 11,
          letterSpacing: "0.06em", zIndex: 1,
          transition: "color .18s",
        }}
      >ON</button>
      <button
        onClick={() => !disabled && onChange(false)}
        style={{
          flex: 1, background: "transparent", border: "none",
          color: !enabled ? "#fff" : "var(--text-muted)",
          fontFamily: "var(--font-mono)", fontSize: 11,
          letterSpacing: "0.06em", zIndex: 1,
          transition: "color .18s",
        }}
      >OFF</button>
    </div>
  );
}
