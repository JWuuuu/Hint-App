export function HintLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/brand/hint-icon-180.png"
      aria-hidden="true"
      className={`rounded-[22%] object-cover ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}
