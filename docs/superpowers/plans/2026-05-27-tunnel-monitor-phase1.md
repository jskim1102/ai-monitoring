# Tunnel Monitor Phase 1 — Detection UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tunnel CCTV monitoring web application by combining deepeye_lite's backend infrastructure (RTSP streaming, YOLO detection, WebSocket) with the tunnel design system's "instrument-grade" dark UI.

**Architecture:** Fork deepeye_lite backend as-is into `/home/kim_3090/sample/`. Build a new React 19 + TypeScript frontend that replaces deepeye_lite's inline-styled pages with the tunnel design system (CSS custom properties, Pretendard + JetBrains Mono, cyan accent, instrument-grade layout with topbar + sidebar). Phase 1 uses object detection only (no pose estimation). The frontend connects to the same FastAPI WebSocket/REST endpoints — no backend API changes needed.

**Tech Stack:** React 19, Vite 8, TypeScript 5.9, CSS Custom Properties (design tokens), FastAPI, Ultralytics YOLO26, OpenCV, WebSocket (binary JPEG + JSON detections), Docker Compose

---

## Source Reference

- **deepeye_lite**: `/home/kim_3090/deepeye/deepeye_lite/` — backend, docker configs, frontend logic reference
- **design system**: `/home/kim_3090/sample/design/` — `tunnel-monitor.html`, `tunnel-cameras.html`
- **target project**: `/home/kim_3090/sample/`

## File Structure

```
/home/kim_3090/sample/
├── design/                          # (existing) Design reference — DO NOT MODIFY
│   ├── tunnel-monitor.html
│   └── tunnel-cameras.html
├── backend/                         # Copied from deepeye_lite (minimal changes)
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── webcam.py
│   │   ├── ipcam.py
│   │   ├── streaming/
│   │   │   ├── capture.py
│   │   │   └── manager.py
│   │   └── inference/
│   │       ├── __init__.py
│   │       ├── worker.py
│   │       └── models_dir.py
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── styles/
│   │   │   └── tokens.css          # NEW: design system tokens + global resets
│   │   ├── layouts/
│   │   │   ├── Shell.tsx           # NEW: topbar + sidebar + main wrapper
│   │   │   ├── Topbar.tsx          # NEW: system status bar
│   │   │   └── Sidebar.tsx         # NEW: navigation sidebar
│   │   ├── pages/
│   │   │   ├── MonitorPage.tsx     # NEW: live stream + detections + HUD (replaces WebcamPage + IpcamPage stream view)
│   │   │   └── CamerasPage.tsx     # NEW: camera CRUD table (replaces IpcamPage table)
│   │   ├── components/
│   │   │   ├── BboxOverlay.tsx     # KEEP from deepeye_lite (detection canvas overlay)
│   │   │   ├── StreamViewer.tsx    # NEW: video frame + corner brackets + HUD chips + scanline
│   │   │   ├── TrackPanel.tsx      # NEW: right rail detection list
│   │   │   ├── CameraTabs.tsx      # NEW: camera selector tabs
│   │   │   ├── StreamControls.tsx  # NEW: control bar below stream
│   │   │   ├── CameraTable.tsx     # NEW: camera registry table
│   │   │   ├── CameraFormModal.tsx # NEW: add/edit camera modal
│   │   │   ├── Modal.tsx           # RESKIN from deepeye_lite
│   │   │   ├── ModelManagerModal.tsx   # RESKIN from deepeye_lite
│   │   │   ├── ModelSettingsModal.tsx  # RESKIN from deepeye_lite
│   │   │   ├── SegmentedToggle.tsx    # RESKIN from deepeye_lite
│   │   │   ├── Pill.tsx            # NEW: status pill/badge component
│   │   │   ├── Button.tsx          # NEW: btn/btn-primary/btn-ghost/btn-sm/btn-danger
│   │   │   └── Toast.tsx           # NEW: notification toast
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts     # NEW: extracted WS logic (connect, reconnect, binary+text)
│   │   │   └── useApi.ts           # NEW: API base URL helper
│   │   └── utils/
│   │       └── colors.ts           # KEEP from deepeye_lite
│   ├── index.html
│   ├── package.json                # Same deps as deepeye_lite
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── nginx.conf
│   ├── Dockerfile
│   ├── .env
│   └── .env.example
├── docker-compose.yml              # Copied from deepeye_lite
├── docker-compose.gpu.yml
├── mediamtx.yml
├── .env
└── .env.example
```

### Key Decisions

1. **No WebcamPage** — tunnel system uses IP cameras only (RTSP). Webcam endpoints kept in backend (no cost to remove), just no frontend route.
2. **No HomePage** — sidebar navigation replaces landing page. Default route → MonitorPage.
3. **No HlsPlayer** — WebSocket JPEG streaming (same as deepeye_lite v3.0).
4. **CSS tokens.css** replaces all inline styles — single source of truth for design system.
5. **useWebSocket hook** extracts common WS logic from WebcamPage/IpcamPage into reusable hook.
6. **ModelsPage removed** — model management accessed via ModelManagerModal from CamerasPage (same as deepeye_lite IpcamPage pattern).

---

## Task 1: Project Scaffolding — Copy Backend & Docker Config

**Files:**
- Copy: `backend/` entire directory from deepeye_lite
- Copy: `docker-compose.yml`, `docker-compose.gpu.yml`, `mediamtx.yml`, `.env`, `.env.example` from deepeye_lite
- Create: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`, `frontend/index.html`, `frontend/.env.example`, `frontend/nginx.conf`, `frontend/Dockerfile`, `frontend/eslint.config.js`

- [ ] **Step 1: Copy backend and docker files**

```bash
cd /home/kim_3090/sample

# Backend
cp -r /home/kim_3090/deepeye/deepeye_lite/backend .

