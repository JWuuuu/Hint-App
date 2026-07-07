import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type WheelEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { readBirthProfile } from "../../../lib/astro/userBirthProfile";
import { useProfile } from "../../../lib/useProfile";
import { zodiacSign } from "../../me/utils";

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
  preview: string;
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

type DesignPanel = "room" | "front" | "back";

type SpreadRecommendation = {
  spreadType: SpreadChoice["id"];
  reason: string;
  focusLabel: string;
  confidence: "high" | "medium" | "low";
  source: "api" | "local";
};

const SPREAD_PREVIEW_TEXT_STYLE: CSSProperties = {
  fontFamily: "Inter, Arial, system-ui, sans-serif",
  fontVariantNumeric: "tabular-nums",
};

const TWO_LINE_CLAMP_STYLE: CSSProperties = {
  display: "-webkit-box",
  overflow: "hidden",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
};

const QUESTION_CARDS: QuestionCard[] = [
  {
    category: "Love",
    preview: "Why am I thinking about them?",
    question: "Why do I keep thinking about them?",
    icon: "love",
    imageCardId: "6-lovers",
    gradient: "from-[#ffd9e6]/80 via-[#fff6ed]/70 to-[#e7dcff]/70",
  },
  {
    category: "Work",
    preview: "What should I know next?",
    question: "What should I know before my next job move?",
    icon: "career",
    imageCardId: "1-magician",
    gradient: "from-[#f7e5c8]/80 via-[#fff8ef]/72 to-[#e6f0ea]/74",
  },
  {
    category: "Decision",
    preview: "Which path is better?",
    question: "Which path is better for me now?",
    icon: "decision",
    imageCardId: "11-justice",
    gradient: "from-[#f6e8c8]/80 via-[#fff8ef]/70 to-[#dcecff]/70",
  },
  {
    category: "Self",
    preview: "What am I avoiding?",
    question: "What am I avoiding emotionally?",
    icon: "self",
    imageCardId: "9-hermit",
    gradient: "from-[#eee8ff]/80 via-[#fff8f5]/70 to-[#ffdce9]/70",
  },
  {
    category: "Timing",
    preview: "Is now the right time?",
    question: "Is now the right time to act?",
    icon: "timing",
    imageCardId: "14-temperance",
    gradient: "from-[#fff0ca]/80 via-[#fff8ef]/70 to-[#eadcff]/70",
  },
  {
    category: "Truth",
    preview: "What am I missing?",
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

let lastTarotHapticAt = 0;

function canUseTarotHaptic(minGap = 28) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return false;
  if (typeof document !== "undefined" && document.hidden) return false;
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    return false;
  }
  const now = Date.now();
  if (now - lastTarotHapticAt < minGap) return false;
  lastTarotHapticAt = now;
  return true;
}

function hapticTick(duration = 8, minGap = 28) {
  if (canUseTarotHaptic(minGap)) {
    navigator.vibrate(Math.min(18, Math.max(2, duration)));
  }
}

function hapticPulse(pattern: number | number[] = [6, 28, 10], minGap = 86) {
  if (canUseTarotHaptic(minGap)) {
    navigator.vibrate(pattern);
  }
}

const CARD_FACE_PREVIEW_IDS = ["0-fool", "6-lovers", "19-sun"] as const;

type QuestionIntent =
  | "career"
  | "love"
  | "timing"
  | "choice"
  | "self"
  | "general";

function getQuestionIntent(question: string): QuestionIntent {
  const lower = question.toLowerCase();
  if (
    /job|career|work|interview|offer|business|money|boss|company|application|hire|hiring|school|exam/.test(
      lower,
    )
  )
    return "career";
  if (
    /love|relationship|partner|crush|ex|date|dating|them|him|her|connection|feel/.test(
      lower,
    )
  )
    return "love";
  if (/when|timing|soon|time|wait|now|later/.test(lower)) return "timing";
  if (/choice|choose|decision|path|option|which|should i/.test(lower))
    return "choice";
  if (/myself|avoid|emotion|healing|fear|pattern|self/.test(lower))
    return "self";
  return "general";
}

function questionPromptTitle(intent: QuestionIntent = "general") {
  if (intent === "career") return "What part of work needs clarity?";
  if (intent === "love")
    return "What do you need to understand about this connection?";
  if (intent === "timing") return "What timing are you trying to feel out?";
  if (intent === "choice") return "Which choice needs a clearer signal?";
  if (intent === "self") return "What part of you needs an honest mirror?";
  return "What do you need help seeing clearly?";
}

function questionPromptBody(intent: QuestionIntent = "general") {
  if (intent === "career")
    return "Ask about the offer, interview, workplace tension, or next move.";
  if (intent === "love")
    return "Ask about feelings, signals, distance, or what this connection is asking from you.";
  if (intent === "timing")
    return "Ask what is opening now, what needs patience, or when to act.";
  if (intent === "choice")
    return "Name the decision and the room will choose a spread around the pressure point.";
  if (intent === "self")
    return "Ask for the pattern, the lesson, or the truth you keep circling.";
  return "Ask in one sentence, or tap a suggested question.";
}

const DEFAULT_GUEST_CARD_BACK_ID: TarotCardBackId =
  "00_Hint_Sky_Deck/01_Sky_Deck_Celestial_Navy_Gold.png";

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

type ZodiacSignName = (typeof ZODIAC_SIGNS)[number];

const ZODIAC_SIGN_SET = new Set<string>(ZODIAC_SIGNS);

const PERSONAL_ZODIAC_CARD_BACKS: Record<
  ZodiacSignName,
  [TarotCardBackId, TarotCardBackId]
> = {
  Aries: [
    "07_Zodiac_Set_A_Detailed/01_Aries_Ram_Fire_Swirls.png",
    "08_Zodiac_Set_B_Minimal/01_Aries_Ram_Fire_Minimal.png",
  ],
  Taurus: [
    "07_Zodiac_Set_A_Detailed/02_Taurus_Horns_Botanical_Green_Gold.png",
    "08_Zodiac_Set_B_Minimal/02_Taurus_Horns_Sage_Minimal.png",
  ],
  Gemini: [
    "07_Zodiac_Set_A_Detailed/03_Gemini_Twin_Air_Navy_Gold.png",
    "08_Zodiac_Set_B_Minimal/03_Gemini_Twin_Veil_Minimal.png",
  ],
  Cancer: [
    "07_Zodiac_Set_A_Detailed/04_Cancer_Shell_Water_Teal_Gold.png",
    "08_Zodiac_Set_B_Minimal/04_Cancer_Shell_Tide_Minimal.png",
  ],
  Leo: [
    "07_Zodiac_Set_A_Detailed/05_Leo_Solar_Lion_Bronze_Gold.png",
    "08_Zodiac_Set_B_Minimal/05_Leo_Sunburst_Minimal.png",
  ],
  Virgo: [
    "07_Zodiac_Set_A_Detailed/06_Virgo_Wheat_Sage_Gold.png",
    "08_Zodiac_Set_B_Minimal/06_Virgo_Wheat_Minimal.png",
  ],
  Libra: [
    "07_Zodiac_Set_A_Detailed/07_Libra_Scales_Plumberry_Gold.png",
    "08_Zodiac_Set_B_Minimal/07_Libra_Violet_Balance_Minimal.png",
  ],
  Scorpio: [
    "07_Zodiac_Set_A_Detailed/08_Scorpio_Claws_Shadow_Plum_Gold.png",
    "08_Zodiac_Set_B_Minimal/08_Scorpio_Claws_Dark_Minimal.png",
  ],
  Sagittarius: [
    "07_Zodiac_Set_A_Detailed/09_Sagittarius_Bow_Arrow_Burgundy_Gold.png",
    "08_Zodiac_Set_B_Minimal/09_Sagittarius_Pink_Archer_Minimal.png",
  ],
  Capricorn: [
    "07_Zodiac_Set_A_Detailed/10_Capricorn_Sea_Goat_Mountain_Gold.png",
    "08_Zodiac_Set_B_Minimal/10_Capricorn_Goat_Horns_Minimal.png",
  ],
  Aquarius: [
    "07_Zodiac_Set_A_Detailed/11_Aquarius_Waterbearer_Teal_Gold.png",
    "08_Zodiac_Set_B_Minimal/11_Aquarius_Waterbearer_Minimal.png",
  ],
  Pisces: [
    "07_Zodiac_Set_A_Detailed/12_Pisces_Twin_Fish_Navy_Gold.png",
    "08_Zodiac_Set_B_Minimal/12_Pisces_Fish_Waves_Minimal.png",
  ],
};

function isZodiacSignName(value: string | null): value is ZodiacSignName {
  return Boolean(value && ZODIAC_SIGN_SET.has(value));
}

function getPersonalZodiacCardBacks(birthDate?: string | null) {
  const sign = zodiacSign(birthDate);
  if (!isZodiacSignName(sign)) return null;
  return {
    sign,
    cardBackIds: PERSONAL_ZODIAC_CARD_BACKS[sign],
  };
}

function isUnlockedCardBackForBirth(
  item: { id: TarotCardBackId },
  personalBacks: ReturnType<typeof getPersonalZodiacCardBacks>,
) {
  if (personalBacks) return personalBacks.cardBackIds.includes(item.id);
  return item.id === DEFAULT_GUEST_CARD_BACK_ID;
}

function isLockedCardBackForBirth(
  item: { id: TarotCardBackId },
  personalBacks: ReturnType<typeof getPersonalZodiacCardBacks>,
) {
  return !isUnlockedCardBackForBirth(item, personalBacks);
}

function getCardFace(cardArtId: CardFaceId) {
  return (
    CARD_FACE_STYLES.find((item) => item.id === cardArtId) ??
    CARD_FACE_STYLES[0]!
  );
}

function getRoomBackground(backgroundId: RoomBackgroundId) {
  return (
    BACKGROUND_STYLES.find((item) => item.id === backgroundId) ??
    BACKGROUND_STYLES[0]!
  );
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

function compactCardBackLabel(label: string) {
  const words = label.split(/\s+/).filter(Boolean);
  const zodiacWord = words.find((word) => ZODIAC_SIGN_SET.has(word));
  if (zodiacWord) {
    if (words.includes("Early")) return `${zodiacWord} Early`;
    return `${zodiacWord} ${words.includes("Minimal") ? "Minimal" : "Classic"}`;
  }

  const fillerWords = new Set([
    "Black",
    "Blue",
    "Bronze",
    "Burgundy",
    "Dark",
    "Detailed",
    "Early",
    "Gold",
    "Green",
    "Ivory",
    "Lavender",
    "Light",
    "Minimal",
    "Mist",
    "Navy",
    "Periwinkle",
    "Plum",
    "Plumberry",
    "Purple",
    "Rich",
    "Rose",
    "Sage",
    "Teal",
  ]);
  const coreWords = words.filter((word) => !fillerWords.has(word));
  const compactWords = coreWords.length >= 2 ? coreWords : words;

  return compactWords.slice(0, 2).join(" ");
}

function getWashTheme(design: RoomDesign): WashRitualTheme {
  const background = design.backgroundId;
  const starClassName =
    background === "sea"
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
    tableBorderColor:
      background === "dawn"
        ? "rgba(174,132,56,0.26)"
        : "rgba(238,188,205,0.28)",
    tableShadow:
      background === "dawn"
        ? "0 35px 100px rgba(49,61,64,0.38), inset 0 0 92px rgba(255,242,199,0.20)"
        : "0 35px 110px rgba(0,0,0,0.68), 0 0 46px rgba(221,180,255,0.10), inset 0 0 92px rgba(246,187,207,0.13)",
    tableRingColor:
      background === "sea"
        ? "rgba(229,154,190,0.18)"
        : "rgba(246,187,207,0.22)",
    secondaryRingColor:
      background === "sea"
        ? "rgba(103,218,209,0.12)"
        : "rgba(248,214,152,0.14)",
    cardBackStyle: design.backStyle,
    cardBackId: design.cardBackId,
  };
}

type HiddenCardIdentity = Pick<RitualCard, "cardId" | "name" | "orientation">;

type FlowDeckState = {
  hiddenDeckOrder: RitualCard[];
  ritualCards: RitualCard[];
};

