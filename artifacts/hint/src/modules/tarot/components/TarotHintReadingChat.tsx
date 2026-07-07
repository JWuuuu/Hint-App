import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { History, Home, SendHorizontal } from "lucide-react";
import { useLocation } from "wouter";
import { useSendTarotChatMessage, type TarotCardDraw } from "@workspace/api-client-react";
import { apiUrl } from "../../../lib/api";
import { triggerFeedback } from "../../../lib/feedback";
import type { SpreadChoice } from "../../hold/useHoldFlow";
import { getCardKeywords, type RitualCard } from "../logic/createHiddenDeck";
import type { TarotCardArtId } from "../logic/cardImageMap";
import type { TarotCardBackId, TarotCardBackStyle } from "../logic/cardBacks";
import { TarotCardVisual } from "./TarotCardVisual";
import { saveLocalTarotReading } from "../../readings/localTarotReadings";
import { saveLocalQuestionHistory } from "../../readings/localQuestionHistory";
import { recordRitualCompletion } from "../../home/data/localRitualProgress";
import { getSpreadPositionLabel } from "../logic/spreadLabels";

type LocalChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type TarotHintReadingChatProps = {
  selectedCards: RitualCard[];
  spread: SpreadChoice;
  backStyle?: TarotCardBackStyle;
  cardBackId?: TarotCardBackId;
  cardArtId?: TarotCardArtId;
  question?: string;
  story?: string;
  focusLabel?: string;
  archiveOnOpen?: boolean;
};

type StructuredSignalType = "clear_signal" | "mixed_signal" | "opening" | "blocked" | "soft_yes" | "soft_no";

type StructuredCardMeaning = {
  position: string;
  card_name: string;
  orientation: "upright" | "reversed";
  meaning: string;
};

type StructuredTarotReading = {
  signal_type: StructuredSignalType;
  overall_summary: string;
  cards: StructuredCardMeaning[];
  final_action_advice: string;
  follow_up_invitation: string;
};

const FOLLOW_UPS = [
  { label: "Next step", prompt: "What should I do next?" },
  { label: "Hidden block", prompt: "What should I stop holding?" },
  { label: "Quiet truth", prompt: "What is the quiet truth here?" },
];

