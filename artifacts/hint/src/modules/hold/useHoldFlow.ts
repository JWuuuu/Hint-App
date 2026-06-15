import { useCallback, useState } from "react";
import { useCreateTarotReading } from "@workspace/api-client-react";
import type { TarotReading } from "@workspace/api-client-react";
import { getAnonId } from "../../lib/identity";
import type {
  ReadingSession,
  SpreadType,
  ChatMessage,
} from "./chat/types";
import { readingToActive } from "./chat/types";
import { useLanguage } from "../../lib/i18n";
import { saveLocalQuestionHistory } from "../readings/localQuestionHistory";
import { isTarotCardArtId, type TarotCardArtId } from "../tarot/logic/cardImageMap";

export type HoldStep =
  | "setup"
  | "ritual"
  | "territories"
  | "acknowledgment"
  | "hold"
  | "chat"
  | "error";

export type RoomPresetId = "hint" | "dawn" | "rose";
export type DeckStyleId = "nocturne" | "ivory" | "rose";
export type CardFaceId = TarotCardArtId;
export type RoomBackgroundId = "stars" | "dawn" | "sea";

export interface TarotRoomSetup {
  presetId: RoomPresetId;
  deckStyleId: DeckStyleId;
  cardFaceId: CardFaceId;
  backgroundId: RoomBackgroundId;
  cardColor: string;
  spreadType: SpreadType;
  story?: string;
  question?: string;
  focusLabel?: string;
}

export interface Territory {
  id: string;
  label: string;
  spreadType: SpreadType;
  questionSeed: string;
}

export interface SpreadChoice {
  id: SpreadType;
  label: string;
  description: string;
  positions: string;
  cardCount: number;
  bestFor: string;
  positionLabels: string[];
  layout: readonly {
    n: number;
    x: number;
    y: number;
  }[];
}

export interface TarotIntake {
  focus: Territory;
  context: string;
  question: string;
  spreadType: SpreadType;
  roomSetup?: TarotRoomSetup;
}

/**
 * Five emotional territories. Each one suggests a tarot-safe question, while
 * still leaving the user room to write their own.
 */
export const TERRITORIES: readonly Territory[] = [
  {
    id: "someone",
    label: "Someone or a relationship",
    spreadType: "relationship",
    questionSeed: "What do I need to understand about this connection right now?",
  },
  {
    id: "avoiding",
    label: "A decision I need to make",
    spreadType: "three",
    questionSeed: "What is this choice asking me to see?",
  },
  {
    id: "lost",
    label: "Something changed or ended",
    spreadType: "three",
    questionSeed: "What is this ending trying to teach me?",
  },
  {
    id: "unnamed",
    label: "A pattern that keeps repeating",
    spreadType: "three",
    questionSeed: "What pattern am I being asked to notice?",
  },
  {
    id: "unknown",
    label: "I'm not sure yet",
    spreadType: "single",
    questionSeed: "What do I need to see clearly right now?",
  },
] as const;

