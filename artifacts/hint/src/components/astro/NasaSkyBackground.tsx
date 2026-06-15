import { type CSSProperties, type ReactNode } from "react";

export function NasaSkyBackground({
  children,
  className = "",
  style,
}: {
  date?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
