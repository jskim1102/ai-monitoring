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

      <section style={S.summary}>
        <div style={S.cell}>
          <div style={S.cellLabel}>Total Cameras</div>
          <div style={S.cellValue}>{cams.length}</div>
        </div>
        <div style={S.cell}>
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

      <div style={S.sectionHead}>
        <span className="h2">Registered Cameras</span>
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 11 }}>
          {String(cams.length).padStart(2, "0")} · devices
        </span>
        <span style={S.sectionRule} />
      </div>

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
                      모델 {models.length > 0 ? `(${models.length})` : ""}
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