function getHiddenIdentities(
  deck: readonly RitualCard[],
): HiddenCardIdentity[] {
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

function cutHiddenOrder(
  deck: readonly RitualCard[],
  ratio = 0.37,
): RitualCard[] {
  const identities = getHiddenIdentities(deck);
  const cutIndex = Math.max(
    1,
    Math.min(identities.length - 1, Math.floor(identities.length * ratio)),
  );
  const cut = [...identities.slice(cutIndex), ...identities.slice(0, cutIndex)];
  return applyHiddenIdentitiesToFixedVisuals(deck, cut);
}

function cleanQuestion(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function recommendSpread(question: string): SpreadChoice {
  const lower = question.toLowerCase();
  if (
    /job|career|work|interview|offer|business|money|boss|company|application|hire|hiring|school|exam/i.test(
      lower,
    )
  ) {
    return (
      SPREAD_CHOICES.find((spread) => spread.id === "three") ??
      FEATURED_SPREADS[0]!
    );
  }
  if (
    /they|them|him|her|love|relationship|ex|crush|partner|feel/i.test(lower)
  ) {
    return (
      SPREAD_CHOICES.find((spread) => spread.id === "trueHeart") ??
      FEATURED_SPREADS[0]!
    );
  }
  if (/choice|choose|decision|path|should|career|move/i.test(lower)) {
    return (
      SPREAD_CHOICES.find((spread) => spread.id === "three") ??
      FEATURED_SPREADS[0]!
    );
  }
  if (/future|when|timing|time|soon/i.test(lower)) {
    return (
      SPREAD_CHOICES.find((spread) => spread.id === "peachBlossom") ??
      FEATURED_SPREADS[0]!
    );
  }
  return (
    SPREAD_CHOICES.find((spread) => spread.id === "three") ??
    FEATURED_SPREADS[0]!
  );
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

function normalizeConfidence(
  value: unknown,
): SpreadRecommendation["confidence"] {
  return value === "high" || value === "medium" || value === "low"
    ? value
    : "medium";
}

function buildLocalSpreadRecommendation(
  question: string,
): SpreadRecommendation {
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

async function requestSpreadRecommendation(
  question: string,
): Promise<SpreadRecommendation> {
  const response = await fetch(apiUrl("/api/tarot/spread-recommendation"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      anonId: getAnonId(),
    }),
  });
  const data = (await response.json()) as Partial<SpreadRecommendation> & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.error ?? `Spread recommendation failed: ${response.status}`,
    );
  }

  const spread = findSpreadChoice(data.spreadType);
  if (
    !spread ||
    typeof data.reason !== "string" ||
    typeof data.focusLabel !== "string"
  ) {
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
  if (spread.id === "three")
    return { width: 44, height: 70, radius: 12, inner: 8, number: 22 };
  if (spread.cardCount >= 7)
    return { width: 26, height: 42, radius: 8, inner: 5, number: 16 };
  if (spread.cardCount >= 5)
    return { width: 32, height: 50, radius: 9, inner: 6, number: 17 };
  return { width: 40, height: 64, radius: 11, inner: 7, number: 20 };
}

function centerSpreadPreviewLayout(points: Array<{ x: number; y: number }>) {
  if (points.length <= 1) return [{ x: 50, y: 50 }];

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const rawWidth = Math.max(1, maxX - minX);
  const rawHeight = Math.max(1, maxY - minY);
  const rawCenterX = (minX + maxX) / 2;
  const rawCenterY = (minY + maxY) / 2;
  const scale = Math.min(1.18, 68 / rawWidth, 56 / rawHeight);

  return points.map((point) => ({
    x: 50 + (point.x - rawCenterX) * scale,
    y: 50 + (point.y - rawCenterY) * scale,
  }));
}

function getSpreadPreviewLayout(spread: SpreadChoice) {
  if (spread.id === "three") {
    return [
      { x: 24, y: 50 },
      { x: 50, y: 50 },
      { x: 76, y: 50 },
    ];
  }

  if (spread.id === "single") {
    return [{ x: 50, y: 50 }];
  }

  if (spread.id === "futureLover") {
    return [
      { x: 14, y: 28 },
      { x: 26, y: 38 },
      { x: 38, y: 52 },
      { x: 50, y: 66 },
      { x: 62, y: 52 },
      { x: 74, y: 38 },
      { x: 86, y: 28 },
    ];
  }

  if (spread.id === "peachBlossom" || spread.id === "trueHeart") {
    return [
      { x: 28, y: 30 },
      { x: 72, y: 30 },
      { x: 28, y: 66 },
      { x: 72, y: 66 },
      { x: 50, y: 48 },
    ];
  }

  if (spread.id === "reconciliation") {
    return [
      { x: 34, y: 26 },
      { x: 66, y: 26 },
      { x: 78, y: 48 },
      { x: 66, y: 70 },
      { x: 50, y: 78 },
      { x: 34, y: 70 },
      { x: 22, y: 48 },
    ];
  }

  if (spread.id === "loveTree") {
    return [
      { x: 50, y: 80 },
      { x: 50, y: 58 },
      { x: 28, y: 54 },
      { x: 72, y: 54 },
      { x: 38, y: 34 },
      { x: 62, y: 34 },
      { x: 50, y: 18 },
    ];
  }

  if (spread.id === "xRelationship") {
    return [
      { x: 24, y: 26 },
      { x: 38, y: 40 },
      { x: 50, y: 54 },
      { x: 62, y: 40 },
      { x: 76, y: 26 },
      { x: 62, y: 68 },
      { x: 50, y: 80 },
      { x: 38, y: 68 },
      { x: 24, y: 80 },
    ];
  }

  return centerSpreadPreviewLayout(
    spread.layout
      .slice(0, spread.cardCount)
      .map((point) => ({ x: point.x, y: point.y })),
  );
}

function getSpreadPreviewLabelStyle(
  point: { x: number; y: number },
  cardHeight: number,
) {
  const offset = cardHeight / 2 + 8;
  const above = point.y > 72 || (point.y >= 30 && point.y < 48);

  return {
    left: `${point.x}%`,
    top: above
      ? `calc(${point.y}% - ${offset}px)`
      : `calc(${point.y}% + ${offset}px)`,
    transform: above ? "translate(-50%, -100%)" : "translate(-50%, 0)",
  };
}

type PickSpreadPreviewPoint = {
  x: number;
  y: number;
};

function pickSpreadSlotSize(spread: SpreadChoice) {
  if (spread.cardCount >= 7) return { width: 42, height: 64 };
  if (spread.cardCount >= 5) return { width: 46, height: 72 };
  return { width: 48, height: 76 };
}

function pickSpreadPanelHeight(spread: SpreadChoice) {
  if (spread.cardCount >= 7) return 318;
  return 300;
}

function getPickSpreadPreviewPoints(spread: SpreadChoice): PickSpreadPreviewPoint[] {
  if (spread.id === "loveTree") {
    return [
      { x: 50, y: 82 },
      { x: 50, y: 55 },
      { x: 24, y: 55 },
      { x: 76, y: 55 },
      { x: 32, y: 25 },
      { x: 68, y: 25 },
      { x: 50, y: 12 },
    ];
  }

  if (spread.id === "reconciliation") {
    return getSpreadPreviewLayout(spread);
  }

  if (spread.cardCount >= 7) {
    return getSpreadPreviewLayout(spread);
  }

  return spread.layout.slice(0, spread.cardCount).map((point) => ({
    x: point.x,
    y: point.y,
  }));
}

function getPickSpreadLabelStyle() {
  return {
    left: "50%",
    top: "calc(100% + 0.35rem)",
    transform: "translateX(-50%)",
  };
}

function SpreadDiagram({
  spread,
  active = false,
  showLabels = false,
  cardBackId,
  className = "",
}: {
  spread: SpreadChoice;
  active?: boolean;
  showLabels?: boolean;
  cardBackId?: TarotCardBackId;
  className?: string;
}) {
  const size = spreadCardSize(spread);
  const previewLayout = getSpreadPreviewLayout(spread);
  const labelsInLegend = showLabels && spread.cardCount >= 5;
  const showInlineLabels = showLabels && !labelsInLegend;
  const displayLayout = labelsInLegend
    ? previewLayout.map((point) => ({
        x: point.x,
        y: 42 + (point.y - 50) * 0.78,
      }))
    : previewLayout;
  const diagramClassName = className.trim() ? className : "h-40";
  const cardBackImageUrl = getTarotCardBackImage(
    cardBackId ?? getDefaultTarotCardBackForStyle("rose"),
  );

  if (spread.id === "three") {
    return (
      <div
        className={`relative w-full min-w-0 overflow-hidden ${diagramClassName}`}
      >
        <div className="absolute inset-0 rounded-[26px] bg-[radial-gradient(circle_at_50%_52%,rgba(255,223,174,0.55),rgba(244,184,211,0.20)_42%,rgba(108,77,142,0.07)_68%,transparent_80%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-start justify-center gap-8">
            {spread.positionLabels.map((label, index) => (
              <div
                key={`${spread.id}-row-${label}`}
                className="flex w-[58px] flex-col items-center"
              >
                <div
                  className={`relative overflow-hidden border ${
                    active
                      ? "border-[#f5d790]/90 bg-[#2f2544]"
                      : "border-white/38 bg-white/24"
                  } shadow-[0_16px_32px_rgba(67,45,86,0.22)]`}
                  style={{
                    width: size.width,
                    height: size.height,
                    borderRadius: size.radius,
                  }}
                >
                  <span
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url("${cardBackImageUrl}")`,
                      filter: active
                        ? "brightness(0.98) saturate(1.18) contrast(1.08)"
                        : "brightness(1.04) saturate(0.94)",
                    }}
                  />
                  <span
                    className="absolute border border-[#ffe5a8]/52 bg-white/5"
                    style={{
                      inset: size.inner,
                      borderRadius: Math.max(4, size.radius - 4),
                    }}
                  />
                  <span
                    className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#f6dfaa]/70 bg-[#fff8ee]/92 text-[10px] font-black text-[#473250] shadow-[0_6px_14px_rgba(36,20,52,0.24)]"
                    style={{
                      width: size.number,
                      height: size.number,
                      ...SPREAD_PREVIEW_TEXT_STYLE,
                    }}
                  >
                    {index + 1}
                  </span>
                </div>
                {showLabels ? (
                  <span
                    className="mt-3 block h-[11px] w-[58px] truncate whitespace-nowrap text-center text-[8px] font-black uppercase leading-none tracking-[0.075em] text-[#6e5968]/84"
                    style={SPREAD_PREVIEW_TEXT_STYLE}
                    title={label}
                  >
                    {label}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full min-w-0 overflow-hidden ${diagramClassName}`}
    >
      <div className="absolute inset-0 rounded-[26px] bg-[radial-gradient(circle_at_50%_48%,rgba(255,232,185,0.62),rgba(244,184,211,0.22)_44%,rgba(108,77,142,0.08)_66%,transparent_78%)]" />
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
      >
        <polyline
          points={displayLayout
            .map((point) => `${point.x},${point.y}`)
            .join(" ")}
          fill="none"
          stroke={active ? "rgba(142,94,42,0.30)" : "rgba(92,74,103,0.14)"}
          strokeDasharray="2.6 5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
        />
      </svg>
      {displayLayout.map((point, index) => (
        <div
          key={`${spread.id}-${index}`}
          className="absolute"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: size.width,
            height: size.height,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className={`absolute inset-0 overflow-hidden border ${
              active
                ? "border-[#f5d790]/90 bg-[#2f2544]"
                : "border-white/38 bg-white/24"
            } shadow-[0_14px_30px_rgba(67,45,86,0.24)]`}
            style={{ borderRadius: size.radius }}
          >
            <span
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("${cardBackImageUrl}")`,
                filter: active
                  ? "brightness(0.98) saturate(1.18) contrast(1.08)"
                  : "brightness(1.04) saturate(0.94)",
              }}
            />
            <span
              className="absolute border border-[#ffe5a8]/52 bg-white/5"
              style={{
                inset: size.inner,
                borderRadius: Math.max(4, size.radius - 4),
              }}
            />
          </div>
          <span
            className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#f6dfaa]/70 bg-[#fff8ee]/92 text-[10px] font-black text-[#473250] shadow-[0_6px_14px_rgba(36,20,52,0.24)]"
            style={{
              width: size.number,
              height: size.number,
              ...SPREAD_PREVIEW_TEXT_STYLE,
            }}
          >
            {index + 1}
          </span>
        </div>
      ))}
      {showInlineLabels ? (
        <>
          {displayLayout.map((point, index) => (
            <span
              key={`${spread.id}-label-${index}`}
              className="absolute z-20 flex h-[13px] w-[64px] items-center justify-center overflow-hidden truncate whitespace-nowrap rounded-full bg-white/58 px-1 text-center text-[7px] font-black uppercase leading-none tracking-[0.055em] text-[#6e5968]/88 shadow-[0_4px_12px_rgba(61,43,74,0.10)] backdrop-blur-md"
              style={{
                ...getSpreadPreviewLabelStyle(point, size.height),
                ...SPREAD_PREVIEW_TEXT_STYLE,
              }}
              title={spread.positionLabels[index]}
            >
              {spread.positionLabels[index]}
            </span>
          ))}
        </>
      ) : null}
      {labelsInLegend ? (
        <div className="absolute inset-x-3 bottom-2 z-20 flex flex-wrap justify-center gap-x-1.5 gap-y-1">
          {spread.positionLabels
            .slice(0, spread.cardCount)
            .map((label, index) => (
              <span
                key={`${spread.id}-legend-${index}`}
                className="flex h-[13px] w-[56px] items-center justify-center overflow-hidden truncate whitespace-nowrap rounded-full bg-white/64 px-1 text-[6.5px] font-black uppercase leading-none tracking-[0.035em] text-[#6e5968]/88 shadow-[0_4px_12px_rgba(61,43,74,0.10)] backdrop-blur-md"
                style={SPREAD_PREVIEW_TEXT_STYLE}
                title={`${index + 1} ${label}`}
              >
                {index + 1} {label}
              </span>
            ))}
        </div>
      ) : null}
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

function RitualPathPanel({
  ready,
  onContinue,
}: {
  ready: boolean;
  onContinue?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const steps = [
    {
      label: "Ask",
      icon: <Sparkles size={16} />,
      tone: "text-[#d7779e] bg-[#fff1f7]",
    },
    {
      label: "Shape",
      icon: <Route size={16} />,
      tone: "text-[#9b76d8] bg-[#f4ecff]",
    },
    {
      label: "Draw",
      icon: <WandSparkles size={16} />,
      tone: "text-[#c68d35] bg-[#fff5dc]",
    },
  ];

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.38, ease: TAROT_STEP_EASE }}
      className="mt-4 rounded-[22px] border border-white/60 bg-white/36 p-3 shadow-[0_14px_34px_rgba(93,68,101,0.10)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div className="flex min-w-0 flex-1 items-center gap-1.5" key={step.label}>
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${step.tone}`}
              aria-hidden="true"
            >
              {step.icon}
            </span>
            <span className="min-w-0 truncate text-[10.5px] font-black text-[#4a3d52]">
              {`${index + 1}. ${step.label}`}
            </span>
          </div>
        ))}
        <span className="rounded-full bg-[#352a46] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#fff8ec] shadow-[0_8px_20px_rgba(55,42,69,0.18)]">
          {ready ? "Next" : "Flow"}
        </span>
      </div>
      {ready && onContinue ? (
        <button
          type="button"
          onClick={() => {
            hapticTick(8);
            onContinue();
          }}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#352a46] px-4 text-[12px] font-black text-[#fff8ec] shadow-[0_14px_30px_rgba(55,42,69,0.20)] transition active:scale-[0.985]"
        >
          Choose spread
          <ChevronRight size={15} strokeWidth={2.5} />
        </button>
      ) : (
        <p className="mt-2 text-[11px] font-bold leading-snug text-[#8b7887]">
          Type your own question or tap a card. Hint will pick the spread.
        </p>
      )}
    </motion.div>
  );
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
      {imageUrl ? (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,18,38,0.04),rgba(24,18,38,0.10))]" />
      ) : null}
      <div className="absolute inset-[10px] rounded-[12px] border border-[#f9e3ad]/38" />
      {!imageUrl ? (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[24px] font-semibold text-[#ffe7a9]/80">
          H
        </span>
      ) : null}
    </div>
  );
}

