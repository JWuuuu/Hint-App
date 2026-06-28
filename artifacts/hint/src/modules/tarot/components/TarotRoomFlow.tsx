import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Hourglass,
  Lock,
  Mic,
  Moon,
  Palette,
  Route,
  Send,
  Sparkles,
  WandSparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Link } from "wouter";
import {
  BACKGROUND_STYLES,
  CARD_FACE_STYLES,
  SPREAD_CHOICES,
  type CardFaceId,
  type DeckStyleId,
  type RoomBackgroundId,
  type SpreadChoice,
} from "../../hold/useHoldFlow";
import { apiUrl } from "../../../lib/api";
import { getAnonId } from "../../../lib/identity";
import {
  getDefaultTarotCardBackForStyle,
  getTarotCardBackImage,
  TAROT_CARD_BACK_CHOICES,
  type TarotCardBackId,
  type TarotCardBackStyle,
} from "../logic/cardBacks";
import { getTarotCardImage } from "../logic/cardImageMap";
import { createHiddenDeck } from "../logic/createHiddenDeck";
import {
  applyTableCurrent,
  applyWashForce,
  cutDeckIntoPackets,
  gatherDeckToCenter,
  loosenDeckForWash,
  mergeCutDeckAtCenter,
  settleWashedDeck,
  squareDeckAtCenter,
  transferCutPacket,
  type WashPointer,
} from "../logic/washPhysics";
import type { RitualCard } from "../types/ritual.types";
import { CardWashRitual, type WashRitualTheme } from "./CardWashRitual";
import { ReadingReveal } from "./ReadingReveal";
import { TarotHintReadingChat } from "./TarotHintReadingChat";

type TarotStep =
  | "question"
  | "spreadRecommendation"
  | "spreadSelector"
  | "design"
  | "prepare"
  | "shuffle"
  | "cut"
  | "pick"
  | "reveal"
  | "reading";

type QuestionCard = {
  category: string;
  question: string;
  icon: "love" | "decision" | "self" | "timing" | "career" | "truth";
  imageCardId: string;
  gradient: string;
};

type RoomDesign = {
  id: string;
  label: string;
  mood: string;
  deckStyleId: DeckStyleId;
  backStyle: TarotCardBackStyle;
  cardBackId: TarotCardBackId;
  cardArtId: CardFaceId;
  backgroundId: RoomBackgroundId;
  background: string;
  glow: string;
};

type SpreadRecommendation = {
  spreadType: SpreadChoice["id"];
  reason: string;
  focusLabel: string;
  confidence: "high" | "medium" | "low";
  source: "api" | "local";
};

const QUESTION_CARDS: QuestionCard[] = [
  {
    category: "Love",
    question: "Why do I keep thinking about them?",
    icon: "love",
    imageCardId: "6-lovers",
    gradient: "from-[#ffd9e6]/80 via-[#fff6ed]/70 to-[#e7dcff]/70",
  },
  {
    category: "Work",
    question: "What should I know before my next job move?",
    icon: "career",
    imageCardId: "1-magician",
    gradient: "from-[#f7e5c8]/80 via-[#fff8ef]/72 to-[#e6f0ea]/74",
  },
  {
    category: "Decision",
    question: "Which path is better for me now?",
    icon: "decision",
    imageCardId: "11-justice",
    gradient: "from-[#f6e8c8]/80 via-[#fff8ef]/70 to-[#dcecff]/70",
  },
  {
    category: "Self",
    question: "What am I avoiding emotionally?",
    icon: "self",
    imageCardId: "9-hermit",
    gradient: "from-[#eee8ff]/80 via-[#fff8f5]/70 to-[#ffdce9]/70",
  },
  {
    category: "Timing",
    question: "Is now the right time to act?",
    icon: "timing",
    imageCardId: "14-temperance",
    gradient: "from-[#fff0ca]/80 via-[#fff8ef]/70 to-[#eadcff]/70",
  },
  {
    category: "Truth",
    question: "What is the honest thing I am missing?",
    icon: "truth",
    imageCardId: "18-moon",
    gradient: "from-[#e9f2ff]/80 via-[#fff8f1]/72 to-[#f0ddff]/70",
  },
];

const FEATURED_SPREADS = [...SPREAD_CHOICES];
const SPREAD_CAROUSEL_CARD_WIDTH = 300;
const SPREAD_CAROUSEL_GAP = 44;
const SPREAD_CAROUSEL_STEP = SPREAD_CAROUSEL_CARD_WIDTH + SPREAD_CAROUSEL_GAP;

const ROOM_DESIGNS: RoomDesign[] = [
  {
    id: "rose",
    label: "Rose Veil",
    mood: "Soft, feminine, relationship-focused.",
    deckStyleId: "rose",
    backStyle: "rose",
    cardBackId: "01_Final_Eight_Set/02_Moon_Tide_Lavender_Gold.png",
    cardArtId: "hint-classic",
    backgroundId: "stars",
    background: "linear-gradient(135deg, #ffe0ec, #fff7ee 52%, #e7ddff)",
    glow: "rgba(246,186,209,0.46)",
  },
  {
    id: "ivory",
    label: "Ivory Gate",
    mood: "Bright, calm, easier to read.",
    deckStyleId: "ivory",
    backStyle: "ivory",
    cardBackId: "01_Final_Eight_Set/05_Dawn_Gate_Ivory_Gold.png",
    cardArtId: "hint-classic",
    backgroundId: "dawn",
    background: "linear-gradient(135deg, #fff3d5, #fffaf3 54%, #e8f2ec)",
    glow: "rgba(236,198,129,0.48)",
  },
  {
    id: "nocturne",
    label: "Sky Deck",
    mood: "Dark sky, celestial, focused.",
    deckStyleId: "nocturne",
    backStyle: "nocturne",
    cardBackId: getDefaultTarotCardBackForStyle("nocturne"),
    cardArtId: "hint-classic",
    backgroundId: "sea",
    background: "linear-gradient(135deg, #e6e1ff, #fff5f8 50%, #d8e8ff)",
    glow: "rgba(171,151,255,0.42)",
  },
];

function hapticTick(duration = 8) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}

