import type { ReactNode } from "react";
import type { RitualCard } from "../logic/createHiddenDeck";
import { getTarotCardImage, type TarotCardArtId } from "../logic/cardImageMap";
import { getCardKeywords } from "../logic/createHiddenDeck";
import type { TarotCardBackStyle } from "./TarotCardVisual";

type HintTarotCardFrontProps = {
  card: RitualCard;
  backStyle?: TarotCardBackStyle;
  cardArtId?: TarotCardArtId;
  compact?: boolean;
  positionLabel?: string;
  showCaption?: boolean;
};

type CardPalette = {
  surface: string;
  panel: string;
  border: string;
  inner: string;
  ink: string;
  muted: string;
  gold: string;
  accent: string;
  texture: string;
};

const PALETTES: Record<TarotCardBackStyle, CardPalette> = {
  nocturne: {
    surface: "linear-gradient(160deg,#101a2b,#17263a 48%,#07101d)",
    panel: "rgba(244,231,196,0.08)",
    border: "rgba(239,205,139,0.86)",
    inner: "rgba(239,205,139,0.42)",
    ink: "#f8ebcf",
    muted: "rgba(248,235,207,0.68)",
    gold: "#efcc83",
    accent: "#9fc7c8",
    texture:
      "radial-gradient(circle at 18% 16%,rgba(255,255,255,0.12),transparent 16%),linear-gradient(115deg,rgba(255,255,255,0.05),transparent 42%)",
  },
  ivory: {
    surface: "linear-gradient(160deg,#fff4dc,#ead9ad 54%,#cfb36f)",
    panel: "rgba(255,250,236,0.62)",
    border: "rgba(160,112,39,0.72)",
    inner: "rgba(151,103,32,0.36)",
    ink: "#292536",
    muted: "rgba(41,37,54,0.62)",
    gold: "#9f6f27",
    accent: "#476d72",
    texture:
      "radial-gradient(circle at 20% 20%,rgba(255,255,255,0.48),transparent 16%),linear-gradient(115deg,rgba(119,81,28,0.08),transparent 42%)",
  },
  rose: {
    surface: "linear-gradient(160deg,#f5ddf2,#dfc4f2 52%,#9571be)",
    panel: "rgba(255,248,246,0.28)",
    border: "rgba(255,214,171,0.78)",
    inner: "rgba(255,214,171,0.36)",
    ink: "#fff1de",
    muted: "rgba(255,241,222,0.72)",
    gold: "#ffd6ab",
    accent: "#f29fbf",
    texture:
      "radial-gradient(circle at 22% 18%,rgba(255,255,255,0.22),transparent 17%),linear-gradient(115deg,rgba(255,255,255,0.10),transparent 44%)",
  },
};

const RANK_MARKS: Record<string, string> = {
  ace: "I",
  two: "II",
  three: "III",
  four: "IV",
  five: "V",
  six: "VI",
  seven: "VII",
  eight: "VIII",
  nine: "IX",
  ten: "X",
  page: "P",
  knight: "N",
  queen: "Q",
  king: "K",
};

function getCardParts(card: RitualCard) {
  const [rankOrMajor, suit] = card.cardId.split("-");
  const majorNumber = Number(rankOrMajor);
  const isMajor = Number.isFinite(majorNumber);
  return {
    isMajor,
    suit: isMajor ? "major" : suit ?? "major",
    mark: isMajor ? toRoman(majorNumber) : RANK_MARKS[rankOrMajor ?? ""] ?? "H",
  };
}

function toRoman(value: number) {
  if (value === 0) return "0";
  const numerals: Array<[number, string]> = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let remaining = value;
  let result = "";
  for (const [amount, numeral] of numerals) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}

function MajorSymbol({ cardId, palette }: { cardId: string; palette: CardPalette }) {
  if (cardId.includes("moon")) return <MoonSymbol palette={palette} />;
  if (cardId.includes("sun")) return <SunSymbol palette={palette} />;
  if (cardId.includes("star")) return <StarSymbol palette={palette} />;
  if (cardId.includes("hanged")) return <HangedSymbol palette={palette} />;
  if (cardId.includes("lovers")) return <BondSymbol palette={palette} />;
  if (cardId.includes("tower")) return <TowerSymbol palette={palette} />;
  return <ArchetypeSymbol palette={palette} />;
}