function RoomBackground({
  design = ROOM_DESIGNS[0]!,
}: {
  design?: RoomDesign;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: design.background }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 24%,rgba(255,255,255,0.86) 0 1px,transparent 1px),radial-gradient(circle at 78% 16%,rgba(205,158,82,0.44) 0 1px,transparent 1px),radial-gradient(circle at 68% 76%,rgba(148,111,188,0.42) 0 1px,transparent 1px)",
          backgroundSize: "118px 138px",
        }}
        animate={
          reducedMotion
            ? undefined
            : {
                backgroundPosition: [
                  "0px 0px, 0px 0px, 0px 0px",
                  "18px 14px, -12px 10px, 8px -16px",
                  "0px 0px, 0px 0px, 0px 0px",
                ],
              }
        }
        transition={
          reducedMotion
            ? undefined
            : { duration: 18, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <div
        className="absolute inset-0 opacity-55 mix-blend-soft-light"
        style={{
          background:
            "linear-gradient(180deg,rgba(255,255,255,0.20),transparent 28%,rgba(255,255,255,0.10) 58%,transparent)",
        }}
      />
      <div className="absolute inset-x-[-20%] bottom-[-16%] h-[48%] rounded-[50%] bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.72),rgba(239,215,224,0.32)_42%,transparent_70%)]" />
    </div>
  );
}

const TAROT_STEP_EASE = [0.18, 0.78, 0.18, 1] as const;

