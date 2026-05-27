import type { CSSProperties } from "react";

type LogoProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function Logo({ size = 40, className = "", style = {} }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="MIDORI logo"
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        display: "block",
        flexShrink: 0,
        borderRadius: "50%",
        ...style,
      }}
    />
  );
}