const MAJOR_MEANINGS: Record<string, { keywords: string[]; upright: string; reversed: string }> = {
  "0-fool": {
    keywords: ["beginning", "risk", "trust"],
    upright: "The Fool points to a fresh start: take the next step, but do not mistake hope for a plan.",
    reversed: "The Fool reversed warns against either reckless action or freezing because you cannot see the whole path yet.",
  },
  "1-magician": {
    keywords: ["will", "skill", "focus"],
    upright: "The Magician says you already have tools to act; the issue is focus and execution.",
    reversed: "The Magician reversed points to scattered effort, self-doubt, or someone using skill without honesty.",
  },
  "2-high-priestess": {
    keywords: ["intuition", "mystery", "silence"],
    upright: "The High Priestess says the answer is quiet but not absent; trust what you already know and verify it calmly.",
    reversed: "The High Priestess reversed says you may be ignoring a clear inner signal or missing hidden information.",
  },
  "3-empress": {
    keywords: ["growth", "care", "abundance"],
    upright: "The Empress points to growth through care, patience, and making the situation easier to nourish.",
    reversed: "The Empress reversed points to neglect, overgiving, or trying to force growth before it is ready.",
  },
  "4-emperor": {
    keywords: ["structure", "order", "authority"],
    upright: "The Emperor asks for structure: make the plan concrete, set boundaries, and lead with steadiness.",
    reversed: "The Emperor reversed points to rigidity, control issues, or a lack of stable structure.",
  },
  "5-hierophant": {
    keywords: ["guidance", "tradition", "belief"],
    upright: "The Hierophant points to guidance, rules, and proven paths; use the system instead of fighting every step alone.",
    reversed: "The Hierophant reversed asks which rule, belief, or outside voice no longer fits your life.",
  },
  "6-lovers": {
    keywords: ["choice", "bond", "alignment"],
    upright: "The Lovers is about alignment and choice; choose what matches your values, not only what feels intense.",
    reversed: "The Lovers reversed points to misalignment, avoidance, or choosing against yourself to keep a bond intact.",
  },
  "7-chariot": {
    keywords: ["direction", "drive", "control"],
    upright: "The Chariot says progress needs direction; pick the route and keep moving even if it is not effortless.",
    reversed: "The Chariot reversed points to scattered direction, impatience, or trying to force a result before steering clearly.",
  },
  "8-strength": {
    keywords: ["courage", "patience", "heart"],
    upright: "Strength asks for calm courage: handle this firmly without becoming harsh.",
    reversed: "Strength reversed points to self-doubt, pressure, or using force where patience would work better.",
  },
  "9-hermit": {
    keywords: ["solitude", "truth", "search"],
    upright: "The Hermit says step back and get honest; the next answer comes from clarity, not noise.",
    reversed: "The Hermit reversed warns that distance may be turning into avoidance or isolation.",
  },
  "10-wheel": {
    keywords: ["cycle", "change", "timing"],
    upright: "Wheel of Fortune points to timing and change; adapt quickly instead of treating this moment as fixed.",
    reversed: "Wheel of Fortune reversed points to resistance, bad timing, or repeating a cycle without learning from it.",
  },
  "11-justice": {
    keywords: ["truth", "balance", "accountability"],
    upright: "Justice asks for facts, fairness, and accountability; look at what is true before what is comforting.",
    reversed: "Justice reversed points to avoidance, unfairness, or a truth that has not been fully faced.",
  },
  "12-hanged-man": {
    keywords: ["pause", "surrender", "perspective"],
    upright: "The Hanged Man says pause and look differently; forcing this now may cost more than waiting well.",
    reversed: "The Hanged Man reversed points to stuckness, delay, or refusing the perspective that would free you.",
  },
  "13-death": {
    keywords: ["ending", "release", "change"],
    upright: "Death says something has to end cleanly so the next phase can begin.",
    reversed: "Death reversed points to clinging to what is already ending or delaying a necessary change.",
  },
  "14-temperance": {
    keywords: ["balance", "healing", "blend"],
    upright: "Temperance asks for balance and pacing; mix the pieces slowly instead of making an extreme move.",
    reversed: "Temperance reversed points to imbalance, overreaction, or a situation that needs moderation.",
  },
  "15-devil": {
    keywords: ["attachment", "shadow", "pattern"],
    upright: "The Devil points to attachment and pattern; name what has power over you before it keeps steering you.",
    reversed: "The Devil reversed says awareness is starting; the pattern can loosen if you stop feeding it.",
  },
  "16-tower": {
    keywords: ["shock", "truth", "collapse"],
    upright: "The Tower says a false structure is breaking; deal with the truth instead of defending the old shape.",
    reversed: "The Tower reversed points to a collapse being delayed, minimized, or happening inside first.",
  },
  "17-star": {
    keywords: ["hope", "renewal", "faith"],
    upright: "The Star points to recovery and hope; choose the step that restores your energy instead of draining it.",
    reversed: "The Star reversed points to discouragement or losing sight of the help and hope still available.",
  },
  "18-moon": {
    keywords: ["uncertainty", "fear", "dream"],
    upright: "The Moon says the situation is unclear; do not make fear sound like evidence.",
    reversed: "The Moon reversed says confusion is lifting, but the truth may still need time to settle.",
  },
  "19-sun": {
    keywords: ["clarity", "warmth", "joy"],
    upright: "The Sun points to clarity, visibility, and a result that becomes easier to see.",
    reversed: "The Sun reversed points to delayed clarity, muted confidence, or joy blocked by doubt.",
  },
  "20-judgement": {
    keywords: ["calling", "reckoning", "awakening"],
    upright: "Judgement asks for a clear decision based on who you are becoming, not who you were.",
    reversed: "Judgement reversed points to self-criticism, avoidance, or refusing a necessary wake-up call.",
  },
  "21-world": {
    keywords: ["completion", "arrival", "wholeness"],
    upright: "The World points to completion and readiness; close the loop before starting the next one.",
    reversed: "The World reversed says something is nearly complete but still needs one final honest step.",
  },
};

const RANK_MEANINGS: Record<string, string> = {
  ace: "a new opening",
  two: "a choice or balancing point",
  three: "growth through others",
  four: "stability, pause, or protection",
  five: "friction that cannot be ignored",
  six: "movement toward repair, recognition, or progress",
  seven: "pressure that asks for persistence",
  eight: "movement, effort, or acceleration",
  nine: "a near-finish point with pressure attached",
  ten: "the end of a cycle and the cost of carrying too much",
  page: "learning, messages, and early signals",
  knight: "active pursuit and momentum",
  queen: "maturity, care, and inner authority",
  king: "leadership, control, and outer authority",
};