# Docker configs
cp /home/kim_3090/deepeye/deepeye_lite/docker-compose.yml .
cp /home/kim_3090/deepeye/deepeye_lite/docker-compose.gpu.yml .
cp /home/kim_3090/deepeye/deepeye_lite/mediamtx.yml .
cp /home/kim_3090/deepeye/deepeye_lite/.env .
cp /home/kim_3090/deepeye/deepeye_lite/.env.example .
```

- [ ] **Step 2: Create frontend project structure**

```bash
cd /home/kim_3090/sample
mkdir -p frontend/src/{styles,layouts,pages,components,hooks,utils}
```

- [ ] **Step 3: Create frontend/package.json**

```json
{
  "name": "tunnel-monitor",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.13.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.28.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^4.5.2",
    "eslint": "^9.28.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.1.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.33.1",
    "vite": "^8.0.0"
  }
}
```

Note: `hls.js` removed (not used in this project).

- [ ] **Step 4: Create frontend/vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 5: Create frontend/tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 6: Create frontend/tsconfig.app.json**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsBuildInfo",
    "target": "ES2023",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

- [ ] **Step 7: Create frontend/tsconfig.node.json**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsBuildInfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 8: Create frontend/index.html**

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tunnel Monitor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Create frontend/.env.example**

```
VITE_API_PORT=8000
```

- [ ] **Step 10: Create frontend/nginx.conf**

Copy from deepeye_lite:
```bash
cp /home/kim_3090/deepeye/deepeye_lite/frontend/nginx.conf /home/kim_3090/sample/frontend/
```

- [ ] **Step 11: Create frontend/Dockerfile**

Copy from deepeye_lite and remove VITE_HLS_PORT references:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_PORT
RUN test -n "$VITE_API_PORT" || (echo "VITE_API_PORT is required" && exit 1)
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 12: Create frontend/eslint.config.js**

```bash
cp /home/kim_3090/deepeye/deepeye_lite/frontend/eslint.config.js /home/kim_3090/sample/frontend/
```

- [ ] **Step 13: Install dependencies and verify build**

```bash
cd /home/kim_3090/sample/frontend
npm install
```

- [ ] **Step 14: Commit**

```bash
cd /home/kim_3090/sample
git init
git add backend/ docker-compose.yml docker-compose.gpu.yml mediamtx.yml .env .env.example frontend/
git commit -m "feat: scaffold tunnel-monitor project from deepeye_lite"
```

---

## Task 2: Design Tokens — CSS Custom Properties & Global Resets

**Files:**
- Create: `frontend/src/styles/tokens.css`

This is the single source of truth for the entire design system, extracted from the tunnel design HTML files.

- [ ] **Step 1: Create tokens.css**

```css
/* Tunnel Monitor Design System
   "instrument-grade" dark UI — single cyan accent + neutral grays */

/* ── External Fonts ── */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@200;300;400;500;600&display=swap');
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');

:root {
  /* ── Surfaces ── */
  --bg-base:      #0a0c10;
  --bg-surface:   #10131a;
  --bg-elevated:  #161a23;
  --bg-overlay:   rgba(8, 10, 14, 0.72);

  /* ── Borders ── */
  --hairline:        rgba(255, 255, 255, 0.06);
  --hairline-strong: rgba(255, 255, 255, 0.10);
  --hairline-focus:  rgba(255, 255, 255, 0.18);

  /* ── Text ── */
  --text-primary:   #e7eaf0;
  --text-secondary: #9aa3b2;
  --text-muted:     #5f6776;
  --text-faint:     #3e4452;

  /* ── Accent ── */
  --accent:        #5EEAD4;
  --accent-dim:    #2DD4BF;
  --accent-glow:   rgba(94, 234, 212, 0.14);
  --accent-faint:  rgba(94, 234, 212, 0.06);

  /* ── Semantic Status ── */
  --ok:       #4ADE80;
  --ok-dim:   rgba(74, 222, 128, 0.12);
  --warn:     #FBBF24;
  --warn-dim: rgba(251, 191, 36, 0.12);
  --crit:     #F87171;
  --crit-dim: rgba(248, 113, 113, 0.14);
  --crit-glow: rgba(248, 113, 113, 0.35);

  /* ── Spacing (8pt base) ── */
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 24px;
  --s-6: 32px;
  --s-7: 48px;
  --s-8: 64px;

  /* ── Radius ── */
  --r-1: 2px;
  --r-2: 4px;
  --r-3: 6px;

  /* ── Fonts ── */
  --font-sans: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Consolas, monospace;

  /* ── Layout ── */
  --topbar-h: 36px;
  --sidebar-w: 220px;
}

/* ── Resets ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root {
  height: 100%;
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-feature-settings: "ss01", "cv02";
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-size: 14px;
  line-height: 1.45;
}

button { font-family: inherit; cursor: pointer; }
a { color: inherit; text-decoration: none; }
input { font-family: inherit; }

/* ── Dot grid background ── */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0);
  background-size: 24px 24px;
  z-index: 0;
}

/* ── Utility classes ── */
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

.eyebrow {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-weight: 500;
}

.h1 {
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.15;
}

.h2 {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

/* ── Animations ── */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--hairline-strong); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--hairline-focus); }
```

- [ ] **Step 2: Verify no syntax errors**

```bash
cd /home/kim_3090/sample/frontend
# tokens.css is valid if Vite can import it
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/tokens.css
git commit -m "feat: add tunnel design system tokens"
```

---

## Task 3: Entry Point & Utilities

**Files:**
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/hooks/useApi.ts`
- Create: `frontend/src/hooks/useWebSocket.ts`
- Create: `frontend/src/utils/colors.ts`

- [ ] **Step 1: Create main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/tokens.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 2: Create useApi.ts**

```typescript
const API_PORT = import.meta.env.VITE_API_PORT || "8000";

export function apiBase(): string {
  return `http://${window.location.hostname}:${API_PORT}`;
}

export function wsBase(): string {
  return `ws://${window.location.hostname}:${API_PORT}`;
}
```

- [ ] **Step 3: Create useWebSocket.ts**

This hook extracts the binary JPEG + JSON detection WebSocket pattern used by both WebcamPage and IpcamPage in deepeye_lite.

```typescript
import { useEffect, useRef, useState, useCallback } from "react";
import { wsBase } from "./useApi";

export interface Detection {
  class_id: number;
  name: string;
  conf: number;
  xyxy: [number, number, number, number];
  model: string;
}

interface WsState {
  connected: boolean;
  imgSrc: string;
  detections: Detection[];
}