function StepTransitionVeil() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[70] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.82, ease: TAROT_STEP_EASE }}
    >
      <motion.div
        className="absolute left-[-38%] top-[18%] h-[38%] w-[176%] -rotate-6"
        style={{
          background:
            "linear-gradient(90deg,transparent 8%,rgba(255,244,250,0.18) 35%,rgba(255,226,166,0.16) 50%,rgba(214,183,255,0.14) 64%,transparent 92%)",
        }}
        initial={{ x: "-12%" }}
        animate={{ x: "12%" }}
        transition={{ duration: 0.82, ease: TAROT_STEP_EASE }}
      />
      <motion.div
        className="absolute inset-x-6 top-[calc(var(--hint-safe-top)+3.1rem)] h-px rounded-full"
        style={{
          background:
            "linear-gradient(90deg,transparent,rgba(255,232,178,0.78),rgba(246,187,207,0.56),transparent)",
        }}
        initial={{ opacity: 0, scaleX: 0.42 }}
        animate={{ opacity: [0, 0.76, 0], scaleX: [0.42, 1, 0.7] }}
        transition={{ duration: 0.74, ease: TAROT_STEP_EASE }}
      />
    </motion.div>
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
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.986 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -14, scale: 1.006 }}
      transition={{ duration: reducedMotion ? 0 : 0.54, ease: TAROT_STEP_EASE }}
      className="hint-app-scroll absolute inset-0 z-10 flex w-full transform-gpu flex-col px-5 pb-[calc(var(--hint-safe-bottom)+1.25rem)] pt-[calc(var(--hint-safe-top)+4rem)]"
    >
      {!reducedMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-5 top-[calc(var(--hint-safe-top)+4.15rem)] z-0 h-16 rounded-full opacity-0"
          style={{
            background:
              "linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,244,250,0.08),transparent)",
          }}
          animate={{ opacity: [0, 0.42, 0.18], y: [-8, 0, 6] }}
          transition={{ duration: 0.82, ease: TAROT_STEP_EASE }}
        />
      ) : null}
      <motion.div
        className="relative z-10 flex min-h-0 flex-1 flex-col"
        initial={reducedMotion ? false : { opacity: 0.88, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.44, ease: TAROT_STEP_EASE }}
      >
        {children}
      </motion.div>
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
        <p className="font-serif text-[28px] text-[#382f45]">
          I'm listening...
        </p>
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
              transition={{
                duration: 1.5 + line * 0.12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
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
          <PrimaryButton
            onClick={onUse}
            disabled={!transcript}
            className="min-h-11 flex-1"
          >
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
    const script =
      "What do I need to understand about this connection right now?";
    script.split(" ").forEach((word, index) => {
      window.setTimeout(
        () => {
          setTranscript((current) => `${current}${current ? " " : ""}${word}`);
        },
        170 * (index + 1),
      );
    });
  }

  return (
    <>
      <StepShell>
        <div className="pb-[calc(var(--hint-safe-bottom)+7.5rem)]">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9c7d92]">
            Ask Hint
          </p>
          <h1 className="mt-2.5 font-serif text-[32px] leading-[0.98] text-[#332d45]">
            {questionPromptTitle(intent)}
          </h1>
          <p className="mt-3 max-w-[24rem] text-[13px] font-semibold leading-relaxed text-[#746276]">
            {questionPromptBody(intent)}
          </p>

          {question ? (
            <>
              <div className="mt-5 rounded-[24px] border border-white/66 bg-white/52 p-4 shadow-[0_16px_46px_rgba(102,72,105,0.10)] backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a28398]">
                  Current question
                </p>
                <p className="mt-2 text-[14px] font-bold leading-relaxed text-[#3d3348]">
                  {question}
                </p>
              </div>
              <RitualPathPanel ready onContinue={onSubmit} />
            </>
          ) : (
            <>
              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9c7d92]">
                  Suggested questions
                </p>
                <p className="rounded-full border border-white/56 bg-white/42 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#8a7888] shadow-[0_8px_22px_rgba(96,72,104,0.08)] backdrop-blur-xl">
                  Auto spread
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {QUESTION_CARDS.map((card) => {
                  const image =
                    getTarotCardImage(card.imageCardId, "hint-card-2") ??
                    getTarotCardImage(card.imageCardId, "hint-classic");
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
                      className={`relative h-[94px] overflow-hidden rounded-[18px] border bg-gradient-to-br ${card.gradient} p-3 text-left shadow-[0_14px_32px_rgba(104,82,111,0.12)] transition duration-200 active:scale-[0.98] ${
                        pickedPrompt === card.category
                          ? "border-[#d7a85e] shadow-[0_20px_50px_rgba(215,168,94,0.26)]"
                          : "border-white/72"
                      }`}
                    >
                      <span className="pointer-events-none absolute -right-8 top-0 h-24 w-24 rounded-full bg-white/44 blur-2xl" />
                      <span className="pointer-events-none absolute -bottom-10 left-8 h-24 w-32 rounded-full bg-[#f5c9df]/22 blur-2xl" />
                      {image ? (
                        <span className="pointer-events-none absolute -right-1.5 bottom-2 h-[52px] w-[32px] rotate-[8deg] overflow-hidden rounded-[7px] border border-white/76 opacity-[0.86] shadow-[0_12px_22px_rgba(79,58,91,0.18)]">
                          <img
                            src={image}
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-cover"
                            draggable={false}
                          />
                        </span>
                      ) : null}
                      {pickedPrompt === card.category ? (
                        <span className="pointer-events-none absolute right-2 top-2 z-20 grid h-5 w-5 place-items-center rounded-full bg-[#fff6df] shadow-[0_6px_16px_rgba(155,106,36,0.18)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#9b6a24]" />
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
                      <span
                        className="relative z-10 mt-3 block max-w-[calc(100%-3rem)] text-[12px] font-black leading-snug text-[#3e3448]"
                        style={TWO_LINE_CLAMP_STYLE}
                      >
                        {card.preview}
                      </span>
                    </button>
                  );
                })}
              </div>
              <RitualPathPanel ready={false} />
            </>
          )}
        </div>
      </StepShell>

      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(var(--hint-safe-bottom)+0.8rem)]">
        <div className="mx-auto flex max-w-[440px] items-end gap-2 rounded-[28px] border border-white/68 bg-white/76 p-2 shadow-[0_18px_54px_rgba(83,61,93,0.20)] backdrop-blur-xl">
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
  design,
  onSpreadChange,
  onUse,
}: {
  spread: SpreadChoice;
  question: string;
  recommendation: SpreadRecommendation | null;
  isLoading: boolean;
  design: RoomDesign;
  onSpreadChange: (spread: SpreadChoice) => void;
  onUse: () => void;
}) {
  const dragStartX = useRef<number | null>(null);
  const dragHapticBucketRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const currentIndex = Math.max(
    0,
    FEATURED_SPREADS.findIndex((item) => item.id === spread.id),
  );
  const intent = getQuestionIntent(question);
  const recommendationMatches = recommendation?.spreadType === spread.id;
  const reason = recommendationMatches
    ? recommendation.reason
    : spreadReason(spread, question);
  const matchLabel = isLoading
    ? "Finding match"
    : recommendationMatches && recommendation?.source === "api"
      ? "Hint matched"
      : recommendationMatches
        ? "Smart match"
        : "Browsing spread";

  function move(delta: number) {
    const nextIndex = Math.max(
      0,
      Math.min(FEATURED_SPREADS.length - 1, currentIndex + delta),
    );
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="h-[164px] shrink-0 overflow-hidden">
          <p className="h-3 text-[10px] font-black uppercase leading-none tracking-[0.22em] text-[#9c7d92]">
            Personal spread
          </p>
          <h1 className="mt-2 line-clamp-2 min-h-[56px] font-serif text-[29px] leading-[0.96] text-[#332d45]">
            The room chose {spread.label}.
          </h1>
          <p className="mt-2 line-clamp-2 min-h-[40px] max-w-[22rem] text-[12.5px] font-semibold leading-relaxed text-[#746276]">
            {questionPromptBody(intent)} Swipe to compare another shape.
          </p>
          <div className="mt-3 flex h-7 flex-wrap items-center gap-2 overflow-hidden">
            <span className="inline-flex h-7 items-center rounded-full border border-white/62 bg-white/58 px-3 text-[9px] font-black uppercase tracking-[0.13em] text-[#8a6f83] shadow-[0_8px_22px_rgba(96,72,104,0.10)] backdrop-blur-xl">
              {matchLabel}
            </span>
            {recommendationMatches ? (
              <span className="inline-flex h-7 items-center rounded-full border border-[#e5c987]/50 bg-[#fff4cf]/64 px-3 text-[9px] font-black uppercase tracking-[0.13em] text-[#9a7442]">
                {recommendation.confidence} confidence
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="relative mt-4 h-[430px] touch-pan-y select-none"
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
          <div className="absolute left-1/2 top-[43%] h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,230,185,0.78),rgba(246,181,213,0.42)_38%,rgba(101,70,135,0.20)_62%,transparent_76%)] blur-[2px]" />
          <div className="absolute left-1/2 top-[43%] h-[276px] w-[276px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 bg-[#fff8f4]/20 shadow-[inset_0_0_90px_rgba(255,255,255,0.30),0_22px_54px_rgba(70,47,84,0.12)]" />

          <motion.div
            className="absolute top-3 flex items-center"
            style={{
              left: `calc(50% - ${SPREAD_CAROUSEL_CARD_WIDTH / 2}px)`,
              gap: SPREAD_CAROUSEL_GAP,
            }}
            animate={{ x: -currentIndex * SPREAD_CAROUSEL_STEP + dragOffset }}
            transition={{
              duration: dragOffset ? 0 : 0.34,
              ease: [0.2, 0.76, 0.2, 1],
            }}
          >
            {FEATURED_SPREADS.map((item, index) => {
              const active = index === currentIndex;
              const distance = Math.abs(index - currentIndex);
              return (
                <motion.div
                  key={item.id}
                  className={`h-[360px] shrink-0 overflow-hidden rounded-[28px] border p-4 text-center backdrop-blur-xl ${
                    active
                      ? "border-white/78 bg-white/72 shadow-[0_24px_66px_rgba(72,50,88,0.24)]"
                      : "border-white/38 bg-white/28 blur-[1.1px]"
                  }`}
                  style={{ width: SPREAD_CAROUSEL_CARD_WIDTH }}
                  animate={{
                    scale: active ? 1 : 0.82,
                    opacity: active ? 1 : distance > 1 ? 0.24 : 0.42,
                  }}
                  transition={{ duration: 0.3, ease: [0.2, 0.76, 0.2, 1] }}
                >
                  <div className="mx-auto mb-1.5 w-fit rounded-full border border-[#d9b883]/36 bg-white/56 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#9c7d65]">
                    {active ? "Current spread" : item.cardCount + " cards"}
                  </div>
                  <SpreadDiagram
                    spread={item}
                    active={active}
                    showLabels={active}
                    cardBackId={design.cardBackId}
                    className="h-[190px]"
                  />
                  <p className="mt-2 font-serif text-[25px] leading-tight text-[#342e43]">
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#a88359]">
                    {item.cardCount} cards
                  </p>
                  <p className="mx-auto mt-2 line-clamp-2 max-w-[14rem] text-[12px] font-semibold leading-relaxed text-[#6f5d72]">
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
            className="absolute left-0 top-[46%] z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-white/64 text-[#67556d] shadow-lg transition disabled:opacity-35"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => move(1)}
            disabled={currentIndex === FEATURED_SPREADS.length - 1}
            aria-label="Next spread"
            className="absolute right-0 top-[46%] z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-white/64 text-[#67556d] shadow-lg transition disabled:opacity-35"
          >
            <ChevronRight />
          </button>
        </div>

        <div className="rounded-[20px] border border-white/58 bg-white/62 p-3 shadow-[0_14px_36px_rgba(97,72,107,0.10)] backdrop-blur-xl">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#a28191]">
            Why this spread
          </p>
          <p className="mt-1.5 line-clamp-2 text-[11.5px] font-semibold leading-relaxed text-[#655668]">
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
  cardBackId,
  onSelect,
  onChoose,
}: {
  selected: SpreadChoice;
  cardBackId: TarotCardBackId;
  onSelect: (spread: SpreadChoice) => void;
  onChoose: () => void;
}) {
  const currentIndex = Math.max(
    0,
    FEATURED_SPREADS.findIndex((spread) => spread.id === selected.id),
  );
  const center = FEATURED_SPREADS[currentIndex] ?? FEATURED_SPREADS[0]!;

  function move(delta: number) {
    const next =
      (currentIndex + delta + FEATURED_SPREADS.length) %
      FEATURED_SPREADS.length;
    onSelect(FEATURED_SPREADS[next]!);
    hapticTick();
  }

  return (
    <StepShell>
      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        <h1 className="font-serif text-[34px] leading-none text-[#332d45]">
          Choose the shape of the reading.
        </h1>
        <div className="relative mt-9 h-[420px]">
          <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,244,218,0.78),rgba(247,205,224,0.42)_38%,transparent_70%)]" />
          {[-1, 0, 1].map((offset) => {
            const spread =
              FEATURED_SPREADS[
                (currentIndex + offset + FEATURED_SPREADS.length) %
                  FEATURED_SPREADS.length
              ]!;
            const active = offset === 0;
            return (
              <motion.div
                key={`${spread.id}-${offset}`}
                className={`absolute left-1/2 top-1/2 w-[270px] -translate-x-1/2 -translate-y-1/2 rounded-[30px] border p-5 text-center ${
                  active
                    ? "border-white/80 bg-white/62 shadow-[0_26px_72px_rgba(95,72,110,0.18)]"
                    : "border-white/34 bg-white/28 blur-[1.2px]"
                }`}
                animate={{
                  x: offset * 222,
                  scale: active ? 1 : 0.82,
                  opacity: active ? 1 : 0.45,
                }}
                transition={{ type: "spring", stiffness: 180, damping: 24 }}
              >
                <SpreadDiagram
                  spread={spread}
                  active={active}
                  cardBackId={cardBackId}
                  className="h-40"
                />
                <p className="mt-3 font-serif text-[25px] leading-tight text-[#342e43]">
                  {spread.label}
                </p>
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
        <PrimaryButton
          onClick={onChoose}
          className="mx-auto w-full max-w-[300px]"
        >
          Choose this spread
        </PrimaryButton>
        <p className="mt-4 text-center text-[12px] font-semibold text-[#826f82]">
          {center.bestFor}
        </p>
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
  const [activePanel, setActivePanel] = useState<DesignPanel>("room");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [showTokenStyles, setShowTokenStyles] = useState(false);
  const { profile } = useProfile();
  const [storedBirthProfile, setStoredBirthProfile] = useState(() =>
    readBirthProfile(),
  );
  const cardFace = getCardFace(design.cardArtId);
  const background = getRoomBackground(design.backgroundId);
  const activeBirthDate =
    profile?.birthDate ?? storedBirthProfile?.birthDate ?? null;
  const personalBacks = getPersonalZodiacCardBacks(activeBirthDate);
  const cardBack =
    TAROT_CARD_BACK_CHOICES.find((item) => item.id === design.cardBackId) ??
    TAROT_CARD_BACK_CHOICES[0]!;
  const cardBackShortLabel = compactCardBackLabel(cardBack.label);
  const previewImages = CARD_FACE_PREVIEW_IDS.map((cardId) =>
    getTarotCardImage(cardId, design.cardArtId),
  ).filter((image): image is string => Boolean(image));
  const frontPreviewImage = previewImages[1] ?? previewImages[0] ?? null;
  const unlockedCardBackChoices = TAROT_CARD_BACK_CHOICES.filter((item) =>
    isUnlockedCardBackForBirth(item, personalBacks),
  );
  const lockedCardBackChoices = TAROT_CARD_BACK_CHOICES.filter((item) =>
    isLockedCardBackForBirth(item, personalBacks),
  );
  const visibleCardBackChoices = showTokenStyles
    ? [...unlockedCardBackChoices, ...lockedCardBackChoices]
    : unlockedCardBackChoices;
  const cardBackHelpText = personalBacks
    ? `Your ${personalBacks.sign} sign has two card backs. Other styles stay available with tokens.`
    : "Your astrology sign card backs appear after profile setup.";
  const summaryItems = [
    { label: "Spread", value: spread.label },
    { label: "Front", value: cardFace.label },
    { label: "Back", value: cardBackShortLabel },
  ];
  const panelTabs: Array<{ id: DesignPanel; label: string; value: string }> = [
    { id: "room", label: "Room", value: background.label },
    { id: "front", label: "Front", value: cardFace.label },
    { id: "back", label: "Back", value: cardBackShortLabel },
  ];

  useEffect(() => {
    const syncBirthProfile = () => setStoredBirthProfile(readBirthProfile());
    window.addEventListener("hint.birthProfile.updated", syncBirthProfile);
    return () => {
      window.removeEventListener(
        "hint.birthProfile.updated",
        syncBirthProfile,
      );
    };
  }, []);

  useEffect(() => {
    if (isUnlockedCardBackForBirth({ id: design.cardBackId }, personalBacks)) {
      return;
    }
    const nextCardBackId =
      personalBacks?.cardBackIds[0] ?? DEFAULT_GUEST_CARD_BACK_ID;
    if (nextCardBackId === design.cardBackId) return;
    onDesign({ ...design, cardBackId: nextCardBackId });
  }, [activeBirthDate, design, onDesign, personalBacks]);

  return (
    <StepShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#9c7d92]">
          <Palette size={15} />
          Reading setup
        </div>
        <h1 className="mt-3 font-serif text-[34px] leading-none text-[#332d45]">
          Your reading is ready.
        </h1>
        <p className="mt-3 max-w-[22rem] text-[14px] font-semibold leading-relaxed text-[#746276]">
          Hint has set the spread and your astrology-sign card back. Begin now,
          or adjust the look first.
        </p>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-3 pr-1 [scrollbar-width:none]">
          <div className="rounded-[28px] border border-white/64 bg-white/46 p-3 shadow-[0_22px_62px_rgba(96,72,104,0.14)] backdrop-blur-xl">
            <div
              className="relative overflow-hidden rounded-[24px] p-4"
              style={{ background: design.background }}
            >
              <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_28%,rgba(255,255,255,0.88)_0_1px,transparent_1px),radial-gradient(circle_at_76%_18%,rgba(198,148,73,0.38)_0_1px,transparent_1px)] [background-size:72px_82px]" />
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9b7a8d]">
                    Ritual setup
                  </p>
                  <p className="mt-1 truncate font-serif text-[29px] leading-tight text-[#342e43]">
                    {spread.label}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-white/58 bg-white/62 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#8d6f82]">
                  {spread.cardCount} cards
                </span>
              </div>

              <div className="relative z-10 mt-4 grid grid-cols-[minmax(0,1fr)_154px] items-center gap-3">
                <div className="min-w-0 space-y-2">
                  {summaryItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex min-h-10 items-center justify-between gap-3 rounded-[16px] border border-white/46 bg-white/44 px-3"
                    >
                      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#9b7a8d]">
                        {item.label}
                      </span>
                      <span className="min-w-0 truncate text-right text-[12px] font-black text-[#43394a]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="relative h-[150px] min-w-0 overflow-hidden rounded-[22px] border border-white/42 bg-white/22 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]">
                  <div
                    className="absolute -inset-6 rounded-full blur-2xl"
                    style={{ backgroundColor: design.glow }}
                  />
                  <div className="relative z-10 grid h-full grid-cols-2 gap-2">
                    <div className="flex min-w-0 flex-col items-center justify-center rounded-[17px] border border-white/46 bg-white/28 px-1 py-2">
                      <TarotBack
                        cardBackId={design.cardBackId}
                        className="h-[94px] w-[60px] rounded-[12px]"
                      />
                      <span className="mt-2 block text-[8px] font-black uppercase tracking-[0.12em] text-[#8f7185]">
                        Back
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-col items-center justify-center rounded-[17px] border border-white/46 bg-white/28 px-1 py-2">
                      {frontPreviewImage ? (
                        <span className="block h-[94px] w-[60px] overflow-hidden rounded-[12px] border border-white/82 shadow-[0_14px_28px_rgba(90,65,95,0.18)]">
                          <img
                            src={frontPreviewImage}
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-cover"
                            draggable={false}
                          />
                        </span>
                      ) : (
                        <span className="flex h-[94px] w-[60px] items-center justify-center rounded-[12px] border border-white/68 bg-white/34 font-serif text-[22px] text-[#6a536a]">
                          H
                        </span>
                      )}
                      <span className="mt-2 block text-[8px] font-black uppercase tracking-[0.12em] text-[#8f7185]">
                        Front
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                hapticTick();
                setCustomizeOpen((current) => !current);
              }}
              className="mt-3 flex min-h-12 w-full items-center justify-between rounded-[22px] border border-white/54 bg-white/42 px-4 text-left text-[#54475c] transition active:scale-[0.99]"
              aria-expanded={customizeOpen}
            >
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#9c7d92]">
                  Customize
                </span>
                <span className="mt-0.5 block text-[12px] font-black">
                  Room, card front, and card back
                </span>
              </span>
              <ChevronRight
                size={17}
                className={`transition ${customizeOpen ? "rotate-90" : ""}`}
              />
            </button>

            {customizeOpen ? (
              <>
                <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-[22px] border border-white/54 bg-white/32 p-1">
                  {panelTabs.map((panel) => {
                    const selected = activePanel === panel.id;
                    return (
                      <button
                        key={panel.id}
                        type="button"
                        onClick={() => {
                          hapticTick();
                          setActivePanel(panel.id);
                        }}
                        className={`min-w-0 rounded-[18px] px-2 py-2.5 text-left transition active:scale-[0.98] ${
                          selected
                            ? "bg-white/78 text-[#3d3349] shadow-[0_10px_24px_rgba(92,65,102,0.14)]"
                            : "text-[#8a7588]"
                        }`}
                      >
                        <span className="block text-[9px] font-black uppercase tracking-[0.14em]">
                          {panel.label}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] font-black">
                          {panel.value}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-[24px] border border-white/54 bg-white/32 p-3">
                  {activePanel === "room" ? (
                    <section>
                      <div className="mb-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9c7d92]">
                          Room background
                        </p>
                        <p className="mt-1 text-[12px] font-bold text-[#6b596c]">
                          Choose the atmosphere for the reading.
                        </p>
                      </div>
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
                                  background: getRoomSurfaceBackground(
                                    item.id,
                                  ),
                                  glow: getBackgroundGlow(item.id),
                                });
                              }}
                              className={`rounded-[18px] border p-2 text-left transition active:scale-[0.98] ${
                                selected
                                  ? "border-[#d7a85e] bg-white/78 shadow-[0_12px_28px_rgba(121,82,93,0.14)]"
                                  : "border-white/54 bg-white/30"
                              }`}
                            >
                              <span
                                className="block h-16 rounded-[14px] border border-white/54"
                                style={{ background: item.preview }}
                              />
                              <span className="mt-2 block truncate text-[10px] font-black text-[#4a4050]">
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}

                  {activePanel === "front" ? (
                    <section>
                      <div className="mb-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9c7d92]">
                          Card front
                        </p>
                        <p className="mt-1 text-[12px] font-bold text-[#6b596c]">
                          Pick the art style shown after reveal.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {CARD_FACE_STYLES.map((item) => {
                          const selected = item.id === design.cardArtId;
                          const images = item.previewCards
                            .map((cardId) =>
                              getTarotCardImage(cardId, item.id),
                            )
                            .filter((image): image is string =>
                              Boolean(image),
                            );
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                hapticTick();
                                onDesign({ ...design, cardArtId: item.id });
                              }}
                              className={`rounded-[18px] border p-2 text-left transition active:scale-[0.98] ${
                                selected
                                  ? "border-[#d7a85e] bg-white/78 shadow-[0_12px_28px_rgba(121,82,93,0.14)]"
                                  : "border-white/54 bg-white/30"
                              }`}
                            >
                              <span className="relative block h-16">
                                {images.slice(0, 3).map((image, index) => (
                                  <span
                                    key={image}
                                    className="absolute left-1/2 top-1 block h-14 w-9 overflow-hidden rounded-[8px] border border-white/68 shadow-[0_8px_14px_rgba(90,65,95,0.14)]"
                                    style={{
                                      transform: `translateX(calc(-50% + ${(index - 1) * 13}px)) rotate(${(index - 1) * 7}deg)`,
                                      zIndex: index + 1,
                                    }}
                                  >
                                    <img
                                      src={image}
                                      alt=""
                                      aria-hidden="true"
                                      className="h-full w-full object-cover"
                                      draggable={false}
                                    />
                                  </span>
                                ))}
                              </span>
                              <span className="mt-1 block truncate text-[10px] font-black text-[#4a4050]">
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}

                  {activePanel === "back" ? (
                    <section>
                      <div className="mb-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9c7d92]">
                          Card back
                        </p>
                        <p className="mt-1 text-[12px] font-bold leading-snug text-[#6b596c]">
                          {cardBackHelpText}
                        </p>
                      </div>
                      <div className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto pr-1 [scrollbar-width:none]">
                        {visibleCardBackChoices.map((item) => {
                          const selected = item.id === design.cardBackId;
                          const locked = isLockedCardBackForBirth(
                            item,
                            personalBacks,
                          );
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                hapticTick();
                                if (locked) return;
                                onDesign({ ...design, cardBackId: item.id });
                              }}
                              className={`relative min-w-0 overflow-hidden rounded-[18px] border p-3 text-center transition active:scale-[0.98] ${
                                selected
                                  ? "border-[#d7a85e] bg-white/72 shadow-[0_12px_32px_rgba(121,82,93,0.14)]"
                                  : locked
                                    ? "border-white/42 bg-white/20 opacity-72"
                                    : "border-white/54 bg-white/30"
                              }`}
                              aria-disabled={locked}
                            >
                              <img
                                src={item.image}
                                alt=""
                                aria-hidden="true"
                                className={`mx-auto h-24 w-[62px] rounded-[11px] object-cover shadow-[0_10px_18px_rgba(90,65,95,0.16)] ${locked ? "saturate-[0.75]" : ""}`}
                                draggable={false}
                              />
                              <p className="mt-2 truncate text-[10px] font-black text-[#4a4050]">
                                {compactCardBackLabel(item.label)}
                              </p>
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
                      {lockedCardBackChoices.length ? (
                        <button
                          type="button"
                          onClick={() => {
                            hapticTick();
                            setShowTokenStyles((current) => !current);
                          }}
                          className="mt-3 min-h-10 w-full rounded-full border border-white/58 bg-white/44 px-4 text-[11px] font-black text-[#67556d]"
                        >
                          {showTokenStyles
                            ? "Show my sign backs only"
                            : "Show token styles"}
                        </button>
                      ) : null}
                    </section>
                  ) : null}
                </div>
              </>
            ) : null}
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
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(onDone, reducedMotion ? 520 : 1320);
    return () => window.clearTimeout(timer);
  }, [onDone, reducedMotion]);

  return (
    <StepShell>
      <motion.div
        className="flex flex-1 flex-col items-center justify-center text-center"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.52, ease: TAROT_STEP_EASE }}
      >
        <motion.div
          className="relative grid h-40 w-40 place-items-center rounded-full border border-[#f2d6e2]/72 bg-white/36 shadow-[0_0_70px_rgba(246,186,209,0.42)]"
          initial={reducedMotion ? false : { scale: 0.88, opacity: 0.72 }}
          animate={
            reducedMotion
              ? { scale: 1, opacity: 1 }
              : { scale: [0.9, 1.035, 0.97], opacity: [0.72, 1, 0.88] }
          }
          transition={{ duration: 3.15, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.span
            aria-hidden
            className="absolute inset-[-10px] rounded-full border border-[#f1d390]/38"
            animate={
              reducedMotion
                ? undefined
                : { rotate: [0, 360], opacity: [0.34, 0.72, 0.34] }
            }
            transition={{ duration: 6.8, repeat: Infinity, ease: "linear" }}
          />
          <TarotBack cardBackId={design.cardBackId} className="h-28 w-[72px]" />
        </motion.div>
        <motion.h1
          className="mt-10 font-serif text-[34px] leading-none text-[#332d45]"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.48, delay: reducedMotion ? 0 : 0.12, ease: TAROT_STEP_EASE }}
        >
          Hold your question in your mind.
        </motion.h1>
        <motion.p
          className="mt-4 max-w-[20rem] text-[15px] font-semibold leading-relaxed text-[#746276]"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.48, delay: reducedMotion ? 0 : 0.2, ease: TAROT_STEP_EASE }}
        >
          Move the cards in one slow circle. Release when it feels enough.
        </motion.p>
        <motion.div
          className="mt-8 w-full max-w-[340px] rounded-[24px] border border-white/62 bg-white/38 p-4 text-left backdrop-blur-xl"
          initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.28, ease: TAROT_STEP_EASE }}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#a28191]">
            {spread.label}
          </p>
          <p className="mt-2 text-[14px] font-semibold leading-relaxed text-[#4a4050]">
            {question}
          </p>
        </motion.div>
      </motion.div>
    </StepShell>
  );
}

