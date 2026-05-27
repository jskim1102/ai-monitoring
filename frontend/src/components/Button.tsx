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