const SUIT_MEANINGS: Record<string, { keywords: string[]; field: string; advice: string }> = {
  wands: {
    keywords: ["action", "confidence", "visibility"],
    field: "action, ambition, confidence, and visibility",
    advice: "move in a way people can see; effort needs direction and proof",
  },
  cups: {
    keywords: ["emotion", "connection", "care"],
    field: "feelings, connection, care, and emotional truth",
    advice: "listen to the emotional reality without letting it replace the facts",
  },
  swords: {
    keywords: ["truth", "decision", "pressure"],
    field: "thoughts, decisions, conflict, and hard truth",
    advice: "separate facts from fear and say the thing clearly",
  },
  pentacles: {
    keywords: ["work", "money", "stability"],
    field: "work, money, body, timing, and practical stability",
    advice: "make the next step practical, measurable, and grounded",
  },
};

function newMessageId() {
  return `hint-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function trimReading(value: string, maxSentences = 2, maxChars = 280) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()) ?? [clean];
  const clipped = sentences.slice(0, maxSentences).join(" ");
  if (clipped.length <= maxChars) return clipped;
  return `${clipped.slice(0, maxChars - 1).trim()}...`;
}

function compactSentence(value: string, maxChars = 150) {
  return trimReading(value, 1, maxChars);
}

function getCardSuit(cardId: string) {
  const suit = cardId.split("-").at(-1);
  return suit === "wands" || suit === "cups" || suit === "swords" || suit === "pentacles"
    ? suit
    : null;
}

function getCardRank(cardId: string) {
  const rank = cardId.split("-")[0] ?? "";
  return rank in RANK_MEANINGS ? rank : null;
}

function getReadableCardMeaning(card: RitualCard) {
  const major = MAJOR_MEANINGS[card.cardId];
  if (major) {
    return {
      keywords: major.keywords,
      upright: major.upright,
      reversed: major.reversed,
      sentence: card.orientation === "reversed" ? major.reversed : major.upright,
    };
  }

  const suit = getCardSuit(card.cardId);
  const rank = getCardRank(card.cardId);
  const suitMeaning = suit ? SUIT_MEANINGS[suit] : null;
  const rankMeaning = rank ? RANK_MEANINGS[rank] : "a clear signal";
  const keywords = suitMeaning?.keywords ?? getCardKeywords(card.cardId);
  const upright = `${card.name} shows ${rankMeaning} in ${suitMeaning?.field ?? "this situation"}. In plain terms, ${suitMeaning?.advice ?? "choose the next honest step"}.`;
  const reversed = `${card.name} reversed shows ${rankMeaning} being blocked or mishandled. In plain terms, ${suitMeaning?.advice ?? "slow down and correct the next step"} before pushing harder.`;

  return {
    keywords,
    upright,
    reversed,
    sentence: card.orientation === "reversed" ? reversed : upright,
  };
}

const BLOCKING_CARD_IDS = new Set([
  "12-hanged-man",
  "13-death",
  "15-devil",
  "16-tower",
  "18-moon",
  "five-cups",
  "five-swords",
  "seven-swords",
  "eight-swords",
  "nine-swords",
  "ten-swords",
]);

const OPENING_CARD_IDS = new Set([
  "0-fool",
  "1-magician",
  "3-empress",
  "6-lovers",
  "7-chariot",
  "8-strength",
  "14-temperance",
  "17-star",
  "19-sun",
  "20-judgement",
  "21-world",
  "ace-wands",
  "ace-cups",
  "ace-pentacles",
  "six-wands",
  "ten-cups",
  "ten-pentacles",
]);

function getReadingSignal(cards: RitualCard[]): StructuredSignalType {
  const reversedCount = cards.filter((card) => card.orientation === "reversed").length;
  const blockingScore = cards.reduce((score, card) => score + (BLOCKING_CARD_IDS.has(card.cardId) ? 1 : 0), 0) + reversedCount;
  const openingScore = cards.reduce((score, card) => score + (OPENING_CARD_IDS.has(card.cardId) ? 1 : 0), 0);

  if (cards.length === 0) return "mixed_signal";
  if (openingScore >= Math.max(1, blockingScore + 1) && reversedCount === 0) return "opening";
  if (openingScore > blockingScore && reversedCount <= 1) return "soft_yes";
  if (blockingScore >= openingScore + 2 || reversedCount >= Math.ceil(cards.length * 0.6)) return "blocked";
  if (blockingScore > openingScore) return "soft_no";
  if (openingScore === blockingScore && cards.length > 1) return "mixed_signal";
  return "clear_signal";
}

function getSignalLanguage(signalType: StructuredSignalType) {
  switch (signalType) {
    case "opening":
      return {
        label: "a very clear positive signal",
        direction: "move forward, but do it steadily instead of waiting for perfect certainty",
      };
    case "soft_yes":
    case "clear_signal":
      return {
        label: "a positive signal with a clear direction",
        direction: "there is movement here, but it needs one clean and paced next step",
      };
    case "blocked":
      return {
        label: "a heavy blocked signal",
        direction: "do not push this right now; protect your energy and stop feeding the loop",
      };
    case "soft_no":
      return {
        label: "a warning signal more than a green light",
        direction: "slow down and test what is real before trusting the surface signal",
      };
    case "mixed_signal":
    default:
      return {
        label: "a mixed signal",
        direction: "stay curious, but do not invest more until the pattern gets clearer",
      };
  }
}

function formatQuestionLead(question?: string) {
  const clean = question?.replace(/\s+/g, " ").trim();
  if (!clean) return "For this question";
  return `For "${compactSentence(clean, 72)}"`;
}

function buildOverallReading(
  cards: RitualCard[],
  question?: string,
): { signalType: StructuredSignalType; text: string } {
  const signalType = getReadingSignal(cards);
  const signal = getSignalLanguage(signalType);
  return {
    signalType,
    text: `${formatQuestionLead(question)}, this spread gives ${signal.label}: ${signal.direction}.`,
  };
}

function buildPositionFrame(position: string, index: number, cardCount: number) {
  const normalized = position.toLowerCase();
  if (/past|before|root|arrival/.test(normalized)) {
    return "This shows what shaped the situation before now";
  }
  if (/present|now|signal|approach|draw|challenge/.test(normalized)) {
    return "This shows the pressure or truth active right now";
  }
  if (/future|next|direction|gain|outcome/.test(normalized)) {
    return "This points to the direction opening next";
  }
  if (cardCount === 3 && index === 0) return "This shows what brought you here";
  if (cardCount === 3 && index === 1) return "This shows what is active right now";
  if (cardCount === 3 && index === 2) return "This points to the next movement";
  return `In the ${position} position, this is the part asking for attention`;
}

function buildCardMeaning(card: RitualCard, index: number, spread: SpreadChoice): StructuredCardMeaning {
  const position = getSpreadPositionLabel(spread, index);
  const orientation = card.orientation === "reversed" ? "reversed" : "upright";
  const positionFrame = buildPositionFrame(position, index, spread.cardCount);
  const cardMeaning = compactSentence(getReadableCardMeaning(card).sentence, 120);
  return {
    position,
    card_name: card.name,
    orientation,
    meaning: compactSentence(`${positionFrame}: ${cardMeaning}`, 170),
  };
}

function buildFinalGuidance(signalType: StructuredSignalType) {
  switch (signalType) {
    case "opening":
    case "soft_yes":
    case "clear_signal":
      return "Take one honest step forward and let the response show you what is real.";
    case "blocked":
      return "Pause, protect your energy, and stop chasing the part that keeps looping.";
    case "soft_no":
      return "Slow down and check the pattern before you make a bigger move.";
    case "mixed_signal":
    default:
      return "Stay close enough to notice the next signal, but do not overinvest yet.";
  }
}

function buildFollowUpInvitation(question?: string, focusLabel?: string) {
  const lower = `${question ?? ""} ${focusLabel ?? ""}`.toLowerCase();
  if (/love|relationship|dating|connection|reconcile|breakup|their|him|her|them/.test(lower)) {
    return "If you tell me what has been happening between you two, I can read where this connection is actually stuck.";
  }
  if (/work|job|career|exam|school|application|offer/.test(lower)) {
    return "If you tell me what decision is in front of you, I can help you see which card is giving the strongest signal.";
  }
  return "If you tell me the part that feels hardest to read, I can help you follow where these cards are pointing next.";
}

function buildLocalStructuredReading(
  cards: RitualCard[],
  spread: SpreadChoice,
  question?: string,
  story?: string,
  focusLabel?: string,
): StructuredTarotReading {
  const overall = buildOverallReading(cards, question);
  return {
    signal_type: overall.signalType,
    overall_summary: overall.text,
    cards: cards.map((card, index) => buildCardMeaning(card, index, spread)),
    final_action_advice: buildFinalGuidance(overall.signalType),
    follow_up_invitation: buildFollowUpInvitation(question, focusLabel),
  };
}

function compactStructuredReading(reading: StructuredTarotReading): StructuredTarotReading {
  return {
    ...reading,
    overall_summary: trimReading(reading.overall_summary, 2, 190),
    cards: reading.cards.map((card) => ({
      ...card,
      meaning: compactSentence(card.meaning, 145),
    })),
    final_action_advice: compactSentence(reading.final_action_advice, 145),
    follow_up_invitation: compactSentence(reading.follow_up_invitation, 118),
  };
}

function buildFollowUpReply(question: string, cards: RitualCard[]) {
  const anchor = cards[0];
  const cleanQuestion = question.replace(/\s+/g, " ").trim();
  const anchorLine = anchor
    ? compactSentence(getReadableCardMeaning(anchor).sentence, 150)
    : "Name what is true, then choose the smallest action that matches it.";
  return `For "${compactSentence(cleanQuestion, 88)}", the useful signal is the whole spread pattern, not only one card. ${anchorLine} The clean move is to name the pressure, then choose the smallest action that does not betray what you already know.`;
}

function structuredReadingToText(reading: StructuredTarotReading) {
  return [
    `Overall Reading: ${reading.overall_summary}`,
    "Card Breakdown:",
    ...reading.cards.map((card) => `${card.position} - ${card.card_name} (${card.orientation}): ${card.meaning}`),
    `Final Guidance: ${reading.final_action_advice}`,
    `Follow Up: ${reading.follow_up_invitation}`,
  ].join("\n\n");
}

function toApiCardDraw(card: RitualCard, index: number, spread: SpreadChoice): TarotCardDraw {
  const meaning = getReadableCardMeaning(card);
  const isMajor = /^\d+-/.test(card.cardId);
  return {
    card: {
      id: card.cardId,
      name: card.name,
      arcana: isMajor ? "major" : "minor",
      suit: isMajor ? null : getCardSuit(card.cardId),
      keywords: meaning.keywords,
      upright: meaning.upright,
      reversed: meaning.reversed,
    },
    isReversed: card.orientation === "reversed",
    position: getSpreadPositionLabel(spread, index),
  };
}

function previewCardSizeClass(count: number) {
  if (count === 1) return "!h-[238px] !w-[146px] sm:!h-[266px] sm:!w-[162px]";
  if (count <= 3) return "!h-[152px] !w-[94px] sm:!h-[172px] sm:!w-[106px]";
  if (count <= 5) return "!h-[132px] !w-[82px] sm:!h-[152px] sm:!w-[94px]";
  if (count <= 7) return "!h-[116px] !w-[72px] sm:!h-[134px] sm:!w-[82px]";
  return "!h-[106px] !w-[66px] sm:!h-[122px] sm:!w-[76px]";
}

function previewItemWidthClass(count: number) {
  if (count === 1) return "w-[168px] sm:w-[190px]";
  if (count <= 3) return "w-[120px] sm:w-[136px]";
  if (count <= 5) return "w-[108px] sm:w-[122px]";
  if (count <= 7) return "w-[96px] sm:w-[108px]";
  return "w-[88px] sm:w-[100px]";
}

export function TarotHintReadingChat({
  selectedCards,
  spread,
  backStyle = "nocturne",
  cardBackId,
  cardArtId = "original",
  question,
  story,
  focusLabel,
  archiveOnOpen = true,
}: TarotHintReadingChatProps) {
  const [, navigate] = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [structuredReading, setStructuredReading] = useState<StructuredTarotReading | null>(null);
  const [saveNotice, setSaveNotice] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const savedReadingKeyRef = useRef<string | null>(null);
  const leaveTimerRef = useRef<number | null>(null);
  const chatMutation = useSendTarotChatMessage({
    mutation: {
      retry: false,
    },
  });
  const selectedCardKey = useMemo(
    () => selectedCards.map((card) => `${card.visualId}:${card.cardId}:${card.orientation}`).join("|"),
    [selectedCards],
  );
  const localReading = useMemo(
    () => buildLocalStructuredReading(selectedCards, spread, question, story, focusLabel),
    [focusLabel, question, selectedCardKey, selectedCards, spread, story],
  );
  const reading = useMemo(() => compactStructuredReading(structuredReading ?? localReading), [localReading, structuredReading]);
  const shortAnswer = reading.overall_summary;
  const cardMeanings = reading.cards.map((card) => `${card.position}: ${card.meaning}`);
  const questionMeaning = reading.final_action_advice;
  const initialReadingText = useMemo(() => structuredReadingToText(reading), [reading]);
  const previewCardSize = previewCardSizeClass(selectedCards.length);
  const previewItemWidth = previewItemWidthClass(selectedCards.length);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedCards]);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current !== null) {
        window.clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCards.length === 0) return undefined;

    const controller = new AbortController();
    setStructuredReading(null);

    const requestBody = {
      question: question?.trim() || focusLabel?.trim() || "What do I need to understand right now?",
      spreadType: spread.id,
      emotionalContext: story?.trim() || null,
      focusLabel: focusLabel?.trim() || null,
      requiredCardCount: selectedCards.length,
      cards: selectedCards.map((card, index) => {
        const meaning = getReadableCardMeaning(card);
        const isMajor = /^\d+-/.test(card.cardId);
        return {
          cardId: card.cardId,
          name: card.name,
          orientation: card.orientation,
          position: getSpreadPositionLabel(spread, index),
          keywords: meaning.keywords,
          upright: meaning.upright,
          reversed: meaning.reversed,
          arcana: isMajor ? "major" : "minor",
          suit: isMajor ? null : getCardSuit(card.cardId),
        };
      }),
    };

    void fetch(apiUrl("/api/tarot/structured-reading"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() as Promise<StructuredTarotReading> : null)
      .then((nextReading) => {
        if (nextReading?.overall_summary && Array.isArray(nextReading.cards)) {
          setStructuredReading(compactStructuredReading(nextReading));
        }
      })
      .catch(() => {
        // The local reading already follows the same structure; API failure should not interrupt the room.
      });

    return () => controller.abort();
  }, [focusLabel, question, selectedCardKey, selectedCards, spread, story]);

  useEffect(() => {
    if (!archiveOnOpen) return;
    if (selectedCards.length === 0) return;
    const saveKey = selectedCards.map((card) => card.visualId).join("|");
    if (savedReadingKeyRef.current === saveKey) return;
    savedReadingKeyRef.current = saveKey;
    const savedReading = saveLocalTarotReading({
      spreadType: spread.id,
      spreadLabel: spread.label,
      question,
      story,
      focusLabel,
      cardArtId,
      shortAnswer,
      questionMeaning,
      cardMeanings,
      cards: selectedCards.map((card, index) => ({
        cardId: card.cardId,
        name: card.name,
        orientation: card.orientation,
        positionLabel: getSpreadPositionLabel(spread, index),
        keywords: getReadableCardMeaning(card).keywords,
      })),
    });
    if (question?.trim()) {
      saveLocalQuestionHistory({
        question,
        focus: focusLabel?.trim() || spread.label,
        spreadType: spread.id,
        readingId: savedReading.id,
        createdAt: savedReading.createdAt,
      });
    }
    recordRitualCompletion();
    // Save once when the reading page opens for this selected card set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chatMutation.isPending) return;
    triggerFeedback("tap");
    setError(null);
    const userMessage: LocalChatMessage = {
      id: newMessageId(),
      role: "user",
      content: trimmed,
    };
    const priorMessages = messages;
    const withUser = [...priorMessages, userMessage];
    setMessages(withUser);
    setDraft("");

    try {
      const reply = await chatMutation.mutateAsync({
        data: {
          originalQuestion: question?.trim() || "What do I need to understand from these Hints?",
          territory: focusLabel?.trim() || spread.label,
          emotionalContext: story?.trim() || undefined,
          spreadType: spread.id,
          cards: selectedCards.map((card, index) => toApiCardDraw(card, index, spread)),
          initialReading: initialReadingText,
          messages: priorMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          followUp: trimmed,
        },
      });

      setMessages([
        ...withUser,
        {
          id: newMessageId(),
          role: "assistant",
          content: reply.message,
        },
      ]);
      triggerFeedback("success");
    } catch {
      setError("The live reading line is quiet right now, so this reply used the local reading context.");
      setMessages([
        ...withUser,
        {
          id: newMessageId(),
          role: "assistant",
          content: buildFollowUpReply(trimmed, selectedCards),
        },
      ]);
      triggerFeedback("soft");
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(draft);
    }
  }

  function leaveTo(path: string) {
    triggerFeedback("soft");
    setSaveNotice(true);
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current);
    }
    leaveTimerRef.current = window.setTimeout(() => {
      navigate(path);
    }, 780);
  }

  return (
    <section className="relative flex h-full w-full flex-col overflow-hidden bg-[#140d1c] text-[#f7ead0]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(228,193,116,0.16),transparent_24%),radial-gradient(circle_at_18%_72%,rgba(238,177,213,0.12),transparent_32%),linear-gradient(180deg,#211629,#140d1c_58%,#0d0914)]" />
      <div className="pointer-events-none absolute inset-0 opacity-28 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,244,226,0.72)_0_1px,transparent_1px),radial-gradient(circle_at_78%_16%,rgba(239,205,139,0.72)_0_1px,transparent_1px),radial-gradient(circle_at_66%_76%,rgba(234,178,217,0.44)_0_1px,transparent_1px)] [background-size:132px_148px]" />

      <AnimatePresence>
        {saveNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-4 top-4 z-50 flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-full border border-[#e4c174]/20 bg-[#1a1023]/92 px-4 py-3 shadow-[0_16px_42px_rgba(0,0,0,0.35)] backdrop-blur-md"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e4c174]/14 text-[#ffe2a2]">
              <History size={16} />
            </span>
            <span className="min-w-0">
              <span className="block font-sans text-[12px] font-semibold text-[#f7ead0]">Saved to History</span>
              <span className="block truncate font-sans text-[11px] text-[#d8c7a6]/66">
                This chat will still be there when you come back.
              </span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative z-10 border-b border-[#e4c174]/10 px-5 pb-3 pl-16 pt-[calc(var(--hint-safe-top)+0.75rem)] sm:px-7 sm:pb-3.5 sm:pl-20">
        <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#e4c174]/70">Tarot room</p>
        <h1 className="mt-1 font-serif text-[26px] leading-tight text-[#f7ead0] sm:text-[34px]">
          Read my Hint
        </h1>
        <p className="mt-1.5 max-w-2xl font-sans text-[12px] leading-relaxed text-[#d8c7a6]/74 sm:text-[13px]">
          Quick answer, cards, then chat if you want more.
        </p>
        {(question || focusLabel) && (
          <p className="mt-2 max-w-2xl truncate font-sans text-xs leading-relaxed text-[#d8c7a6]/58">
            {focusLabel ? `${focusLabel} · ` : ""}
            {question}
          </p>
        )}
        <div className="absolute right-4 top-3 flex items-center gap-2 sm:right-6">
          <button
            type="button"
            onClick={() => leaveTo("/app/readings")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4c174]/16 bg-white/[0.04] text-[#d8c7a6]/82 transition-colors hover:border-[#e4c174]/34 hover:text-[#ffe2a2]"
            aria-label="Open reading history"
          >
            <History size={16} />
          </button>
          <button
            type="button"
            onClick={() => leaveTo("/app")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4c174]/16 bg-white/[0.04] text-[#d8c7a6]/82 transition-colors hover:border-[#e4c174]/34 hover:text-[#ffe2a2]"
            aria-label="Return home"
          >
            <Home size={16} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-4 sm:px-7">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 pb-24">
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-[14px] border border-[#e4c174]/14 bg-[#201426]/56 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.20)] backdrop-blur-sm"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-[#e4c174]/72">
                Cards drawn
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-[#d8c7a6]/48">
                {selectedCards.length} cards
              </p>
            </div>
            <div className="snap-x snap-mandatory overflow-x-auto pb-2 [scrollbar-width:none]">
              <div className={`mx-auto flex ${selectedCards.length === 1 ? "justify-center" : "justify-start"} gap-3 sm:gap-4`}>
                {selectedCards.map((card, index) => (
                  <div key={card.visualId} className={`${previewItemWidth} shrink-0 snap-center text-center`}>
                    <TarotCardVisual
                      card={card}
                      faceDown={false}
                      revealed
                      backStyle={backStyle}
                      cardBackId={cardBackId}
                      cardArtId={cardArtId}
                      positionLabel={getSpreadPositionLabel(spread, index)}
                      ariaLabel={`${getSpreadPositionLabel(spread, index)}, ${card.name}, ${card.orientation}`}
                      showFrontCaption={false}
                      className={previewCardSize}
                    />
                    <p className="mt-2 truncate font-sans text-[9px] uppercase tracking-[0.16em] text-[#e4c174]/68">
                      {getSpreadPositionLabel(spread, index)}
                    </p>
                    <p className="mt-0.5 truncate font-serif text-[12px] leading-tight text-[#f7ead0] sm:text-[13px]">
                      {card.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <main className="flex min-w-0 flex-col gap-3">
            <motion.article
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[14px] border border-[#e4c174]/14 bg-[#201426]/48 p-3.5 shadow-[0_14px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-4"
            >
              <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-[#e4c174]/76">
                Reading
              </p>
              <div className="mt-3 space-y-3">
                <section>
                  <h3 className="font-sans text-[11px] uppercase tracking-[0.18em] text-[#d8c7a6]/62">Overall Reading</h3>
                  <p className="mt-1.5 font-sans text-[15px] leading-6 text-[#f7ead0]/92 sm:text-[16px]">{reading.overall_summary}</p>
                </section>
                <section>
                  <h3 className="font-sans text-[11px] uppercase tracking-[0.18em] text-[#d8c7a6]/62">
                    Card Breakdown
                  </h3>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {reading.cards.map((card, index) => (
                      <div key={`${selectedCards[index]?.visualId ?? index}-meaning`} className="rounded-[10px] border border-white/8 bg-black/20 px-3 py-2">
                        <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#e4c174]/68">
                          {card.position}
                        </p>
                        <p className="mt-0.5 font-serif text-[14px] leading-tight text-[#f7ead0]">
                          {card.card_name}{card.orientation === "reversed" ? " reversed" : ""}
                        </p>
                        <p className="mt-1.5 font-sans text-[12.5px] leading-5 text-[#f7ead0]/86 sm:text-[13px]">
                          {compactSentence(card.meaning, 145)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="font-sans text-[11px] uppercase tracking-[0.18em] text-[#d8c7a6]/62">Final Guidance</h3>
                  <p className="mt-1.5 font-sans text-[13.5px] leading-6 text-[#f7ead0]/88 sm:text-sm">{reading.final_action_advice}</p>
                </section>
                <section>
                  <h3 className="font-sans text-[11px] uppercase tracking-[0.18em] text-[#d8c7a6]/62">Follow Up</h3>
                  <p className="mt-1.5 font-serif text-[15px] italic leading-6 text-[#f7ead0]/88 sm:text-[16px]">{reading.follow_up_invitation}</p>
                </section>
              </div>
            </motion.article>

            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: "easeOut" }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-[14px] border px-4 py-3 ${
                    message.role === "user"
                      ? "border-[#e4c174]/22 bg-[#e4c174]/10"
                      : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <p className="font-sans text-[15px] leading-7 text-[#f7ead0]/90">{message.content}</p>
                </div>
              </motion.div>
            ))}
          </main>
        </div>
      </div>

      <div className="relative z-20 border-t border-[#e4c174]/10 bg-[#140d1c]/90 px-5 pb-[calc(var(--hint-safe-bottom)+1rem)] pt-2.5 backdrop-blur-md sm:px-7">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-sans text-[11px] text-[#d8c7a6]/54">
              Saved in History. You can leave and come back later.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => leaveTo("/app/readings")}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#e4c174]/18 bg-white/[0.035] px-3 font-sans text-[11px] font-semibold text-[#d8c7a6]/78 transition-colors hover:border-[#e4c174]/36 hover:text-[#ffe2a2]"
              >
                <History size={13} />
                History
              </button>
              <button
                type="button"
                onClick={() => leaveTo("/app")}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#e4c174]/18 bg-white/[0.035] px-3 font-sans text-[11px] font-semibold text-[#d8c7a6]/78 transition-colors hover:border-[#e4c174]/36 hover:text-[#ffe2a2]"
              >
                <Home size={13} />
                Leave room
              </button>
            </div>
          </div>
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {FOLLOW_UPS.map((followUp) => (
              <button
                key={followUp.label}
                type="button"
                onClick={() => void send(followUp.prompt)}
                disabled={chatMutation.isPending}
                className="shrink-0 rounded-full border border-[#e4c174]/18 bg-white/[0.035] px-3.5 py-2 font-serif text-[13px] italic text-[#d8c7a6]/82 transition-colors hover:border-[#e4c174]/36 hover:text-[#ffe8aa] disabled:cursor-wait disabled:opacity-55"
              >
                {followUp.label}
              </button>
            ))}
          </div>
          {error && (
            <p className="mb-2 font-sans text-xs text-[#d8c7a6]/58">
              {error}
            </p>
          )}
          <div className="flex items-end gap-3 rounded-[14px] border border-[#e4c174]/16 bg-[#0f0a16]/54 px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.24)]">
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={chatMutation.isPending ? "Hint is reading..." : "Ask what you want to understand next..."}
              disabled={chatMutation.isPending}
              className="max-h-32 flex-1 resize-none bg-transparent font-sans text-[15px] leading-relaxed text-[#f7ead0] outline-none placeholder:text-[#d8c7a6]/42"
            />
            <button
              type="button"
              onClick={() => void send(draft)}
              disabled={!draft.trim() || chatMutation.isPending}
              aria-label="Send follow-up"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e4c174]/90 text-[#08070b] transition-colors hover:bg-[#ffe2a2] disabled:cursor-default disabled:bg-white/10 disabled:text-[#d8c7a6]/35"
            >
              <SendHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
