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