export const SPREAD_CHOICES: readonly SpreadChoice[] = [
  {
    id: "single",
    label: "One card",
    description: "The core hint",
    positions: "A single mirror for the heart of the question",
    cardCount: 1,
    bestFor: "Quick clarity, daily pulls, or one direct question.",
    positionLabels: ["Core hint"],
    layout: [{ n: 1, x: 50, y: 50 }],
  },
  {
    id: "three",
    label: "Three cards",
    description: "Past, present, next",
    positions: "What shaped it, what is here, what wants attention",
    cardCount: 3,
    bestFor: "Sorting a situation into before, now, and next movement.",
    positionLabels: ["Past", "Present", "Next"],
    layout: [
      { n: 1, x: 23, y: 56 },
      { n: 2, x: 50, y: 42 },
      { n: 3, x: 77, y: 56 },
    ],
  },
  {
    id: "relationship",
    label: "Connection",
    description: "Me, them, between",
    positions: "Your side, their side, and the thread between",
    cardCount: 3,
    bestFor: "Understanding two sides of a relationship and the shared thread.",
    positionLabels: ["You", "Them", "Between"],
    layout: [
      { n: 1, x: 24, y: 60 },
      { n: 2, x: 76, y: 60 },
      { n: 3, x: 50, y: 34 },
    ],
  },
  {
    id: "futureLover",
    label: "Future Lover",
    description: "Arrival, attraction, and where it may move",
    positions: "Arrival, signal, draw, approach, challenge, gain, direction",
    cardCount: 7,
    bestFor: "When you want to look at who may enter, the pull, and future movement.",
    positionLabels: ["Arrival", "Signal", "Draw", "Approach", "Challenge", "Gain", "Direction"],
    layout: [
      { n: 1, x: 14, y: 20 },
      { n: 2, x: 27, y: 38 },
      { n: 3, x: 41, y: 56 },
      { n: 4, x: 50, y: 76 },
      { n: 5, x: 59, y: 56 },
      { n: 6, x: 73, y: 38 },
      { n: 7, x: 86, y: 20 },
    ],
  },
  {
    id: "peachBlossom",
    label: "Peach Blossom",
    description: "Attraction, appearance, block, and trend",
    positions: "Appears, image, block, trend, gain",
    cardCount: 5,
    bestFor: "For attraction, whether someone is appearing, and the relationship trend.",
    positionLabels: ["Appears", "Image", "Block", "Trend", "Gain"],
    layout: [
      { n: 1, x: 22, y: 26 },
      { n: 2, x: 78, y: 26 },
      { n: 3, x: 22, y: 72 },
      { n: 4, x: 78, y: 72 },
      { n: 5, x: 50, y: 50 },
    ],
  },
  {
    id: "reconciliation",
    label: "Reconciliation",
    description: "Whether a broken connection can reopen",
    positions: "You now, them now, break, positive, barrier, future, advice",
    cardCount: 7,
    bestFor: "When the question is whether a broken connection can reopen.",
    positionLabels: ["You now", "Them now", "Break", "Positive", "Barrier", "Future", "Advice"],
    layout: [
      { n: 1, x: 34, y: 24 },
      { n: 2, x: 66, y: 24 },
      { n: 3, x: 82, y: 48 },
      { n: 4, x: 66, y: 70 },
      { n: 5, x: 50, y: 82 },
      { n: 6, x: 34, y: 70 },
      { n: 7, x: 18, y: 48 },
    ],
  },
  {
    id: "trueHeart",
    label: "True Heart",
    description: "Their outer signal, feeling, block, truth, future",
    positions: "Outer, feeling, block, true view, future",
    cardCount: 5,
    bestFor: "For reading the other person's inner feeling, block, and possible future.",
    positionLabels: ["Outer", "Feeling", "Block", "True view", "Future"],
    layout: [
      { n: 1, x: 26, y: 28 },
      { n: 2, x: 50, y: 28 },
      { n: 3, x: 26, y: 68 },
      { n: 4, x: 50, y: 68 },
      { n: 5, x: 78, y: 48 },
    ],
  },
  {
    id: "loveTree",
    label: "Love Tree",
    description: "Roots, environment, past, future, and advice",
    positions: "Root, trunk, environment, past, future, crown, fruit",
    cardCount: 7,
    bestFor: "For relationship roots, environment, past, future, and advice.",
    positionLabels: ["Root", "Trunk", "Environment", "Past", "Future", "Crown", "Fruit"],
    layout: [
      { n: 1, x: 50, y: 80 },
      { n: 2, x: 50, y: 58 },
      { n: 3, x: 25, y: 52 },
      { n: 4, x: 75, y: 52 },
      { n: 5, x: 35, y: 34 },
      { n: 6, x: 65, y: 34 },
      { n: 7, x: 50, y: 18 },
    ],
  },
  {
    id: "xRelationship",
    label: "X Relationship",
    description: "Root, cause, two sides, obstacle, action, result",
    positions: "Root, cause, you, them, obstacle, help, block, action, result",
    cardCount: 9,
    bestFor: "For a complicated relationship with root, cause, status, strategy, and result.",
    positionLabels: ["Root", "Cause", "You", "Them", "Obstacle", "Help", "Block", "Action", "Result"],
    layout: [
      { n: 1, x: 18, y: 28 },
      { n: 2, x: 34, y: 42 },
      { n: 3, x: 50, y: 56 },
      { n: 4, x: 66, y: 42 },
      { n: 5, x: 82, y: 28 },
      { n: 6, x: 66, y: 70 },
      { n: 7, x: 50, y: 84 },
      { n: 8, x: 34, y: 70 },
      { n: 9, x: 18, y: 84 },
    ],
  },
] as const;

export interface RoomPreset {
  id: RoomPresetId;
  label: string;
  description: string;
  setup: TarotRoomSetup;
}

export interface VisualChoice<T extends string> {
  id: T;
  label: string;
  description: string;
  preview: string;
}

