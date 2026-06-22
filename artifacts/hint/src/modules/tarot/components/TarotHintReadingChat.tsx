import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { SendHorizontal } from "lucide-react";
import { useSendTarotChatMessage, type TarotCardDraw } from "@workspace/api-client-react";
import { apiUrl } from "../../../lib/api";
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
  "What should I do next?",
  "What should I stop holding?",
  "What is the quiet truth here?",
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
  if (clean.length <= maxChars) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()) ?? [clean];
  const clipped = sentences.slice(0, maxSentences).join(" ");
  if (clipped.length <= maxChars) return clipped;
  return `${clipped.slice(0, maxChars - 1).trim()}...`;
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
        direction: "the cards are not asking you to step back; they are saying this can move forward if you act with steadiness instead of waiting for perfect certainty",
      };
    case "soft_yes":
    case "clear_signal":
      return {
        label: "a positive signal with a clear direction",
        direction: "the cards lean toward movement, but they want that movement to be clean, paced, and based on what is already visible",
      };
    case "blocked":
      return {
        label: "a heavy blocked signal",
        direction: "the cards are not supporting a rushed push right now; they are asking you to stop feeding the part of this that is draining your judgment",
      };
    case "soft_no":
      return {
        label: "a warning signal more than a green light",
        direction: "the cards are not saying everything is closed, but they are telling you not to trust the surface version of this too quickly",
      };
    case "mixed_signal":
    default:
      return {
        label: "a mixed signal",
        direction: "the cards do not fully reject this, but they also do not give an easy yes; you can keep looking, but not blindly invest more before the pattern becomes clearer",
      };
  }
}

function questionLead(question?: string) {
  const clean = question?.trim();
  return clean ? `For "${clean}", ` : "For this question, ";
}

function buildOverallReading(cards: RitualCard[], question?: string): { signalType: StructuredSignalType; text: string } {
  const signalType = getReadingSignal(cards);
  const signal = getSignalLanguage(signalType);
  const cardCountLabel = cards.length === 1 ? "this card" : `these ${cards.length} cards`;
  return {
    signalType,
    text: `${questionLead(question)}${cardCountLabel} give ${signal.label}. ${signal.direction}.`,
  };
}

function getPositionFrame(position: string, index: number, spread: SpreadChoice) {
  const normalized = position.toLowerCase();
  if (/past|before|root|break|cause/.test(normalized)) {
    return "This shows what has been shaping the situation before this moment";
  }
  if (/present|now|outer|you|trunk|appears|signal/.test(normalized)) {
    return "This shows the energy that is active right now";
  }
  if (/future|next|direction|trend|gain|crown|fruit|result/.test(normalized)) {
    return "This points to where the pattern is likely to move if nothing important changes";
  }
  if (/block|barrier|challenge|obstacle/.test(normalized)) {
    return "This names what is slowing the situation down";
  }
  if (/advice|approach|action/.test(normalized)) {
    return "This is the card's direct guidance for how to move";
  }
  if (/them|feeling|other|between|connection|true view/.test(normalized)) {
    return "This describes the relational thread showing up in this position";
  }
  if (spread.cardCount === 3 && index === 0) return "This shows the influence that brought you here";
  if (spread.cardCount === 3 && index === 1) return "This shows the real pressure or energy in the present";
  if (spread.cardCount === 3 && index === 2) return "This points to the next movement if the pattern continues";
  return "This shows the specific part of the reading that wants attention here";
}

function buildCardMeaning(card: RitualCard, index: number, spread: SpreadChoice): StructuredCardMeaning {
  const position = getSpreadPositionLabel(spread, index);
  const frame = getPositionFrame(position, index, spread);
  const orientation = card.orientation === "reversed" ? "reversed" : "upright";
  return {
    position,
    card_name: card.name,
    orientation,
    meaning: `${frame}. ${getReadableCardMeaning(card).sentence}`,
  };
}

function buildFinalGuidance(signalType: StructuredSignalType, question?: string, story?: string) {
  const storyLine = story?.trim() ? "Because the story already has emotional weight, " : "";
  switch (signalType) {
    case "opening":
    case "soft_yes":
    case "clear_signal":
      return `${storyLine}your next move is to lean forward, but not all at once. Make one clear action that matches what you already know, and do not keep waiting for a perfect sign before you let the situation move.`;
    case "blocked":
      return `${storyLine}your next move is to stop giving this situation unlimited access to your energy. Pull the focus back to what is real, what is repeated, and what you can act on without chasing reassurance.`;
    case "soft_no":
      return `${storyLine}your next move is to slow down and test the reality of what you are seeing. Do not build the whole choice on hope or on someone else's small reaction; ask what the pattern has already proven.`;
    case "mixed_signal":
    default:
      return `${storyLine}your next move is not to disappear and not to rush. Stay close enough to see what happens next, but put a clearer boundary around how much emotion, time, or trust you give before the signal becomes cleaner.`;
  }
}