function createFlowDeckState(deck: RitualCard[]): FlowDeckState {
  return {
    hiddenDeckOrder: deck,
    ritualCards: deck,
  };
}

const CLOCKWISE_WASH_DIRECTION: 1 | -1 = 1;
const AUTO_WASH_DURATION_MS = 3000;
const AUTO_WASH_RELEASE_PAD_MS = 80;
const AUTO_WASH_PHASE_STEP = 0.042;

function RitualShuffleStep({
  design,
  deck,
  onComplete,
}: {
  design: RoomDesign;
  deck: RitualCard[];
  onComplete: (deck: RitualCard[]) => void;
}) {
  const [deckState, setDeckState] = useState<FlowDeckState>(() =>
    createFlowDeckState(deck),
  );
  const [stage, setStage] = useState<
    "placed" | "washing" | "gathering" | "cutReady" | "cutting"
  >("placed");
  const [washScore, setWashScore] = useState(0);
  const [washDirection, setWashDirection] = useState<1 | -1>(CLOCKWISE_WASH_DIRECTION);
  const [autoWashActive, setAutoWashActive] = useState(false);
  const deckStateRef = useRef(deckState);
  const stageRef = useRef(stage);
  const timers = useRef<number[]>([]);
  const pendingWashPointerRef = useRef<WashPointer | null>(null);
  const washFrameRef = useRef<number | null>(null);
  const washDirectionRef = useRef<1 | -1>(washDirection);
  const autoWashPhaseRef = useRef(0);
  const autoWashStartedAtRef = useRef<number | null>(null);
  const autoWashLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastWashHapticAtRef = useRef(0);
  const lastStrongWashHapticAtRef = useRef(0);
  const washCompleteScore = 136;
  const washProgress = Math.min(1, washScore / washCompleteScore);
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
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    washDirectionRef.current = washDirection;
  }, [washDirection]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (washFrameRef.current !== null) {
        window.cancelAnimationFrame(washFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (stage !== "washing" && autoWashActive) {
      setAutoWashActive(false);
    }
    if (stage !== "washing") {
      autoWashStartedAtRef.current = null;
      autoWashLastPointRef.current = null;
    }
  }, [autoWashActive, stage]);

  useEffect(() => {
    if (stage !== "washing") return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last > 54) {
        last = now;
        updateDeckState((current) => ({
          ...current,
          ritualCards: applyTableCurrent(
            settleWashedDeck(current.ritualCards, washDirection),
            now,
            autoWashActive ? 0.20 : 0.24,
            washDirection,
          ),
        }));
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [autoWashActive, stage, washDirection]);

  useEffect(() => {
    if (!autoWashActive || stage !== "washing") return undefined;

    washDirectionRef.current = CLOCKWISE_WASH_DIRECTION;
    setWashDirection(CLOCKWISE_WASH_DIRECTION);
    autoWashStartedAtRef.current = performance.now();
    autoWashLastPointRef.current = null;

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (stageRef.current !== "washing") {
        setAutoWashActive(false);
        return;
      }

      if (now - last >= 52) {
        last = now;
        const startedAt = autoWashStartedAtRef.current ?? now;
        autoWashStartedAtRef.current = startedAt;
        const elapsed = now - startedAt;
        const width = Math.min(Math.max(window.innerWidth || 430, 320), 430);
        const height = Math.min(Math.max((window.innerHeight || 932) * 0.68, 420), 640);
        const centerX = width / 2;
        const centerY = height * 0.50;
        const radiusX = width * 0.31;
        const radiusY = height * 0.245;
        autoWashPhaseRef.current += AUTO_WASH_PHASE_STEP;
        const phase = autoWashPhaseRef.current;
        const x =
          centerX +
          Math.cos(phase) * radiusX +
          Math.sin(phase * 2.25) * width * 0.026;
        const y =
          centerY +
          Math.sin(phase) * radiusY +
          Math.cos(phase * 1.85) * height * 0.020;
        const previous =
          autoWashLastPointRef.current ?? {
            x:
              centerX +
              Math.cos(phase - AUTO_WASH_PHASE_STEP) * radiusX +
              Math.sin((phase - AUTO_WASH_PHASE_STEP) * 2.25) * width * 0.026,
            y:
              centerY +
              Math.sin(phase - AUTO_WASH_PHASE_STEP) * radiusY +
              Math.cos((phase - AUTO_WASH_PHASE_STEP) * 1.85) * height * 0.020,
          };

        autoWashLastPointRef.current = { x, y };
        applyWashPointer(
          {
            x,
            y,
            movementX: x - previous.x,
            movementY: y - previous.y,
            width,
            height,
            spinDirection: CLOCKWISE_WASH_DIRECTION,
            forceScale: 0.16,
          },
          0,
          false,
        );
        const timedProgress =
          elapsed >= AUTO_WASH_DURATION_MS
            ? 1
            : Math.min(0.96, 0.04 + (elapsed / AUTO_WASH_DURATION_MS) * 0.92);
        setWashScore((score) =>
          Math.max(score, timedProgress * washCompleteScore),
        );
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      autoWashStartedAtRef.current = null;
      autoWashLastPointRef.current = null;
    };
  }, [autoWashActive, stage]);

  useEffect(() => {
    if (!autoWashActive || stage !== "washing" || washProgress < 0.99) return undefined;
    const elapsed =
      autoWashStartedAtRef.current === null
        ? AUTO_WASH_DURATION_MS
        : performance.now() - autoWashStartedAtRef.current;
    const releaseDelay = Math.max(
      AUTO_WASH_RELEASE_PAD_MS,
      AUTO_WASH_DURATION_MS - elapsed + AUTO_WASH_RELEASE_PAD_MS,
    );
    const timer = window.setTimeout(() => {
      if (stageRef.current === "washing") {
        finishWash();
      }
    }, releaseDelay);

    return () => window.clearTimeout(timer);
  }, [autoWashActive, stage, washProgress]);

  function beginWash() {
    const currentStage = stageRef.current;
    if (currentStage !== "placed" && currentStage !== "washing") return;
    hapticPulse([6, 22, 8]);
    washDirectionRef.current = CLOCKWISE_WASH_DIRECTION;
    setWashDirection(CLOCKWISE_WASH_DIRECTION);
    if (currentStage === "placed") {
      stageRef.current = "washing";
      setStage("washing");
      updateDeckState((current) => ({
        ...current,
        ritualCards: loosenDeckForWash(current.ritualCards),
      }));
    }
    setWashScore((score) => Math.max(score, 3));
  }

  function applyWashPointer(pointer: WashPointer, progressScale = 1, emitHaptics = true) {
    const clockwisePointer = {
      ...pointer,
      spinDirection: CLOCKWISE_WASH_DIRECTION,
    };
    if (washDirectionRef.current !== CLOCKWISE_WASH_DIRECTION) {
      washDirectionRef.current = CLOCKWISE_WASH_DIRECTION;
      setWashDirection(CLOCKWISE_WASH_DIRECTION);
    }
    const now = Date.now();
    if (emitHaptics && now - lastWashHapticAtRef.current > 88) {
      lastWashHapticAtRef.current = now;
      hapticTick(4);
    }
    updateDeckState((current) => {
      const result = applyWashForce(current.ritualCards, clockwisePointer);
      if (
        emitHaptics &&
        result.movementScore > 9 &&
        now - lastStrongWashHapticAtRef.current > 320
      ) {
        lastStrongWashHapticAtRef.current = now;
        hapticPulse([4, 18, 5]);
      }
      setWashScore((score) =>
        Math.min(
          washCompleteScore,
          score + (result.movementScore * 0.11 + 0.05) * progressScale,
        ),
      );
      return {
        ...current,
        ritualCards: result.cards,
      };
    });
  }

  function flushPendingWashPointer() {
    washFrameRef.current = null;
    const pointer = pendingWashPointerRef.current;
    pendingWashPointerRef.current = null;
    if (!pointer || stageRef.current !== "washing") return;
    applyWashPointer(pointer);
  }

  function wash(pointer: WashPointer) {
    if (stageRef.current !== "washing") return;
    pendingWashPointerRef.current = pointer;
    if (washFrameRef.current !== null) return;
    washFrameRef.current = window.requestAnimationFrame(flushPendingWashPointer);
  }

  function startCutDeck() {
    if (stageRef.current === "cutting") return;
    const currentWashDirection = washDirectionRef.current;
    const secondCutDirection: 1 | -1 = currentWashDirection === 1 ? -1 : 1;
    stageRef.current = "cutting";
    setStage("cutting");
    hapticPulse([10, 42, 12]);
    updateDeckState((current) => ({
      ...current,
      hiddenDeckOrder: cutHiddenOrder(current.hiddenDeckOrder, 0.42),
      ritualCards: cutDeckIntoPackets(
        current.ritualCards,
        currentWashDirection,
        0,
      ),
    }));
    clearTimers();
    timers.current = [
      window.setTimeout(() => {
        hapticTick(8);
        updateDeckState((current) => ({
          ...current,
          ritualCards: transferCutPacket(
            current.ritualCards,
            currentWashDirection,
            0,
          ),
        }));
      }, 420),
      window.setTimeout(() => {
        hapticTick(6);
        updateDeckState((current) => ({
          ...current,
          hiddenDeckOrder: cutHiddenOrder(current.hiddenDeckOrder, 0.58),
          ritualCards: cutDeckIntoPackets(
            current.ritualCards,
            secondCutDirection,
            1,
          ),
        }));
      }, 860),
      window.setTimeout(() => {
        hapticTick(8);
        updateDeckState((current) => ({
          ...current,
          ritualCards: transferCutPacket(
            current.ritualCards,
            secondCutDirection,
            1,
          ),
        }));
      }, 1280),
      window.setTimeout(() => {
        hapticPulse([7, 34, 9]);
        updateDeckState((current) => ({
          ...current,
          ritualCards: mergeCutDeckAtCenter(current.ritualCards),
        }));
      }, 1640),
      window.setTimeout(() => {
        onComplete(deckStateRef.current.hiddenDeckOrder);
      }, 2060),
    ];
  }

  function finishWash() {
    if (stageRef.current !== "washing") return;
    hapticPulse([8, 34, 10]);
    setAutoWashActive(false);
    setWashScore(washCompleteScore);
    stageRef.current = "gathering";
    setStage("gathering");
    pendingWashPointerRef.current = null;
    if (washFrameRef.current !== null) {
      window.cancelAnimationFrame(washFrameRef.current);
      washFrameRef.current = null;
    }
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
      }, 380),
      window.setTimeout(() => {
        stageRef.current = "cutReady";
        setStage("cutReady");
      }, 640),
      window.setTimeout(startCutDeck, 780),
    ];
  }

  function toggleAutoWash() {
    const currentStage = stageRef.current;
    if (currentStage === "gathering" || currentStage === "cutReady" || currentStage === "cutting") return;
    washDirectionRef.current = CLOCKWISE_WASH_DIRECTION;
    setWashDirection(CLOCKWISE_WASH_DIRECTION);
    if (currentStage === "placed") {
      beginWash();
    }
    setAutoWashActive((current) => !current);
  }

  return (
    <CardWashRitual
      stage={stage}
      ritualCards={displayRitualCards}
      washProgress={washProgress}
      theme={theme}
      autoWashActive={autoWashActive}
      onBeginWash={beginWash}
      onWash={wash}
      onWashRelease={finishWash}
      onCutDeck={startCutDeck}
      onAutoWashToggle={toggleAutoWash}
      showControls
    />
  );
}

