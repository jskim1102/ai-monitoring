export type PoseClass = "standing" | "sitting" | "lying" | "unknown";

export const POSE_COLORS: Record<PoseClass, string> = {
  standing: "#4ade80",
  sitting: "#facc15",
  lying: "#f87171",
  unknown: "#5EEAD4",
};

export function classifyPose(kpts: [number, number, number][]): PoseClass {
  if (!kpts || kpts.length < 17) return "unknown";

  const pt = (i: number) => {
    const [x, y, c] = kpts[i];
    return c >= 0.3 ? { x, y } : null;
  };

  const ls = pt(5), rs = pt(6), lh = pt(11), rh = pt(12);

  const shoulder = ls && rs ? { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 }
    : ls ?? rs;
  const hip = lh && rh ? { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 }
    : lh ?? rh;

  if (!shoulder || !hip) return "unknown";

  const dx = hip.x - shoulder.x;
  const dy = hip.y - shoulder.y;
  const torsoAngle = Math.atan2(Math.abs(dy), Math.abs(dx));

  if (torsoAngle < Math.PI / 6) {
    const visible = kpts.filter(([, , c]) => c >= 0.3);
    if (visible.length >= 4) {
      const ys = visible.map(([, y]) => y);
      const xs = visible.map(([x]) => x);
      const yRange = Math.max(...ys) - Math.min(...ys);
      const xRange = Math.max(...xs) - Math.min(...xs);
      if (xRange > 0 && yRange / xRange < 0.8) return "lying";
    }
  }

  const lk = pt(13), rk = pt(14);
  const knee = lk && rk ? { x: (lk.x + rk.x) / 2, y: (lk.y + rk.y) / 2 }
    : lk ?? rk;

  if (knee) {
    const torsoLen = Math.sqrt(dx * dx + dy * dy);
    const legLen = knee.y - hip.y;
    if (legLen < torsoLen * 0.4) return "sitting";
  }

  return "standing";
}