function hapticPulse(pattern: number | number[] = [6, 28, 10]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

const CARD_FACE_PREVIEW_IDS = ["0-fool", "6-lovers", "19-sun"] as const;

type QuestionIntent = "career" | "love" | "timing" | "choice" | "self" | "general";

function getQuestionIntent(question: string): QuestionIntent {
  const lower = question.toLowerCase();
  if (/job|career|work|interview|offer|business|money|boss|company|application|hire|hiring|school|exam/.test(lower)) return "career";
  if (/love|relationship|partner|crush|ex|date|dating|them|him|her|connection|feel/.test(lower)) return "love";
  if (/when|timing|soon|time|wait|now|later/.test(lower)) return "timing";
  if (/choice|choose|decision|path|option|which|should i/.test(lower)) return "choice";
  if (/myself|avoid|emotion|healing|fear|pattern|self/.test(lower)) return "self";
  return "general";
}

function questionPromptTitle(intent: QuestionIntent = "general") {
  if (intent === "career") return "What part of work needs clarity?";
  if (intent === "love") return "What do you need to understand about this connection?";
  if (intent === "timing") return "What timing are you trying to feel out?";
  if (intent === "choice") return "Which choice needs a clearer signal?";
  if (intent === "self") return "What part of you needs an honest mirror?";
  return "What do you need help seeing clearly?";
}

function questionPromptBody(intent: QuestionIntent = "general") {
  if (intent === "career") return "Ask about the offer, interview, workplace tension, or next move.";
  if (intent === "love") return "Ask about feelings, signals, distance, or what this connection is asking from you.";
  if (intent === "timing") return "Ask what is opening now, what needs patience, or when to act.";
  if (intent === "choice") return "Name the decision and the room will choose a spread around the pressure point.";
  if (intent === "self") return "Ask for the pattern, the lesson, or the truth you keep circling.";
  return "Ask in one sentence, or tap a suggested question.";
}

function isUnlockedCardBack(item: { id: TarotCardBackId }) {
  return (
    item.id.startsWith("00_Hint_Sky_Deck/") ||
    item.id.startsWith("01_Final_Eight_Set/") ||
    item.id.startsWith("07_Zodiac_Set_A_Detailed/") ||
    item.id.startsWith("08_Zodiac_Set_B_Minimal/")
  );
}

function isLockedCardBack(item: { id: TarotCardBackId }) {
  return !isUnlockedCardBack(item);
}

function getCardFace(cardArtId: CardFaceId) {
  return CARD_FACE_STYLES.find((item) => item.id === cardArtId) ?? CARD_FACE_STYLES[0]!;
}

function getRoomBackground(backgroundId: RoomBackgroundId) {
  return BACKGROUND_STYLES.find((item) => item.id === backgroundId) ?? BACKGROUND_STYLES[0]!;
}

function getBackgroundGlow(backgroundId: RoomBackgroundId) {
  if (backgroundId === "dawn") return "rgba(236,198,129,0.48)";
  if (backgroundId === "sea") return "rgba(83,194,194,0.38)";
  return "rgba(171,151,255,0.42)";
}

function getRoomSurfaceBackground(backgroundId: RoomBackgroundId) {
  if (backgroundId === "dawn") {
    return "radial-gradient(circle at 50% 18%, rgba(255,226,177,0.80), transparent 26%), radial-gradient(circle at 82% 76%, rgba(204,232,220,0.58), transparent 34%), linear-gradient(180deg, #fff8ef 0%, #f5ece5 46%, #e9f3ec 100%)";
  }
  if (backgroundId === "sea") {
    return "radial-gradient(circle at 50% 16%, rgba(205,245,238,0.72), transparent 26%), radial-gradient(circle at 18% 72%, rgba(220,203,255,0.60), transparent 32%), linear-gradient(180deg, #f8fbf6 0%, #edf4f1 42%, #e9e1f8 100%)";
  }
  return "radial-gradient(circle at 50% 18%, rgba(255,226,236,0.95), transparent 24%), radial-gradient(circle at 18% 72%, rgba(236,205,255,0.74), transparent 30%), linear-gradient(180deg,#fff8f1 0%,#f6e8ed 42%,#ece4ff 100%)";
}

function getWashTheme(design: RoomDesign): WashRitualTheme {
  const background = design.backgroundId;
  const starClassName = background === "sea"
    ? "opacity-34 [background-image:radial-gradient(circle_at_18%_24%,rgba(235,255,246,0.65)_0_1px,transparent_1px),radial-gradient(circle_at_78%_16%,rgba(244,196,214,0.70)_0_1px,transparent_1px),radial-gradient(circle_at_68%_76%,rgba(103,218,209,0.62)_0_1px,transparent_1px)] [background-size:132px_148px]"
    : background === "dawn"
      ? "opacity-28 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.84)_0_1px,transparent_1px),radial-gradient(circle_at_78%_16%,rgba(187,146,68,0.62)_0_1px,transparent_1px)] [background-size:142px_152px]"
      : "opacity-44 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,238,246,0.86)_0_1px,transparent_1px),radial-gradient(circle_at_78%_16%,rgba(248,214,152,0.82)_0_1px,transparent_1px),radial-gradient(circle_at_68%_76%,rgba(219,199,255,0.66)_0_1px,transparent_1px)] [background-size:132px_148px]";

  return {
    chamberOverlay:
      background === "sea"
        ? "radial-gradient(circle at 48% 42%, rgba(229,154,190,0.14), transparent 24%), radial-gradient(circle at 50% 52%, rgba(12,55,65,0.92), rgba(5,14,24,0.98) 64%, #020409 100%)"
        : background === "dawn"
          ? "radial-gradient(circle at 50% 38%, rgba(234,205,143,0.34), transparent 27%), radial-gradient(circle at 50% 54%, rgba(222,241,236,0.92), rgba(88,117,128,0.48) 64%, rgba(12,20,34,0.88) 100%)"
          : "linear-gradient(180deg, rgba(255,237,246,0.12), rgba(12,8,26,0.04) 28%, rgba(220,196,255,0.08) 62%, rgba(4,3,12,0.98) 100%), radial-gradient(ellipse at 50% 36%, rgba(246,187,207,0.24), transparent 30%), radial-gradient(circle at 50% 52%, rgba(26,19,50,0.94), rgba(7,6,18,0.98) 65%, #020106 100%)",
    starClassName,
    tableBackground:
      background === "sea"
        ? "radial-gradient(circle at 50% 50%, rgba(21,67,72,0.80), rgba(8,21,35,0.95) 56%, rgba(4,5,14,0.99) 100%)"
        : background === "dawn"
          ? "radial-gradient(circle at 50% 48%, rgba(255,248,232,0.72), rgba(136,178,178,0.58) 58%, rgba(18,35,50,0.84) 100%)"
          : "radial-gradient(circle at 48% 42%, rgba(255,236,244,0.18), transparent 30%), radial-gradient(circle at 50% 54%, rgba(45,37,78,0.82), rgba(14,11,30,0.95) 58%, rgba(4,3,12,0.99) 100%)",
    tableBorderColor: background === "dawn" ? "rgba(174,132,56,0.26)" : "rgba(238,188,205,0.28)",
    tableShadow:
      background === "dawn"
        ? "0 35px 100px rgba(49,61,64,0.38), inset 0 0 92px rgba(255,242,199,0.20)"
        : "0 35px 110px rgba(0,0,0,0.68), 0 0 46px rgba(221,180,255,0.10), inset 0 0 92px rgba(246,187,207,0.13)",
    tableRingColor: background === "sea" ? "rgba(229,154,190,0.18)" : "rgba(246,187,207,0.22)",
    secondaryRingColor: background === "sea" ? "rgba(103,218,209,0.12)" : "rgba(248,214,152,0.14)",
    cardBackStyle: design.backStyle,
    cardBackId: design.cardBackId,
  };
}

type HiddenCardIdentity = Pick<RitualCard, "cardId" | "name" | "orientation">;

type FlowDeckState = {
  hiddenDeckOrder: RitualCard[];
  ritualCards: RitualCard[];
};

function getHiddenIdentities(deck: readonly RitualCard[]): HiddenCardIdentity[] {
  return deck.map((card) => ({
    cardId: card.cardId,
    name: card.name,
    orientation: card.orientation,
  }));
}

function applyHiddenIdentitiesToFixedVisuals(
  visualDeck: readonly RitualCard[],
  identities: readonly HiddenCardIdentity[],
): RitualCard[] {
  return visualDeck.map((visualCard, index) => {
    const identity = identities[index] ?? identities[0];
    return {
      ...visualCard,
      cardId: identity?.cardId ?? visualCard.cardId,
      name: identity?.name ?? visualCard.name,
      orientation: identity?.orientation ?? visualCard.orientation,
      selected: false,
      revealed: false,
    };
  });
}

function washHiddenOrder(deck: readonly RitualCard[]): RitualCard[] {
  const identities = getHiddenIdentities(deck);
  const half = Math.ceil(identities.length / 2);
  const left = identities.slice(0, half);
  const right = identities.slice(half);
  const mixed: HiddenCardIdentity[] = [];
  const max = Math.max(left.length, right.length);

  for (let index = 0; index < max; index += 1) {
    if (right[index]) mixed.push(right[index]!);
    if (left[index]) mixed.push(left[index]!);
  }

  return applyHiddenIdentitiesToFixedVisuals(deck, mixed);
}

function cutHiddenOrder(deck: readonly RitualCard[], ratio = 0.37): RitualCard[] {
  const identities = getHiddenIdentities(deck);
  const cutIndex = Math.max(1, Math.min(identities.length - 1, Math.floor(identities.length * ratio)));
  const cut = [...identities.slice(cutIndex), ...identities.slice(0, cutIndex)];
  return applyHiddenIdentitiesToFixedVisuals(deck, cut);
}

function cleanQuestion(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function recommendSpread(question: string): SpreadChoice {
  const lower = question.toLowerCase();
  if (/job|career|work|interview|offer|business|money|boss|company|application|hire|hiring|school|exam/i.test(lower)) {
    return SPREAD_CHOICES.find((spread) => spread.id === "three") ?? FEATURED_SPREADS[0]!;
  }
  if (/they|them|him|her|love|relationship|ex|crush|partner|feel/i.test(lower)) {
    return SPREAD_CHOICES.find((spread) => spread.id === "trueHeart") ?? FEATURED_SPREADS[0]!;
  }
  if (/choice|choose|decision|path|should|career|move/i.test(lower)) {
    return SPREAD_CHOICES.find((spread) => spread.id === "three") ?? FEATURED_SPREADS[0]!;
  }
  if (/future|when|timing|time|soon/i.test(lower)) {
    return SPREAD_CHOICES.find((spread) => spread.id === "peachBlossom") ?? FEATURED_SPREADS[0]!;
  }
  return SPREAD_CHOICES.find((spread) => spread.id === "three") ?? FEATURED_SPREADS[0]!;
}

function spreadReason(spread: SpreadChoice, question: string) {
  const intent = getQuestionIntent(question);
  if (intent === "career") {
    return `${spread.label} keeps the work question practical: what shaped it, what is true now, and what move deserves your energy.`;
  }
  if (intent === "choice") {
    return `${spread.label} is best here because it turns the decision into a clear next action instead of more overthinking.`;
  }
  if (intent === "timing") {
    return `${spread.label} helps separate what is ready now from what still needs time.`;
  }
  if (intent === "self") {
    return `${spread.label} gives the pattern a mirror, then points to the next honest adjustment.`;
  }
  if (spread.id === "trueHeart") {
    return "This question has mixed signals, so the room separates what they show from what may be underneath.";
  }
  if (spread.id === "relationship") {
    return "This keeps your side, their side, and the thread between you in view.";
  }
  if (spread.id === "loveTree") {
    return "This gives the situation roots, environment, growth, future, and advice.";
  }
  return question
    ? `${spread.label} fits this question because it gives the room a clear shape before cards are chosen.`
    : "This spread is balanced for emotional uncertainty and next-step clarity.";
}

function findSpreadChoice(spreadType: string | null | undefined) {
  return SPREAD_CHOICES.find((item) => item.id === spreadType) ?? null;
}

function normalizeConfidence(value: unknown): SpreadRecommendation["confidence"] {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function buildLocalSpreadRecommendation(question: string): SpreadRecommendation {
  const spread = recommendSpread(question);
  const intent = getQuestionIntent(question);
  const focusLabel =
    intent === "career"
      ? "Next move"
      : intent === "love"
        ? "Inner feelings"
        : intent === "timing"
          ? "Timing signal"
          : intent === "choice"
            ? "Decision path"
            : intent === "self"
              ? "Self pattern"
              : "Clear signal";

  return {
    spreadType: spread.id,
    reason: spreadReason(spread, question),
    focusLabel,
    confidence: intent === "general" ? "low" : "medium",
    source: "local",
  };
}

async function requestSpreadRecommendation(question: string): Promise<SpreadRecommendation> {
  const response = await fetch(apiUrl("/api/tarot/spread-recommendation"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      anonId: getAnonId(),
    }),
  });
  const data = await response.json() as Partial<SpreadRecommendation> & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? `Spread recommendation failed: ${response.status}`);
  }

  const spread = findSpreadChoice(data.spreadType);
  if (!spread || typeof data.reason !== "string" || typeof data.focusLabel !== "string") {
    throw new Error("Spread recommendation response was invalid.");
  }

  return {
    spreadType: spread.id,
    reason: data.reason.trim(),
    focusLabel: data.focusLabel.trim() || spread.label,
    confidence: normalizeConfidence(data.confidence),
    source: data.source === "api" ? "api" : "local",
  };
}

function spreadCardSize(spread: SpreadChoice) {
  if (spread.cardCount >= 7) return { width: 18, height: 31, radius: 5 };
  if (spread.cardCount >= 5) return { width: 22, height: 36, radius: 6 };
  return { width: 26, height: 42, radius: 7 };
}

