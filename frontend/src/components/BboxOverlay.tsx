import { useEffect, useRef, useState } from "react";
import { resolveClassColor } from "../utils/colors";
import type { ModelSettings } from "./ModelSettingsModal";
import { classifyPose, POSE_COLORS } from "../utils/poseClassifier";

/**
 * `<img>` 위에 절대 위치 `<canvas>` 로 bbox 오버레이.
 *
 * - canvas internal width/height = 이미지 natural 픽셀 크기 → bbox 원본 좌표 그대로 그림
 * - CSS 가 canvas 와 img 를 똑같이 스케일 → 좌표 변환 코드 0
 * - detections 또는 자연 크기 변경 시 redraw
 * - settings (per-model) 가 주어지면 클래스 필터링 + 색상 override 적용 (§4.20)
 */

export interface Detection {
  class_id: number;
  name: string;
  conf: number;
  xyxy: [number, number, number, number];
  model: string;
  keypoints?: [number, number, number][];
}

interface Props {
  imgSrc: string; // blob URL
  alt: string;
  detections: Detection[];
  // 모델별 설정 — class filter (enabledClasses) + color override.
  // undefined 또는 해당 모델 키 없음 → 모든 클래스 표시 + 기본 팔레트 색.
  settings?: Record<string, ModelSettings>;
  imgStyle?: React.CSSProperties;
}

const COCO_SKELETON: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16],
];

function BboxOverlay({ imgSrc, alt, detections, settings, imgStyle }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // 이미지 자연 크기 — onLoad 시 갱신
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const onLoad = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setSize((prev) => {
          if (prev?.w === img.naturalWidth && prev?.h === img.naturalHeight) return prev;
          return { w: img.naturalWidth, h: img.naturalHeight };
        });
      }
    };
    img.addEventListener("load", onLoad);
    if (img.complete) onLoad();
    return () => img.removeEventListener("load", onLoad);
  }, []);

  // 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1) 모델별 settings 기반 필터 — class filter + conf threshold
    const visible = detections.filter((det) => {
      const ms = settings?.[det.model];
      // class filter (enabledClasses)
      const en = ms?.classes;
      if (en !== undefined && en !== null && !en.includes(det.class_id)) return false;
      // conf threshold — UI 에서 override 한 값이 있으면 그 미만은 숨김
      if (ms?.conf !== undefined && det.conf < ms.conf) return false;
      return true;
    });

    // 다중 모델 여부 — 라벨 prefix 결정
    const distinctModels = new Set(visible.map((d) => d.model).filter(Boolean));
    const showModelPrefix = distinctModels.size >= 2;

    // 원본 좌표계 기준 적정 사이즈 (이미지가 클수록 두꺼운 선 → 작아 보일 수 있어 비율 보정)
    const scale = Math.max(1, Math.min(size.w, size.h) / 600);
    const lineWidth = Math.max(1.5, 2 * scale);
    const fontPx = Math.max(11, Math.round(13 * scale));
    ctx.font = `${fontPx}px sans-serif`;
    ctx.textBaseline = "top";

    for (const det of visible) {
      const [x1, y1, x2, y2] = det.xyxy;
      const hasPose = det.keypoints && det.keypoints.length >= 17;
      const pose = hasPose ? classifyPose(det.keypoints!) : null;

      const colorOverride = settings?.[det.model]?.colors;
      const color = pose ? POSE_COLORS[pose] : resolveClassColor(det.class_id, colorOverride);

      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      const short =
        showModelPrefix && det.model
          ? det.model.endsWith(".pt")
            ? det.model.slice(0, -3)
            : det.model
          : "";
      const label = pose
        ? `${pose.toUpperCase()} ${det.conf.toFixed(2)}`
        : short
          ? `[${short}] ${det.name} ${det.conf.toFixed(2)}`
          : `${det.name} ${det.conf.toFixed(2)}`;

      const padX = 4 * scale;
      const padY = 2 * scale;
      const textW = ctx.measureText(label).width;
      const labelH = fontPx + padY * 2;
      const labelY = Math.max(0, y1 - labelH);

      ctx.fillStyle = color;
      ctx.fillRect(x1, labelY, textW + padX * 2, labelH);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, x1 + padX, labelY + padY);

      const kpts = det.keypoints;
      if (kpts && kpts.length >= 17) {
        const kptR = Math.max(2, 3 * scale);
        const skelColor = pose ? POSE_COLORS[pose] : "#00ffff";

        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.strokeStyle = skelColor;
        for (const [a, b] of COCO_SKELETON) {
          const [ax, ay, ac] = kpts[a];
          const [bx, by, bc] = kpts[b];
          if (ac < 0.3 || bc < 0.3) continue;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

        ctx.fillStyle = skelColor;
        for (let k = 0; k < kpts.length; k++) {
          const [kx, ky, kc] = kpts[k];
          if (kc < 0.3) continue;
          ctx.beginPath();
          ctx.arc(kx, ky, kptR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [detections, size, settings]);

  return (
    <div style={containerStyle}>
      <img ref={imgRef} src={imgSrc} alt={alt} style={{ ...imgBase, ...imgStyle }} />
      {size && (
        <canvas
          ref={canvasRef}
          width={size.w}
          height={size.h}
          style={canvasStyle}
        />
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  display: "block",
};

const imgBase: React.CSSProperties = {
  width: "100%",
  height: "auto",
  display: "block",
};

const canvasStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
};

export default BboxOverlay;
