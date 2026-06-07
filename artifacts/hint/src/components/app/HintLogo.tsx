export function HintLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/brand/hint-card-logo.png"
      aria-hidden="true"
      className={`rounded-[18%] object-cover ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}
