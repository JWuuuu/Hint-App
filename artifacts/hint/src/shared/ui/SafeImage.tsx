import { useState, type ReactNode } from "react";
import { ImageOff, Sparkles } from "lucide-react";

type SafeImageProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  fallbackLabel?: string;
  loading?: "eager" | "lazy";
  decoding?: "sync" | "async" | "auto";
  draggable?: boolean;
  children?: ReactNode;
};

export function SafeImage({
  src,
  alt = "",
  className = "",
  fallbackClassName = "",
  fallbackLabel = "Image unavailable",
  loading = "lazy",
  decoding = "async",
  draggable = false,
  children,
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        draggable={draggable}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={[
        "relative grid min-h-full min-w-full place-items-center overflow-hidden bg-[#070b14]",
        fallbackClassName,
      ].join(" ")}
      aria-label={alt || fallbackLabel}
      role={alt ? "img" : undefined}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(134,214,199,0.22),transparent_34%),radial-gradient(circle_at_52%_58%,rgba(230,203,142,0.18),transparent_44%),linear-gradient(160deg,rgba(12,18,34,0.98),rgba(5,7,14,0.98))]"
      />
      <div
        aria-hidden
        className="absolute inset-3 rounded-[inherit] border border-[#e6cb8e]/20 shadow-[inset_0_0_28px_rgba(230,203,142,0.06)]"
      />
      <div className="relative grid justify-items-center gap-2 px-4 text-center">
        <span className="grid size-11 place-items-center rounded-full border border-[#e6cb8e]/28 bg-white/[0.04] text-[#e6cb8e] shadow-[0_0_28px_rgba(230,203,142,0.14)]">
          {children ?? <Sparkles size={18} strokeWidth={1.6} />}
        </span>
        <span className="inline-flex items-center gap-1.5 font-sans text-[10px] font-black uppercase tracking-[0.16em] text-[#f2ecde]/54">
          <ImageOff size={12} strokeWidth={1.8} />
          {fallbackLabel}
        </span>
      </div>
    </div>
  );
}
