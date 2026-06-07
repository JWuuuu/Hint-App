import { motion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import { HintTarotCardFront } from "./HintTarotCardFront";

export type TarotCardBackStyle = "nocturne" | "ivory" | "rose";

type TarotCardVisualProps = {
  card?: RitualCard;
  faceDown?: boolean;
  revealed?: boolean;
  compact?: boolean;
  active?: boolean;
  selected?: boolean;
  backStyle?: TarotCardBackStyle;
  positionLabel?: string;
  ariaLabel?: string;
  className?: string;
  onClick?: () => void;
};

function BackDesign({
  backStyle = "nocturne",
}: {
  compact?: boolean;
  backStyle?: TarotCardBackStyle;
}) {
  const styles: Record<TarotCardBackStyle, {
    borderColor: string;
    shadow: string;
  }> = {
    nocturne: {
      borderColor: "rgba(231,197,121,0.86)",
      shadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -14px 24px rgba(0,0,0,0.28)",
    },
    ivory: {
      borderColor: "rgba(181,136,55,0.68)",
      shadow: "inset 0 1px 0 rgba(255,255,255,0.56), inset 0 -14px 24px rgba(96,70,34,0.14)",
    },
    rose: {
      borderColor: "rgba(255,219,180,0.72)",
      shadow: "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -14px 24px rgba(42,29,68,0.24)",
    },
  };
  const style = styles[backStyle];
  const imageUrl = `/brand/tarot/hint-back-${backStyle}.svg`;

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[10px] border bg-cover bg-center"
      style={{
        backgroundImage: `url("${imageUrl}")`,
        borderColor: style.borderColor,
        boxShadow: style.shadow,
      }}
    />
  );
}

export function TarotCardVisual({
  card,
  faceDown = true,
  revealed = false,
  compact = false,
  active = false,
  selected = false,
  backStyle = "nocturne",
  positionLabel,
  ariaLabel,
  className = "",
  onClick,
}: TarotCardVisualProps) {
  const isFront = Boolean(card && (revealed || card.revealed) && !faceDown);
  const accessibleLabel = ariaLabel ?? (isFront && card
    ? `${card.name}, ${card.orientation === "reversed" ? "reversed" : "upright"}`
    : "Face-down tarot card");

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={accessibleLabel}
      className={`relative block shrink-0 rounded-[12px] outline-none ${!onClick ? "pointer-events-none" : ""} ${compact ? "h-[82px] w-[54px] sm:h-[98px] sm:w-[64px] md:h-[112px] md:w-[72px]" : "h-[218px] w-[132px] sm:h-[264px] sm:w-[160px] md:h-[294px] md:w-[178px]"} ${className}`}
      animate={{
        y: selected ? -18 : 0,
        scale: selected ? 1.035 : 1,
      }}
      whileHover={onClick ? { y: -12, scale: 1.04 } : undefined}
      whileTap={onClick ? { y: -18, scale: 1.025 } : undefined}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      style={{
        boxShadow: active
          ? "0 0 0 1px rgba(232,195,118,0.42), 0 0 30px rgba(232,195,118,0.22), 0 18px 32px rgba(0,0,0,0.44)"
          : "0 8px 16px rgba(0,0,0,0.34)",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-[10px]"
        animate={{ rotateY: isFront ? 180 : 0 }}
        transition={{ duration: 0.92, ease: [0.2, 0.74, 0.18, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="absolute inset-0 backface-hidden">
          <BackDesign compact={compact} backStyle={backStyle} />
        </div>
        {isFront && card && (
          <div
            className="absolute inset-0 backface-hidden"
            style={{ transform: "rotateY(180deg)" }}
          >
            <HintTarotCardFront
              card={card}
              compact={compact}
              backStyle={backStyle}
              positionLabel={positionLabel}
            />
          </div>
        )}
      </motion.div>
    </motion.button>
  );
}
