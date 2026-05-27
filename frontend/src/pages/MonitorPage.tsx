import { useEffect, useState, useCallback, useRef } from "react";
import { apiBase } from "../hooks/useApi";
import { useWebSocket } from "../hooks/useWebSocket";
import CameraTabs from "../components/CameraTabs";
import type { Camera } from "../components/CameraTabs";
import StreamViewer from "../components/StreamViewer";
import PosePanel from "../components/PosePanel";
import type { PoseEvent } from "../components/PosePanel";
import { classifyPose } from "../utils/poseClassifier";
import type { PoseClass } from "../utils/poseClassifier";
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

  const [events, setEvents] = useState<PoseEvent[]>([]);
  const lastFallRef = useRef(0);
  const eventIdRef = useRef(0);

  useEffect(() => {
    if (detections.length === 0) return;
    const hasFall = detections.some((d) => d.keypoints && classifyPose(d.keypoints) === "lying");
    if (hasFall && Date.now() - lastFallRef.current > 5000) {
      lastFallRef.current = Date.now();
      const id = ++eventIdRef.current;
      setEvents((prev) => [{ id, type: "fall" as const, timestamp: Date.now(), cameraName: activeCam?.name ?? "" }, ...prev].slice(0, 50));
    }
  }, [detections, activeCam]);

  const activeStats = activeKey ? camStats[activeKey] : undefined;

  const cameras: Camera[] = cams.map((cam) => ({
    id: cam.id,
    name: cam.name,
    stream_key: cam.stream_key,
    status: camStats[cam.stream_key]?.active ? "ok" : "off" as const,
  }));

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  const distribution: Record<PoseClass, number> = { standing: 0, sitting: 0, lying: 0, unknown: 0 };
  for (const d of detections) {
    const pose = d.keypoints ? classifyPose(d.keypoints) : "unknown";
    distribution[pose]++;
  }

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
        <PosePanel distribution={distribution} total={detections.length} events={events} />
      </div>
    </>
  );
}
