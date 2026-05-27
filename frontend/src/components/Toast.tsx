import { useEffect, useState, useCallback } from "react";

interface ToastData {
  message: string;
  status?: "ok" | "crit";
}

let showToastGlobal: (data: ToastData) => void = () => {};

export function showToast(data: ToastData) {
  showToastGlobal(data);
}

const S: Record<string, React.CSSProperties> = {
  toast: {
    position: "fixed", bottom: 24, right: 24,
    display: "flex", alignItems: "stretch",
    background: "var(--bg-surface)",
    border: "1px solid var(--hairline-focus)",
    zIndex: 200,
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    minWidth: 320,
    transition: "opacity .2s, transform .2s",
  },
  body: { padding: "var(--s-3) var(--s-4)", flex: 1 },
  label: {
    fontSize: 10, letterSpacing: "0.16em",
    textTransform: "uppercase" as const, fontWeight: 600, marginBottom: 2,
  },
  msg: { fontSize: 12, color: "var(--text-primary)" },
};

export default function Toast() {
  const [data, setData] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback((d: ToastData) => {
    setData(d);
    setVisible(true);
    setTimeout(() => setVisible(false), 3500);
  }, []);

  useEffect(() => { showToastGlobal = show; }, [show]);

  if (!data) return null;

  const color = data.status === "crit" ? "var(--crit)" : "var(--ok)";

  return (
    <div style={{
      ...S.toast,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(8px)",
      pointerEvents: visible ? "auto" : "none",
    }}>
      <div style={{ width: 2, background: color }} />
      <div style={S.body}>
        <div style={{ ...S.label, color }}>{data.status === "crit" ? "Error" : "Success"}</div>
        <div style={S.msg}>{data.message}</div>
      </div>
    </div>
  );
}
