import { motion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import type { TarotCardArtId } from "../logic/cardImageMap";
import { HintTarotCardFront } from "./HintTarotCardFront";

export type TarotCardBackStyle = "nocturne" | "ivory" | "rose";

type TarotCardVisualProps = {
  card?: RitualCard;
  faceDown?: boolean;
  revealed?: boolean;
  compact?: boolean;
  subtleBack?: boolean;
  active?: boolean;
  selected?: boolean;
  backStyle?: TarotCardBackStyle;
  cardArtId?: TarotCardArtId;
  positionLabel?: string;
  ariaLabel?: string;
  className?: string;
  showFrontCaption?: boolean;
  onClick?: () => void;
};

function BackDesign({
  subtle = false,
  backStyle = "nocturne",
}: {
  compact?: boolean;
  subtle?: boolean;
  backStyle?: TarotCardBackStyle;
}) {
  const styles: Record<TarotCardBackStyle, {
    surface: string;
    borderColor: string;
    filter: string;
    imageOpacity: number;
    shadow: string;
  }> = {
    nocturne: {
      surface: "linear-gradient(155deg,#2d527d,#173452 58%,#0b1a2d)",
      borderColor: "rgba(231,197,121,0.86)",
      filter: "brightness(1.28) saturate(1.08)",
      imageOpacity: 0.82,
      shadow: "0 10px 18px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -14px 24px rgba(0,0,0,0.24)",
    },
    ivory: {
      surface: "linear-gradient(155deg,#fff4d8,#ead7aa 58%,#cab477)",
      borderColor: "rgba(181,136,55,0.68)",
      filter: "brightness(1.04) saturate(1.03)",
      imageOpacity: 0.88,
      shadow: "0 10px 18px rgba(58,42,20,0.24), inset 0 1px 0 rgba(255,255,255,0.60), inset 0 -14px 24px rgba(96,70,34,0.12)",
    },
    rose: {
      surface: "linear-gradient(155deg,#f5c7ea,#9f73d0 56%,#3b275c)",
      borderColor: "rgba(255,219,180,0.72)",
      filter: "brightness(1.12) saturate(1.06)",
      imageOpacity: 0.86,
      shadow: "0 10px 18px rgba(26,12,36,0.34), inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -14px 24px rgba(42,29,68,0.20)",
    },
  };
  const style = styles[backStyle];
  const imageUrl = `/brand/tarot/hint-back-${backStyle}.svg`;
  const imageOpacity = subtle ? style.imageOpacity * 0.68 : style.imageOpacity;
  const shadow = subtle
    ? "0 6px 12px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -10px 18px rgba(0,0,0,0.16)"
    : style.shadow;

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[10px] border"
      style={{
        background: style.surface,
        borderColor: style.borderColor,
        boxShadow: shadow,
      }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url("${imageUrl}")`,
          filter: style.filter,
          opacity: imageOpacity,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[10px]"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 -18px 28px rgba(0,0,0,0.16)",
        }}
      />
    </div>
  );
}

export function TarotCardVisual({
  card,
  faceDown = true,
  revealed = false,
  compact = false,
  subtleBack = false,
  active = false,
  selected = false,
  backStyle = "nocturne",
  cardArtId = "original",
  positionLabel,
  ariaLabel,
  className = "",
  showFrontCaption = true,
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
          <BackDesign compact={compact} subtle={subtleBack} backStyle={backStyle} />
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
              cardArtId={cardArtId}
              positionLabel={positionLabel}
              showCaption={showFrontCaption}
            />
          </div>
        )}
      </motion.div>
    </motion.button>
  );
}