export function useWebSocket(path: string | null): WsState {
  const [connected, setConnected] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [detections, setDetections] = useState<Detection[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const prevBlobRef = useRef("");

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (prevBlobRef.current) {
      URL.revokeObjectURL(prevBlobRef.current);
      prevBlobRef.current = "";
    }
  }, []);

  useEffect(() => {
    if (!path) {
      cleanup();
      setConnected(false);
      setImgSrc("");
      setDetections([]);
      return;
    }

    let reconnectTimer: ReturnType<typeof setTimeout>;
    let disposed = false;

    function connect() {
      if (disposed) return;
      const ws = new WebSocket(`${wsBase()}${path}`);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (ev) => {
        if (ev.data instanceof ArrayBuffer) {
          const blob = new Blob([ev.data], { type: "image/jpeg" });
          const url = URL.createObjectURL(blob);
          if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
          prevBlobRef.current = url;
          setImgSrc(url);
        } else {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === "detections") {
              setDetections(msg.items ?? []);
            }
          } catch { /* ignore parse errors */ }
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!disposed) reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      cleanup();
    };
  }, [path, cleanup]);

  return { connected, imgSrc, detections };
}
```

- [ ] **Step 4: Copy colors.ts from deepeye_lite**

```bash
cp /home/kim_3090/deepeye/deepeye_lite/frontend/src/utils/colors.ts /home/kim_3090/sample/frontend/src/utils/
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/main.tsx frontend/src/hooks/ frontend/src/utils/
git commit -m "feat: add entry point, WebSocket hook, and color utilities"
```

---

## Task 4: Layout Shell — Topbar + Sidebar

**Files:**
- Create: `frontend/src/layouts/Topbar.tsx`
- Create: `frontend/src/layouts/Sidebar.tsx`
- Create: `frontend/src/layouts/Shell.tsx`

- [ ] **Step 1: Create Topbar.tsx**

```tsx
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
```

- [ ] **Step 2: Create Sidebar.tsx**

```tsx
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiBase } from "../hooks/useApi";

interface CamSummary { total: number; online: number; }

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

const NAV = [
  { to: "/", label: "Monitor", icon: "M1,2 h12v9H1z M5,13h4" },
  { to: "/cameras", label: "Cameras", icon: "M7,4.5a2.5,2.5 0 1,0 0,5 2.5,2.5 0 0,0 0-5z M3,4 11,4 12,6 12,11 2,11 2,6z" },
];

export default function Sidebar() {
  const location = useLocation();
  const [summary, setSummary] = useState<CamSummary>({ total: 0, online: 0 });

  useEffect(() => {
    fetch(`${apiBase()}/api/ipcams`)
      .then((r) => r.json())
      .then((cams: unknown[]) => setSummary({ total: cams.length, online: cams.length }))
      .catch(() => {});
  }, [location.pathname]);

  return (
    <nav style={S.sidebar}>
      <div style={S.sectionLabel}>Workspace</div>
      {NAV.map((n) => {
        const active = n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to);
        return (
          <Link key={n.to} to={n.to} style={{ ...S.navItem, ...(active ? S.navActive : {}) }}>
            <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.4}>
              <path d={n.icon} />
            </svg>
            {n.label}
          </Link>
        );
      })}

      <div style={{ ...S.sectionLabel, marginTop: "var(--s-6)" }}>System</div>
      <Link to="/settings" style={S.navItem}>
        <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.4}>
          <circle cx={7} cy={7} r={2} />
          <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8 4.2 4.2M9.8 9.8 11.2 11.2M2.8 11.2 4.2 9.8M9.8 4.2 11.2 2.8" />
        </svg>
        Settings
      </Link>

      <div style={S.foot}>
        <div style={S.footRow}>
          <span>CAM</span>
          <span style={{ color: "var(--ok)" }}>{summary.online} / {summary.total} ONLINE</span>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Create Shell.tsx**

```tsx
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

const S: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    paddingTop: "var(--topbar-h)",
    position: "relative",
    zIndex: 1,
  },
  main: {
    flex: 1,
    marginLeft: "var(--sidebar-w)",
    padding: "var(--s-6) var(--s-5)",
    maxWidth: 1600,
    minWidth: 0,
  },
};

export default function Shell() {
  return (
    <>
      <Topbar />
      <div style={S.shell}>
        <Sidebar />
        <main style={S.main}>
          <Outlet />
        </main>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/layouts/
git commit -m "feat: add Shell layout with Topbar and Sidebar"
```

---

## Task 5: Core UI Components — Button, Pill, Modal, Toast

**Files:**
- Create: `frontend/src/components/Button.tsx`
- Create: `frontend/src/components/Pill.tsx`
- Create: `frontend/src/components/Modal.tsx`
- Create: `frontend/src/components/Toast.tsx`
- Create: `frontend/src/components/SegmentedToggle.tsx`

- [ ] **Step 1: Create Button.tsx**

```tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "primary" | "ghost" | "danger";
type Size = "md" | "sm";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  fontFamily: "inherit", fontSize: 12, fontWeight: 500, letterSpacing: "0.02em",
  borderRadius: "var(--r-1)",
  border: "1px solid var(--hairline-strong)",
  background: "transparent", color: "var(--text-primary)",
  cursor: "pointer", whiteSpace: "nowrap",
  transition: "border-color .15s, background .15s, color .15s",
};

const sizes: Record<Size, React.CSSProperties> = {
  md: { height: 32, padding: "0 14px" },
  sm: { height: 26, padding: "0 10px", fontSize: 11 },
};

const variants: Record<Variant, React.CSSProperties> = {
  default: {},
  primary: {
    background: "var(--accent)", borderColor: "var(--accent)",
    color: "#0a0c10", fontWeight: 600,
  },
  ghost: { borderColor: "transparent", color: "var(--text-secondary)" },
  danger: { color: "var(--crit)", borderColor: "rgba(248,113,113,0.25)" },
};

export default function Button({ variant = "default", size = "md", style, ...rest }: Props) {
  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      {...rest}
    />
  );
}
```

- [ ] **Step 2: Create Pill.tsx**

