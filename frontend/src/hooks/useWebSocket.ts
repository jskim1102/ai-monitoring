import { useEffect, useRef, useState, useCallback } from "react";
import { wsBase } from "./useApi";

export interface Detection {
  class_id: number;
  name: string;
  conf: number;
  xyxy: [number, number, number, number];
  model: string;
  keypoints?: [number, number, number][];
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