export interface CardFaceChoice {
  id: CardFaceId;
  label: string;
  description: string;
  previewCards: readonly string[];
}

export const DEFAULT_TAROT_ROOM_SETUP: TarotRoomSetup = {
  presetId: "hint",
  deckStyleId: "nocturne",
  cardFaceId: "hint-classic",
  backgroundId: "stars",
  cardColor: "Deep navy with gold linework",
  spreadType: "single",
};

export const ROOM_PRESETS: readonly RoomPreset[] = [
  {
    id: "hint",
    label: "Hint Study",
    description: "A quiet star room for a clean, direct answer.",
    setup: DEFAULT_TAROT_ROOM_SETUP,
  },
  {
    id: "dawn",
    label: "Dawn Mirror",
    description: "A brighter room for sorting what changed and what comes next.",
    setup: {
      presetId: "dawn",
      deckStyleId: "ivory",
      cardFaceId: "hint-classic",
      backgroundId: "dawn",
      cardColor: "Ivory with warm gold",
      spreadType: "three",
    },
  },
  {
    id: "rose",
    label: "Rose Thread",
    description: "A softer room for relationships, attraction, and mixed signals.",
    setup: {
      presetId: "rose",
      deckStyleId: "rose",
      cardFaceId: "hint-classic",
      backgroundId: "sea",
      cardColor: "Rose quartz with violet foil",
      spreadType: "relationship",
    },
  },
] as const;

export const DECK_STYLES: readonly VisualChoice<DeckStyleId>[] = [
  {
    id: "nocturne",
    label: "Nocturne",
    description: "Navy cards with gold constellation lines.",
    preview: "linear-gradient(155deg, #101827, #070b14 58%, #171023)",
  },
  {
    id: "ivory",
    label: "Ivory Gold",
    description: "Bright cards with soft gold edges.",
    preview: "linear-gradient(155deg, #fff8ea, #eadcbf 58%, #f5f0e5)",
  },
  {
    id: "rose",
    label: "Rose Quartz",
    description: "Pink-violet cards for warmer readings.",
    preview: "linear-gradient(155deg, #ffe4ef, #c9b5ff 55%, #60406f)",
  },
] as const;

export const CARD_FACE_STYLES: readonly CardFaceChoice[] = [
  {
    id: "hint-classic",
    label: "Hint Classic",
    description: "Full illustrated 78-card artwork, stored locally for in-room readings.",
    previewCards: ["0-fool", "2-high-priestess", "19-sun"],
  },
  {
    id: "original",
    label: "Original Hint",
    description: "The earlier Hint deck art for a cleaner, simpler look.",
    previewCards: ["1-magician", "17-star", "ace-cups"],
  },
] as const;

export const BACKGROUND_STYLES: readonly VisualChoice<RoomBackgroundId>[] = [
  {
    id: "stars",
    label: "Star Field",
    description: "Dark, celestial, focused.",
    preview: "radial-gradient(circle at 30% 20%, #e4c68a, transparent 12%), linear-gradient(135deg, #080712, #142437)",
  },
  {
    id: "dawn",
    label: "Soft Dawn",
    description: "Bright, calm, easier to read.",
    preview: "linear-gradient(135deg, #fff1d5, #e5f4ef 52%, #eadcf2)",
  },
  {
    id: "sea",
    label: "Deep Sea",
    description: "Moody teal with a dreamier edge.",
    preview: "linear-gradient(135deg, #051216, #123d46 56%, #2b1737)",
  },
] as const;

const TAROT_ROOM_SETUP_STORAGE_KEY = "hint.tarotRoomSetup.v1";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRoomPresetId(value: unknown): value is RoomPresetId {
  return ROOM_PRESETS.some((preset) => preset.id === value);
}

function isDeckStyleId(value: unknown): value is DeckStyleId {
  return DECK_STYLES.some((deck) => deck.id === value);
}

function isCardFaceId(value: unknown): value is CardFaceId {
  return isTarotCardArtId(value);
}

function isRoomBackgroundId(value: unknown): value is RoomBackgroundId {
  return BACKGROUND_STYLES.some((background) => background.id === value);
}

function isSetupForcedFromUrl() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("setup") === "1" || params.get("roomSetup") === "1";
}

function clearSetupUrlFlag() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("setup");
  url.searchParams.delete("roomSetup");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

