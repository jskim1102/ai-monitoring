import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiBase } from "../hooks/useApi";

const S: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "var(--sidebar-w)", flexShrink: 0,
    borderRight: "1px solid var(--hairline)",
    background: "rgba(16, 19, 26, 0.4)",
    position: "fixed" as const,
    top: "var(--topbar-h)", bottom: 0, left: 0,
    display: "flex", flexDirection: "column",
    padding: "var(--s-5) 0 var(--s-4)",
  },
  sectionLabel: {
    fontSize: 10, color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.16em",
    padding: "0 var(--s-5) var(--s-2)",
  },
  navItem: {
    display: "flex", alignItems: "center", gap: "var(--s-3)",
    padding: "10px var(--s-5)",
    fontSize: 13, color: "var(--text-secondary)",
    borderLeft: "2px solid transparent",
    transition: "color .15s, background .15s",
  },
  navActive: {
    color: "var(--accent)",
    background: "var(--accent-faint)",
    borderLeftColor: "var(--accent)",
  },
  foot: {
    marginTop: "auto",
    padding: "var(--s-4) var(--s-5) 0",
    borderTop: "1px solid var(--hairline)",
    fontSize: 11, color: "var(--text-muted)",
    fontFamily: "var(--font-mono)", lineHeight: 1.6,
  },
  footRow: { display: "flex", justifyContent: "space-between" },
};

export default function Sidebar() {
  const location = useLocation();
  const [camCount, setCamCount] = useState(0);

  useEffect(() => {
    fetch(`${apiBase()}/api/ipcams`)
      .then((r) => r.json())
      .then((cams: unknown[]) => setCamCount(cams.length))
      .catch(() => {});
  }, [location.pathname]);

  const isMonitor = location.pathname === "/";
  const isCameras = location.pathname.startsWith("/cameras");

  return (
    <nav style={S.sidebar}>
      <div style={S.sectionLabel}>Workspace</div>
      <Link to="/" style={{ ...S.navItem, ...(isMonitor ? S.navActive : {}) }}>
        <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.4}>
          <rect x="1" y="2" width="12" height="9" />
          <line x1="1" y1="11" x2="13" y2="11" />
          <line x1="5" y1="13" x2="9" y2="13" />
        </svg>
        Monitor
      </Link>
      <Link to="/cameras" style={{ ...S.navItem, ...(isCameras ? S.navActive : {}) }}>
        <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.4}>
          <circle cx="7" cy="7" r="2.5" />
          <path d="M3 4 L11 4 L12 6 L12 11 L2 11 L2 6 Z" />
        </svg>
        Cameras
      </Link>

      <div style={{ ...S.sectionLabel, marginTop: "var(--s-6)" }}>System</div>
      <span style={S.navItem}>
        <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.4}>
          <circle cx="7" cy="7" r="2" />
          <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8 4.2 4.2M9.8 9.8 11.2 11.2M2.8 11.2 4.2 9.8M9.8 4.2 11.2 2.8" />
        </svg>
        Settings
      </span>

      <div style={S.foot}>
        <div style={S.footRow}>
          <span>CAM</span>
          <span style={{ color: "var(--ok)" }}>{camCount} ONLINE</span>
        </div>
      </div>
    </nav>
  );
}
