import { SafeImage } from "../../shared/ui/SafeImage";

export function HintLogo({ className = "" }: { className?: string }) {
  return (
    <SafeImage
      src="/brand/hint-card-logo.png"
      className={`rounded-[18%] object-cover ${className}`}
      fallbackClassName={`rounded-[18%] ${className}`}
      fallbackLabel="Hint"
      loading="eager"
      decoding="async"
    />
  );
}