```tsx
type Status = "ok" | "warn" | "crit" | "off" | "default";

interface Props {
  status?: Status;
  children: React.ReactNode;
  dot?: boolean;
  style?: React.CSSProperties;
}

const pillBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "3px 8px", borderRadius: 2,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--hairline)",
  fontSize: 11, fontFamily: "var(--font-mono)",
  letterSpacing: "0.04em", textTransform: "uppercase" as const,
  color: "var(--text-secondary)", whiteSpace: "nowrap" as const,
};

const statusColors: Record<Status, React.CSSProperties> = {
  ok: { color: "var(--ok)" },
  warn: { color: "var(--warn)" },
  crit: { color: "var(--crit)" },
  off: {},
  default: {},
};

const dotColors: Record<Status, React.CSSProperties> = {
  ok: { background: "var(--ok)", boxShadow: "0 0 6px var(--ok)" },
  warn: { background: "var(--warn)" },
  crit: { background: "var(--crit)", boxShadow: "0 0 8px var(--crit-glow)", animation: "pulse 1.4s ease-in-out infinite" },
  off: { background: "var(--text-muted)" },
  default: { background: "var(--text-muted)" },
};

export default function Pill({ status = "default", children, dot = true, style }: Props) {
  return (
    <span style={{ ...pillBase, ...statusColors[status], ...style }}>
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, ...dotColors[status] }} />
      )}
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Create Modal.tsx**

Reskinned version of deepeye_lite's Modal with tunnel design system styling:

```tsx
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
  corner: (pos: "tl" | "tr" | "bl" | "br"): React.CSSProperties => ({
    position: "absolute",
    width: 10, height: 10,
    borderColor: "var(--accent)", borderStyle: "solid", borderWidth: 0,
    opacity: 0.85,
    ...(pos === "tl" ? { top: -1, left: -1, borderTopWidth: 1, borderLeftWidth: 1 } : {}),
    ...(pos === "tr" ? { top: -1, right: -1, borderTopWidth: 1, borderRightWidth: 1 } : {}),
    ...(pos === "bl" ? { bottom: -1, left: -1, borderBottomWidth: 1, borderLeftWidth: 1 } : {}),
    ...(pos === "br" ? { bottom: -1, right: -1, borderBottomWidth: 1, borderRightWidth: 1 } : {}),
  }),
};

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
        <span style={S.corner("tl")} /><span style={S.corner("tr")} />
        <span style={S.corner("bl")} /><span style={S.corner("br")} />
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
```

- [ ] **Step 4: Create Toast.tsx**

```tsx
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
```

- [ ] **Step 5: Create SegmentedToggle.tsx**

Copy from deepeye_lite and reskin with tunnel tokens:

```tsx
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
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Button.tsx frontend/src/components/Pill.tsx frontend/src/components/Modal.tsx frontend/src/components/Toast.tsx frontend/src/components/SegmentedToggle.tsx
git commit -m "feat: add core UI components (Button, Pill, Modal, Toast, Toggle)"
```

---

## Task 6: BboxOverlay — Copy from deepeye_lite

**Files:**
- Copy: `frontend/src/components/BboxOverlay.tsx`

- [ ] **Step 1: Copy BboxOverlay.tsx**

```bash
cp /home/kim_3090/deepeye/deepeye_lite/frontend/src/components/BboxOverlay.tsx /home/kim_3090/sample/frontend/src/components/
```

This component is framework-agnostic (uses canvas API) and does not depend on any styling system. Keep as-is.

- [ ] **Step 2: Verify Detection interface matches useWebSocket hook**

The BboxOverlay component exports its own `Detection` interface. The `useWebSocket` hook also defines `Detection`. Both should match the backend JSON format:
```typescript
{ class_id, name, conf, xyxy, model }
```

If they differ, update `useWebSocket.ts` to re-export BboxOverlay's `Detection` type:

```typescript
// In useWebSocket.ts, replace the Detection interface with:
import type { Detection } from "../components/BboxOverlay";
export type { Detection };
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/BboxOverlay.tsx
git commit -m "feat: add BboxOverlay component from deepeye_lite"
```

---

## Task 7: Stream Components — StreamViewer, CameraTabs, TrackPanel, StreamControls

**Files:**
- Create: `frontend/src/components/StreamViewer.tsx`
- Create: `frontend/src/components/CameraTabs.tsx`
- Create: `frontend/src/components/TrackPanel.tsx`
- Create: `frontend/src/components/StreamControls.tsx`

- [ ] **Step 1: Create CameraTabs.tsx**

```tsx
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

const dotStyle = (status: Camera["status"]): React.CSSProperties => ({
  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
  background: status === "ok" ? "var(--ok)" : status === "crit" ? "var(--crit)" : "var(--text-muted)",
  boxShadow: status === "ok" ? "0 0 6px var(--ok)" : status === "crit" ? "0 0 8px var(--crit-glow)" : "none",
  ...(status === "crit" ? { animation: "pulse 1.4s ease-in-out infinite" } : {}),
});

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
```

- [ ] **Step 2: Create StreamViewer.tsx**

```tsx
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
  corner: (pos: "tl" | "tr" | "bl" | "br"): React.CSSProperties => ({
    position: "absolute",
    width: 14, height: 14,
    borderColor: "var(--accent)", borderStyle: "solid", borderWidth: 0,
    zIndex: 3, opacity: 0.7,
    ...(pos === "tl" ? { top: 8, left: 8, borderTopWidth: 1, borderLeftWidth: 1 } : {}),
    ...(pos === "tr" ? { top: 8, right: 8, borderTopWidth: 1, borderRightWidth: 1 } : {}),
    ...(pos === "bl" ? { bottom: 8, left: 8, borderBottomWidth: 1, borderLeftWidth: 1 } : {}),
    ...(pos === "br" ? { bottom: 8, right: 8, borderBottomWidth: 1, borderRightWidth: 1 } : {}),
  }),
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
  scanline: {
    position: "absolute", inset: 0,
    background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px)",
    pointerEvents: "none" as const, zIndex: 1,
  },
};