function MinorSymbol({ suit, palette }: { suit: string; palette: CardPalette }) {
  if (suit === "cups") return <CupsSymbol palette={palette} />;
  if (suit === "swords") return <SwordsSymbol palette={palette} />;
  if (suit === "wands") return <WandsSymbol palette={palette} />;
  if (suit === "pentacles") return <PentaclesSymbol palette={palette} />;
  return <ArchetypeSymbol palette={palette} />;
}

function SymbolFrame({ children, palette }: { children: ReactNode; palette: CardPalette }) {
  return (
    <svg className="h-full w-full" viewBox="0 0 120 150" role="presentation" aria-hidden="true">
      <rect x="10" y="10" width="100" height="130" rx="7" fill="none" stroke={palette.inner} strokeWidth="1.2" />
      <path d="M22 116 C42 106 78 106 98 116" fill="none" stroke={palette.inner} strokeWidth="1" />
      <path d="M28 123 H92" stroke={palette.inner} strokeWidth="1" />
      {children}
      <circle cx="25" cy="25" r="2.2" fill={palette.gold} />
      <circle cx="95" cy="25" r="2.2" fill={palette.gold} />
      <circle cx="25" cy="125" r="2.2" fill={palette.gold} />
      <circle cx="95" cy="125" r="2.2" fill={palette.gold} />
    </svg>
  );
}

function CupsSymbol({ palette }: { palette: CardPalette }) {
  return (
    <SymbolFrame palette={palette}>
      <path d="M40 48 H80 C78 70 70 83 60 83 C50 83 42 70 40 48Z" fill="none" stroke={palette.gold} strokeWidth="3" />
      <path d="M48 88 H72 M60 83 V101 M48 101 H72" stroke={palette.gold} strokeWidth="3" strokeLinecap="round" />
      <path d="M38 100 C48 93 52 108 60 99 C68 90 72 105 83 98" fill="none" stroke={palette.accent} strokeWidth="2" />
      <path d="M54 58 C54 52 60 52 60 58 C60 52 66 52 66 58 C66 65 60 69 60 69 C60 69 54 65 54 58Z" fill={palette.accent} opacity="0.75" />
    </SymbolFrame>
  );
}

function SwordsSymbol({ palette }: { palette: CardPalette }) {
  return (
    <SymbolFrame palette={palette}>
      {[34, 47, 60, 73, 86].map((x, index) => (
        <path key={x} d={`M${x} 38 L${x - 10} 102 M${x - 5} 47 L${x + 6} 49`} stroke={index % 2 ? palette.accent : palette.gold} strokeWidth="2.4" strokeLinecap="round" />
      ))}
      <path d="M28 88 C48 78 73 100 94 84" fill="none" stroke={palette.inner} strokeWidth="1.6" />
    </SymbolFrame>
  );
}

function WandsSymbol({ palette }: { palette: CardPalette }) {
  return (
    <SymbolFrame palette={palette}>
      <path d="M45 105 L73 38" stroke={palette.gold} strokeWidth="4" strokeLinecap="round" />
      <path d="M60 68 C50 58 61 49 58 38 C72 48 77 61 66 73" fill="none" stroke={palette.accent} strokeWidth="2.4" />
      <path d="M40 78 C48 78 51 72 55 66 M56 52 C64 52 67 46 70 40" stroke={palette.inner} strokeWidth="2" strokeLinecap="round" />
      <path d="M78 32 L82 42 L92 45 L82 49 L78 59 L74 49 L64 45 L74 42Z" fill={palette.gold} opacity="0.72" />
    </SymbolFrame>
  );
}

function PentaclesSymbol({ palette }: { palette: CardPalette }) {
  return (
    <SymbolFrame palette={palette}>
      <circle cx="60" cy="70" r="28" fill="none" stroke={palette.gold} strokeWidth="3" />
      <path d="M60 43 L68 62 H89 L72 75 L79 96 L60 83 L41 96 L48 75 L31 62 H52Z" fill="none" stroke={palette.accent} strokeWidth="2.4" />
      <path d="M36 108 C47 102 73 102 84 108" fill="none" stroke={palette.inner} strokeWidth="2" />
    </SymbolFrame>
  );
}