function SpreadDiagram({
  spread,
  active = false,
  showLabels = false,
  className = "",
}: {
  spread: SpreadChoice;
  active?: boolean;
  showLabels?: boolean;
  className?: string;
}) {
  const size = spreadCardSize(spread);
  return (
    <div className={`relative h-36 w-full min-w-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 rounded-[26px] bg-[radial-gradient(circle_at_50%_48%,rgba(255,244,220,0.58),rgba(255,230,239,0.20)_42%,transparent_72%)]" />
      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <polyline
          points={spread.layout.slice(0, spread.cardCount).map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          stroke={active ? "rgba(156,116,54,0.30)" : "rgba(92,74,103,0.18)"}
          strokeDasharray="2 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="0.8"
        />
      </svg>
      {spread.layout.slice(0, spread.cardCount).map((point, index) => (
        <div
          key={`${spread.id}-${index}`}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-[7px] border ${
            active ? "border-[#f5d790]/80 bg-[#fff3cf]/78" : "border-white/32 bg-white/22"
          } shadow-[0_10px_22px_rgba(81,58,85,0.18)]`}
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: size.width,
            height: size.height,
            borderRadius: size.radius,
            transform: `translate(-50%, -50%) rotate(${(index - (spread.cardCount - 1) / 2) * 2.4}deg)`,
          }}
        >
          <span className="absolute inset-[3px] rounded-[4px] border border-white/28" />
          <span className="absolute left-1/2 top-1/2 grid h-4 w-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/42 text-[9px] font-black text-[#6f5570]">
            {index + 1}
          </span>
          {showLabels ? (
            <span className="absolute left-1/2 top-[calc(100%+4px)] w-20 -translate-x-1/2 text-center text-[7px] font-black uppercase tracking-[0.08em] text-[#745f70]/72">
              {spread.positionLabels[index]}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function QuestionIcon({ icon }: { icon: QuestionCard["icon"] }) {
  const className = "h-5 w-5";
  if (icon === "love") return <Heart className={className} />;
  if (icon === "decision") return <Route className={className} />;
  if (icon === "timing") return <Hourglass className={className} />;
  if (icon === "career") return <WandSparkles className={className} />;
  if (icon === "truth") return <Sparkles className={className} />;
  return <Moon className={className} />;
}

function TarotBack({
  className = "",
  cardBackId,
}: {
  className?: string;
  cardBackId?: TarotCardBackId;
}) {
  const imageUrl = cardBackId ? getTarotCardBackImage(cardBackId) : "";
  return (
    <div
      className={`relative overflow-hidden rounded-[16px] border border-[#e7c77d]/70 bg-[linear-gradient(155deg,#29395f,#10162c_58%,#291a35)] shadow-[0_28px_70px_rgba(70,42,82,0.28),0_0_44px_rgba(246,194,213,0.28)] ${className}`}
    >
      {imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("${imageUrl}")`,
            filter: "brightness(0.96) saturate(1.22) contrast(1.16)",
          }}
        />
      ) : null}
      {imageUrl ? <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,18,38,0.04),rgba(24,18,38,0.10))]" /> : null}
      <div className="absolute inset-[10px] rounded-[12px] border border-[#f9e3ad]/38" />
      {!imageUrl ? (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[24px] font-semibold text-[#ffe7a9]/80">
          H
        </span>
      ) : null}
    </div>
  );
}

function RoomBackground({ design = ROOM_DESIGNS[0]! }: { design?: RoomDesign }) {
  return (
    <>
      <div className="fixed inset-0" style={{ background: design.background }} />
      <div className="fixed inset-0 opacity-55 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.86)_0_1px,transparent_1px),radial-gradient(circle_at_78%_16%,rgba(205,158,82,0.44)_0_1px,transparent_1px),radial-gradient(circle_at_68%_76%,rgba(148,111,188,0.42)_0_1px,transparent_1px)] [background-size:118px_138px]" />
      <div className="fixed inset-x-[-20%] bottom-[-16%] h-[48%] rounded-[50%] bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.72),rgba(239,215,224,0.32)_42%,transparent_70%)]" />
    </>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-12 items-center justify-center rounded-full bg-[#2f2544] px-6 py-3 text-[13px] font-black text-[#fff8ec] shadow-[0_16px_34px_rgba(84,61,92,0.24)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
    >
      {children}
    </button>
  );
}

function StepShell({ children }: { children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.42, ease: [0.22, 0.74, 0.2, 1] }}
      className="hint-app-scroll absolute inset-0 z-10 flex w-full flex-col px-5 pb-[calc(var(--hint-safe-bottom)+1.25rem)] pt-[calc(var(--hint-safe-top)+4rem)]"
    >
      {children}
    </motion.section>
  );
}

function Composer({
  question,
  setQuestion,
  onSubmit,
  onVoice,
}: {
  question: string;
  setQuestion: (value: string) => void;
  onSubmit: () => void;
  onVoice: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(var(--hint-safe-bottom)+0.8rem)]">
      <div className="mx-auto flex max-w-[440px] items-center gap-2 rounded-[28px] border border-white/68 bg-white/66 p-2 shadow-[0_18px_48px_rgba(98,75,102,0.18)] backdrop-blur-xl">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit();
          }}
          placeholder="Ask about love, timing, choices, or anything you can't stop thinking about."
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[14px] font-semibold text-[#382f45] outline-none placeholder:text-[#8f7d91]"
        />
        <button
          type="button"
          onClick={onVoice}
          aria-label="Voice input"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f4e8f1] text-[#6e5871] transition active:scale-95"
        >
          <Mic size={18} />
        </button>
        <button
          type="button"
          onClick={onSubmit}
          aria-label="Send question"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2f2544] text-[#fff8ec] shadow-[0_10px_24px_rgba(65,48,76,0.24)] transition active:scale-95"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}

function VoicePanel({
  transcript,
  onUse,
  onCancel,
}: {
  transcript: string;
  onUse: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#271f33]/30 px-5 pb-[calc(var(--hint-safe-bottom)+1rem)] backdrop-blur-[2px]"
    >
      <div className="absolute inset-x-4 bottom-[calc(var(--hint-safe-bottom)+1rem)] mx-auto max-w-[440px] rounded-[32px] border border-white/50 bg-white/74 p-5 text-center shadow-[0_24px_70px_rgba(61,40,74,0.28)] backdrop-blur-2xl">
        <p className="font-serif text-[28px] text-[#382f45]">I'm listening...</p>
        <div className="relative mx-auto mt-5 h-20 max-w-[260px]">
          {[0, 1, 2, 3, 4].map((line) => (
            <motion.span
              key={line}
              className="absolute left-1/2 top-1/2 h-1.5 rounded-full bg-[linear-gradient(90deg,#f6b8d0,#cfb7ff,#f3d28c)]"
              animate={{
                width: [38, 124 - line * 12, 56],
                y: [-18 + line * 9, -12 + line * 5, -18 + line * 9],
                opacity: [0.28, 0.88, 0.36],
              }}
              transition={{ duration: 1.5 + line * 0.12, repeat: Infinity, ease: "easeInOut" }}
              style={{ transform: "translateX(-50%)" }}
            />
          ))}
        </div>
        <p className="mx-auto min-h-12 max-w-[20rem] font-sans text-[14px] font-semibold leading-relaxed text-[#6b586d]">
          {transcript || "Let the question come out in one sentence."}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 flex-1 rounded-full border border-[#d9c9d6] bg-white/48 text-[12px] font-black text-[#6f6072]"
          >
            Cancel
          </button>
          <PrimaryButton onClick={onUse} disabled={!transcript} className="min-h-11 flex-1">
            Use this question
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  );
}

function QuestionStep({
  question,
  setQuestion,
  onSubmit,
  onPromptSelect,
  voiceOpen,
  openVoice,
  closeVoice,
}: {
  question: string;
  setQuestion: (value: string) => void;
  onSubmit: () => void;
  onPromptSelect: (value: string) => void;
  voiceOpen: boolean;
  openVoice: () => void;
  closeVoice: () => void;
}) {
  const [transcript, setTranscript] = useState("");
  const [pickedPrompt, setPickedPrompt] = useState<string | null>(null);
  const intent = getQuestionIntent(question);
  const canContinue = Boolean(cleanQuestion(question));

  function startVoice() {
    hapticTick(8);
    setTranscript("");
    openVoice();
    const script = "What do I need to understand about this connection right now?";
    script.split(" ").forEach((word, index) => {
      window.setTimeout(() => {
        setTranscript((current) => `${current}${current ? " " : ""}${word}`);
      }, 170 * (index + 1));
    });
  }

  return (
    <>
      <StepShell>
      <div className="pb-[calc(var(--hint-safe-bottom)+7.5rem)]">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9c7d92]">Ask Hint</p>
        <h1 className="mt-2.5 font-serif text-[32px] leading-[0.98] text-[#332d45]">
          {questionPromptTitle(intent)}
        </h1>
        <p className="mt-3 max-w-[24rem] text-[13px] font-semibold leading-relaxed text-[#746276]">
          {questionPromptBody(intent)}
        </p>

        {question ? (
          <div className="mt-5 rounded-[24px] border border-white/66 bg-white/46 p-4 shadow-[0_16px_46px_rgba(102,72,105,0.10)] backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a28398]">Current question</p>
            <p className="mt-2 text-[14px] font-bold leading-relaxed text-[#3d3348]">{question}</p>
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9c7d92]">Suggested questions</p>
          <p className="rounded-full border border-white/56 bg-white/42 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#8a7888] shadow-[0_8px_22px_rgba(96,72,104,0.08)] backdrop-blur-xl">
            Auto spread
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {QUESTION_CARDS.map((card) => {
            const image = getTarotCardImage(card.imageCardId, "hint-card-2") ?? getTarotCardImage(card.imageCardId, "hint-classic");
            return (
              <button
                key={card.category}
                type="button"
                onClick={() => {
                  hapticTick();
                  setPickedPrompt(card.category);
                  setQuestion(card.question);
                  onPromptSelect(card.question);
                }}
                className={`relative h-[104px] overflow-hidden rounded-[18px] border bg-gradient-to-br ${card.gradient} p-3 text-left shadow-[0_14px_32px_rgba(104,82,111,0.12)] transition duration-200 active:scale-[0.98] ${
                  pickedPrompt === card.category ? "border-[#d7a85e] shadow-[0_20px_50px_rgba(215,168,94,0.26)]" : "border-white/72"
                }`}
              >
                <span className="pointer-events-none absolute -right-8 top-0 h-24 w-24 rounded-full bg-white/44 blur-2xl" />
                <span className="pointer-events-none absolute -bottom-10 left-8 h-24 w-32 rounded-full bg-[#f5c9df]/22 blur-2xl" />
                {image ? (
                  <span className="pointer-events-none absolute -right-1 bottom-1 h-[66px] w-[40px] rotate-[8deg] overflow-hidden rounded-[8px] border border-white/76 opacity-95 shadow-[0_12px_22px_rgba(79,58,91,0.18)]">
                    <img src={image} alt="" aria-hidden="true" className="h-full w-full object-cover" draggable={false} />
                  </span>
                ) : null}
                <span className="relative z-10 flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/58 text-[#5e4c67] shadow-inner">
                    <QuestionIcon icon={card.icon} />
                  </span>
                  <span className="min-w-0 truncate text-[9px] font-black uppercase tracking-[0.18em] text-[#9d7c84]">
                    {card.category}
                  </span>
                </span>
                <span className="relative z-10 mt-3 line-clamp-2 block max-w-[calc(100%-2rem)] text-[12.5px] font-black leading-snug text-[#3e3448]">
                  {card.question}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      </StepShell>

      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(var(--hint-safe-bottom)+0.8rem)]">
        <div className="mx-auto flex max-w-[520px] items-end gap-2 rounded-[28px] border border-white/68 bg-white/76 p-2 shadow-[0_18px_54px_rgba(83,61,93,0.20)] backdrop-blur-xl">
          <textarea
            value={question}
            rows={1}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Type your question..."
            className="max-h-24 min-h-11 flex-1 resize-none rounded-[22px] bg-transparent px-3 py-3 text-[14px] font-bold leading-snug text-[#382f45] outline-none placeholder:text-[#9b8c9e]"
          />
          <button
            type="button"
            onClick={startVoice}
            aria-label="Voice input"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f4e8f1] text-[#6e5871] transition active:scale-95"
          >
            <Mic size={18} />
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canContinue}
            aria-label="Continue"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#2f2544] text-[#fff8ec] shadow-[0_10px_24px_rgba(65,48,76,0.24)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {voiceOpen && (
          <VoicePanel
            transcript={transcript}
            onCancel={closeVoice}
            onUse={() => {
              hapticTick(8);
              setQuestion(transcript);
              closeVoice();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function SpreadRecommendationStep({
  spread,
  question,
  recommendation,
  isLoading,
  onSpreadChange,
  onUse,
}: {
  spread: SpreadChoice;
  question: string;
  recommendation: SpreadRecommendation | null;
  isLoading: boolean;
  onSpreadChange: (spread: SpreadChoice) => void;
  onUse: () => void;
}) {
  const dragStartX = useRef<number | null>(null);
  const dragHapticBucketRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const currentIndex = Math.max(0, FEATURED_SPREADS.findIndex((item) => item.id === spread.id));
  const intent = getQuestionIntent(question);
  const recommendationMatches = recommendation?.spreadType === spread.id;
  const reason = recommendationMatches ? recommendation.reason : spreadReason(spread, question);
  const matchLabel = isLoading
    ? "Choosing with API"
    : recommendationMatches && recommendation?.source === "api"
      ? "AI matched"
      : recommendationMatches
        ? "Local match"
        : "Manual choice";

  function move(delta: number) {
    const nextIndex = Math.max(0, Math.min(FEATURED_SPREADS.length - 1, currentIndex + delta));
    if (nextIndex === currentIndex) return;
    onSpreadChange(FEATURED_SPREADS[nextIndex]!);
    hapticTick();
  }

  function finishSwipe(clientX: number) {
    if (dragStartX.current === null) return;
    const delta = clientX - dragStartX.current;
    dragStartX.current = null;
    setDragOffset(0);
    if (Math.abs(delta) < 34) return;
    move(delta > 0 ? -1 : 1);
  }

  return (
    <StepShell>
      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9c7d92]">Personal spread</p>
        <h1 className="mt-3 font-serif text-[34px] leading-none text-[#332d45]">The room chose {spread.label}.</h1>
        <p className="mt-3 max-w-[23rem] text-[14px] font-semibold leading-relaxed text-[#746276]">
          {questionPromptBody(intent)} Swipe if another shape feels closer.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/60 bg-white/54 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-[#8a6f83] shadow-[0_8px_22px_rgba(96,72,104,0.10)] backdrop-blur-xl">
            {matchLabel}
          </span>
          {recommendationMatches ? (
            <span className="rounded-full border border-[#e5c987]/50 bg-[#fff4cf]/58 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-[#9a7442]">
              {recommendation.confidence} confidence
            </span>
          ) : null}
        </div>

        <div
          className="relative mt-7 h-[470px] touch-pan-y select-none"
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("button")) return;
            dragStartX.current = event.clientX;
            dragHapticBucketRef.current = 0;
            hapticTick(3);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (dragStartX.current === null) return;
            const delta = event.clientX - dragStartX.current;
            setDragOffset(Math.max(-132, Math.min(132, delta)));
            const bucket = Math.trunc(Math.abs(delta) / 54);
            if (bucket > dragHapticBucketRef.current) {
              dragHapticBucketRef.current = bucket;
              hapticTick(3);
            }
          }}
          onPointerUp={(event) => finishSwipe(event.clientX)}
          onPointerCancel={() => {
            dragStartX.current = null;
            setDragOffset(0);
          }}
        >
          <div className="absolute left-1/2 top-[46%] h-[370px] w-[370px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,246,223,0.94),rgba(247,203,225,0.48)_38%,rgba(211,190,255,0.20)_58%,transparent_74%)] blur-[2px]" />
          <div className="absolute left-1/2 top-[46%] h-[296px] w-[296px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/54 bg-white/18 shadow-[inset_0_0_90px_rgba(255,255,255,0.36)]" />

          <motion.div
            className="absolute top-7 flex items-center"
            style={{
              left: `calc(50% - ${SPREAD_CAROUSEL_CARD_WIDTH / 2}px)`,
              gap: SPREAD_CAROUSEL_GAP,
            }}
            animate={{ x: -currentIndex * SPREAD_CAROUSEL_STEP + dragOffset }}
            transition={{ duration: dragOffset ? 0 : 0.34, ease: [0.2, 0.76, 0.2, 1] }}
          >
          {FEATURED_SPREADS.map((item, index) => {
            const active = index === currentIndex;
            const distance = Math.abs(index - currentIndex);
            return (
              <motion.div
                key={item.id}
                className={`shrink-0 rounded-[32px] border p-5 text-center backdrop-blur-xl ${
                  active ? "border-white/82 bg-white/68 shadow-[0_28px_78px_rgba(96,72,104,0.22)]" : "border-white/38 bg-white/28 blur-[1.1px]"
                }`}
                style={{ width: SPREAD_CAROUSEL_CARD_WIDTH }}
                animate={{
                  scale: active ? 1 : 0.82,
                  opacity: active ? 1 : distance > 1 ? 0.24 : 0.42,
                }}
                transition={{ duration: 0.3, ease: [0.2, 0.76, 0.2, 1] }}
              >
                <div className="mx-auto mb-3 w-fit rounded-full border border-[#d9b883]/36 bg-white/52 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#9c7d65]">
                  {active ? "Current spread" : item.cardCount + " cards"}
                </div>
                <SpreadDiagram spread={item} active={active} showLabels={active} className="h-44" />
                <p className="mt-3 font-serif text-[27px] leading-tight text-[#342e43]">{item.label}</p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#a88359]">
                  {item.cardCount} cards
                </p>
                <p className="mx-auto mt-3 line-clamp-2 max-w-[14rem] text-[13px] font-semibold leading-relaxed text-[#6f5d72]">
                  {item.bestFor}
                </p>
              </motion.div>
            );
          })}
          </motion.div>

          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => move(-1)}
            disabled={currentIndex === 0}
            aria-label="Previous spread"
            className="absolute left-0 top-[48%] z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/58 bg-white/58 text-[#67556d] shadow-lg transition disabled:opacity-35"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => move(1)}
            disabled={currentIndex === FEATURED_SPREADS.length - 1}
            aria-label="Next spread"
            className="absolute right-0 top-[48%] z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/58 bg-white/58 text-[#67556d] shadow-lg transition disabled:opacity-35"
          >
            <ChevronRight />
          </button>

        </div>

        <div className="rounded-[22px] border border-white/58 bg-white/56 p-3.5 shadow-[0_14px_36px_rgba(97,72,107,0.10)] backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a28191]">Why this spread</p>
          <p className="mt-1.5 line-clamp-3 text-[12px] font-semibold leading-relaxed text-[#655668]">
            {reason}
          </p>
        </div>

        <PrimaryButton onClick={onUse} className="mt-3 w-full">
          Use this spread
        </PrimaryButton>
      </div>
    </StepShell>
  );
}

function SpotlightSelectorStep({
  selected,
  onSelect,
  onChoose,
}: {
  selected: SpreadChoice;
  onSelect: (spread: SpreadChoice) => void;
  onChoose: () => void;
}) {
  const currentIndex = Math.max(0, FEATURED_SPREADS.findIndex((spread) => spread.id === selected.id));
  const center = FEATURED_SPREADS[currentIndex] ?? FEATURED_SPREADS[0]!;

  function move(delta: number) {
    const next = (currentIndex + delta + FEATURED_SPREADS.length) % FEATURED_SPREADS.length;
    onSelect(FEATURED_SPREADS[next]!);
    hapticTick();
  }

  return (
    <StepShell>
      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        <h1 className="font-serif text-[34px] leading-none text-[#332d45]">Choose the shape of the reading.</h1>
        <div className="relative mt-9 h-[420px]">
          <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,244,218,0.78),rgba(247,205,224,0.42)_38%,transparent_70%)]" />
          {[-1, 0, 1].map((offset) => {
            const spread = FEATURED_SPREADS[(currentIndex + offset + FEATURED_SPREADS.length) % FEATURED_SPREADS.length]!;
            const active = offset === 0;
            return (
              <motion.div
                key={`${spread.id}-${offset}`}
                className={`absolute left-1/2 top-1/2 w-[270px] -translate-x-1/2 -translate-y-1/2 rounded-[30px] border p-5 text-center ${
                  active ? "border-white/80 bg-white/62 shadow-[0_26px_72px_rgba(95,72,110,0.18)]" : "border-white/34 bg-white/28 blur-[1.2px]"
                }`}
                animate={{
                  x: offset * 222,
                  scale: active ? 1 : 0.82,
                  opacity: active ? 1 : 0.45,
                }}
                transition={{ type: "spring", stiffness: 180, damping: 24 }}
              >
                <SpreadDiagram spread={spread} active={active} className="h-40" />
                <p className="mt-3 font-serif text-[25px] leading-tight text-[#342e43]">{spread.label}</p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#a88359]">
                  {spread.cardCount} cards
                </p>
                <p className="mt-3 line-clamp-2 text-[13px] font-semibold leading-relaxed text-[#6f5d72]">
                  {spread.description}. {spread.positions}
                </p>
              </motion.div>
            );
          })}
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => move(-1)}
            aria-label="Previous spread"
            className="absolute left-0 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/58 bg-white/48 text-[#67556d] shadow-lg"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => move(1)}
            aria-label="Next spread"
            className="absolute right-0 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/58 bg-white/48 text-[#67556d] shadow-lg"
          >
            <ChevronRight />
          </button>
        </div>
        <PrimaryButton onClick={onChoose} className="mx-auto w-full max-w-[300px]">
          Choose this spread
        </PrimaryButton>
        <p className="mt-4 text-center text-[12px] font-semibold text-[#826f82]">{center.bestFor}</p>
      </div>
    </StepShell>
  );
}

function DesignStep({
  design,
  onDesign,
  spread,
  onContinue,
}: {
  design: RoomDesign;
  onDesign: (design: RoomDesign) => void;
  spread: SpreadChoice;
  onContinue: () => void;
}) {
  return (
    <StepShell>
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#9c7d92]">
          <Palette size={15} />
          Choose your design
        </div>
        <h1 className="mt-3 font-serif text-[34px] leading-none text-[#332d45]">Design your room.</h1>
        <p className="mt-3 max-w-[21rem] text-[14px] font-semibold leading-relaxed text-[#746276]">
          Pick the room mood and card back before the ritual starts.
        </p>

        <div className="mt-6 rounded-[30px] border border-white/64 bg-white/42 p-4 shadow-[0_22px_62px_rgba(96,72,104,0.14)] backdrop-blur-xl">
          <div className={`relative overflow-hidden rounded-[26px] bg-gradient-to-br ${design.background} p-5`}>
            <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_28%,rgba(255,255,255,0.88)_0_1px,transparent_1px),radial-gradient(circle_at_76%_18%,rgba(198,148,73,0.38)_0_1px,transparent_1px)] [background-size:72px_82px]" />
            <div className="relative flex items-center justify-between gap-5">
              <div>
                <p className="font-serif text-[28px] leading-tight text-[#342e43]">{design.label}</p>
                <p className="mt-2 max-w-[13rem] text-[13px] font-semibold leading-relaxed text-[#6f5d72]">
                  {design.mood}
                </p>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#a17c58]">
                  {spread.label} · {spread.cardCount} cards
                </p>
              </div>
              <motion.div
                animate={{ y: [-4, 5, -4], rotate: [-2, 2, -2] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                className="relative shrink-0"
              >
                <div className="absolute -inset-7 rounded-full blur-2xl" style={{ backgroundColor: design.glow }} />
                <TarotBack cardBackId={design.cardBackId} className="relative h-36 w-[88px]" />
              </motion.div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {ROOM_DESIGNS.map((item) => {
              const selected = item.id === design.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    hapticTick();
                    onDesign(item);
                  }}
                  className={`rounded-[20px] border p-2 text-left transition active:scale-[0.98] ${
                    selected ? "border-[#d7a85e] bg-white/68 shadow-[0_12px_32px_rgba(121,82,93,0.14)]" : "border-white/54 bg-white/30"
                  }`}
                >
                  <div className={`relative h-20 overflow-hidden rounded-[16px] bg-gradient-to-br ${item.background}`}>
                    <TarotBack cardBackId={item.cardBackId} className="absolute left-1/2 top-1/2 h-16 w-10 -translate-x-1/2 -translate-y-1/2 rounded-[8px]" />
                  </div>
                  <p className="mt-2 truncate text-[10px] font-black text-[#4a4050]">{item.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        <PrimaryButton onClick={onContinue} className="mt-5 w-full">
          Begin the ritual
        </PrimaryButton>
      </div>
    </StepShell>
  );
}

function RoomDesignStudioStep({
  design,
  onDesign,
  spread,
  onContinue,
}: {
  design: RoomDesign;
  onDesign: (design: RoomDesign) => void;
  spread: SpreadChoice;
  onContinue: () => void;
}) {
  const cardFace = getCardFace(design.cardArtId);
  const background = getRoomBackground(design.backgroundId);
  const cardBack = TAROT_CARD_BACK_CHOICES.find((item) => item.id === design.cardBackId) ?? TAROT_CARD_BACK_CHOICES[0]!;
  const previewImages = CARD_FACE_PREVIEW_IDS
    .map((cardId) => getTarotCardImage(cardId, design.cardArtId))
    .filter((image): image is string => Boolean(image));
  const frontPreviewImage = previewImages[1] ?? previewImages[0] ?? null;
  const cardBackChoices = [
    ...TAROT_CARD_BACK_CHOICES.filter((item) => isUnlockedCardBack(item)),
    ...TAROT_CARD_BACK_CHOICES.filter((item) => isLockedCardBack(item)),
  ];

  return (
    <StepShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#9c7d92]">
          <Palette size={15} />
          Choose your design
        </div>
        <h1 className="mt-3 font-serif text-[34px] leading-none text-[#332d45]">Design your room.</h1>
        <p className="mt-3 max-w-[22rem] text-[14px] font-semibold leading-relaxed text-[#746276]">
          Choose the room, card front, and card back before the ritual starts.
        </p>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none]">
          <div className="rounded-[30px] border border-white/64 bg-white/42 p-4 shadow-[0_22px_62px_rgba(96,72,104,0.14)] backdrop-blur-xl">
            <div className="relative overflow-hidden rounded-[26px] p-5" style={{ background: design.background }}>
              <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_28%,rgba(255,255,255,0.88)_0_1px,transparent_1px),radial-gradient(circle_at_76%_18%,rgba(198,148,73,0.38)_0_1px,transparent_1px)] [background-size:72px_82px]" />
              <div className="relative flex items-center justify-between gap-5">
                <div className="min-w-0">
                  <p className="font-serif text-[28px] leading-tight text-[#342e43]">{background.label}</p>
                  <p className="mt-2 max-w-[14rem] text-[13px] font-semibold leading-relaxed text-[#6f5d72]">
                    {cardFace.label} front. {cardBack.label} back.
                  </p>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#a17c58]">
                    {spread.label} · {spread.cardCount} cards
                  </p>
                </div>
                <div className="relative h-40 w-[204px] shrink-0">
                  <div className="absolute -inset-7 rounded-full blur-2xl" style={{ backgroundColor: design.glow }} />
                  <span className="absolute left-1 top-0 block h-[150px] w-[94px] -rotate-[4deg]">
                    <TarotBack cardBackId={design.cardBackId} className="h-full w-full rounded-[13px]" />
                  </span>
                  {frontPreviewImage ? (
                    <span className="absolute right-1 top-0 z-20 block h-[150px] w-[94px] rotate-[4deg] overflow-hidden rounded-[14px] border border-white/82 shadow-[0_18px_36px_rgba(90,65,95,0.24)]">
                      <img src={frontPreviewImage} alt="" aria-hidden="true" className="h-full w-full object-cover" draggable={false} />
                    </span>
                  ) : null}
                  <span className="absolute bottom-0 left-7 rounded-full border border-white/54 bg-white/76 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-[#8d7185]">Back</span>
                  <span className="absolute bottom-0 right-7 z-30 rounded-full border border-white/64 bg-white/86 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-[#8d7185]">Front</span>
                </div>
              </div>
            </div>

            <section className="mt-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9c7d92]">Room background</p>
              <div className="grid grid-cols-3 gap-2">
                {BACKGROUND_STYLES.map((item) => {
                  const selected = item.id === design.backgroundId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        hapticTick();
                        onDesign({
                          ...design,
                          id: item.id,
                          label: item.label,
                          mood: item.description,
                          backgroundId: item.id,
                          background: getRoomSurfaceBackground(item.id),
                          glow: getBackgroundGlow(item.id),
                        });
                      }}
                      className={`rounded-[18px] border p-2 text-left transition active:scale-[0.98] ${
                        selected ? "border-[#d7a85e] bg-white/72 shadow-[0_12px_28px_rgba(121,82,93,0.14)]" : "border-white/54 bg-white/30"
                      }`}
                    >
                      <span className="block h-16 rounded-[14px] border border-white/54" style={{ background: item.preview }} />
                      <span className="mt-2 block truncate text-[10px] font-black text-[#4a4050]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9c7d92]">Card front</p>
              <div className="grid grid-cols-3 gap-2">
                {CARD_FACE_STYLES.map((item) => {
                  const selected = item.id === design.cardArtId;
                  const images = item.previewCards
                    .map((cardId) => getTarotCardImage(cardId, item.id))
                    .filter((image): image is string => Boolean(image));
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        hapticTick();
                        onDesign({ ...design, cardArtId: item.id });
                      }}
                      className={`rounded-[18px] border p-2 text-left transition active:scale-[0.98] ${
                        selected ? "border-[#d7a85e] bg-white/72 shadow-[0_12px_28px_rgba(121,82,93,0.14)]" : "border-white/54 bg-white/30"
                      }`}
                    >
                      <span className="relative block h-16">
                        {images.slice(0, 3).map((image, index) => (
                          <span
                            key={image}
                            className="absolute left-1/2 top-1 block h-14 w-9 overflow-hidden rounded-[8px] border border-white/68 shadow-[0_8px_14px_rgba(90,65,95,0.14)]"
                            style={{ transform: `translateX(calc(-50% + ${(index - 1) * 13}px)) rotate(${(index - 1) * 7}deg)`, zIndex: index + 1 }}
                          >
                            <img src={image} alt="" aria-hidden="true" className="h-full w-full object-cover" draggable={false} />
                          </span>
                        ))}
                      </span>
                      <span className="mt-1 block truncate text-[10px] font-black text-[#4a4050]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9c7d92]">Card back</p>
                <p className="truncate text-[10px] font-bold text-[#7c6a7e]">Core + zodiac unlocked - others use token</p>
              </div>
              <div className="grid max-h-[340px] grid-cols-3 gap-2 overflow-y-auto pr-1 [scrollbar-width:none]">
                {cardBackChoices.map((item) => {
                  const selected = item.id === design.cardBackId;
                  const locked = isLockedCardBack(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        hapticTick();
                        if (locked) return;
                        onDesign({ ...design, cardBackId: item.id });
                      }}
                      className={`relative min-w-0 overflow-hidden rounded-[18px] border p-2 text-center transition active:scale-[0.98] ${
                        selected ? "border-[#d7a85e] bg-white/68 shadow-[0_12px_32px_rgba(121,82,93,0.14)]" : locked ? "border-white/42 bg-white/20 opacity-72" : "border-white/54 bg-white/30"
                      }`}
                      aria-disabled={locked}
                    >
                      <img src={item.image} alt="" aria-hidden="true" className={`mx-auto h-20 w-[52px] rounded-[10px] object-cover shadow-[0_10px_18px_rgba(90,65,95,0.16)] ${locked ? "saturate-[0.75]" : ""}`} draggable={false} />
                      <p className="mt-2 truncate text-[9px] font-black text-[#4a4050]">{item.label}</p>
                      {locked ? (
                        <span className="absolute right-2 top-2 inline-flex h-7 items-center gap-1 rounded-full border border-white/60 bg-white/78 px-2 text-[8px] font-black uppercase tracking-[0.12em] text-[#7a6074] shadow-[0_8px_18px_rgba(72,52,82,0.14)]">
                          <Lock size={10} />
                          Token
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        <PrimaryButton onClick={onContinue} className="mt-4 w-full">
          Begin the ritual
        </PrimaryButton>
      </div>
    </StepShell>
  );
}

function PrepareStep({
  question,
  spread,
  design,
  onDone,
}: {
  question: string;
  spread: SpreadChoice;
  design: RoomDesign;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1300);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <StepShell>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          className="grid h-40 w-40 place-items-center rounded-full border border-[#f2d6e2]/72 bg-white/36 shadow-[0_0_70px_rgba(246,186,209,0.42)]"
          animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.72, 1, 0.72] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <TarotBack cardBackId={design.cardBackId} className="h-28 w-[72px]" />
        </motion.div>
        <h1 className="mt-10 font-serif text-[34px] leading-none text-[#332d45]">Hold your question in your mind.</h1>
        <p className="mt-4 max-w-[20rem] text-[15px] font-semibold leading-relaxed text-[#746276]">
          Move the cards in one slow circle. Release when it feels enough.
        </p>
        <div className="mt-8 w-full max-w-[340px] rounded-[24px] border border-white/62 bg-white/38 p-4 text-left backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#a28191]">{spread.label}</p>
          <p className="mt-2 text-[14px] font-semibold leading-relaxed text-[#4a4050]">{question}</p>
        </div>
      </div>
    </StepShell>
  );
}

function createFlowDeckState(deck: RitualCard[]): FlowDeckState {
  return {
    hiddenDeckOrder: deck,
    ritualCards: deck,
  };
}

function RitualShuffleStep({
  design,
  deck,
  onComplete,
}: {
  design: RoomDesign;
  deck: RitualCard[];
  onComplete: (deck: RitualCard[]) => void;
}) {
  const [deckState, setDeckState] = useState<FlowDeckState>(() => createFlowDeckState(deck));
  const [stage, setStage] = useState<"placed" | "washing" | "gathering" | "cutReady" | "cutting">("placed");
  const [washScore, setWashScore] = useState(0);
  const [washDirection, setWashDirection] = useState<1 | -1>(1);
  const deckStateRef = useRef(deckState);
  const timers = useRef<number[]>([]);
  const lastWashHapticAtRef = useRef(0);
  const lastStrongWashHapticAtRef = useRef(0);
  const washProgress = Math.min(1, washScore / 56);
  const theme = getWashTheme(design);
  const displayRitualCards = deckState.ritualCards;

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  function updateDeckState(updater: (current: FlowDeckState) => FlowDeckState) {
    setDeckState((current) => {
      const next = updater(current);
      deckStateRef.current = next;
      return next;
    });
  }

  useEffect(() => {
    deckStateRef.current = deckState;
  }, [deckState]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (stage !== "placed" && stage !== "washing") return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last > 32) {
        last = now;
        updateDeckState((current) => ({
          ...current,
          ritualCards: applyTableCurrent(
            settleWashedDeck(current.ritualCards),
            now,
            stage === "placed" ? 0.20 : 0.55,
            washDirection,
          ),
        }));
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [stage, washDirection]);

  function beginWash() {
    if (stage !== "placed" && stage !== "washing") return;
    hapticPulse([6, 22, 8]);
    setStage("washing");
    updateDeckState((current) => ({
      ...current,
      ritualCards: loosenDeckForWash(current.ritualCards),
    }));
    setWashScore((score) => Math.max(score, 10));
  }

  function wash(pointer: WashPointer) {
    if (stage !== "washing") return;
    setWashDirection(pointer.spinDirection);
    const now = Date.now();
    if (now - lastWashHapticAtRef.current > 88) {
      lastWashHapticAtRef.current = now;
      hapticTick(pointer.spinDirection === 1 ? 4 : 3);
    }
    updateDeckState((current) => {
      const result = applyWashForce(current.ritualCards, pointer);
      if (result.movementScore > 9 && now - lastStrongWashHapticAtRef.current > 320) {
        lastStrongWashHapticAtRef.current = now;
        hapticPulse([4, 18, 5]);
      }
      setWashScore((score) => Math.min(56, score + result.movementScore * 0.58 + 0.22));
      return {
        ...current,
        ritualCards: result.cards,
      };
    });
  }

  function startCutDeck() {
    const secondCutDirection: 1 | -1 = washDirection === 1 ? -1 : 1;
    setStage("cutting");
    hapticPulse([10, 42, 12]);
    updateDeckState((current) => ({
      ...current,
      hiddenDeckOrder: cutHiddenOrder(current.hiddenDeckOrder, 0.42),
      ritualCards: cutDeckIntoPackets(current.ritualCards, washDirection, 0),
    }));
    clearTimers();
    timers.current = [
      window.setTimeout(() => {
        hapticTick(8);
        updateDeckState((current) => ({
          ...current,
          ritualCards: transferCutPacket(current.ritualCards, washDirection, 0),
        }));
      }, 460),
      window.setTimeout(() => {
        hapticTick(6);
        updateDeckState((current) => ({
          ...current,
          hiddenDeckOrder: cutHiddenOrder(current.hiddenDeckOrder, 0.58),
          ritualCards: cutDeckIntoPackets(current.ritualCards, secondCutDirection, 1),
        }));
      }, 920),
      window.setTimeout(() => {
        hapticTick(8);
        updateDeckState((current) => ({
          ...current,
          ritualCards: transferCutPacket(current.ritualCards, secondCutDirection, 1),
        }));
      }, 1380),
      window.setTimeout(() => {
        hapticPulse([7, 34, 9]);
        updateDeckState((current) => ({
          ...current,
          ritualCards: mergeCutDeckAtCenter(current.ritualCards),
        }));
      }, 1840),
      window.setTimeout(() => {
        onComplete(deckStateRef.current.hiddenDeckOrder);
      }, 2320),
    ];
  }

  function finishWash() {
    if (stage !== "washing") return;
    hapticPulse([8, 34, 10]);
    setWashScore(56);
    setStage("gathering");
    updateDeckState((current) => ({
      ...current,
      hiddenDeckOrder: washHiddenOrder(current.hiddenDeckOrder),
      ritualCards: gatherDeckToCenter(current.ritualCards),
    }));
    clearTimers();
    timers.current = [
      window.setTimeout(() => {
        updateDeckState((current) => ({
          ...current,
          ritualCards: squareDeckAtCenter(current.ritualCards),
        }));
      }, 360),
      window.setTimeout(() => {
        setStage("cutReady");
      }, 620),
      window.setTimeout(startCutDeck, 780),
    ];
  }

  return (
    <CardWashRitual
      stage={stage}
      ritualCards={displayRitualCards}
      washProgress={washProgress}
      theme={theme}
      onBeginWash={beginWash}
      onWash={wash}
      onWashRelease={finishWash}
      onCutDeck={startCutDeck}
      showControls
    />
  );
}

function ShuffleStep({ design, onDone }: { design: RoomDesign; onDone: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [auto, setAuto] = useState(false);
  const [motionSeed, setMotionSeed] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<1 | -1>(1);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const lastShuffleHapticAtRef = useRef(0);

  useEffect(() => {
    if (!auto && !dragging) return undefined;
    const timer = window.setInterval(() => {
      setMotionSeed((current) => current + (auto ? 9 : 2.8));
    }, 72);
    return () => window.clearInterval(timer);
  }, [auto, dragging]);

  function finish() {
    setDragging(false);
    lastPoint.current = null;
    hapticTick(12);
    window.setTimeout(onDone, 720);
  }

  function autoShuffle() {
    setAuto(true);
    setDirection((current) => (current === 1 ? -1 : 1));
    hapticTick();
    window.setTimeout(() => {
      setAuto(false);
      finish();
    }, 4200);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.42, ease: [0.22, 0.74, 0.2, 1] }}
      className="relative z-10 min-h-full overflow-hidden px-5 pb-[calc(var(--hint-safe-bottom)+1.25rem)] pt-[calc(var(--hint-safe-top)+4rem)] text-center"
      onPointerDown={(event: PointerEvent<HTMLElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        setDragging(true);
        hapticTick(6);
        setPointer({ x, y });
        lastPoint.current = { x, y };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!dragging) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        const previous = lastPoint.current ?? { x, y };
        const turn = previous.x * y - previous.y * x;
        if (Math.abs(turn) > 220) setDirection(turn > 0 ? 1 : -1);
        const now = Date.now();
        if (now - lastShuffleHapticAtRef.current > 150 && Math.hypot(x - previous.x, y - previous.y) > 14) {
          lastShuffleHapticAtRef.current = now;
          hapticTick(3);
        }
        setPointer({ x, y });
        setMotionSeed((current) => current + Math.hypot(x - previous.x, y - previous.y) * 0.35);
        lastPoint.current = { x, y };
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(255,245,224,0.62),transparent_34%),radial-gradient(circle_at_50%_65%,rgba(223,196,255,0.24),transparent_55%)]" />
      <div className="relative z-30 mx-auto max-w-[24rem]">
        <h1 className="font-serif text-[34px] leading-none text-[#332d45]">Wash the deck.</h1>
        <p className="mt-3 text-[14px] font-semibold leading-relaxed text-[#746276]">
          Wash clockwise or counterclockwise. Keep one direction, then release when it feels enough.
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        {Array.from({ length: 42 }, (_, index) => {
          const active = dragging || auto;
          const angle = index * 2.399 + motionSeed * 0.038 * direction;
          const lane = index % 7;
          const radius = active ? 82 + lane * 24 + Math.sin(index * 1.7 + motionSeed * 0.04) * 24 : 6 + index * 0.16;
          const currentX = active
            ? pointer.x * 0.38 + Math.cos(angle) * radius + Math.sin(index * 2.1 + motionSeed * 0.045) * 38
            : (index % 8 - 4) * 1.2;
          const currentY = active
            ? pointer.y * 0.28 + Math.sin(angle) * radius * 0.82 + Math.cos(index * 1.8 + motionSeed * 0.05) * 34
            : -index * 0.22;
          return (
            <motion.div
              key={index}
              className="absolute left-1/2 top-1/2 h-[92px] w-[58px] -translate-x-1/2 -translate-y-1/2"
              animate={{
                x: currentX,
                y: currentY,
                rotate: active ? (angle * 180) / Math.PI + direction * motionSeed + index * 9 : index * 0.35,
                scale: active ? 0.86 + (index % 5) * 0.035 : 0.78,
                opacity: active ? 0.92 : 0.96,
              }}
              transition={{ duration: active ? 0.12 : 0.8, ease: "easeOut" }}
              style={{ zIndex: index }}
            >
              <TarotBack cardBackId={design.cardBackId} className="h-full w-full rounded-[10px]" />
            </motion.div>
          );
        })}
      </div>

      <div className="absolute inset-x-5 bottom-[calc(var(--hint-safe-bottom)+1.25rem)] z-40">
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={autoShuffle}
          className="min-h-12 w-full rounded-full border border-[#d8c8d8] bg-white/60 px-6 text-[13px] font-black text-[#67556d] shadow-[0_18px_44px_rgba(97,72,107,0.14)] backdrop-blur-xl"
        >
          Auto Shuffle
        </button>
      </div>
    </motion.section>
  );
}

function CutStep({ design, onDone }: { design: RoomDesign; onDone: () => void }) {
  const [cut, setCut] = useState(48);
  const [animating, setAnimating] = useState(false);
  const lastCutHapticRef = useRef({ band: Math.round(48 / 8), at: 0 });

  function finishCut() {
    if (animating) return;
    setAnimating(true);
    hapticTick(14);
    window.setTimeout(onDone, 1300);
  }

  return (
    <StepShell>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="font-serif text-[34px] leading-none text-[#332d45]">Cut where it feels right.</h1>
        <p className="mt-3 max-w-[20rem] text-[14px] font-semibold leading-relaxed text-[#746276]">
          Drag the crescent, then release. The upper packet moves under; the lower packet rises.
        </p>
        <div className="relative mt-8 h-[370px] w-full max-w-[360px]">
          <motion.div
            className="absolute left-1/2 top-1/2 h-44 w-28 -translate-x-1/2 -translate-y-1/2"
            animate={animating ? { x: [0, 48, 18, 0], y: [0, 48, 94, 0], rotate: [0, 12, 3, 0] } : { x: 0, y: 0, rotate: 0 }}
            transition={{ duration: 1.15, times: [0, 0.42, 0.72, 1], ease: "easeInOut" }}
          >
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={`top-${index}`}
                className="absolute h-44 w-28"
                style={{ transform: `translate(${index * 0.42}px, ${index * -0.72}px) rotate(${index * 0.18}deg)` }}
              >
                <TarotBack cardBackId={design.cardBackId} className="h-full w-full" />
              </div>
            ))}
          </motion.div>
          <motion.div
            className="absolute left-1/2 top-1/2 h-44 w-28 -translate-x-1/2 -translate-y-1/2"
            animate={animating ? { x: [4, -34, -14, 0], y: [-12, -58, -98, 0], rotate: [2, -10, -3, 0] } : { x: 4, y: -12, rotate: 2 }}
            transition={{ duration: 1.15, times: [0, 0.42, 0.72, 1], ease: "easeInOut" }}
          >
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={`bottom-${index}`}
                className="absolute h-44 w-28"
                style={{ transform: `translate(${index * 0.36}px, ${index * -0.66}px) rotate(${index * -0.16}deg)` }}
              >
                <TarotBack cardBackId={design.cardBackId} className="h-full w-full" />
              </div>
            ))}
          </motion.div>
          {animating ? (
            <motion.div
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff0bf]/50 blur-xl"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1.35, 1.9] }}
              transition={{ duration: 0.92, delay: 0.72, ease: "easeOut" }}
            />
          ) : null}
          <div
            className="absolute left-[calc(50%+64px)] top-1/2 h-56 w-14 -translate-y-1/2 touch-none"
            onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const next = ((event.clientY - rect.top) / rect.height) * 100;
              const clamped = Math.max(8, Math.min(92, next));
              const band = Math.round(clamped / 8);
              const now = Date.now();
              if (band !== lastCutHapticRef.current.band && now - lastCutHapticRef.current.at > 90) {
                lastCutHapticRef.current = { band, at: now };
                hapticTick(4);
              }
              setCut(clamped);
            }}
            onPointerUp={finishCut}
          >
            <div className="absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 rounded-r-full border-r-2 border-[#f4d78f] shadow-[0_0_24px_rgba(244,215,143,0.72)]" />
            <motion.span
              className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[#fff2bf] shadow-[0_0_24px_rgba(244,215,143,0.9)]"
              style={{ top: `${cut}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={finishCut}
          className="min-h-12 rounded-full border border-[#d8c8d8] bg-white/42 px-6 text-[13px] font-black text-[#67556d] shadow-lg"
        >
          Finish Cut
        </button>
      </div>
    </StepShell>
  );
}

type StageSize = {
  width: number;
  height: number;
};

const TAROT_PHONE_FRAME_MAX_WIDTH = 430;
const PICK_WHEEL_CARD_W = 90;
const PICK_WHEEL_CARD_H = 144;
const PICK_WHEEL_CARD_W_ZOOM = 108;
const PICK_WHEEL_CARD_H_ZOOM = 172;
const PICK_WHEEL_DRAG_SENSITIVITY = 0.0058;
const PICK_WHEEL_STEP_SCALE = 0.6;
const PICK_WHEEL_VISIBLE_BUFFER = 72;

type PickWheelGeometry = {
  centerX: number;
  centerY: number;
  radius: number;
  startAngle: number;
};

type PickWheelLayout = {
  x: number;
  y: number;
  rotate: number;
  zIndex: number;
  angle: number;
};

function pickWheelStep(total: number) {
  return ((Math.PI * 2) / Math.max(total, 1)) * PICK_WHEEL_STEP_SCALE;
}

function positiveModulo(value: number, total: number) {
  return ((value % total) + total) % total;
}

function wheelDisplayNumber(index: number, total: number) {
  return positiveModulo(index, total) + 1;
}

function getTarotPhoneStageSize(): StageSize {
  if (typeof window === "undefined") return { width: 390, height: 844 };
  return {
    width: Math.min(window.innerWidth, TAROT_PHONE_FRAME_MAX_WIDTH),
    height: window.innerHeight,
  };
}

function getPickWheelGeometry(zoomed: boolean, size: StageSize): PickWheelGeometry {
  const shorter = Math.min(size.width, size.height);
  const radius = shorter * (zoomed ? 0.98 : 0.95);
  return {
    centerX: size.width * (zoomed ? 0.94 : 1.0),
    centerY: size.height + radius * (zoomed ? 0.39 : 0.43),
    radius,
    startAngle: -Math.PI * 0.86,
  };
}

function getPickWheelLayout(index: number, rotation: number, total: number, geometry: PickWheelGeometry): PickWheelLayout {
  const angle = geometry.startAngle + rotation + index * pickWheelStep(total);
  const x = geometry.centerX + Math.cos(angle) * geometry.radius;
  const y = geometry.centerY + Math.sin(angle) * geometry.radius;
  const fanRotation = angle + Math.PI / 2;
  return {
    x,
    y,
    rotate: fanRotation,
    zIndex: Math.round(y),
    angle,
  };
}

function PickStep({
  spread,
  deck,
  design,
  selectedCards,
  setSelectedCards,
  onDone,
}: {
  spread: SpreadChoice;
  deck: RitualCard[];
  design: RoomDesign;
  selectedCards: RitualCard[];
  setSelectedCards: (cards: RitualCard[]) => void;
  onDone: () => void;
}) {
  const [fanRotation, setFanRotation] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [stageSize, setStageSize] = useState<StageSize>(() => getTarotPhoneStageSize());
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [armedCardId, setArmedCardId] = useState<string | null>(null);
  const wheelDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startRotation: number;
    moved: boolean;
  } | null>(null);
  const suppressNextClickRef = useRef(false);
  const lastWheelHapticNumberRef = useRef<number | null>(null);
  const lastWheelHapticAtRef = useRef(0);
  const lastWheelScrollHapticAtRef = useRef(0);
  const selectedIds = new Set(selectedCards.map((card) => card.visualId));
  const done = selectedCards.length >= spread.cardCount;
  const wheelGeometry = getPickWheelGeometry(zoomed, stageSize);
  const cardBackImageUrl = getTarotCardBackImage(design.cardBackId);
  const pickTarget = {
    x: stageSize.width * 0.52,
    y: stageSize.height * 0.73,
  };
  const wheelStep = pickWheelStep(deck.length);
  const targetAngle = Math.atan2(pickTarget.y - wheelGeometry.centerY, pickTarget.x - wheelGeometry.centerX);
  const virtualCenterIndex = Math.round((targetAngle - wheelGeometry.startAngle - fanRotation) / wheelStep);
  const candidateWheelCards = Array.from({ length: PICK_WHEEL_VISIBLE_BUFFER * 2 + 1 }, (_, offset) => {
    const virtualIndex = virtualCenterIndex - PICK_WHEEL_VISIBLE_BUFFER + offset;
    const index = positiveModulo(virtualIndex, deck.length);
    const card = deck[index];
    return {
      card,
      index,
      virtualIndex,
      displayNumber: wheelDisplayNumber(virtualIndex, deck.length),
      layout: getPickWheelLayout(virtualIndex, fanRotation, deck.length, wheelGeometry),
    };
  }).filter((item): item is { card: RitualCard; index: number; virtualIndex: number; displayNumber: number; layout: PickWheelLayout } => Boolean(item.card));
  let activeWheelCard: (typeof candidateWheelCards)[number] | null = null;
  let activeDistance = Number.POSITIVE_INFINITY;

  for (const item of candidateWheelCards) {
    const { card, layout } = item;
    if (!card || selectedIds.has(card.visualId)) continue;
    const distance = Math.hypot(layout.x - pickTarget.x, layout.y - pickTarget.y);
    if (distance < activeDistance) {
      activeDistance = distance;
      activeWheelCard = item;
    }
  }

  const fallbackVirtualIndex = activeWheelCard?.virtualIndex ?? virtualCenterIndex;
  const activeIndex = positiveModulo(fallbackVirtualIndex, deck.length);
  const activeCard = activeWheelCard?.card ?? deck[activeIndex];
  const activeLayout = activeWheelCard?.layout ?? getPickWheelLayout(fallbackVirtualIndex, fanRotation, deck.length, wheelGeometry);
  const activeNumber = wheelDisplayNumber(fallbackVirtualIndex, deck.length);
  const activeCardIsArmed = Boolean(activeCard && armedCardId === activeCard.visualId);
  const nextPositionIndex = Math.min(selectedCards.length, Math.max(spread.cardCount - 1, 0));
  const nextPositionLabel = spread.positionLabels[nextPositionIndex] ?? `Card ${nextPositionIndex + 1}`;

  useEffect(() => {
    if (lastWheelHapticNumberRef.current === null) {
      lastWheelHapticNumberRef.current = activeNumber;
      return;
    }
    if (lastWheelHapticNumberRef.current === activeNumber) return;
    lastWheelHapticNumberRef.current = activeNumber;

    const now = Date.now();
    if (now - lastWheelHapticAtRef.current < (zoomed ? 46 : 72)) return;
    lastWheelHapticAtRef.current = now;
    hapticTick(zoomed ? 5 : 3);
  }, [activeNumber, zoomed]);

  useEffect(() => {
    if (!placingId) return undefined;
    const timer = window.setTimeout(() => setPlacingId(null), 560);
    return () => window.clearTimeout(timer);
  }, [placingId]);

  useEffect(() => {
    if (!armedCardId) return;
    if (selectedCards.some((card) => card.visualId === armedCardId)) {
      setArmedCardId(null);
    }
  }, [armedCardId, selectedCards]);

  useEffect(() => {
    const updateSize = () => {
      setStageSize(getTarotPhoneStageSize());
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  function choose(card = activeCard, force = false) {
    if (!force && suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    if (done) return;
    if (!card) return;
    if (selectedCards.some((item) => item.visualId === card.visualId)) {
      hapticTick(4);
      setFanRotation((current) => current + pickWheelStep(deck.length) * 2);
      return;
    }
    if (armedCardId !== card.visualId) {
      hapticPulse([4, 20, 5]);
      setArmedCardId(card.visualId);
      return;
    }
    hapticPulse([8, 24, 10]);
    setPlacingId(card.visualId);
    setArmedCardId(null);
    setSelectedCards([...selectedCards, card]);
    setFanRotation((current) => current + pickWheelStep(deck.length) * 2.6);
  }

  function findNearestCard(clientX: number, clientY: number) {
    const threshold = zoomed ? 118 : 104;
    let nearest: { card: RitualCard; distance: number } | null = null;
    for (const item of candidateWheelCards) {
      const { card, layout } = item;
      if (!card || selectedIds.has(card.visualId)) continue;
      const distance = Math.hypot(clientX - layout.x, clientY - layout.y);
      if (distance > threshold) continue;
      if (!nearest || distance < nearest.distance) nearest = { card, distance };
    }
    return nearest?.card ?? null;
  }

  function handleWheelPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (done) return;
    hapticTick(3);
    wheelDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRotation: fanRotation,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleWheelPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = wheelDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.hypot(deltaX, deltaY) > 5) {
      drag.moved = true;
      if (armedCardId) setArmedCardId(null);
    }
    setFanRotation(drag.startRotation + (deltaX - deltaY * 0.7) * PICK_WHEEL_DRAG_SENSITIVITY);
  }

  function handleWheelPointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = wheelDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.moved) {
      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
    } else {
      const card = findNearestCard(event.clientX, event.clientY);
      if (card) {
        suppressNextClickRef.current = true;
        window.setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 0);
        choose(card, true);
      }
    }
    wheelDragRef.current = null;
  }

  function handleWheelScroll(deltaY: number) {
    if (armedCardId) setArmedCardId(null);
    const now = Date.now();
    if (now - lastWheelScrollHapticAtRef.current > 58) {
      lastWheelScrollHapticAtRef.current = now;
      hapticTick(zoomed ? 5 : 3);
    }
    const nextZoomed = deltaY < 0;
    if (nextZoomed !== zoomed) {
      setWheelZoom(nextZoomed);
      return;
    }
    setFanRotation((current) => current - deltaY * 0.0012);
  }

  function setWheelZoom(nextZoomed: boolean, rotationOffset = 0) {
    if (nextZoomed === zoomed) {
      setFanRotation((current) => current + rotationOffset);
      return;
    }

    if (armedCardId) setArmedCardId(null);
    hapticPulse(nextZoomed ? [5, 18, 7] : [4, 16, 4]);
    const nextGeometry = getPickWheelGeometry(nextZoomed, stageSize);
    const desiredAngle = Math.atan2(activeLayout.y - nextGeometry.centerY, activeLayout.x - nextGeometry.centerX);
    const nextRotation = desiredAngle - nextGeometry.startAngle - fallbackVirtualIndex * pickWheelStep(deck.length);
    setFanRotation(nextRotation + rotationOffset);
    setZoomed(nextZoomed);
  }

  const visibleWheelCards = candidateWheelCards
    .filter(({ card, layout }) => {
      if (selectedIds.has(card.visualId)) return false;
      const topLimit = zoomed ? stageSize.height * 0.22 : stageSize.height * 0.36;
      return layout.x > -260 && layout.x < stageSize.width + 260 && layout.y > topLimit && layout.y < stageSize.height + 280;
    });
  const spreadPreviewPoints = spread.layout.slice(0, spread.cardCount);

  return (
    <StepShell>
      <div className="relative flex flex-1 flex-col">
        <div
          className={`pointer-events-none relative z-50 text-center transition duration-300 ${
            zoomed ? "-translate-y-3 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          <h1 className="font-serif text-[32px] leading-none text-[#332d45]">Pick Cards</h1>
          <p className="mt-2 text-[13px] font-bold text-[#746276]">
            {spread.label} - {selectedCards.length} of {spread.cardCount} chosen
          </p>
        </div>
        {zoomed ? (
          <motion.div
            className="pointer-events-none fixed inset-x-0 top-[calc(var(--hint-safe-top)+4.2rem)] z-50 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-white/70 bg-white/78 px-4 py-2 text-[11px] font-black uppercase tracking-[0.13em] text-[#6f5570] shadow-[0_16px_38px_rgba(98,72,107,0.16)] backdrop-blur-xl"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <span>{nextPositionLabel} card</span>
            <span className="h-1 w-1 rounded-full bg-[#d7a85e]" />
            <span>{selectedCards.length} of {spread.cardCount} chosen</span>
          </motion.div>
        ) : null}
        <div
          className={`pointer-events-none relative z-50 mt-7 h-[300px] rounded-[34px] border border-white/70 bg-white/34 shadow-[inset_0_0_80px_rgba(255,255,255,0.20),0_18px_54px_rgba(91,65,100,0.08)] backdrop-blur-sm transition duration-300 ${
            zoomed ? "scale-[0.96] opacity-0" : "scale-100 opacity-100"
          }`}
        >
          {spreadPreviewPoints.map((point, index) => (
            <motion.div
              key={index}
              className="absolute h-[76px] w-[48px] -translate-x-1/2 -translate-y-1/2 rounded-[10px]"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              initial={false}
              animate={selectedCards[index] ? { x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 } : { x: 0, y: 0, scale: 0.92, opacity: 0.78, rotate: 0 }}
              transition={{ type: "spring", stiffness: 160, damping: 21 }}
            >
              {selectedCards[index] ? (
                <motion.div
                  layoutId={`pick-card-${selectedCards[index]!.visualId}`}
                  animate={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 115, damping: 17, mass: 0.95 }}
                  className="relative h-full w-full"
                >
                  {placingId === selectedCards[index]?.visualId ? (
                    <motion.span
                      aria-hidden
                      className="absolute -inset-5 rounded-[18px] border border-[#f1d390]/62"
                      initial={{ opacity: 0.9, scale: 0.72 }}
                      animate={{ opacity: 0, scale: 1.36 }}
                      transition={{ duration: 0.82, ease: "easeOut" }}
                    />
                  ) : null}
                  <TarotBack cardBackId={design.cardBackId} className="h-full w-full rounded-[10px] shadow-[0_14px_30px_rgba(108,79,116,0.12)]" />
                </motion.div>
              ) : (
                <div className="h-full w-full rounded-[10px] border border-dashed border-[#876b84]/82 bg-white/76 shadow-[0_10px_24px_rgba(108,79,116,0.10)]">
                  <span className="grid h-full place-items-center text-[12px] font-black text-[#674f65]">{index + 1}</span>
                </div>
              )}
              <span className="absolute left-1/2 top-[calc(100%+0.35rem)] max-w-[5.5rem] -translate-x-1/2 truncate text-[8px] font-black uppercase tracking-[0.12em] text-[#654f63]">
                {spread.positionLabels[index] ?? `Card ${index + 1}`}
              </span>
            </motion.div>
          ))}
        </div>
        <div
          className="fixed inset-0 z-40 cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
          onPointerDown={handleWheelPointerDown}
          onPointerMove={handleWheelPointerMove}
          onPointerUp={handleWheelPointerUp}
          onPointerCancel={handleWheelPointerUp}
          onWheel={(event) => {
            if (event.cancelable) event.preventDefault();
            handleWheelScroll(event.deltaY);
          }}
          aria-label="Rotating tarot deck wheel"
        >
          <div
            className="pointer-events-none absolute rounded-full border border-[#f1d390]/46 bg-white/14 shadow-[0_28px_84px_rgba(78,56,92,0.16),inset_0_0_110px_rgba(255,255,255,0.22)] backdrop-blur-lg"
            style={{
              left: wheelGeometry.centerX - wheelGeometry.radius,
              top: wheelGeometry.centerY - wheelGeometry.radius,
              width: wheelGeometry.radius * 2,
              height: wheelGeometry.radius * 2,
            }}
          />
          {visibleWheelCards.map(({ card, index, virtualIndex, displayNumber, layout }) => {
            const isActive = virtualIndex === fallbackVirtualIndex;
            const selectedInWheel = selectedIds.has(card.visualId);
            const isArmed = armedCardId === card.visualId;
            const cardWidth = zoomed ? PICK_WHEEL_CARD_W_ZOOM : PICK_WHEEL_CARD_W;
            const cardHeight = zoomed ? PICK_WHEEL_CARD_H_ZOOM : PICK_WHEEL_CARD_H;
            const cardOpacity = selectedInWheel ? 0.68 : 1;
            return (
              <motion.button
                key={`${card.visualId}-${virtualIndex}`}
                layoutId={selectedInWheel ? undefined : `pick-card-${card.visualId}`}
                type="button"
                data-visual-id={card.visualId}
                aria-disabled={selectedInWheel}
                onClick={() => {
                  if (!selectedInWheel) choose(card);
                }}
                aria-label={
                  isArmed
                    ? `Confirm card ${displayNumber}`
                    : isActive
                      ? `Lift active card ${displayNumber}`
                      : `Lift card ${displayNumber}`
                }
                className="absolute block overflow-hidden rounded-[16px] border outline-none transition-[box-shadow,filter,opacity] duration-150 will-change-transform"
                style={{
                  left: layout.x,
                  top: layout.y,
                  width: cardWidth,
                  height: cardHeight,
                  zIndex: layout.zIndex + (isArmed ? 12000 : isActive ? 1000 : 0),
                  opacity: cardOpacity,
                  backgroundColor: "#251d35",
                  backgroundImage: `url("${cardBackImageUrl}")`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  borderColor: isArmed ? "rgba(241,211,144,0.88)" : "rgba(241,211,144,0.42)",
                  boxShadow: isArmed
                    ? "0 28px 58px rgba(78,56,92,0.28), 0 0 0 1px rgba(255,255,255,0.54)"
                    : zoomed
                      ? "0 18px 34px rgba(78,56,92,0.20)"
                      : "0 12px 24px rgba(78,56,92,0.15)",
                  filter: zoomed ? "brightness(0.95) saturate(1.28) contrast(1.18)" : "brightness(0.96) saturate(1.22) contrast(1.14)",
                  transformOrigin: "50% 100%",
                }}
                animate={{
                  x: "-50%",
                  y: isArmed ? (zoomed ? "-132%" : "-128%") : "-100%",
                  rotate: `${layout.rotate}rad`,
                  scale: isArmed ? 1.035 : 1,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
              >
                <span className="pointer-events-none absolute inset-[8px] rounded-[11px] border border-white/18" />
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.05),transparent_28%),linear-gradient(140deg,rgba(255,255,255,0.04),transparent_42%)]" />
              </motion.button>
            );
          })}
          {zoomed
            ? visibleWheelCards.map(({ card, virtualIndex, displayNumber, layout }) => {
                const isArmed = armedCardId === card.visualId;
                return (
                  <div
                    key={`wheel-number-${virtualIndex}`}
                    className="pointer-events-none absolute"
                    style={{
                      left: layout.x,
                      top: layout.y,
                      width: PICK_WHEEL_CARD_W_ZOOM,
                      height: PICK_WHEEL_CARD_H_ZOOM,
                      zIndex: layout.zIndex + (isArmed ? 14000 : 9000),
                      transform: `translate(-50%, ${isArmed ? "-132%" : "-100%"}) rotate(${layout.rotate}rad)`,
                      transformOrigin: "50% 100%",
                    }}
                  >
                    <span
                      className={`absolute left-1/2 top-[-2.15rem] grid h-7 min-w-7 place-items-center rounded-full border px-1.5 font-serif text-[12px] font-black leading-none shadow-[0_10px_22px_rgba(80,60,90,0.18)] backdrop-blur-md ${
                        isArmed
                          ? "border-[#e3b45f]/86 bg-[#fff2cf]/95 text-[#6e4c25]"
                          : "border-white/86 bg-white/92 text-[#332d45]"
                      }`}
                      style={{ transform: `translateX(-50%) rotate(${-layout.rotate}rad)` }}
                    >
                      {displayNumber}
                    </span>
                  </div>
                );
              })
            : null}
        </div>
        <button
          type="button"
          onClick={() => {
            hapticTick(8);
            setWheelZoom(!zoomed);
          }}
          aria-label={zoomed ? "Zoom out wheel" : "Zoom in wheel"}
          className="fixed bottom-[calc(var(--hint-safe-bottom)+1rem)] left-5 z-50 grid h-12 w-12 place-items-center rounded-full border border-[#f1d390]/52 bg-white/78 text-[#6f5570] shadow-[0_18px_44px_rgba(97,72,107,0.18)] backdrop-blur-xl transition active:scale-95"
        >
          {zoomed ? <ZoomOut size={19} /> : <ZoomIn size={19} />}
        </button>
        <div className="pointer-events-none fixed inset-x-5 bottom-[calc(var(--hint-safe-bottom)+1rem)] z-50">
          {done ? (
            <PrimaryButton onClick={onDone} className="pointer-events-auto w-full">
              Reveal Reading
            </PrimaryButton>
          ) : (
            <button
              type="button"
              onClick={() => choose(activeCard, true)}
              className={`pointer-events-auto ml-auto flex min-h-12 w-fit min-w-32 items-center justify-center rounded-full border px-5 text-[12px] font-black uppercase tracking-[0.12em] shadow-[0_18px_44px_rgba(97,72,107,0.18)] backdrop-blur-xl transition active:scale-95 ${
                activeCardIsArmed
                  ? "border-[#d7a85e]/72 bg-[#fff0cc]/88 text-[#7b572e]"
                  : "border-[#f1d390]/52 bg-white/72 text-[#6f5570]"
              }`}
            >
              {activeCardIsArmed ? "Confirm" : "Lift"} {activeNumber}
            </button>
          )}
        </div>
      </div>
    </StepShell>
  );
}

function TarotPhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div data-testid="tarot-phone-frame-shell" className="absolute inset-0 flex justify-center overflow-hidden bg-[#f8edf4]">
      <div
        data-testid="tarot-phone-frame"
        className="relative h-full min-h-0 w-full max-w-[430px] transform-gpu overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.55),0_24px_80px_rgba(82,62,91,0.12)]"
      >
        {children}
      </div>
    </div>
  );
}

export function TarotRoomFlow() {
  const [step, setStep] = useState<TarotStep>("question");
  const [question, setQuestion] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [spread, setSpread] = useState<SpreadChoice>(() => SPREAD_CHOICES.find((item) => item.id === "three") ?? SPREAD_CHOICES[0]!);
  const [spreadRecommendation, setSpreadRecommendation] = useState<SpreadRecommendation | null>(null);
  const [spreadRecommendationPending, setSpreadRecommendationPending] = useState(false);
  const [design, setDesign] = useState<RoomDesign>(ROOM_DESIGNS[0]!);
  const [selectedCards, setSelectedCards] = useState<RitualCard[]>([]);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [deck, setDeck] = useState<RitualCard[]>(() => createHiddenDeck());

  async function submitQuestionValue(value: string) {
    const cleaned = cleanQuestion(value);
    if (!cleaned) return;
    hapticPulse([8, 26, 8]);
    const localRecommendation = buildLocalSpreadRecommendation(cleaned);
    const localSpread = findSpreadChoice(localRecommendation.spreadType) ?? recommendSpread(cleaned);
    setQuestion(cleaned);
    setSpread(localSpread);
    setSpreadRecommendation(localRecommendation);
    setSpreadRecommendationPending(true);
    setSelectedCards([]);
    setRevealedIds([]);
    setDeck(createHiddenDeck());
    setStep("spreadRecommendation");

    try {
      const apiRecommendation = await requestSpreadRecommendation(cleaned);
      const apiSpread = findSpreadChoice(apiRecommendation.spreadType) ?? localSpread;
      setSpread(apiSpread);
      setSpreadRecommendation(apiRecommendation);
    } catch {
      setSpread(localSpread);
      setSpreadRecommendation(localRecommendation);
    } finally {
      setSpreadRecommendationPending(false);
    }
  }

  function submitQuestion() {
    void submitQuestionValue(question);
  }

  if (step === "reading") {
    return (
      <TarotPhoneFrame>
        <div className="absolute inset-0">
          <TarotHintReadingChat
            selectedCards={selectedCards}
            spread={spread}
            backStyle={design.backStyle}
            cardBackId={design.cardBackId}
            cardArtId={design.cardArtId}
            question={question}
            focusLabel={spreadRecommendation?.focusLabel ?? "Tarot Room"}
          />
        </div>
      </TarotPhoneFrame>
    );
  }

  return (
    <TarotPhoneFrame>
    <div className="absolute inset-0 overflow-hidden text-[#332d45]">
      <RoomBackground design={design} />
      <Link
        href="/app"
        aria-label="Close Tarot Room"
        className="absolute left-4 top-[calc(var(--hint-safe-top)+0.75rem)] z-[80] grid h-10 w-10 place-items-center rounded-full border border-white/60 bg-white/48 text-[#5e5063] shadow-[0_10px_28px_rgba(92,72,105,0.14)] backdrop-blur-xl transition active:scale-95"
      >
        <ArrowLeft size={18} />
      </Link>
      <div className="pointer-events-none absolute right-5 top-[calc(var(--hint-safe-top)+0.9rem)] z-20 flex items-center gap-2 rounded-full border border-white/54 bg-white/38 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9b7c8d] backdrop-blur-xl">
        <WandSparkles size={13} />
        Tarot Room
      </div>

      <AnimatePresence mode="wait">
        {step === "question" && (
          <QuestionStep
            key="question"
            question={question}
            setQuestion={setQuestion}
            onSubmit={submitQuestion}
            onPromptSelect={(value) => void submitQuestionValue(value)}
            voiceOpen={voiceOpen}
            openVoice={() => setVoiceOpen(true)}
            closeVoice={() => setVoiceOpen(false)}
          />
        )}
        {step === "spreadRecommendation" && (
          <SpreadRecommendationStep
            key="spread-recommendation"
            spread={spread}
            question={question}
            recommendation={spreadRecommendation}
            isLoading={spreadRecommendationPending}
            onSpreadChange={setSpread}
            onUse={() => {
              hapticTick(12);
              setStep("design");
            }}
          />
        )}
        {step === "spreadSelector" && (
          <SpotlightSelectorStep
            key="spread-selector"
            selected={spread}
            onSelect={setSpread}
            onChoose={() => {
              hapticTick(12);
              setStep("design");
            }}
          />
        )}
        {step === "design" && (
          <RoomDesignStudioStep
            key="design"
            design={design}
            onDesign={setDesign}
            spread={spread}
            onContinue={() => {
              hapticPulse([8, 28, 10]);
              setStep("prepare");
            }}
          />
        )}
        {step === "prepare" && (
          <PrepareStep
            key="prepare"
            question={question}
            spread={spread}
            design={design}
            onDone={() => {
              hapticTick(10);
              setStep("shuffle");
            }}
          />
        )}
        {step === "shuffle" && (
          <RitualShuffleStep
            key="shuffle"
            design={design}
            deck={deck}
            onComplete={(nextDeck) => {
              hapticPulse([8, 34, 12]);
              setDeck(nextDeck);
              setStep("pick");
            }}
          />
        )}
        {step === "cut" && <CutStep key="cut" design={design} onDone={() => setStep("pick")} />}
        {step === "pick" && (
          <PickStep
            key="pick"
            spread={spread}
            deck={deck}
            design={design}
            selectedCards={selectedCards}
            setSelectedCards={setSelectedCards}
            onDone={() => {
              hapticPulse([10, 42, 14]);
              setRevealedIds([]);
              setStep("reveal");
            }}
          />
        )}
        {step === "reveal" && (
          <motion.div
            key="reveal"
            className="absolute inset-0 z-30"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.36, ease: "easeOut" }}
          >
            <ReadingReveal
              selectedCards={selectedCards}
              revealedIds={revealedIds}
              spread={spread}
              backStyle={design.backStyle}
              cardBackId={design.cardBackId}
              cardArtId={design.cardArtId}
              theme={getWashTheme(design)}
              autoReveal
              onReveal={(visualId) => {
                hapticTick(8);
                setRevealedIds((current) => (current.includes(visualId) ? current : [...current, visualId]));
              }}
              onContinue={() => {
                hapticTick(12);
                setStep("reading");
              }}
              onRestart={() => {
                hapticTick(10);
                setSelectedCards([]);
                setRevealedIds([]);
                setDeck(createHiddenDeck());
                setSpreadRecommendation(null);
                setSpreadRecommendationPending(false);
                setStep("question");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </TarotPhoneFrame>
  );
}