export default function StreamViewer({ imgSrc, detections, connected, cameraName, streamKey, settings }: Props) {
  const hasAlert = detections.some((d) => d.conf > 0.8);

  return (
    <div style={{ ...S.stream, ...(hasAlert ? S.streamCrit : {}) }}>
      {/* Corner brackets */}
      <span style={S.corner("tl")} />
      <span style={S.corner("tr")} />
      <span style={S.corner("bl")} />
      <span style={S.corner("br")} />

      {/* Scanline overlay */}
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

      {/* HUD — top left */}
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

      {/* HUD — bottom left */}
      <div style={{ ...S.hud, bottom: 14, left: 14 }}>
        <span style={S.chip}>{detections.length} detected</span>
      </div>

      {/* HUD — bottom right */}
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
```

- [ ] **Step 3: Create TrackPanel.tsx**

```tsx
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
```

- [ ] **Step 4: Create StreamControls.tsx**

```tsx
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
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/StreamViewer.tsx frontend/src/components/CameraTabs.tsx frontend/src/components/TrackPanel.tsx frontend/src/components/StreamControls.tsx
git commit -m "feat: add stream viewer, camera tabs, track panel, and stream controls"
```

---

## Task 8: ModelManagerModal & ModelSettingsModal — Copy & Reskin

**Files:**
- Copy + Modify: `frontend/src/components/ModelManagerModal.tsx`
- Copy + Modify: `frontend/src/components/ModelSettingsModal.tsx`

- [ ] **Step 1: Copy both files from deepeye_lite**

```bash
cp /home/kim_3090/deepeye/deepeye_lite/frontend/src/components/ModelManagerModal.tsx /home/kim_3090/sample/frontend/src/components/
cp /home/kim_3090/deepeye/deepeye_lite/frontend/src/components/ModelSettingsModal.tsx /home/kim_3090/sample/frontend/src/components/
```

- [ ] **Step 2: Update import paths in both files**

In both files, update the Modal import:
- Old: `import Modal from "./Modal"` — should still work since our Modal has the same props interface but adds `subtitle` and `footer` props.

Verify the import paths for `apiBase` match our project:
- If original uses inline `http://${hostname}:${port}`, replace with `import { apiBase } from "../hooks/useApi"`.

- [ ] **Step 3: Reskin inline styles**

In both modals, replace deepeye_lite color values with tunnel design tokens:
- `#1a1a2e` → `var(--bg-base)`
- `#16213e` → `var(--bg-surface)`
- `#0f3460` → `var(--bg-elevated)`
- `#ffffff` / `#fff` → `var(--text-primary)`
- `#aaaaaa` / `#aaa` → `var(--text-secondary)`
- `#7a7a8a` / `#888` → `var(--text-muted)`
- `#4caf50` / `#4ade80` → `var(--ok)`
- `#f87171` / `#e74c3c` → `var(--crit)`
- `#2563eb` → `var(--accent)`
- Border values: `1px solid #333` → `1px solid var(--hairline)`
- Font families: add `fontFamily: "var(--font-mono)"` to monospace elements

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ModelManagerModal.tsx frontend/src/components/ModelSettingsModal.tsx
git commit -m "feat: add model management modals (reskinned from deepeye_lite)"
```

---

## Task 9: CameraFormModal — Camera Registration

**Files:**
- Create: `frontend/src/components/CameraFormModal.tsx`

- [ ] **Step 1: Create CameraFormModal.tsx**

```tsx
import { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";

interface IpCam {
  id: number;
  name: string;
  rtsp_url: string;
  stream_key: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editCam?: IpCam | null;
  apiBase: string;
}

const fieldStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "var(--s-2)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, color: "var(--text-secondary)",
  letterSpacing: "0.14em", textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
  height: 36, padding: "0 12px",
  background: "var(--bg-base)",
  border: "1px solid var(--hairline-strong)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-sans)",
  fontSize: 13, outline: "none",
};

const inputMonoStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: "var(--font-mono)",
  fontSize: 12, letterSpacing: "0.02em",
};

const hintStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 10,
  color: "var(--text-muted)", letterSpacing: "0.04em", lineHeight: 1.5,
};

export default function CameraFormModal({ open, onClose, onSaved, editCam, apiBase: api }: Props) {
  const [name, setName] = useState("");
  const [rtspUrl, setRtspUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(editCam?.name ?? "");
      setRtspUrl(editCam?.rtsp_url ?? "");
      setError("");
    }
  }, [open, editCam]);

  async function handleSubmit() {
    if (!name.trim() || !rtspUrl.trim()) {
      setError("이름과 RTSP URL을 입력하세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const method = editCam ? "PUT" : "POST";
      const url = editCam ? `${api}/api/ipcams/${editCam.id}` : `${api}/api/ipcams`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), rtsp_url: rtspUrl.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editCam ? "Edit Camera" : "Register Camera"}
      subtitle={editCam ? `editing ${editCam.stream_key}` : "add rtsp stream to registry"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={busy}>
            {busy ? "..." : editCam ? "저장" : "등록"}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>카메라 이름</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 터널 입구 카메라"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>RTSP URL</label>
          <input
            style={inputMonoStyle}
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            placeholder="rtsp://192.168.1.100:554/stream1"
          />
          <div style={hintStyle}>
            형식 — rtsp://[user:pass@]IP:PORT/PATH<br />
            지원 코덱 — H.264, H.265 (HEVC)
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "var(--crit)" }}>{error}</div>
        )}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/CameraFormModal.tsx
git commit -m "feat: add camera registration/edit modal"
```

---

## Task 10: CamerasPage — Camera Management Table

**Files:**
- Create: `frontend/src/pages/CamerasPage.tsx`

- [ ] **Step 1: Create CamerasPage.tsx**

This page combines IpcamPage's CRUD + per-camera inference control + the tunnel-cameras.html table design.

```tsx
import { useEffect, useState, useCallback } from "react";
import { apiBase } from "../hooks/useApi";
import Button from "../components/Button";
import Pill from "../components/Pill";
import SegmentedToggle from "../components/SegmentedToggle";
import CameraFormModal from "../components/CameraFormModal";
import ModelManagerModal from "../components/ModelManagerModal";
import { showToast } from "../components/Toast";

interface IpCam {
  id: number;
  name: string;
  rtsp_url: string;
  stream_key: string;
  created_at: string;
}

interface CamStats {
  active: boolean;
  source_fps: number;
  inference_fps: number;
}

const api = apiBase();