function StarSymbol({ palette }: { palette: CardPalette }) {
  return (
    <SymbolFrame palette={palette}>
      <path d="M60 32 L66 56 L90 56 L70 69 L78 94 L60 79 L42 94 L50 69 L30 56 L54 56Z" fill="none" stroke={palette.gold} strokeWidth="3" />
      <path d="M35 108 C50 98 70 119 87 104" fill="none" stroke={palette.accent} strokeWidth="2.2" />
      <path d="M42 118 H79" stroke={palette.inner} strokeWidth="1.5" />
    </SymbolFrame>
  );
}

function MoonSymbol({ palette }: { palette: CardPalette }) {
  return (
    <SymbolFrame palette={palette}>
      <path d="M72 32 C52 38 49 66 67 77 C45 75 34 50 48 34 C55 26 64 25 72 32Z" fill="none" stroke={palette.gold} strokeWidth="3" />
      <path d="M60 85 C52 94 51 104 60 116 C69 104 68 94 60 85Z" fill="none" stroke={palette.accent} strokeWidth="2.4" />
      <path d="M36 112 C48 105 72 105 84 112" fill="none" stroke={palette.inner} strokeWidth="2" />
    </SymbolFrame>
  );
}

function SunSymbol({ palette }: { palette: CardPalette }) {
  return (
    <SymbolFrame palette={palette}>
      <circle cx="60" cy="62" r="22" fill="none" stroke={palette.gold} strokeWidth="3" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <path key={angle} d="M60 28 V18" stroke={palette.gold} strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${angle} 60 62)`} />
      ))}
      <path d="M38 104 C48 96 72 96 82 104" fill="none" stroke={palette.accent} strokeWidth="2.4" />
    </SymbolFrame>
  );
}

function HangedSymbol({ palette }: { palette: CardPalette }) {
  return (
    <SymbolFrame palette={palette}>
      <path d="M32 34 H88 M60 34 V88" stroke={palette.gold} strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="72" r="18" fill="none" stroke={palette.accent} strokeWidth="2.4" />
      <path d="M48 94 C57 104 68 104 76 92" fill="none" stroke={palette.inner} strokeWidth="2" />
    </SymbolFrame>
  );
}

function BondSymbol({ palette }: { palette: CardPalette }) {
  return (
    <SymbolFrame palette={palette}>
      <circle cx="45" cy="66" r="18" fill="none" stroke={palette.gold} strokeWidth="3" />
      <circle cx="75" cy="66" r="18" fill="none" stroke={palette.accent} strokeWidth="3" />
      <path d="M60 42 L66 54 L79 56 L69 65 L72 78 L60 71 L48 78 L51 65 L41 56 L54 54Z" fill={palette.gold} opacity="0.58" />
      <path d="M38 106 H82" stroke={palette.inner} strokeWidth="2" />
    </SymbolFrame>
  );
}

function TowerSymbol({ palette }: { palette: CardPalette }) {
  return (
    <SymbolFrame palette={palette}>
      <path d="M50 106 L42 42 H78 L70 106Z" fill="none" stroke={palette.gold} strokeWidth="3" />
      <path d="M50 42 L60 25 L70 42 M46 66 H74 M51 84 H69" stroke={palette.accent} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M37 36 L28 54 M88 40 L79 58" stroke={palette.gold} strokeWidth="2.2" />
    </SymbolFrame>
  );
}

function ArchetypeSymbol({ palette }: { palette: CardPalette }) {
  return (
    <SymbolFrame palette={palette}>
      <path d="M60 34 L84 58 L60 82 L36 58Z" fill="none" stroke={palette.gold} strokeWidth="3" />
      <circle cx="60" cy="58" r="13" fill="none" stroke={palette.accent} strokeWidth="2.4" />
      <path d="M60 22 V34 M60 82 V104 M24 58 H36 M84 58 H96" stroke={palette.inner} strokeWidth="2" strokeLinecap="round" />
      <path d="M54 58 C54 51 66 51 66 58 C66 65 60 69 60 69 C60 69 54 65 54 58Z" fill={palette.gold} opacity="0.62" />
    </SymbolFrame>
  );
}

function SuitName({ suit }: { suit: string }) {
  if (suit === "cups") return "Cups";
  if (suit === "swords") return "Swords";
  if (suit === "wands") return "Wands";
  if (suit === "pentacles") return "Pentacles";
  return "Major";
}

export function HintTarotCardFront({
  card,
  backStyle = "nocturne",
  cardArtId = "original",
  compact = false,
  positionLabel,
  showCaption = true,
}: HintTarotCardFrontProps) {
  const palette = PALETTES[backStyle];
  const keywords = getCardKeywords(card.cardId);
  const parts = getCardParts(card);
  const reversed = card.orientation === "reversed";
  const cardImageUrl = getTarotCardImage(card.cardId, cardArtId);

  if (cardImageUrl) {
    return (
      <div
        className="absolute inset-0 overflow-hidden rounded-[12px] border bg-[#090b12] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
        style={{
          borderColor: palette.border,
          color: palette.ink,
        }}
      >
        <img
          src={cardImageUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={`h-full w-full bg-[#05060b] object-contain ${reversed ? "rotate-180" : ""}`}
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-[12px] border"
          style={{
            borderColor: palette.border,
            boxShadow: "inset 0 0 0 4px rgba(6,8,16,0.64)",
          }}
        />
        {showCaption && (
          <div
            className="absolute inset-x-2 bottom-2 rounded-[8px] border px-2 py-2 text-center backdrop-blur-[2px]"
            style={{
              background: backStyle === "ivory" ? "rgba(255,250,236,0.84)" : "rgba(5,7,14,0.78)",
              borderColor: palette.inner,
              color: backStyle === "ivory" ? "#292536" : "#f8ebcf",
            }}
          >
            {positionLabel && !compact && (
              <p className="mb-1 font-sans text-[7px] uppercase tracking-[0.16em]" style={{ color: palette.gold }}>
                {positionLabel}
              </p>
            )}
            <p className={`${compact ? "text-[10px]" : "text-[13px]"} font-serif leading-tight`}>
              {card.name}
            </p>
            <p className="mt-1 font-sans text-[7px] uppercase tracking-[0.16em]" style={{ color: palette.gold }}>
              {reversed ? "Reversed" : "Upright"}
            </p>
            {!compact && (
              <p className="mt-1 font-sans text-[8px] leading-tight opacity-80">
                {keywords.join(" · ")}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[12px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]"
      style={{
        background: palette.surface,
        borderColor: palette.border,
        color: palette.ink,
      }}
    >
      <div className="absolute inset-0 opacity-70" style={{ background: palette.texture }} />
      <div className="absolute inset-[5px] rounded-[9px] border" style={{ borderColor: palette.inner }} />
      <div className="absolute inset-[10px] rounded-[7px] border" style={{ borderColor: palette.inner, opacity: 0.55 }} />

      <div className="absolute left-[9%] right-[9%] top-[6.5%] flex items-center justify-between font-sans text-[8px] uppercase tracking-[0.16em]" style={{ color: palette.muted }}>
        <span>{parts.mark}</span>
        <span className="font-serif text-[13px]" style={{ color: palette.gold }}>H</span>
        <span>{parts.isMajor ? "Hint" : <SuitName suit={parts.suit} />}</span>
      </div>

      <div
        className="absolute left-[11%] right-[11%] top-[17%] h-[46%] rounded-[8px] border"
        style={{ background: palette.panel, borderColor: palette.inner }}
      >
        {parts.isMajor ? (
          <MajorSymbol cardId={card.cardId} palette={palette} />
        ) : (
          <MinorSymbol suit={parts.suit} palette={palette} />
        )}
      </div>

      <div className="absolute inset-x-[9%] bottom-[9%] text-center">
        {positionLabel && !compact && (
          <p className="mb-1 font-sans text-[8px] uppercase tracking-[0.18em]" style={{ color: palette.muted }}>
            {positionLabel}
          </p>
        )}
        <p className={`${compact ? "text-[12px]" : "text-[17px]"} font-serif leading-none`} style={{ color: palette.ink }}>
          {card.name}
        </p>
        <p className="mt-1 font-sans text-[8px] uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
          {reversed ? "Reversed" : "Upright"}
        </p>
        {!compact && (
          <p className="mt-2 font-sans text-[9px] leading-tight" style={{ color: palette.muted }}>
            {keywords.join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}