export function loadSavedTarotRoomSetup(): TarotRoomSetup | null {
  if (!canUseBrowserStorage()) return null;
  try {
    const raw = window.localStorage.getItem(TAROT_ROOM_SETUP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TarotRoomSetup>;
    return {
      ...DEFAULT_TAROT_ROOM_SETUP,
      presetId: isRoomPresetId(parsed.presetId) ? parsed.presetId : DEFAULT_TAROT_ROOM_SETUP.presetId,
      deckStyleId: isDeckStyleId(parsed.deckStyleId) ? parsed.deckStyleId : DEFAULT_TAROT_ROOM_SETUP.deckStyleId,
      cardFaceId: isCardFaceId(parsed.cardFaceId) ? parsed.cardFaceId : DEFAULT_TAROT_ROOM_SETUP.cardFaceId,
      backgroundId: isRoomBackgroundId(parsed.backgroundId) ? parsed.backgroundId : DEFAULT_TAROT_ROOM_SETUP.backgroundId,
      cardColor: typeof parsed.cardColor === "string" ? parsed.cardColor : DEFAULT_TAROT_ROOM_SETUP.cardColor,
    };
  } catch {
    return null;
  }
}

export function saveTarotRoomSetupPreference(setup: TarotRoomSetup) {
  if (!canUseBrowserStorage()) return;
  const preference: TarotRoomSetup = {
    ...DEFAULT_TAROT_ROOM_SETUP,
    presetId: setup.presetId,
    deckStyleId: setup.deckStyleId,
    cardFaceId: setup.cardFaceId,
    backgroundId: setup.backgroundId,
    cardColor: setup.cardColor,
  };
  try {
    window.localStorage.setItem(TAROT_ROOM_SETUP_STORAGE_KEY, JSON.stringify(preference));
  } catch {
    // If storage is blocked, the in-memory setup still works for the current reading.
  }
}

function newSessionId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function cleanInput(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function buildEmotionalContext(intake: TarotIntake): string {
  const context = intake.context.trim();
  const spread = SPREAD_CHOICES.find((s) => s.id === intake.spreadType);
  const preset = ROOM_PRESETS.find((item) => item.id === intake.roomSetup?.presetId);
  const deck = DECK_STYLES.find((item) => item.id === intake.roomSetup?.deckStyleId);
  const background = BACKGROUND_STYLES.find((item) => item.id === intake.roomSetup?.backgroundId);

  return [
    `Focus: ${intake.focus.label}`,
    preset ? `Room preset: ${preset.label}` : null,
    deck ? `Deck style: ${deck.label}` : null,
    background ? `Background: ${background.label}` : null,
    context ? `What happened: ${context}` : null,
    spread ? `Tarot spread: ${spread.label} - ${spread.positions}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

type Translate = (key: string) => string;

function userFacingReadingError(error: unknown, t: Translate): string {
  const status = typeof error === "object" && error ? (error as { status?: number }).status : null;
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (status === 429 || /quota|billing|too many requests/i.test(message)) {
    return t("tarot.error.quota");
  }

  return t("tarot.error.service");
}

export function useHoldFlow() {
  const { t } = useLanguage();
  const initialSavedRoomSetup = loadSavedTarotRoomSetup();
  const initialRoomSetup = initialSavedRoomSetup ?? DEFAULT_TAROT_ROOM_SETUP;
  const [step, setStep] = useState<HoldStep>(() => (initialSavedRoomSetup && !isSetupForcedFromUrl() ? "territories" : "setup"));
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [session, setSession] = useState<ReadingSession | null>(null);
  const [intake, setIntake] = useState<TarotIntake | null>(null);
  const [roomSetup, setRoomSetup] = useState<TarotRoomSetup>(initialRoomSetup);
  const [pendingReading, setPendingReading] = useState<TarotReading | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useCreateTarotReading({
    mutation: {
      retry: false,
    },
  });

  /** Internal: kicks off a reading API call. Used for both initial + redraw. */
  const requestReading = useCallback(
    (params: {
      question: string;
      territoryLabel: string;
      emotionalContext?: string;
      spreadType: SpreadType;
      onSuccess: (reading: TarotReading) => void;
    }) => {
      mutation.mutate(
        {
          data: {
            question: params.question,
            spreadType: params.spreadType,
            emotionalContext: params.emotionalContext ?? params.territoryLabel,
            anonId: getAnonId(),
          },
        },
        {
          onSuccess: (data) => {
            setPendingReading(data);
            params.onSuccess(data);
          },
          onError: (err) => {
            setErrorMessage(userFacingReadingError(err, t));
            setStep("error");
          },
        }
      );
    },
    [mutation, t]
  );

  const submitIntake = useCallback(
    (next: TarotIntake) => {
      const localizedFocus = {
        ...next.focus,
        label: t(`territory.${next.focus.id}.label`),
        questionSeed: t(`territory.${next.focus.id}.seed`),
      };
      const question = cleanInput(next.question || localizedFocus.questionSeed);
      const normalized: TarotIntake = {
        ...next,
        focus: localizedFocus,
        context: next.context.trim(),
        question,
        roomSetup: next.roomSetup ?? roomSetup,
      };
      const emotionalContext = buildEmotionalContext(normalized);

      setTerritory(normalized.focus);
      setIntake(normalized);
      setPendingReading(null);
      requestReading({
        question,
        territoryLabel: normalized.focus.label,
        emotionalContext,
        spreadType: normalized.spreadType,
        onSuccess: (reading) => {
          saveLocalQuestionHistory({
            question,
            focus: normalized.focus.label,
            spreadType: normalized.spreadType,
            readingId: reading.id,
            createdAt: reading.createdAt,
          });
          // First reading in a brand new session
          setSession({
            sessionId: newSessionId(),
            originalQuestion: question,
            territory: normalized.focus.label,
            emotionalContext,
            spreadType: normalized.spreadType,
            active: readingToActive(reading, normalized.spreadType),
            messages: [],
            redrawCount: 0,
            startedAt: new Date().toISOString(),
          });
        },
      });
      setStep("acknowledgment");
    },
    [requestReading, roomSetup, t]
  );

  const startRoom = useCallback((next: TarotRoomSetup) => {
    saveTarotRoomSetupPreference(next);
    setRoomSetup(next);
    setErrorMessage(null);
    clearSetupUrlFlag();
    setStep("territories");
  }, []);

  const submitRoomIntake = useCallback(
    (next: TarotIntake) => {
      const localizedFocus = {
        ...next.focus,
        label: t(`territory.${next.focus.id}.label`),
        questionSeed: t(`territory.${next.focus.id}.seed`),
      };
      const question = cleanInput(next.question || localizedFocus.questionSeed);
      const normalized: TarotIntake = {
        ...next,
        focus: localizedFocus,
        context: next.context.trim(),
        question,
        roomSetup: next.roomSetup ?? roomSetup,
      };
      const nextRoomSetup: TarotRoomSetup = {
        ...(normalized.roomSetup ?? roomSetup),
        spreadType: normalized.spreadType,
        story: normalized.context,
        question,
        focusLabel: normalized.focus.label,
      };

      setTerritory(normalized.focus);
      setIntake(normalized);
      setRoomSetup(nextRoomSetup);
      setPendingReading(null);
      setErrorMessage(null);
      setStep("ritual");
    },
    [roomSetup, t]
  );

  /** Pull a fresh set of cards for the same territory. Keeps chat history. */
  const redraw = useCallback(() => {
    if (!session || !territory) return;
    setPendingReading(null);
    requestReading({
      question: session.originalQuestion,
      territoryLabel: session.territory,
      emotionalContext: session.emotionalContext,
      spreadType: session.spreadType,
      onSuccess: (reading) => {
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            active: readingToActive(reading, prev.spreadType),
            messages: [], // fresh chat for the new reading
            redrawCount: prev.redrawCount + 1,
          };
        });
      },
    });
    setStep("hold");
  }, [session, territory, requestReading]);

  const updateSession = useCallback((next: ReadingSession) => {
    setSession(next);
  }, []);

  const setMessages = useCallback((next: ChatMessage[]) => {
    setSession((prev) => (prev ? { ...prev, messages: next } : prev));
  }, []);

  const advance = useCallback((next: HoldStep) => {
    setStep(next);
  }, []);

  const reset = useCallback(() => {
    const savedRoomSetup = loadSavedTarotRoomSetup();
    setStep(savedRoomSetup ? "territories" : "setup");
    setTerritory(null);
    setIntake(null);
    setSession(null);
    setRoomSetup(savedRoomSetup ?? DEFAULT_TAROT_ROOM_SETUP);
    setPendingReading(null);
    setErrorMessage(null);
  }, []);

  return {
    step,
    territory,
    intake,
    roomSetup,
    session,
    pendingReading,
    errorMessage,
    isPending: mutation.isPending,
    submitIntake,
    submitRoomIntake,
    startRoom,
    advance,
    reset,
    redraw,
    updateSession,
    setMessages,
  };
}