const S: Record<string, React.CSSProperties> = {
  pageHead: {
    display: "flex", alignItems: "flex-end", justifyContent: "space-between",
    gap: "var(--s-5)", marginBottom: "var(--s-5)",
  },
  left: { display: "flex", flexDirection: "column", gap: 6 },
  actions: { display: "flex", gap: "var(--s-2)", alignItems: "center" },
  metaStrip: {
    display: "flex", gap: "var(--s-5)",
    fontFamily: "var(--font-mono)", fontSize: 11,
    color: "var(--text-muted)", letterSpacing: "0.04em",
  },
  summary: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
    border: "1px solid var(--hairline)",
    background: "var(--bg-surface)",
    marginBottom: "var(--s-5)",
  },
  cell: {
    padding: "var(--s-4) var(--s-5)",
    borderRight: "1px solid var(--hairline)",
  },
  cellLabel: {
    fontSize: 10, color: "var(--text-muted)",
    letterSpacing: "0.16em", textTransform: "uppercase" as const,
    fontWeight: 500, marginBottom: "var(--s-2)",
  },
  cellValue: {
    fontFamily: "var(--font-mono)", fontWeight: 200,
    fontSize: 34, lineHeight: 1,
    color: "var(--text-primary)", letterSpacing: "-0.02em",
    fontVariantNumeric: "tabular-nums",
  },
  tableWrap: {
    border: "1px solid var(--hairline)",
    background: "var(--bg-surface)",
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: {
    textAlign: "left" as const, padding: "10px var(--s-4)",
    background: "rgba(255,255,255,0.015)",
    color: "var(--text-muted)", fontSize: 10, fontWeight: 500,
    borderBottom: "1px solid var(--hairline)",
    textTransform: "uppercase" as const, letterSpacing: "0.14em",
  },
  td: {
    padding: "14px var(--s-4)",
    borderBottom: "1px solid var(--hairline)",
    verticalAlign: "middle" as const,
    color: "var(--text-primary)",
  },
  camId: {
    fontFamily: "var(--font-mono)", fontSize: 11,
    color: "var(--text-muted)", letterSpacing: "0.1em",
  },
  camName: {
    color: "var(--text-primary)", marginTop: 2,
    fontSize: 13, fontWeight: 500,
  },
  url: {
    fontFamily: "var(--font-mono)", fontSize: 11,
    color: "var(--text-secondary)", letterSpacing: "0.02em",
    overflow: "hidden", textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const, display: "block", maxWidth: 360,
  },
  fps: {
    fontFamily: "var(--font-mono)", fontSize: 13,
    color: "var(--ok)", fontVariantNumeric: "tabular-nums",
  },
  actionCell: { textAlign: "right" as const, whiteSpace: "nowrap" as const },
  sectionHead: {
    display: "flex", alignItems: "center", gap: "var(--s-4)",
    margin: "var(--s-6) 0 var(--s-4)",
  },
  sectionRule: { flex: 1, height: 1, background: "var(--hairline)" },
};