function ShuffleStep({
  design,
  onDone,
}: {
  design: RoomDesign;
  onDone: () => void;
}) {
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
    window.setTimeout(onDone, 520);
  }

  function autoShuffle() {
    setAuto(true);
    setDirection((current) => (current === 1 ? -1 : 1));
    hapticTick();
    window.setTimeout(() => {
      setAuto(false);
      finish();
    }, 3200);
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
        if (
          now - lastShuffleHapticAtRef.current > 150 &&
          Math.hypot(x - previous.x, y - previous.y) > 14
        ) {
          lastShuffleHapticAtRef.current = now;
          hapticTick(3);
        }
        setPointer({ x, y });
        setMotionSeed(
          (current) =>
            current + Math.hypot(x - previous.x, y - previous.y) * 0.35,
        );
        lastPoint.current = { x, y };
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(255,245,224,0.62),transparent_34%),radial-gradient(circle_at_50%_65%,rgba(223,196,255,0.24),transparent_55%)]" />
      <div className="relative z-30 mx-auto max-w-[24rem]">
        <h1 className="font-serif text-[34px] leading-none text-[#332d45]">
          Wash the deck.
        </h1>
        <p className="mt-3 text-[14px] font-semibold leading-relaxed text-[#746276]">
          Wash clockwise or counterclockwise. Keep one direction, then release
          when it feels enough.
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        {Array.from({ length: 42 }, (_, index) => {
          const active = dragging || auto;
          const angle = index * 2.399 + motionSeed * 0.038 * direction;
          const lane = index % 7;
          const radius = active
            ? 82 + lane * 24 + Math.sin(index * 1.7 + motionSeed * 0.04) * 24
            : 6 + index * 0.16;
          const currentX = active
            ? pointer.x * 0.38 +
              Math.cos(angle) * radius +
              Math.sin(index * 2.1 + motionSeed * 0.045) * 38
            : ((index % 8) - 4) * 1.2;
          const currentY = active
            ? pointer.y * 0.28 +
              Math.sin(angle) * radius * 0.82 +
              Math.cos(index * 1.8 + motionSeed * 0.05) * 34
            : -index * 0.22;
          return (
            <motion.div
              key={index}
              className="absolute left-1/2 top-1/2 h-[92px] w-[58px] -translate-x-1/2 -translate-y-1/2"
              animate={{
                x: currentX,
                y: currentY,
                rotate: active
                  ? (angle * 180) / Math.PI + direction * motionSeed + index * 9
                  : index * 0.35,
                scale: active ? 0.86 + (index % 5) * 0.035 : 0.78,
                opacity: active ? 0.92 : 0.96,
              }}
              transition={{ duration: active ? 0.12 : 0.8, ease: "easeOut" }}
              style={{ zIndex: index }}
            >
              <TarotBack
                cardBackId={design.cardBackId}
                className="h-full w-full rounded-[10px]"
              />
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

function CutStep({
  design,
  onDone,
}: {
  design: RoomDesign;
  onDone: () => void;
}) {
  const [cut, setCut] = useState(48);
  const [animating, setAnimating] = useState(false);
  const lastCutHapticRef = useRef({ band: Math.round(48 / 8), at: 0 });

  function finishCut() {
    if (animating) return;
    setAnimating(true);
    hapticTick(14);
    window.setTimeout(onDone, 980);
  }

  return (
    <StepShell>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="font-serif text-[34px] leading-none text-[#332d45]">
          Cut where it feels right.
        </h1>
        <p className="mt-3 max-w-[20rem] text-[14px] font-semibold leading-relaxed text-[#746276]">
          Drag the crescent, then release. The upper packet moves under; the
          lower packet rises.
        </p>
        <div className="relative mt-8 h-[370px] w-full max-w-[360px]">
          <motion.div
            className="absolute left-1/2 top-1/2 h-44 w-28 -translate-x-1/2 -translate-y-1/2"
            animate={
              animating
                ? {
                    x: [0, 48, 18, 0],
                    y: [0, 48, 94, 0],
                    rotate: [0, 12, 3, 0],
                  }
                : { x: 0, y: 0, rotate: 0 }
            }
            transition={{
              duration: 0.96,
              times: [0, 0.42, 0.72, 1],
              ease: "easeInOut",
            }}
          >
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={`top-${index}`}
                className="absolute h-44 w-28"
                style={{
                  transform: `translate(${index * 0.42}px, ${index * -0.72}px) rotate(${index * 0.18}deg)`,
                }}
              >
                <TarotBack
                  cardBackId={design.cardBackId}
                  className="h-full w-full"
                />
              </div>
            ))}
          </motion.div>
          <motion.div
            className="absolute left-1/2 top-1/2 h-44 w-28 -translate-x-1/2 -translate-y-1/2"
            animate={
              animating
                ? {
                    x: [4, -34, -14, 0],
                    y: [-12, -58, -98, 0],
                    rotate: [2, -10, -3, 0],
                  }
                : { x: 4, y: -12, rotate: 2 }
            }
            transition={{
              duration: 0.96,
              times: [0, 0.42, 0.72, 1],
              ease: "easeInOut",
            }}
          >
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={`bottom-${index}`}
                className="absolute h-44 w-28"
                style={{
                  transform: `translate(${index * 0.36}px, ${index * -0.66}px) rotate(${index * -0.16}deg)`,
                }}
              >
                <TarotBack
                  cardBackId={design.cardBackId}
                  className="h-full w-full"
                />
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
            onPointerDown={(event) =>
              event.currentTarget.setPointerCapture(event.pointerId)
            }
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const next = ((event.clientY - rect.top) / rect.height) * 100;
              const clamped = Math.max(8, Math.min(92, next));
              const band = Math.round(clamped / 8);
              const now = Date.now();
              if (
                band !== lastCutHapticRef.current.band &&
                now - lastCutHapticRef.current.at > 90
              ) {
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

const TAROT_PHONE_FRAME_MAX_WIDTH = 440;
const PICK_WHEEL_CARD_W = 84;
const PICK_WHEEL_CARD_H = 134;
const PICK_WHEEL_CARD_W_ZOOM = 124;
const PICK_WHEEL_CARD_H_ZOOM = 198;
const PICK_WHEEL_DRAG_SENSITIVITY = 0.0048;
const PICK_WHEEL_STEP_SCALE = 0.74;

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

type PickWheelLocalPoint = {
  x: number;
  y: number;
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

function getPickWheelGeometry(size: StageSize, _zoomed = false): PickWheelGeometry {
  const shorter = Math.min(size.width, size.height);
  const baseRadius = shorter * 0.95;
  return {
    centerX: size.width,
    centerY: size.height + baseRadius * 0.43,
    radius: baseRadius,
    startAngle: -Math.PI * 0.86,
  };
}

function getPickWheelLayout(
  index: number,
  rotation: number,
  total: number,
  geometry: PickWheelGeometry,
): PickWheelLayout {
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

function isPointInsidePickWheelCard(
  layout: PickWheelLayout,
  width: number,
  height: number,
  radialOffset: number,
  clientX: number,
  clientY: number,
  padding = 14,
) {
  const localPoint = getPickWheelCardLocalPoint(
    layout,
    radialOffset,
    clientX,
    clientY,
  );
  return isLocalPointInsidePickWheelCard(localPoint, width, height, padding);
}

function getPickWheelCardLocalPoint(
  layout: PickWheelLayout,
  radialOffset: number,
  clientX: number,
  clientY: number,
): PickWheelLocalPoint {
  const originX = layout.x + Math.cos(layout.angle) * radialOffset;
  const originY = layout.y + Math.sin(layout.angle) * radialOffset;
  const dx = clientX - originX;
  const dy = clientY - originY;
  const cos = Math.cos(layout.rotate);
  const sin = Math.sin(layout.rotate);
  return {
    x: dx * cos + dy * sin,
    y: -dx * sin + dy * cos,
  };
}

function isLocalPointInsidePickWheelCard(
  point: PickWheelLocalPoint,
  width: number,
  height: number,
  padding = 14,
) {
  return (
    point.x >= -width / 2 - padding &&
    point.x <= width / 2 + padding &&
    point.y >= -height - padding &&
    point.y <= padding
  );
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
  const [stageSize, setStageSize] = useState<StageSize>(() =>
    getTarotPhoneStageSize(),
  );
  const pickStageRef = useRef<HTMLDivElement | null>(null);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [armedCardId, setArmedCardId] = useState<string | null>(null);
  const wheelDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startRotation: number;
    startVisualId: string | null;
    moved: boolean;
  } | null>(null);
  const wheelRotationFrameRef = useRef<number | null>(null);
  const pendingWheelRotationRef = useRef<number | null>(null);
  const activeWheelPointersRef = useRef<Map<number, { x: number; y: number }>>(
    new Map(),
  );
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomedRef = useRef(false);
  const suppressNextClickRef = useRef(false);
  const lastWheelHapticNumberRef = useRef<number | null>(null);
  const lastWheelHapticAtRef = useRef(0);
  const lastWheelScrollHapticAtRef = useRef(0);
  const selectedIds = new Set(selectedCards.map((card) => card.visualId));
  const done = selectedCards.length >= spread.cardCount;
  const wheelGeometry = getPickWheelGeometry(stageSize, zoomed);
  const wheelCardWidth = zoomed ? PICK_WHEEL_CARD_W_ZOOM : PICK_WHEEL_CARD_W;
  const wheelCardHeight = zoomed ? PICK_WHEEL_CARD_H_ZOOM : PICK_WHEEL_CARD_H;
  const armedLift = zoomed ? 12 : 14;
  const armedScale = zoomed ? 1.035 : 1.055;
  const cardBackImageUrl = getTarotCardBackImage(design.cardBackId);
  const pickTarget = {
    x: stageSize.width * 0.52,
    y: stageSize.height * 0.73,
  };
  const wheelStep = pickWheelStep(deck.length);
  const targetAngle = Math.atan2(
    pickTarget.y - wheelGeometry.centerY,
    pickTarget.x - wheelGeometry.centerX,
  );
  const virtualCenterIndex = Math.round(
    (targetAngle - wheelGeometry.startAngle - fanRotation) / wheelStep,
  );
  const candidateWheelCards = deck.map((card, index) => {
    const virtualIndex =
      index + Math.round((virtualCenterIndex - index) / deck.length) * deck.length;
    return {
      card,
      index,
      virtualIndex,
      displayNumber: wheelDisplayNumber(virtualIndex, deck.length),
      layout: getPickWheelLayout(
        virtualIndex,
        fanRotation,
        deck.length,
        wheelGeometry,
      ),
    };
  });
  let activeWheelCard: (typeof candidateWheelCards)[number] | null = null;
  let activeDistance = Number.POSITIVE_INFINITY;

  for (const item of candidateWheelCards) {
    const { card, layout } = item;
    if (!card || selectedIds.has(card.visualId)) continue;
    const distance = Math.hypot(
      layout.x - pickTarget.x,
      layout.y - pickTarget.y,
    );
    if (distance < activeDistance) {
      activeDistance = distance;
      activeWheelCard = item;
    }
  }

  const fallbackVirtualIndex =
    activeWheelCard?.virtualIndex ?? virtualCenterIndex;
  const activeIndex = positiveModulo(fallbackVirtualIndex, deck.length);
  const activeCard = activeWheelCard?.card ?? deck[activeIndex];
  const activeNumber = wheelDisplayNumber(fallbackVirtualIndex, deck.length);

  useEffect(() => {
    if (lastWheelHapticNumberRef.current === null) {
      lastWheelHapticNumberRef.current = activeNumber;
      return;
    }
    if (lastWheelHapticNumberRef.current === activeNumber) return;
    lastWheelHapticNumberRef.current = activeNumber;

    const now = Date.now();
    if (now - lastWheelHapticAtRef.current < 72) return;
    lastWheelHapticAtRef.current = now;
    hapticTick(3);
  }, [activeNumber]);

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
      const rect = pickStageRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        setStageSize({
          width: Math.min(rect.width, TAROT_PHONE_FRAME_MAX_WIDTH),
          height: rect.height,
        });
        return;
      }
      setStageSize(getTarotPhoneStageSize());
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && pickStageRef.current
        ? new ResizeObserver(updateSize)
        : null;
    if (resizeObserver && pickStageRef.current) {
      resizeObserver.observe(pickStageRef.current);
    }
    return () => {
      window.removeEventListener("resize", updateSize);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (wheelRotationFrameRef.current !== null) {
        window.cancelAnimationFrame(wheelRotationFrameRef.current);
      }
      activeWheelPointersRef.current.clear();
    };
  }, []);

  function scheduleFanRotation(nextRotation: number) {
    pendingWheelRotationRef.current = nextRotation;
    if (wheelRotationFrameRef.current !== null) return;
    wheelRotationFrameRef.current = window.requestAnimationFrame(() => {
      wheelRotationFrameRef.current = null;
      const pendingRotation = pendingWheelRotationRef.current;
      pendingWheelRotationRef.current = null;
      if (pendingRotation !== null) setFanRotation(pendingRotation);
    });
  }

  function flushScheduledFanRotation() {
    if (pendingWheelRotationRef.current === null) return;
    if (wheelRotationFrameRef.current !== null) {
      window.cancelAnimationFrame(wheelRotationFrameRef.current);
      wheelRotationFrameRef.current = null;
    }
    const pendingRotation = pendingWheelRotationRef.current;
    pendingWheelRotationRef.current = null;
    setFanRotation(pendingRotation);
  }

  function getPointerDistance() {
    const points = Array.from(activeWheelPointersRef.current.values());
    if (points.length < 2) return 0;
    const [first, second] = points;
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

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

  function findTopCardAtPoint(localX: number, localY: number) {
    let topCard: { card: RitualCard; zIndex: number } | null = null;
    for (const item of candidateWheelCards) {
      const { card, layout } = item;
      if (!card || selectedIds.has(card.visualId)) continue;
      const radialOffset = armedCardId === card.visualId ? armedLift : 0;
      if (
        !isPointInsidePickWheelCard(
          layout,
          wheelCardWidth,
          wheelCardHeight,
          radialOffset,
          localX,
          localY,
          zoomed ? 20 : 16,
        )
      ) {
        continue;
      }
      if (!topCard || layout.zIndex > topCard.zIndex) {
        topCard = { card, zIndex: layout.zIndex };
      }
    }
    return topCard?.card ?? null;
  }

  function findIntendedCardAtPoint(
    localX: number,
    localY: number,
    directVisualId: string | null,
  ) {
    const padding = zoomed ? 10 : 8;
    let intended: { card: RitualCard; score: number } | null = null;
    for (const item of candidateWheelCards) {
      const { card, layout } = item;
      if (!card || selectedIds.has(card.visualId)) continue;
      const offset = armedCardId === card.visualId ? armedLift : 0;
      const point = getPickWheelCardLocalPoint(layout, offset, localX, localY);
      if (!isLocalPointInsidePickWheelCard(point, wheelCardWidth, wheelCardHeight, padding)) {
        continue;
      }

      const normalizedX = point.x / (wheelCardWidth / 2);
      const normalizedY = (point.y + wheelCardHeight / 2) / (wheelCardHeight / 2);
      const targetBias = directVisualId === card.visualId ? -0.08 : 0;
      const armedBias = armedCardId === card.visualId ? -0.04 : 0;
      const score = normalizedX ** 2 + normalizedY ** 2 + targetBias + armedBias;
      if (!intended || score < intended.score) {
        intended = { card, score };
      }
    }
    return intended?.card ?? null;
  }

  function findNearestCard(localX: number, localY: number) {
    const threshold = zoomed ? 132 : 104;
    let nearest: { card: RitualCard; distance: number } | null = null;
    for (const item of candidateWheelCards) {
      const { card, layout } = item;
      if (!card || selectedIds.has(card.visualId)) continue;
      const offset = armedCardId === card.visualId ? armedLift : 0;
      const originX = layout.x + Math.cos(layout.angle) * offset;
      const originY = layout.y + Math.sin(layout.angle) * offset;
      const distance = Math.hypot(localX - originX, localY - originY);
      if (distance > threshold) continue;
      if (!nearest || distance < nearest.distance) nearest = { card, distance };
    }
    return nearest?.card ?? null;
  }

  function handleWheelPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (done) return;
    event.preventDefault();
    const targetElement = event.target instanceof HTMLElement ? event.target : null;
    const targetButton = targetElement?.closest<HTMLButtonElement>("button[data-visual-id]");
    activeWheelPointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (activeWheelPointersRef.current.size >= 2) {
      pinchStartDistanceRef.current = getPointerDistance();
      pinchStartZoomedRef.current = zoomed;
      wheelDragRef.current = null;
      if (armedCardId) setArmedCardId(null);
      hapticTick(3);
      return;
    }

    hapticTick(3);
    wheelDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRotation: fanRotation,
      startVisualId: targetButton?.dataset.visualId ?? null,
      moved: false,
    };
  }

  function handleWheelPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (activeWheelPointersRef.current.has(event.pointerId)) {
      activeWheelPointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
    }

    if (activeWheelPointersRef.current.size >= 2) {
      const startDistance =
        pinchStartDistanceRef.current || getPointerDistance();
      pinchStartDistanceRef.current = startDistance;
      const currentDistance = getPointerDistance();
      const ratio = startDistance > 0 ? currentDistance / startDistance : 1;
      if (ratio > 1.08 && !pinchStartZoomedRef.current) {
        hapticPulse([4, 18, 5]);
        setArmedCardId(null);
        setZoomed(true);
      }
      if (ratio < 0.92 && pinchStartZoomedRef.current) {
        hapticPulse([4, 18, 5]);
        setArmedCardId(null);
        setZoomed(false);
      }
      return;
    }

    const drag = wheelDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.hypot(deltaX, deltaY) > 10) {
      drag.moved = true;
      if (armedCardId) setArmedCardId(null);
    }
    if (drag.moved) {
      scheduleFanRotation(
        drag.startRotation +
          (deltaX - deltaY * 0.7) * PICK_WHEEL_DRAG_SENSITIVITY,
      );
    }
  }

  function handleWheelPointerUp(event: PointerEvent<HTMLDivElement>) {
    const wasPinching =
      activeWheelPointersRef.current.size >= 2 ||
      pinchStartDistanceRef.current !== null;
    activeWheelPointersRef.current.delete(event.pointerId);
    if (activeWheelPointersRef.current.size < 2) {
      pinchStartDistanceRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (wasPinching) {
      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
      wheelDragRef.current = null;
      return;
    }

    const drag = wheelDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    flushScheduledFanRotation();
    if (drag.moved) {
      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const targetElement = event.target instanceof HTMLElement ? event.target : null;
      const targetButton = targetElement?.closest<HTMLButtonElement>("button[data-visual-id]");
      const targetVisualId = drag.startVisualId ?? targetButton?.dataset.visualId;
      const directCard = targetVisualId
        ? deck.find((card) => card.visualId === targetVisualId)
        : undefined;
      const directAvailable =
        directCard && !selectedIds.has(directCard.visualId) ? directCard : undefined;
      const armedItem = armedCardId
        ? candidateWheelCards.find((item) => item.card.visualId === armedCardId)
        : undefined;
      const armedConfirmCard =
        armedItem &&
        !selectedIds.has(armedItem.card.visualId) &&
        isPointInsidePickWheelCard(
          armedItem.layout,
          wheelCardWidth,
          wheelCardHeight,
          armedLift,
          localX,
          localY,
          zoomed ? 30 : 24,
        )
          ? armedItem.card
          : undefined;
      const intendedCard = findIntendedCardAtPoint(
        localX,
        localY,
        targetVisualId ?? null,
      );
      const card =
        armedConfirmCard ??
        directAvailable ??
        intendedCard ??
        findTopCardAtPoint(localX, localY) ??
        findNearestCard(localX, localY);
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

  function handleWheelPointerCancel(event: PointerEvent<HTMLDivElement>) {
    activeWheelPointersRef.current.delete(event.pointerId);
    if (activeWheelPointersRef.current.size < 2) {
      pinchStartDistanceRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    wheelDragRef.current = null;
    suppressNextClickRef.current = true;
    window.setTimeout(() => {
      suppressNextClickRef.current = false;
    }, 0);
  }

  function handleWheelScroll(deltaY: number) {
    if (armedCardId) setArmedCardId(null);
    const now = Date.now();
    if (now - lastWheelScrollHapticAtRef.current > 58) {
      lastWheelScrollHapticAtRef.current = now;
      hapticTick(3);
    }
    setFanRotation((current) => current - deltaY * 0.0012);
  }

  function handleWheelGesture(event: WheelEvent<HTMLDivElement>) {
    if (event.cancelable) event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      hapticPulse([4, 18, 5]);
      setArmedCardId(null);
      setZoomed(event.deltaY < 0);
      return;
    }
    handleWheelScroll(event.deltaY);
  }

  const visibleWheelCards = candidateWheelCards.filter(({ card, layout }) => {
    if (selectedIds.has(card.visualId)) return false;
    const topLimit = stageSize.height * (zoomed ? 0.30 : 0.36);
    return (
      layout.x > -310 &&
      layout.x < stageSize.width + 310 &&
      layout.y > topLimit &&
      layout.y < stageSize.height + 320
    );
  });
  const spreadPreviewPoints = getPickSpreadPreviewPoints(spread).slice(
    0,
    spread.cardCount,
  );
  const pickSlotSize = pickSpreadSlotSize(spread);
  const pickPanelHeight = pickSpreadPanelHeight(spread);

  return (
    <StepShell>
      <div
        ref={pickStageRef}
        className="relative -mx-5 -mb-[calc(var(--hint-safe-bottom)+1.25rem)] flex min-h-0 flex-1 flex-col overflow-clip px-5"
      >
        <div
          className={`pointer-events-none relative z-50 text-center transition duration-300 ${
            zoomed ? "-translate-y-4 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          <h1 className="font-serif text-[32px] leading-none text-[#332d45]">
            Pick Cards
          </h1>
          <p className="mt-2 text-[13px] font-bold text-[#746276]">
            {spread.label} - {selectedCards.length} of {spread.cardCount} chosen
          </p>
        </div>
        <div
          className={`pointer-events-none relative z-50 mt-7 rounded-[34px] border border-white/70 bg-white/34 shadow-[inset_0_0_80px_rgba(255,255,255,0.20),0_18px_54px_rgba(91,65,100,0.08)] backdrop-blur-sm transition duration-300 ${
            zoomed ? "scale-[0.98] opacity-0" : "scale-100 opacity-100"
          }`}
          style={{ height: pickPanelHeight }}
        >
          {spreadPreviewPoints.map((point, index) => (
            <motion.div
              key={index}
              data-pick-slot-index={index}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[10px]"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                width: pickSlotSize.width,
                height: pickSlotSize.height,
              }}
              initial={false}
              animate={
                selectedCards[index]
                  ? { x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }
                  : { x: 0, y: 0, scale: 0.92, opacity: 0.78, rotate: 0 }
              }
              transition={{ type: "spring", stiffness: 160, damping: 21 }}
            >
              {selectedCards[index] ? (
                <motion.div
                  layoutId={`pick-card-${selectedCards[index]!.visualId}`}
                  animate={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 115,
                    damping: 17,
                    mass: 0.95,
                  }}
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
                  <TarotBack
                    cardBackId={design.cardBackId}
                    className="h-full w-full rounded-[10px] shadow-[0_14px_30px_rgba(108,79,116,0.12)]"
                  />
                </motion.div>
              ) : (
                <div className="h-full w-full rounded-[10px] border border-dashed border-[#876b84]/82 bg-white/76 shadow-[0_10px_24px_rgba(108,79,116,0.10)]">
                  <span className="grid h-full place-items-center text-[12px] font-black text-[#674f65]">
                    {index + 1}
                  </span>
                </div>
              )}
              <span
                data-pick-slot-label-index={index}
                className="absolute z-20 max-w-[6.25rem] whitespace-nowrap rounded-full bg-white/54 px-1.5 py-0.5 text-[8px] font-black uppercase leading-none tracking-[0.12em] text-[#654f63] shadow-[0_7px_16px_rgba(108,79,116,0.10)] backdrop-blur-md"
                style={getPickSpreadLabelStyle()}
              >
                {spread.positionLabels[index] ?? `Card ${index + 1}`}
              </span>
            </motion.div>
          ))}
        </div>
        <div
          className="absolute inset-0 z-40 cursor-grab touch-none select-none overflow-clip active:cursor-grabbing"
          onPointerDown={handleWheelPointerDown}
          onPointerMove={handleWheelPointerMove}
          onPointerUp={handleWheelPointerUp}
          onPointerCancel={handleWheelPointerCancel}
          onWheel={handleWheelGesture}
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
          {visibleWheelCards.map(
            ({ card, index, virtualIndex, displayNumber, layout }) => {
              const selectedInWheel = selectedIds.has(card.visualId);
              const isArmed = armedCardId === card.visualId;
              const emphasized = isArmed;
              const cardWidth = wheelCardWidth;
              const cardHeight = wheelCardHeight;
              const cardOpacity = selectedInWheel ? 0.68 : 1;
              const armedOffset = isArmed ? armedLift : 0;
              const cardX = layout.x + Math.cos(layout.angle) * armedOffset;
              const cardY = layout.y + Math.sin(layout.angle) * armedOffset;
              return (
                <motion.button
                  key={`${card.visualId}-${virtualIndex}`}
                  layoutId={
                    selectedInWheel ? undefined : `pick-card-${card.visualId}`
                  }
                  type="button"
                  data-visual-id={card.visualId}
                  aria-disabled={selectedInWheel}
                  onClick={(event) => {
                    event.preventDefault();
                  }}
                  aria-label={
                    isArmed
                      ? `Confirm card ${displayNumber}`
                      : `Lift card ${displayNumber}`
                  }
                  className="absolute block overflow-visible rounded-[16px] border outline-none transition-[box-shadow,filter,opacity] duration-150 will-change-transform"
                  style={{
                    left: cardX,
                    top: cardY,
                    width: cardWidth,
                    height: cardHeight,
                    zIndex: layout.zIndex,
                    opacity: cardOpacity,
                    backgroundColor: "#251d35",
                    backgroundImage: `url("${cardBackImageUrl}")`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    borderColor: emphasized
                      ? "rgba(241,211,144,0.86)"
                      : "rgba(241,211,144,0.42)",
                    boxShadow: emphasized
                      ? "0 24px 52px rgba(78,56,92,0.28), 0 0 0 2px rgba(255,244,216,0.72), 0 0 42px rgba(241,211,144,0.34)"
                      : "0 9px 18px rgba(78,56,92,0.13)",
                    filter: emphasized
                      ? "brightness(1.08) saturate(1.38) contrast(1.18)"
                      : "brightness(0.96) saturate(1.22) contrast(1.14)",
                    transformOrigin: "50% 100%",
                  }}
                  animate={{
                    x: "-50%",
                    y: "-100%",
                    rotate: `${layout.rotate}rad`,
                    scale: isArmed ? armedScale : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 310,
                    damping: 31,
                    mass: 0.86,
                  }}
                >
                  {zoomed ? (
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute left-1/2 top-[-1.85rem] z-30 font-serif text-[13px] font-black leading-none ${
                        emphasized ? "text-[#6a461d]" : "text-[#4a3422]"
                      }`}
                      style={{
                        opacity: emphasized ? 0.68 : 0.48,
                        transform: `translateX(-50%) rotate(${-layout.rotate}rad)`,
                        textShadow: emphasized
                          ? "0 1px 0 rgba(255,250,230,0.72), 0 6px 14px rgba(108,70,29,0.14)"
                          : "0 1px 0 rgba(255,250,230,0.58), 0 5px 12px rgba(80,52,34,0.10)",
                      }}
                    >
                      {displayNumber}
                    </span>
                  ) : null}
                  <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[16px]">
                    <span className="absolute inset-[8px] rounded-[11px] border border-white/18" />
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.05),transparent_28%),linear-gradient(140deg,rgba(255,255,255,0.04),transparent_42%)]" />
                    {emphasized ? (
                      <span className="absolute inset-0 rounded-[16px] bg-[radial-gradient(circle_at_50%_12%,rgba(255,246,215,0.20),transparent_35%)]" />
                    ) : null}
                  </span>
                </motion.button>
              );
            },
          )}
        </div>
        {zoomed ? (
          <div className="absolute bottom-[5.25rem] left-5 z-50 flex items-center gap-2">
            <button
              type="button"
              aria-label="Close expanded deck"
              className="h-11 rounded-full border border-white/75 bg-white/84 px-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#654f6d] shadow-[0_14px_32px_rgba(78,56,92,0.14)] backdrop-blur-xl transition active:scale-95"
              onClick={() => {
                hapticPulse([4, 18, 5]);
                setArmedCardId(null);
                setZoomed(false);
              }}
            >
              Close
            </button>
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-x-5 bottom-4 z-50">
          {done ? (
            <PrimaryButton
              onClick={onDone}
              className="pointer-events-auto w-full"
            >
              Reveal Reading
            </PrimaryButton>
          ) : null}
        </div>
      </div>
    </StepShell>
  );
}

function TarotPhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="tarot-phone-frame-shell"
      className="absolute inset-0 flex justify-center overflow-hidden bg-[#f8edf4]"
    >
      <div
        data-testid="tarot-phone-frame"
        className="relative h-full min-h-0 w-full max-w-[440px] transform-gpu overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.55),0_24px_80px_rgba(82,62,91,0.12)]"
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
  const [spread, setSpread] = useState<SpreadChoice>(
    () =>
      SPREAD_CHOICES.find((item) => item.id === "three") ?? SPREAD_CHOICES[0]!,
  );
  const [spreadRecommendation, setSpreadRecommendation] =
    useState<SpreadRecommendation | null>(null);
  const [spreadRecommendationPending, setSpreadRecommendationPending] =
    useState(false);
  const [design, setDesign] = useState<RoomDesign>(ROOM_DESIGNS[0]!);
  const [selectedCards, setSelectedCards] = useState<RitualCard[]>([]);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [deck, setDeck] = useState<RitualCard[]>(() => createHiddenDeck());

  async function submitQuestionValue(value: string) {
    const cleaned = cleanQuestion(value);
    if (!cleaned) return;
    hapticPulse([8, 26, 8]);
    const localRecommendation = buildLocalSpreadRecommendation(cleaned);
    const localSpread =
      findSpreadChoice(localRecommendation.spreadType) ??
      recommendSpread(cleaned);
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
      const apiSpread =
        findSpreadChoice(apiRecommendation.spreadType) ?? localSpread;
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

        <AnimatePresence initial={false}>
          <StepTransitionVeil key={`tarot-transition-${step}`} />
        </AnimatePresence>

        <AnimatePresence initial={false}>
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
              design={design}
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
              cardBackId={design.cardBackId}
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
          {step === "cut" && (
            <CutStep key="cut" design={design} onDone={() => setStep("pick")} />
          )}
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
              initial={{ opacity: 0, y: 18, scale: 0.986 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 1.006 }}
              transition={{ duration: 0.54, ease: TAROT_STEP_EASE }}
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
                  setRevealedIds((current) =>
                    current.includes(visualId)
                      ? current
                      : [...current, visualId],
                  );
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
