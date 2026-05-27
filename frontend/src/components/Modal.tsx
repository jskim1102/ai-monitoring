import { useEffect, useCallback, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(6, 8, 11, 0.7)",
    backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, padding: "var(--s-4)",
  },
  modal: {
    background: "var(--bg-surface)",
    border: "1px solid var(--hairline-focus)",
    width: "100%", position: "relative" as const,
  },
  head: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "var(--s-4) var(--s-5)",
    borderBottom: "1px solid var(--hairline)",
  },
  title: {
    fontSize: 10, color: "var(--text-secondary)",
    letterSpacing: "0.18em", textTransform: "uppercase" as const, fontWeight: 600,
  },
  sub: {
    fontFamily: "var(--font-mono)", fontSize: 11,
    color: "var(--text-muted)", marginTop: 3, letterSpacing: "0.06em",
  },
  close: {
    width: 28, height: 28,
    display: "grid", placeItems: "center",
    background: "transparent",
    border: "1px solid var(--hairline)",
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)", fontSize: 14,
    cursor: "pointer",
  },
  body: { padding: "var(--s-5)" },
  foot: {
    display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "var(--s-2)",
    padding: "var(--s-3) var(--s-5)",
    borderTop: "1px solid var(--hairline)",
    background: "rgba(255,255,255,0.01)",
  },
};

function corner(pos: "tl" | "tr" | "bl" | "br"): React.CSSProperties {
  return {
    position: "absolute",
    width: 10, height: 10,
    borderColor: "var(--accent)", borderStyle: "solid", borderWidth: 0,
    opacity: 0.85,
    ...(pos === "tl" ? { top: -1, left: -1, borderTopWidth: 1, borderLeftWidth: 1 } : {}),
    ...(pos === "tr" ? { top: -1, right: -1, borderTopWidth: 1, borderRightWidth: 1 } : {}),
    ...(pos === "bl" ? { bottom: -1, left: -1, borderBottomWidth: 1, borderLeftWidth: 1 } : {}),
    ...(pos === "br" ? { bottom: -1, right: -1, borderBottomWidth: 1, borderRightWidth: 1 } : {}),
  };
}

export default function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = 520 }: Props) {
  const onKey = useCallback((e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onKey]);

  if (!open) return null;

  return (
    <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...S.modal, maxWidth }}>
        <span style={corner("tl")} /><span style={corner("tr")} />
        <span style={corner("bl")} /><span style={corner("br")} />
        <div style={S.head}>
          <div>
            <div style={S.title}>{title}</div>
            {subtitle && <div style={S.sub}>{subtitle}</div>}
          </div>
          <button style={S.close} onClick={onClose} aria-label="close">&times;</button>
        </div>
        <div style={S.body}>{children}</div>
        {footer && <div style={S.foot}>{footer}</div>}
      </div>
    </div>
  );
}