function buildFollowUpInvitation(question?: string, focusLabel?: string) {
  const lower = `${question ?? ""} ${focusLabel ?? ""}`.toLowerCase();
  if (/love|relationship|dating|connection|reconcile|breakup|their|him|her|them/.test(lower)) {
    return "If you want, tell me what has been happening between you two lately, and I can help you see more clearly where this connection is actually getting stuck.";
  }
  if (/work|job|career|exam|school|application|offer/.test(lower)) {
    return "If you want, tell me what choice or pressure is in front of you right now, and I can help you read which next step these cards are pointing toward.";
  }
  return "If you want, tell me more about the part that feels stuck right now, and I can help you read the next step through these cards more closely.";
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
    final_action_advice: buildFinalGuidance(overall.signalType, question, story),
    follow_up_invitation: buildFollowUpInvitation(question, focusLabel),
  };
}

function buildFollowUpReply(question: string, cards: RitualCard[]) {
  const anchor = cards[0];
  const cleanQuestion = question.replace(/\s+/g, " ").trim();
  return `For "${cleanQuestion}", the cards are still pointing back to the whole pattern, not only one card. ${anchor ? getReadableCardMeaning(anchor).sentence : "Name what is true, then choose the smallest action that matches it."} Tell me the part that feels hardest to read, and I can stay with that thread.`;
}

function structuredReadingToText(reading: StructuredTarotReading) {
  return [
    `Overall Reading: ${reading.overall_summary}`,
    "Card Breakdown:",
    ...reading.cards.map((card) => `${card.position} - ${card.card_name} (${card.orientation}): ${card.meaning}`),
    `Final Guidance: ${reading.final_action_advice}`,
    `Keep Reading: ${reading.follow_up_invitation}`,
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
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [structuredReading, setStructuredReading] = useState<StructuredTarotReading | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const savedReadingKeyRef = useRef<string | null>(null);
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
  const reading = structuredReading ?? localReading;
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
          setStructuredReading(nextReading);
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
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(draft);
    }
  }

  return (
    <section className="relative flex h-full w-full flex-col overflow-hidden bg-[#010207] text-[#f7ead0]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(228,193,116,0.10),transparent_24%),linear-gradient(180deg,#050816,#010207_58%,#03040c)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.8)_0_1px,transparent_1px),radial-gradient(circle_at_78%_16%,rgba(239,205,139,0.78)_0_1px,transparent_1px)] [background-size:132px_148px]" />

      <header className="relative z-10 border-b border-[#e4c174]/10 px-5 py-3 pl-16 sm:px-7 sm:py-3.5 sm:pl-20">
        <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#e4c174]/70">Tarot room</p>
        <h1 className="mt-1 font-serif text-[26px] leading-tight text-[#f7ead0] sm:text-[34px]">
          Read my Hint
        </h1>
        <p className="mt-1.5 max-w-2xl font-sans text-[12px] leading-relaxed text-[#d8c7a6]/74 sm:text-[13px]">
          Summary first, then the cards, then the next honest move.
        </p>
        {(question || focusLabel) && (
          <p className="mt-2 max-w-2xl truncate font-sans text-xs leading-relaxed text-[#d8c7a6]/58">
            {focusLabel ? `${focusLabel} · ` : ""}
            {question}
          </p>
        )}
      </header>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-4 sm:px-7">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 pb-24">
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.36, ease: "easeOut" }}
            className="w-full rounded-[14px] border border-[#e4c174]/14 bg-black/24 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.22)]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-[#e4c174]/72">
                Cards drawn
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-[#d8c7a6]/48">
                {selectedCards.length} cards
              </p>
            </div>
            <div className="overflow-x-auto pb-2 [scrollbar-width:none]">
              <div className={`mx-auto flex ${selectedCards.length === 1 ? "justify-center" : "justify-start"} gap-3 sm:gap-4`}>
                {selectedCards.map((card, index) => (
                  <div key={card.visualId} className={`${previewItemWidth} shrink-0 text-center`}>
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
              transition={{ duration: 0.34, ease: "easeOut" }}
              className="rounded-[14px] border border-[#e4c174]/14 bg-white/[0.04] p-3.5 shadow-[0_14px_30px_rgba(0,0,0,0.20)] sm:p-4"
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
                          {trimReading(card.meaning, 3, 360)}
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
                  <h3 className="font-sans text-[11px] uppercase tracking-[0.18em] text-[#d8c7a6]/62">Keep Reading</h3>
                  <p className="mt-1.5 font-serif text-[15px] italic leading-6 text-[#f7ead0]/88 sm:text-[16px]">{reading.follow_up_invitation}</p>
                </section>
              </div>
            </motion.article>

            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
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

      <div className="relative z-20 border-t border-[#e4c174]/10 bg-[#010207]/88 px-5 pb-4 pt-2.5 backdrop-blur-md sm:px-7">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {FOLLOW_UPS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => void send(question)}
                disabled={chatMutation.isPending}
                className="shrink-0 rounded-full border border-[#e4c174]/18 bg-white/[0.035] px-3.5 py-2 font-serif text-[13px] italic text-[#d8c7a6]/82 transition-colors hover:border-[#e4c174]/36 hover:text-[#ffe8aa] disabled:cursor-wait disabled:opacity-55"
              >
                {question}
              </button>
            ))}
          </div>
          {error && (
            <p className="mb-2 font-sans text-xs text-[#d8c7a6]/58">
              {error}
            </p>
          )}
          <div className="flex items-end gap-3 rounded-[14px] border border-[#e4c174]/16 bg-black/38 px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
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
