import { motion } from "framer-motion";
import type { RitualCard } from "../logic/createHiddenDeck";
import { getCardKeywords } from "../logic/createHiddenDeck";

type TarotCardVisualProps = {
  card?: RitualCard;
  faceDown?: boolean;
  revealed?: boolean;
  compact?: boolean;
  active?: boolean;
  selected?: boolean;
  positionLabel?: string;
  className?: string;
  onClick?: () => void;
};

function BackDesign({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[8px] border border-[#d9bd78]/70 bg-[radial-gradient(circle_at_50%_28%,rgba(51,82,105,0.9),rgba(7,19,39,0.98)_58%,rgba(4,8,18,1))] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
      <div className="absolute inset-[7%] rounded-[6px] border border-[#efd28f]/70" />
      <div className="absolute inset-[16%] rounded-full border border-[#efd28f]/30" />
      <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-[#efd28f]/55" />
      <div className="absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f6e6b0]/80" />
      <div className="absolute left-1/2 top-[18%] h-5 w-5 -translate-x-1/2 rotate-45 rounded-[2px] bg-[#f5d58c] shadow-[0_0_18px_rgba(245,213,140,0.45)]" />
      <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 font-serif text-[18px] text-[#f6e9bf]">
        H
      </div>
      {!compact && (
        <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_20%_20%,white_0_1px,transparent_1px),radial-gradient(circle_at_82%_72%,white_0_1px,transparent_1px)] [background-size:18px_22px]" />
      )}
    </div>
  );
}

function FrontDesign({
  card,
  compact = false,
  positionLabel,
}: {
  card: RitualCard;
  compact?: boolean;
  positionLabel?: string;
}) {
  const keywords = getCardKeywords(card.cardId);
  const reversed = card.orientation === "reversed";

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[8px] border border-[#d9bd78]/75 bg-[linear-gradient(155deg,#fbf3df,#efe3c6_48%,#d9cba8)] text-[#1e2130] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
      <div className="absolute inset-[6%] rounded-[6px] border border-[#b89143]/45" />
      <div className="absolute left-1/2 top-[24%] h-[28%] w-[46%] -translate-x-1/2 rounded-full border border-[#b89143]/45" />
      <div className="absolute left-1/2 top-[28%] h-[22%] w-[22%] -translate-x-1/2 rotate-45 rounded-[3px] bg-[radial-gradient(circle,#f5d58c,#98733b)] shadow-[0_10px_22px_rgba(88,62,24,0.18)]" />
      <div className="absolute left-1/2 top-[33%] h-2 w-2 -translate-x-1/2 rounded-full bg-[#1e2130]/70" />

      <div className="absolute inset-x-[12%] bottom-[10%] text-center">
        {positionLabel && !compact && (
          <p className="mb-1 font-sans text-[8px] uppercase tracking-[0.18em] text-[#7d6d51]">
            {positionLabel}
          </p>
        )}
        <p className="font-serif text-[15px] leading-none text-[#1d1b22]">
          {card.name}
        </p>
        <p className="mt-1 font-sans text-[8px] uppercase tracking-[0.16em] text-[#8b6c2f]">
          {reversed ? "Reversed" : "Upright"}
        </p>
        {!compact && (
          <p className="mt-2 font-sans text-[9px] leading-tight text-[#625844]">
            {keywords.join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

export function TarotCardVisual({
  card,
  faceDown = true,
  revealed = false,
  compact = false,
  active = false,
  selected = false,
  positionLabel,
  className = "",
  onClick,
}: TarotCardVisualProps) {
  const isFront = Boolean(card && revealed && !faceDown);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`relative block shrink-0 rounded-[8px] outline-none ${compact ? "h-[72px] w-[48px]" : "h-[156px] w-[104px]"} ${className}`}
      animate={{
        y: active ? -18 : selected ? -28 : 0,
        scale: active ? 1.06 : selected ? 1.04 : 1,
      }}
      whileHover={onClick ? { y: -18, scale: 1.055 } : undefined}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      style={{
        filter: active
          ? "drop-shadow(0 18px 26px rgba(231, 197, 121, 0.22))"
          : "drop-shadow(0 13px 20px rgba(0, 0, 0, 0.38))",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-[8px]"
        animate={{ rotateY: isFront ? 180 : 0 }}
        transition={{ duration: 0.82, ease: [0.22, 0.72, 0.21, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="absolute inset-0 backface-hidden">
          <BackDesign compact={compact} />
        </div>
        {card && (
          <div
            className="absolute inset-0 backface-hidden"
            style={{ transform: "rotateY(180deg)" }}
          >
            <FrontDesign card={card} compact={compact} positionLabel={positionLabel} />
          </div>
        )}
      </motion.div>
    </motion.button>
  );
}