export default function CamerasPage() {
  const [cams, setCams] = useState<IpCam[]>([]);
  const [stats, setStats] = useState<Record<string, CamStats>>({});
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [modelsByCam, setModelsByCam] = useState<Record<string, string[]>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editCam, setEditCam] = useState<IpCam | null>(null);
  const [modelModalCam, setModelModalCam] = useState<IpCam | null>(null);

  const fetchCams = useCallback(async () => {
    try {
      const res = await fetch(`${api}/api/ipcams`);
      const data: IpCam[] = await res.json();
      setCams(data);
      for (const cam of data) {
        fetch(`${api}/api/ipcams/${cam.stream_key}/inference`)
          .then((r) => r.json())
          .then((inf) => {
            setEnabled((p) => ({ ...p, [cam.stream_key]: inf.enabled ?? false }));
            setModelsByCam((p) => ({ ...p, [cam.stream_key]: inf.models ?? [] }));
          })
          .catch(() => {});
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCams(); }, [fetchCams]);

  useEffect(() => {
    if (cams.length === 0) return;
    const id = setInterval(() => {
      for (const cam of cams) {
        fetch(`${api}/api/ipcams/${cam.stream_key}/stats`)
          .then((r) => r.json())
          .then((s) => setStats((p) => ({ ...p, [cam.stream_key]: s })))
          .catch(() => {});
      }
    }, 1000);
    return () => clearInterval(id);
  }, [cams]);

  async function toggleInference(cam: IpCam, val: boolean) {
    setEnabled((p) => ({ ...p, [cam.stream_key]: val }));
    await fetch(`${api}/api/ipcams/${cam.stream_key}/inference`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: val }),
    }).catch(() => {});
  }

  async function deleteCam(cam: IpCam) {
    if (!confirm(`${cam.name} 삭제?`)) return;
    await fetch(`${api}/api/ipcams/${cam.id}`, { method: "DELETE" });
    showToast({ message: `${cam.name} 삭제됨` });
    fetchCams();
  }

  function handleModelsChange(streamKey: string, models: string[]) {
    setModelsByCam((p) => ({ ...p, [streamKey]: models }));
    fetch(`${api}/api/ipcams/${streamKey}/inference`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ models }),
    }).catch(() => {});
    if (models.length === 0) {
      setEnabled((p) => ({ ...p, [streamKey]: false }));
    }
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  return (
    <>
      {/* Page header */}
      <div style={S.pageHead}>
        <div style={S.left}>
          <span className="eyebrow">Device Registry</span>
          <h1 className="h1">Camera Management</h1>
          <div style={S.metaStrip}>
            <span><span style={{ color: "var(--text-secondary)" }}>{dateStr}</span> · KST</span>
          </div>
        </div>
        <div style={S.actions}>
          <Button variant="primary" onClick={() => { setEditCam(null); setFormOpen(true); }}>
            + 카메라 등록
          </Button>
        </div>
      </div>

      {/* Summary */}
      <section style={S.summary}>
        <div style={S.cell}>
          <div style={S.cellLabel}>Total Cameras</div>
          <div style={S.cellValue}>{cams.length}</div>
        </div>
        <div style={{ ...S.cell }}>
          <div style={S.cellLabel}>Online</div>
          <div style={S.cellValue}>
            {Object.values(stats).filter((s) => s.active).length}
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>/ {cams.length}</span>
          </div>
        </div>
        <div style={S.cell}>
          <div style={S.cellLabel}>Inference Active</div>
          <div style={S.cellValue}>
            {Object.values(enabled).filter(Boolean).length}
          </div>
        </div>
        <div style={{ ...S.cell, borderRight: "none" }}>
          <div style={S.cellLabel}>Models Loaded</div>
          <div style={S.cellValue}>
            {new Set(Object.values(modelsByCam).flat()).size}
          </div>
        </div>
      </section>

      {/* Section heading */}
      <div style={S.sectionHead}>
        <span className="h2">Registered Cameras</span>
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 11 }}>
          {String(cams.length).padStart(2, "0")} · devices
        </span>
        <span style={S.sectionRule} />
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: 160 }}>Identifier</th>
              <th style={S.th}>Stream URL</th>
              <th style={{ ...S.th, width: 120 }}>Status</th>
              <th style={{ ...S.th, width: 100 }}>Models</th>
              <th style={{ ...S.th, width: 80 }}>FPS</th>
              <th style={{ ...S.th, width: 100 }}>Inference</th>
              <th style={{ ...S.th, width: 160, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cams.map((cam) => {
              const st = stats[cam.stream_key];
              const active = st?.active ?? false;
              const models = modelsByCam[cam.stream_key] ?? [];
              const inf = enabled[cam.stream_key] ?? false;

              return (
                <tr key={cam.id}>
                  <td style={S.td}>
                    <div style={S.camId}>CAM-{String(cam.id).padStart(2, "0")}</div>
                    <div style={S.camName}>{cam.name}</div>
                  </td>
                  <td style={S.td}>
                    <span style={S.url}>{cam.rtsp_url}</span>
                  </td>
                  <td style={S.td}>
                    <Pill status={active ? "ok" : "off"}>
                      {active ? "Online" : "Offline"}
                    </Pill>
                  </td>
                  <td style={S.td}>
                    <Button size="sm" onClick={() => setModelModalCam(cam)}>
                      모델 {models.length > 0 && `(${models.length})`}
                    </Button>
                  </td>
                  <td style={{ ...S.td, ...S.fps }}>
                    {active ? (st?.source_fps ?? 0).toFixed(1) : "—"}
                  </td>
                  <td style={S.td}>
                    <SegmentedToggle
                      enabled={inf}
                      onChange={(v) => toggleInference(cam, v)}
                      disabled={models.length === 0}
                    />
                  </td>
                  <td style={{ ...S.td, ...S.actionCell }}>
                    <Button size="sm" onClick={() => { setEditCam(cam); setFormOpen(true); }} style={{ marginLeft: 4 }}>
                      수정
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => deleteCam(cam)} style={{ marginLeft: 4 }}>
                      삭제
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <CameraFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => { fetchCams(); showToast({ message: editCam ? "카메라 수정 완료" : "카메라 등록 완료" }); }}
        editCam={editCam}
        apiBase={api}
      />

      {modelModalCam && (
        <ModelManagerModal
          open={!!modelModalCam}
          onClose={() => setModelModalCam(null)}
          cameraName={modelModalCam.name}
          selected={modelsByCam[modelModalCam.stream_key] ?? []}
          onSelectedChange={(m) => handleModelsChange(modelModalCam.stream_key, m)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/CamerasPage.tsx
git commit -m "feat: add CamerasPage with table, CRUD, and inference control"
```

---

## Task 11: MonitorPage — Live Stream Monitoring

**Files:**
- Create: `frontend/src/pages/MonitorPage.tsx`

- [ ] **Step 1: Create MonitorPage.tsx**

```tsx
import { useEffect, useState, useCallback } from "react";
import { apiBase } from "../hooks/useApi";
import { useWebSocket } from "../hooks/useWebSocket";
import CameraTabs from "../components/CameraTabs";
import type { Camera } from "../components/CameraTabs";
import StreamViewer from "../components/StreamViewer";
import TrackPanel from "../components/TrackPanel";
import StreamControls from "../components/StreamControls";

interface IpCam {
  id: number;
  name: string;
  rtsp_url: string;
  stream_key: string;
}

interface CamStats {
  active: boolean;
  source_fps: number;
  inference_fps: number;
}

const api = apiBase();

const S: Record<string, React.CSSProperties> = {
  pageHead: {
    display: "flex", alignItems: "flex-end", justifyContent: "space-between",
    gap: "var(--s-5)", marginBottom: "var(--s-5)",
  },
  left: { display: "flex", flexDirection: "column", gap: 6 },
  metaStrip: {
    display: "flex", gap: "var(--s-5)",
    fontFamily: "var(--font-mono)", fontSize: 11,
    color: "var(--text-muted)", letterSpacing: "0.04em",
  },
  streamWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 280px",
    gap: "var(--s-4)",
    marginBottom: "var(--s-5)",
  },
  empty: {
    display: "flex", alignItems: "center", justifyContent: "center",
    height: 400, border: "1px solid var(--hairline)",
    background: "var(--bg-surface)",
    color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12,
    letterSpacing: "0.06em",
  },
};

export default function MonitorPage() {
  const [cams, setCams] = useState<IpCam[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [camStats, setCamStats] = useState<Record<string, CamStats>>({});

  const fetchCams = useCallback(async () => {
    try {
      const res = await fetch(`${api}/api/ipcams`);
      const data: IpCam[] = await res.json();
      setCams(data);
      if (data.length > 0 && !activeKey) {
        setActiveKey(data[0].stream_key);
      }
    } catch { /* ignore */ }
  }, [activeKey]);

  useEffect(() => { fetchCams(); }, [fetchCams]);

  useEffect(() => {
    if (cams.length === 0) return;
    const id = setInterval(() => {
      for (const cam of cams) {
        fetch(`${api}/api/ipcams/${cam.stream_key}/stats`)
          .then((r) => r.json())
          .then((s) => setCamStats((p) => ({ ...p, [cam.stream_key]: s })))
          .catch(() => {});
      }
    }, 1000);
    return () => clearInterval(id);
  }, [cams]);

  const wsPath = activeKey ? `/api/ipcams/${activeKey}/ws` : null;
  const { connected, imgSrc, detections } = useWebSocket(wsPath);

  const activeCam = cams.find((c) => c.stream_key === activeKey);
  const activeStats = activeKey ? camStats[activeKey] : undefined;

  const cameras: Camera[] = cams.map((cam) => ({
    id: cam.id,
    name: cam.name,
    stream_key: cam.stream_key,
    status: camStats[cam.stream_key]?.active ? "ok" : "off" as const,
  }));

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  if (cams.length === 0) {
    return (
      <div style={S.empty}>
        카메라가 등록되지 않았습니다. Cameras 페이지에서 등록하세요.
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div style={S.pageHead}>
        <div style={S.left}>
          <span className="eyebrow">Live Monitor</span>
          <h1 className="h1">
            {activeCam ? `CAM-${String(activeCam.id).padStart(2, "0")} · ${activeCam.name}` : "Select Camera"}
          </h1>
          <div style={S.metaStrip}>
            <span><span style={{ color: "var(--text-secondary)" }}>{dateStr}</span> · KST</span>
            {activeCam && (
              <span>Stream <span style={{ color: "var(--text-secondary)" }}>{activeCam.rtsp_url}</span></span>
            )}
          </div>
        </div>
      </div>

      {/* Camera tabs */}
      <CameraTabs cameras={cameras} activeKey={activeKey} onSelect={setActiveKey} />

      {/* Stream + Track panel */}
      <div style={S.streamWrap}>
        <div>
          <StreamViewer
            imgSrc={imgSrc}
            detections={detections}
            connected={connected}
            cameraName={activeCam?.name ?? ""}
            streamKey={activeKey ?? ""}
          />
          <StreamControls
            sourceFps={activeStats?.source_fps ?? 0}
            inferenceFps={activeStats?.inference_fps ?? 0}
          />
        </div>
        <TrackPanel detections={detections} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/MonitorPage.tsx
git commit -m "feat: add MonitorPage with live stream viewer and detection panel"
```

---

## Task 12: App Router & Final Wiring

**Files:**
- Create: `frontend/src/App.tsx`

- [ ] **Step 1: Create App.tsx**

```tsx
import { Routes, Route } from "react-router-dom";
import Shell from "./layouts/Shell";
import MonitorPage from "./pages/MonitorPage";
import CamerasPage from "./pages/CamerasPage";
import Toast from "./components/Toast";

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<MonitorPage />} />
          <Route path="cameras" element={<CamerasPage />} />
        </Route>
      </Routes>
      <Toast />
    </>
  );
}
```

- [ ] **Step 2: Create frontend/.env (for local dev)**

```
VITE_API_PORT=8000
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd /home/kim_3090/sample/frontend
npx tsc --noEmit
```

Fix any type errors. Common issues:
- Missing `ModelSettings` export from `ModelSettingsModal.tsx`
- Import path mismatches between deepeye_lite originals and new project structure

- [ ] **Step 4: Verify Vite dev server starts**

```bash
cd /home/kim_3090/sample/frontend
npm run dev -- --port 3000
```

Open browser at `http://localhost:3000`. Expect:
- Topbar visible with "Tunnel · Operations" brand
- Sidebar with Monitor (active) and Cameras links
- Main area shows MonitorPage (empty state if no backend)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/.env
git commit -m "feat: wire up App router with Shell layout"
```

---

## Task 13: Docker Compose Integration & End-to-End Test

**Files:**
- Modify: `docker-compose.yml` (update frontend build context if needed)

- [ ] **Step 1: Verify docker-compose.yml frontend service points to ./frontend**

Check the `build` context for the frontend service. In deepeye_lite it's `./frontend`. Should match our structure. Update if needed.

- [ ] **Step 2: Ensure backend/.env has MEDIAMTX_API set**

```bash
grep MEDIAMTX_API /home/kim_3090/sample/backend/.env
```

If missing:
```
MEDIAMTX_API=http://mediamtx:9997
```

- [ ] **Step 3: Touch deepeye.db if missing**

```bash
touch /home/kim_3090/sample/backend/deepeye.db
```

- [ ] **Step 4: Build and run**

```bash
cd /home/kim_3090/sample
docker compose up -d --build
```

- [ ] **Step 5: End-to-end verification**

Open browser at `http://localhost:{FRONTEND_PORT}`:

1. **Layout**: Topbar shows "Tunnel · Operations", sidebar shows Monitor + Cameras
2. **Cameras page** (`/cameras`):
   - Summary row shows 0 cameras
   - Click "카메라 등록" → modal opens
   - Register a test RTSP stream
   - Camera appears in table
   - Select models via modal
   - Toggle inference ON/OFF
3. **Monitor page** (`/`):
   - Camera tabs show registered camera
   - Click → WebSocket connects
   - Video stream appears with corner brackets + HUD
   - Detections appear in TrackPanel
   - StreamControls show FPS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: complete tunnel-monitor Phase 1 — detection UI"
```

---

## Summary

| Task | Component | Est. |
|------|-----------|------|
| 1 | Project scaffolding (copy backend + configs) | 5 min |
| 2 | Design tokens CSS | 3 min |
| 3 | Entry point + utilities (hooks, colors) | 5 min |
| 4 | Layout shell (Topbar, Sidebar, Shell) | 5 min |
| 5 | Core UI (Button, Pill, Modal, Toast, Toggle) | 8 min |
| 6 | BboxOverlay copy | 2 min |
| 7 | Stream components (Viewer, Tabs, Panel, Controls) | 10 min |
| 8 | Model modals (copy + reskin) | 5 min |
| 9 | CameraFormModal | 3 min |
| 10 | CamerasPage | 8 min |
| 11 | MonitorPage | 8 min |
| 12 | App router + wiring | 5 min |
| 13 | Docker integration + E2E test | 10 min |
| **Total** | | **~77 min** |

### Phase 2 (Future)

After Phase 1 verified working:
- Swap YOLO26 detection → YOLOv8-pose (worker.py `_parse_results` + `FrameRequest`)
- Add skeleton overlay to StreamViewer (SVG lines between keypoints)
- Add pose-specific UI: Pose Distribution panel, Event Timeline, fall detection alerts
- Add pose semantic colors: standing=green, sitting=yellow, lying=red
