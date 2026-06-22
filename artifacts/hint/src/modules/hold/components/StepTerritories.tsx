import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, Mic, MicOff, Sparkles } from "lucide-react";
import type { SpreadType } from "../chat/types";
import {
  SPREAD_CHOICES,
  TERRITORIES,
  type SpreadChoice,
  type TarotIntake,
  type TarotRoomSetup,
  type Territory,
} from "../useHoldFlow";
import { GOLD, IVORY, TEXT_HALO } from "../atmosphere";
import { useLanguage } from "../../../lib/i18n";
import { getTarotCardImage } from "../../tarot/logic/cardImageMap";

interface Props {
  roomSetup?: TarotRoomSetup | null;
  onSubmit: (intake: TarotIntake) => void;
}

type IntakePanel = "context" | "spread";
type DictationField = "context" | "question";

interface QuestionPrompt {
  text: string;
  focusId: Territory["id"];
}

interface QuestionPromptGroup {
  label: string;
  prompts: readonly QuestionPrompt[];
}

interface GuidedSpreadChoice {
  id: "quick" | "simple" | "between" | "deep";
  spreadType: SpreadType;
  title: string;
  cardCount: string;
  body: string;
  badge?: string;
}

interface SpeechAlternativeLike {
  transcript: string;
}

interface SpeechResultLike {
  isFinal: boolean;
  [index: number]: SpeechAlternativeLike | undefined;
}

interface SpeechResultListLike {
  length: number;
  [index: number]: SpeechResultLike | undefined;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onresult: ((event: { results: SpeechResultListLike; resultIndex?: number }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const SELECT_BLOOM_MS = 650;
const STEP_ORDER: IntakePanel[] = ["context", "spread"];
const QUICK_SPREAD_IDS: readonly SpreadType[] = ["single", "three", "relationship"];
const APP_TAROT_SPREAD_IDS: readonly SpreadType[] = [
  "single",
  "three",
  "relationship",
  "peachBlossom",
  "trueHeart",
  "futureLover",
  "reconciliation",
  "loveTree",
];
const MAX_VISIBLE_LONG_POSITION_CHIPS = 4;

interface SpreadRecommendation {
  spreadType: SpreadType;
  reasonKey: string;
}

const GUIDED_SPREAD_CHOICE_COPY = [
  {
    id: "quick",
    spreadType: "single",
    titleKey: "tarot.readingShape.quick.title",
    cardCountKey: "tarot.readingShape.quick.cards",
    bodyKey: "tarot.readingShape.quick.body",
  },
  {
    id: "simple",
    spreadType: "three",
    titleKey: "tarot.readingShape.simple.title",
    cardCountKey: "tarot.readingShape.simple.cards",
    bodyKey: "tarot.readingShape.simple.body",
  },
  {
    id: "between",
    spreadType: "relationship",
    titleKey: "tarot.readingShape.between.title",
    cardCountKey: "tarot.readingShape.between.cards",
    bodyKey: "tarot.readingShape.between.body",
  },
  {
    id: "deep",
    spreadType: "loveTree",
    titleKey: "tarot.readingShape.deep.title",
    cardCountKey: "tarot.readingShape.deep.cards",
    bodyKey: "tarot.readingShape.deep.body",
    badgeKey: "tarot.readingShape.deep.badge",
  },
] as const satisfies ReadonlyArray<{
  id: GuidedSpreadChoice["id"];
  spreadType: SpreadType;
  titleKey: string;
  cardCountKey: string;
  bodyKey: string;
  badgeKey?: string;
}>;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function appendText(existing: string, spoken: string): string {
  const clean = spoken.trim();
  if (!clean) return existing;
  return [existing.trim(), clean].filter(Boolean).join(" ");
}

function voiceErrorKey(error?: string): string {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "tarot.voice.permission";
    case "audio-capture":
      return "tarot.voice.micMissing";
    case "network":
      return "tarot.voice.network";
    case "no-speech":
      return "tarot.voice.noSpeech";
    default:
      return "tarot.voice.stopped";
  }
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}...`;
}

function panelIndex(panel: IntakePanel): number {
  return STEP_ORDER.indexOf(panel);
}

function StepDots({ panel }: { panel: IntakePanel }) {
  const active = panelIndex(panel);
  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5"
      style={{
        borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 24%, var(--hint-border))",
        background: "color-mix(in srgb, var(--hint-surface-soft) 72%, transparent)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
      }}
      aria-hidden
    >
      {STEP_ORDER.map((step, i) => (
        <span
          key={step}
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: i === active ? 18 : 6,
            background:
              i <= active ? "rgba(228, 198, 138, 0.78)" : "var(--hint-border)",
            boxShadow: i === active ? "0 0 12px rgba(228, 198, 138, 0.28)" : "none",
          }}
        />
      ))}
    </div>
  );
}

const INTAKE_ART_CARDS = ["2-high-priestess", "6-lovers", "19-sun"] as const;

function TarotIntakeArtwork({ spread }: { spread?: SpreadChoice }) {
  const images = INTAKE_ART_CARDS
    .map((cardId) => getTarotCardImage(cardId, "hint-classic") ?? getTarotCardImage(cardId, "original"))
    .filter((image): image is string => Boolean(image));
  const cardTransforms = [
    "translate3d(-8px, 8px, 0) rotate(-7deg)",
    "translate3d(0, 0, 0) rotate(0deg)",
    "translate3d(10px, 7px, 0) rotate(7deg)",
  ];

  return (
    <div
      className="hint-liquid-panel relative min-h-[318px] overflow-hidden rounded-[24px] border sm:min-h-[204px]"
      style={{
        borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 28%, var(--hint-liquid-border))",
        background:
          "radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--hint-aqua, #86d6c7) 20%, transparent), transparent 32%), radial-gradient(circle at 78% 28%, color-mix(in srgb, var(--hint-gold, #cba866) 24%, transparent), transparent 34%), var(--hint-liquid-panel-strong)",
        boxShadow: "var(--hint-liquid-shadow)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.62)_0_1px,transparent_1px),radial-gradient(circle_at_80%_22%,rgba(228,198,138,0.72)_0_1px,transparent_1px),radial-gradient(circle_at_62%_76%,rgba(64,224,208,0.58)_0_1px,transparent_1px)] [background-size:86px_94px]" />
      <motion.div
        aria-hidden
        className="absolute left-[8%] top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border border-[#e4c174]/18 sm:h-44 sm:w-44"
        animate={{ opacity: [0.18, 0.42, 0.18], scale: [0.98, 1.035, 0.98] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-6 left-8 h-28 w-52 rounded-full blur-2xl"
        style={{
          background: "radial-gradient(ellipse, rgba(228,198,138,0.24), rgba(64,224,208,0.11) 48%, transparent 74%)",
        }}
        animate={{ opacity: [0.46, 0.72, 0.46], scale: [0.98, 1.04, 0.98] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute left-1/2 top-5 flex h-[154px] w-[220px] -translate-x-1/2 items-end justify-center sm:h-[170px] sm:w-[246px]">
        {images.map((image, index) => (
          <span
            key={image}
            className="absolute bottom-0 block h-[146px] w-[92px] overflow-hidden rounded-[14px] border shadow-[0_22px_42px_rgba(0,0,0,0.28)] sm:h-[164px] sm:w-[104px]"
            style={{
              left: `${index * 48}px`,
              transform: cardTransforms[index],
              transformOrigin: "50% 88%",
              borderColor: index === 1
                ? "color-mix(in srgb, var(--hint-gold, #cba866) 72%, var(--hint-liquid-border))"
                : "color-mix(in srgb, var(--hint-liquid-border) 72%, transparent)",
              zIndex: index === 1 ? 3 : index === 2 ? 2 : 1,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: "var(--hint-deck-card-bg)",
            }}
          >
            <img
              src={image}
              alt=""
              aria-hidden="true"
              draggable={false}
              decoding="async"
              className="h-full w-full object-cover"
              style={{
                filter: "brightness(1.06) contrast(1.06) saturate(1.05)",
                imageRendering: "auto",
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            />
          </span>
        ))}
      </div>
      <div className="absolute inset-x-5 bottom-5 top-auto flex flex-col justify-center px-0 text-center">
        <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] sm:text-[10px]" style={{ color: GOLD.ink }}>
          Energy-selected
        </p>
        <p className="mt-1 font-serif text-[23px] leading-tight sm:text-[28px]" style={{ color: IVORY.primary, textShadow: TEXT_HALO.soft }}>
          The cards wait for your hand.
        </p>
        <p className="mt-2 line-clamp-2 font-sans text-[11px] leading-relaxed sm:text-[12px]" style={{ color: IVORY.dim }}>
          {spread
            ? `${spread.label} · ${spread.cardCount} ${spread.cardCount === 1 ? "card" : "cards"}`
            : "Ask first, then choose from a fixed hidden deck."}
        </p>
      </div>
    </div>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 items-center gap-2 rounded-[8px] border px-3 font-sans text-[12px] font-medium uppercase tracking-[0.14em] transition-all duration-500 disabled:opacity-35"
      style={{
        color: IVORY.body,
        borderColor: "var(--hint-border)",
        background: "color-mix(in srgb, var(--hint-card-surface-muted) 82%, transparent)",
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="hint-prism-action inline-flex h-11 items-center gap-2 rounded-[16px] px-4 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] transition-all duration-500 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-35"
      style={{
        color: "var(--hint-special-action-text)",
      }}
    >
      {children}
    </button>
  );
}

function Chip({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[50px] items-center rounded-[16px] border px-3 py-2 text-left font-sans text-[13px] font-medium leading-snug transition-all duration-500 hover:-translate-y-0.5 active:translate-y-0"
      style={{
        color: selected ? IVORY.primary : IVORY.body,
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected
          ? "linear-gradient(135deg, color-mix(in srgb, var(--hint-gold, #cba866) 18%, transparent), color-mix(in srgb, var(--hint-aqua, #86d6c7) 9%, transparent))"
          : "color-mix(in srgb, var(--hint-card-surface-muted) 88%, transparent)",
        textShadow: selected ? TEXT_HALO.soft : "none",
      }}
    >
      {children}
    </button>
  );
}

function MiniSpreadDiagram({ spread }: { spread: SpreadChoice }) {
  const points = spread.layout.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div
      className="relative h-[70px] w-[84px] shrink-0 overflow-hidden rounded-[14px]"
      style={{
        background: "var(--hint-liquid-panel-strong)",
        boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--hint-gold, #cba866) 22%, var(--hint-border))",
      }}
    >
      <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
        <circle cx="50" cy="46" r="38" fill="rgba(228,198,138,0.08)" />
        {spread.layout.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="rgba(228,198,138,0.28)"
            strokeWidth="0.9"
            strokeDasharray="3 3"
          />
        )}
      </svg>
      {spread.layout.map((point) => (
        <span
          key={`${spread.id}-${point.n}`}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[4px] border font-sans text-[9px] font-semibold"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: 16,
            height: 24,
            color: "var(--hint-gold-bright, #f2d48d)",
            borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 50%, var(--hint-border))",
            background: "color-mix(in srgb, var(--hint-deck-card-bg) 72%, transparent)",
          }}
        >
          {point.n}
        </span>
      ))}
    </div>
  );
}

function translatedList(value: string): string[] {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeForRecommendation(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
}

function includesAny(value: string, terms: readonly string[]): boolean {
  const paddedValue = ` ${value} `;
  return terms.some((term) => {
    const normalizedTerm = normalizeForRecommendation(term).trim();
    if (!normalizedTerm) return false;
    if (/^[a-z0-9]{1,3}$/i.test(normalizedTerm)) {
      return paddedValue.includes(` ${normalizedTerm} `);
    }
    return value.includes(normalizedTerm);
  });
}

function recommendSpreadType({
  context,
  focus,
  question,
}: {
  context: string;
  focus: Territory;
  question: string;
}): SpreadRecommendation {
  const text = normalizeForRecommendation(`${focus.id} ${context} ${question}`);
  const relationshipText = includesAny(text, [
    "relationship",
    "connection",
    "between us",
    "partner",
    "boyfriend",
    "girlfriend",
    "husband",
    "wife",
    "dating",
    "crush",
    "love",
    "romance",
    "marriage",
    "friend",
    "friendship",
    "family",
    "mother",
    "father",
    "parent",
    "child",
    "sibling",
    "coworker",
    "boss",
    "client",
    "them",
    "him",
    "her",
    "we",
    "关系",
    "感情",
    "对象",
    "伴侣",
    "喜欢",
    "暧昧",
    "朋友",
    "家人",
    "同事",
    "老板",
    "他",
    "她",
  ]);

  const reconciliationText = includesAny(text, [
    "ex",
    "break up",
    "breakup",
    "broke up",
    "broken",
    "come back",
    "get back together",
    "reconcile",
    "reconciliation",
    "restart with them",
    "复合",
    "前任",
    "分手",
    "复联",
  ]);

  if (
    reconciliationText &&
    (relationshipText || includesAny(text, ["ex", "reconcile", "reconciliation", "复合", "前任", "复联"]))
  ) {
    return { spreadType: "reconciliation", reasonKey: "tarot.spreadRecommendation.reason.reconciliation" };
  }

  if (
    includesAny(text, [
      "future lover",
      "future love",
      "new love",
      "new person",
      "meet someone",
      "coming in",
      "when will i find",
      "桃花",
      "未来对象",
      "未来伴侣",
      "新恋情",
      "脱单",
    ])
  ) {
    return { spreadType: "futureLover", reasonKey: "tarot.spreadRecommendation.reason.futureLover" };
  }

  if (
    relationshipText &&
    includesAny(text, [
      "crush",
      "attraction",
      "attracted",
      "dating",
      "flirt",
      "text me",
      "message me",
      "interested",
      "暧昧",
      "吸引",
    ])
  ) {
    return { spreadType: "peachBlossom", reasonKey: "tarot.spreadRecommendation.reason.peachBlossom" };
  }

  if (
    relationshipText &&
    includesAny(text, [
      "do they feel",
      "feeling",
      "feelings",
      "their feeling",
      "think of me",
      "what do they think",
      "true heart",
      "honest",
      "inner feeling",
      "really feel",
      "真心",
      "感觉",
      "想法",
    ])
  ) {
    return { spreadType: "trueHeart", reasonKey: "tarot.spreadRecommendation.reason.trueHeart" };
  }

  if (
    relationshipText &&
    includesAny(text, [
      "complicated",
      "pattern",
      "cycle",
      "why",
      "obstacle",
      "blocked",
      "mixed signal",
      "confusing",
      "复杂",
      "模式",
      "阻碍",
    ])
  ) {
    return { spreadType: "loveTree", reasonKey: "tarot.spreadRecommendation.reason.loveTree" };
  }

  if (relationshipText || focus.id === "someone") {
    return { spreadType: "relationship", reasonKey: "tarot.spreadRecommendation.reason.relationship" };
  }

  if (
    includesAny(text, [
      "job",
      "career",
      "work",
      "interview",
      "offer",
      "hire",
      "salary",
      "money",
      "finance",
      "business",
      "project",
      "school",
      "study",
      "exam",
      "move",
      "relocate",
      "city",
      "home",
      "travel",
      "health",
      "wellbeing",
      "legal",
      "contract",
      "decision",
      "choose",
      "choice",
      "should i",
      "next step",
      "what now",
      "工作",
      "事业",
      "面试",
      "钱",
      "财务",
      "学业",
      "考试",
      "搬家",
      "城市",
      "健康",
      "法律",
      "合同",
      "决定",
      "选择",
    ])
  ) {
    return { spreadType: "three", reasonKey: "tarot.spreadRecommendation.reason.three" };
  }

  if (
    includesAny(text, [
      "pattern",
      "cycle",
      "repeat",
      "stuck",
      "blocked",
      "worry",
      "anxiety",
      "fear",
      "habit",
      "shadow",
      "release",
      "let go",
      "模式",
      "循环",
      "卡住",
      "焦虑",
      "害怕",
      "放下",
    ])
  ) {
    return { spreadType: "three", reasonKey: "tarot.spreadRecommendation.reason.three" };
  }

  if (includesAny(text, ["quick", "today", "daily", "one thing", "right now", "现在", "今天"])) {
    return { spreadType: "single", reasonKey: "tarot.spreadRecommendation.reason.single" };
  }

  if (question.trim().length > 120 || context.trim().length > 220) {
    return { spreadType: "three", reasonKey: "tarot.spreadRecommendation.reason.three" };
  }

  return { spreadType: focus.spreadType, reasonKey: `tarot.spreadRecommendation.reason.${focus.spreadType}` };
}

function translateSpreadChoice(choice: SpreadChoice, t: (key: string) => string): SpreadChoice {
  const positionLabels = translatedList(t(`tarot.spread.${choice.id}.positionLabels`));

  return {
    ...choice,
    label: t(`tarot.spread.${choice.id}.label`),
    description: t(`tarot.spread.${choice.id}.description`),
    positions: t(`tarot.spread.${choice.id}.positions`),
    bestFor: t(`tarot.spread.${choice.id}.bestFor`),
    positionLabels: positionLabels.length ? positionLabels : choice.positionLabels,
  };
}

function positionGuideText(label: string): string {
  const normalized = label.toLowerCase();

  if (/(past|root|cause|break|appears|arrival)/.test(normalized)) {
    return "where the story begins or what shaped this question";
  }
  if (/(present|now|trunk|outer|image|signal)/.test(normalized)) {
    return "what is visible in the current moment";
  }
  if (/(next|future|direction|trend|result)/.test(normalized)) {
    return "where the energy may move next";
  }
  if (/(you|your)/.test(normalized)) {
    return "your side, role, or inner position";
  }
  if (/(them|their|feeling|pull)/.test(normalized)) {
    return "the other side, signal, or emotional pull";
  }
  if (/(between|connection)/.test(normalized)) {
    return "the shared thread between both sides";
  }
  if (/(block|barrier|obstacle|challenge)/.test(normalized)) {
    return "what creates friction or asks for care";
  }
  if (/(help|positive|gain|crown|fruit|advice|approach|action)/.test(normalized)) {
    return "what can support the next honest move";
  }

  return "the specific job this card has inside the spread";
}

function VoiceButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  const Icon = active ? MicOff : Mic;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-500"
      style={{
        color: active ? "rgba(64, 224, 208, 0.95)" : IVORY.body,
        borderColor: active ? "rgba(64, 224, 208, 0.45)" : "var(--hint-border)",
        background: active ? "rgba(64, 224, 208, 0.12)" : "var(--hint-card-surface-muted)",
        boxShadow: active ? "0 0 18px rgba(64, 224, 208, 0.22)" : "none",
      }}
    >
      <Icon size={16} strokeWidth={1.8} />
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em]"
      style={{ color: IVORY.mute }}
    >
      {children}
    </p>
  );
}

const DEFAULT_TAROT_QUESTION = "";
const FALLBACK_TAROT_QUESTION = "What do I need to see clearly right now?";

const QUESTION_PROMPT_GROUPS: readonly QuestionPromptGroup[] = [
  {
    label: "Love and connection",
    prompts: [
      {
        text: "What is this connection trying to show me?",
        focusId: "someone",
      },
      {
        text: "What do they feel but not say?",
        focusId: "someone",
      },
      {
        text: "Is this connection still good for me?",
        focusId: "someone",
      },
      {
        text: "What is the next honest move between us?",
        focusId: "someone",
      },
    ],
  },
  {
    label: "Work, school, and money",
    prompts: [
      {
        text: "How do I find the right job now?",
        focusId: "avoiding",
      },
      {
        text: "What should I fix before my next interview?",
        focusId: "avoiding",
      },
      {
        text: "Is this project worth my full attention?",
        focusId: "avoiding",
      },
      {
        text: "What money choice needs my attention?",
        focusId: "avoiding",
      },
    ],
  },
  {
    label: "Choices and timing",
    prompts: [
      {
        text: "Which path is healthier for me now?",
        focusId: "avoiding",
      },
      {
        text: "Should I wait, move, or choose something else?",
        focusId: "avoiding",
      },
      {
        text: "What am I not seeing about this decision?",
        focusId: "avoiding",
      },
      {
        text: "What is the next step I can actually take?",
        focusId: "avoiding",
      },
    ],
  },
  {
    label: "Patterns and healing",
    prompts: [
      {
        text: "What pattern am I repeating?",
        focusId: "unnamed",
      },
      {
        text: "What should I stop carrying alone?",
        focusId: "unnamed",
      },
      {
        text: "What is this anxiety trying to protect?",
        focusId: "unnamed",
      },
      {
        text: "What do I need to release from the past?",
        focusId: "lost",
      },
    ],
  },
  {
    label: "Family and friendship",
    prompts: [
      {
        text: "What boundary would make this relationship clearer?",
        focusId: "someone",
      },
      {
        text: "What should I understand about this friendship?",
        focusId: "someone",
      },
      {
        text: "How do I handle this family tension?",
        focusId: "someone",
      },
      {
        text: "What part of this conflict belongs to me?",
        focusId: "someone",
      },
    ],
  },
  {
    label: "Moving, home, and direction",
    prompts: [
      {
        text: "Which city or path helps me grow?",
        focusId: "avoiding",
      },
      {
        text: "What should I know before I move?",
        focusId: "avoiding",
      },
      {
        text: "What would make home feel safer now?",
        focusId: "lost",
      },
      {
        text: "Where is my energy being pulled next?",
        focusId: "unknown",
      },
    ],
  },
  {
    label: "Self, intuition, and purpose",
    prompts: [
      {
        text: "What is my intuition already noticing?",
        focusId: "unknown",
      },
      {
        text: "What part of myself wants more space?",
        focusId: "unknown",
      },
      {
        text: "What would help me trust myself again?",
        focusId: "lost",
      },
      {
        text: "What am I ready to become honest about?",
        focusId: "unnamed",
      },
    ],
  },
  {
    label: "When it feels unclear",
    prompts: [
      {
        text: "I do not know what to ask. What do I need to see?",
        focusId: "unknown",
      },
      {
        text: "What is the real question underneath this feeling?",
        focusId: "unknown",
      },
      {
        text: "What should I pay attention to first?",
        focusId: "unknown",
      },
      {
        text: "What is the simplest truth available right now?",
        focusId: "unknown",
      },
    ],
  },
] as const;

function territoryById(id: Territory["id"]): Territory | null {
  return TERRITORIES.find((item) => item.id === id) ?? null;
}

function inferTerritoryFromQuestion(value: string): Territory | null {
  const text = normalizeForRecommendation(value);
  if (!text.trim()) return null;

  if (
    includesAny(text, [
      "relationship",
      "connection",
      "partner",
      "boyfriend",
      "girlfriend",
      "husband",
      "wife",
      "dating",
      "crush",
      "love",
      "romance",
      "marriage",
      "friend",
      "friendship",
      "family",
      "mother",
      "father",
      "parent",
      "sibling",
      "coworker",
      "boss",
      "client",
      "them",
      "him",
      "her",
      "关系",
      "感情",
      "对象",
      "伴侣",
      "朋友",
      "家人",
      "同事",
      "老板",
      "他",
      "她",
    ])
  ) {
    return territoryById("someone");
  }

  if (
    includesAny(text, [
      "ended",
      "ending",
      "lost",
      "grief",
      "release",
      "past",
      "let go",
      "changed",
      "closed",
      "结束",
      "失去",
      "过去",
      "放下",
      "改变",
    ])
  ) {
    return territoryById("lost");
  }

  if (
    includesAny(text, [
      "pattern",
      "cycle",
      "repeat",
      "stuck",
      "blocked",
      "anxiety",
      "worry",
      "fear",
      "habit",
      "shadow",
      "模式",
      "循环",
      "卡住",
      "焦虑",
      "担心",
      "害怕",
    ])
  ) {
    return territoryById("unnamed");
  }

  if (
    includesAny(text, [
      "job",
      "career",
      "work",
      "interview",
      "offer",
      "money",
      "finance",
      "business",
      "project",
      "school",
      "study",
      "exam",
      "move",
      "city",
      "home",
      "legal",
      "contract",
      "decision",
      "choose",
      "choice",
      "should i",
      "next step",
      "工作",
      "事业",
      "面试",
      "钱",
      "财务",
      "学业",
      "考试",
      "搬家",
      "城市",
      "合同",
      "决定",
      "选择",
    ])
  ) {
    return territoryById("avoiding");
  }

  return territoryById("unknown");
}

export function StepTerritories({ roomSetup, onSubmit }: Props) {
  const initialFocus = TERRITORIES[TERRITORIES.length - 1]!;
  const initialQuestion = roomSetup?.question?.trim() ?? DEFAULT_TAROT_QUESTION;
  const initialContext = roomSetup?.story?.trim() ?? "";
  const initialRoomFocus = initialQuestion
    ? inferTerritoryFromQuestion(initialQuestion) ?? initialFocus
    : initialFocus;
  const { language, t } = useLanguage();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [panel, setPanel] = useState<IntakePanel>("context");
  const [focus, setFocus] = useState<Territory>(initialRoomFocus);
  const [context, setContext] = useState(initialContext);
  const [question, setQuestion] = useState(initialQuestion);
  const [spreadType, setSpreadType] = useState<SpreadType>(
    roomSetup?.spreadType === "xRelationship" ? "loveTree" : roomSetup?.spreadType ?? initialFocus.spreadType
  );
  const [spreadTouched, setSpreadTouched] = useState(false);
  const [listeningField, setListeningField] = useState<DictationField | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [showAdvancedSpreads, setShowAdvancedSpreads] = useState(false);
  const [promptSetIndex, setPromptSetIndex] = useState(0);

  const localizedSpreads = useMemo(
    () => SPREAD_CHOICES
      .filter((choice) => APP_TAROT_SPREAD_IDS.includes(choice.id))
      .map((choice) => translateSpreadChoice(choice, t)),
    [t]
  );
  const specializedSpreads = useMemo(
    () => localizedSpreads.filter((choice) => !QUICK_SPREAD_IDS.includes(choice.id)),
    [localizedSpreads]
  );
  const guidedReadingChoices = useMemo<GuidedSpreadChoice[]>(
    () =>
      GUIDED_SPREAD_CHOICE_COPY.map((choice) => ({
        id: choice.id,
        spreadType: choice.spreadType,
        title: t(choice.titleKey),
        cardCount: t(choice.cardCountKey),
        body: t(choice.bodyKey),
        badge: "badgeKey" in choice ? t(choice.badgeKey) : undefined,
      })),
    [t]
  );
  const questionForReading = question.trim() || focus.questionSeed || FALLBACK_TAROT_QUESTION;
  const recommendedSpread = useMemo(
    () => recommendSpreadType({ context, focus, question: questionForReading }),
    [context, focus, questionForReading]
  );
  const recommendedSpreadChoice = useMemo(
    () => localizedSpreads.find((choice) => choice.id === recommendedSpread.spreadType) ?? localizedSpreads[0]!,
    [localizedSpreads, recommendedSpread.spreadType]
  );
  const effectiveSpreadType = spreadTouched ? spreadType : recommendedSpread.spreadType;
  const selectedSpread = useMemo(
    () => localizedSpreads.find((choice) => choice.id === effectiveSpreadType) ?? localizedSpreads[0]!,
    [effectiveSpreadType, localizedSpreads]
  );
  const positionChipLimit =
    selectedSpread.positionLabels.length >= 7
      ? MAX_VISIBLE_LONG_POSITION_CHIPS
      : selectedSpread.positionLabels.length;
  const visiblePositionLabels = showAllPositions
    ? selectedSpread.positionLabels
    : selectedSpread.positionLabels.slice(0, positionChipLimit);
  const hiddenPositionCount =
    selectedSpread.positionLabels.length - visiblePositionLabels.length;
  const visibleQuestionGroup =
    QUESTION_PROMPT_GROUPS[promptSetIndex % QUESTION_PROMPT_GROUPS.length] ?? QUESTION_PROMPT_GROUPS[0]!;
  const visibleQuestionPrompts = visibleQuestionGroup.prompts;

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [panel]);

  useEffect(() => {
    setShowAllPositions(false);
  }, [spreadType]);

  useEffect(() => {
    if (spreadTouched) return;
    setSpreadType(recommendedSpread.spreadType);
    if (!QUICK_SPREAD_IDS.includes(recommendedSpread.spreadType)) {
      setShowAdvancedSpreads(true);
    }
  }, [recommendedSpread.spreadType, spreadTouched]);

  const updateFocus = (next: Territory) => {
    setFocus(next);
    if (!spreadTouched) setSpreadType(next.spreadType);
  };

  const applyQuestionText = (nextQuestion: string) => {
    setQuestion(nextQuestion);
    const inferredFocus = inferTerritoryFromQuestion(nextQuestion);
    if (inferredFocus && inferredFocus.id !== focus.id) {
      updateFocus(inferredFocus);
    }
  };

  const useQuestionPrompt = (prompt: QuestionPrompt) => {
    const promptFocus = territoryById(prompt.focusId) ?? initialFocus;
    setQuestion(prompt.text);
    updateFocus(promptFocus);
  };

  const addSpeech = (field: DictationField, spoken: string) => {
    if (field === "context") {
      setContext((current) => appendText(current, spoken));
      return;
    }
    setQuestion((current) => {
      const nextQuestion = appendText(current, spoken);
      const inferredFocus = inferTerritoryFromQuestion(nextQuestion);
      if (inferredFocus && inferredFocus.id !== focus.id) {
        updateFocus(inferredFocus);
      }
      return nextQuestion;
    });
  };

  const toggleDictation = (field: DictationField) => {
    if (listeningField === field) {
      recognitionRef.current?.stop();
      setListeningField(null);
      return;
    }

    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setVoiceNotice(t("tarot.voice.unavailable"));
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang =
      language === "zh"
        ? "zh-CN"
        : language === "es"
          ? "es-ES"
          : language === "ja"
            ? "ja-JP"
            : language === "ko"
              ? "ko-KR"
              : "en-US";
    recognition.onresult = (event) => {
      let finalText = "";
      const start = typeof event.resultIndex === "number" ? event.resultIndex : 0;
      for (let i = start; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) finalText += ` ${result[0]?.transcript ?? ""}`;
      }
      addSpeech(field, finalText);
    };
    recognition.onerror = (event) => {
      setListeningField(null);
      setVoiceNotice(t(voiceErrorKey(event.error)));
    };
    recognition.onend = () => setListeningField(null);
    recognitionRef.current = recognition;

    try {
      setVoiceNotice(null);
      setListeningField(field);
      recognition.start();
    } catch {
      setListeningField(null);
      setVoiceNotice(t("tarot.voice.failed"));
    }
  };

  const goNext = () => {
    const i = panelIndex(panel);
    if (i < STEP_ORDER.length - 1) {
      if (!question.trim()) setQuestion(questionForReading);
      setPanel(STEP_ORDER[i + 1]!);
    }
  };

  const goBack = () => {
    const i = panelIndex(panel);
    if (i > 0) setPanel(STEP_ORDER[i - 1]!);
  };

  const submit = () => {
    if (submitted) return;
    setSubmitted(true);
    recognitionRef.current?.abort();
    const finalSpreadType = spreadTouched ? spreadType : recommendedSpread.spreadType;
    const translatedFocus: Territory = {
      ...focus,
      label: t(`territory.${focus.id}.label`),
      questionSeed: t(`territory.${focus.id}.seed`),
    };
    window.setTimeout(
      () =>
        onSubmit({
          focus: translatedFocus,
          context,
          question: questionForReading,
          spreadType: finalSpreadType,
          roomSetup: roomSetup ?? undefined,
        }),
      SELECT_BLOOM_MS
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="flex w-full max-w-[430px] flex-col px-4"
    >
      <div
        className="hint-liquid-panel relative overflow-hidden rounded-[28px] border"
        style={{
          background: "var(--hint-liquid-panel)",
          borderColor: "var(--hint-liquid-border)",
          boxShadow: "var(--hint-liquid-shadow)",
        }}
      >
        {submitted && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1.15 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(228,198,138,0.18), transparent 70%)",
            }}
          />
        )}

        <div className="relative flex max-h-[82vh] flex-col">
          <header
            className="flex flex-col items-start gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "var(--hint-border)" }}
          >
            <div className="flex items-center gap-3">
              <Sparkles size={16} strokeWidth={1.6} style={{ color: GOLD.ink }} />
              <span
                className="font-sans text-[13px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: IVORY.mute }}
              >
                {t("tarot.room")}
              </span>
            </div>
            <StepDots panel={panel} />
          </header>

          <div
            ref={scrollRef}
            data-tarot-intake-scroll
            className="min-h-0 flex-1 overflow-y-auto px-5 py-6"
          >
            <>
              {panel === "context" && (
                <motion.div
                  key="context"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="space-y-5"
                >
                  <div className="space-y-3 text-center">
                    <p
                      className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em]"
                      style={{ color: GOLD.ink }}
                    >
                      Hint question
                    </p>
                    <h1
                      className="font-serif text-[30px] leading-tight sm:text-[36px]"
                      style={{ color: IVORY.primary, textShadow: TEXT_HALO.strong }}
                    >
                      What do you want Hint to look into?
                    </h1>
                    <p className="mx-auto max-w-[21rem] font-sans text-[13px] leading-relaxed" style={{ color: IVORY.mute }}>
                      Big, small, messy, or specific. Ask it in your own words; Hint will choose a reading shape from the question.
                    </p>
                  </div>

                  <div
                    className="relative overflow-hidden rounded-[24px] border p-3"
                    style={{
                      borderColor: question.trim()
                        ? "color-mix(in srgb, var(--hint-gold, #cba866) 44%, var(--hint-border))"
                        : "var(--hint-border)",
                      background:
                        "radial-gradient(circle at 18% 14%, color-mix(in srgb, var(--hint-rose, #f0b6cf) 16%, transparent), transparent 34%), color-mix(in srgb, var(--hint-input-bg) 92%, transparent)",
                      boxShadow: question.trim() ? "0 18px 44px rgba(228,198,138,0.10)" : "none",
                    }}
                  >
                    <textarea
                      value={question}
                      onChange={(event) => {
                        applyQuestionText(event.target.value);
                      }}
                      maxLength={1000}
                      rows={5}
                      placeholder="Ask about a person, a choice, timing, work, money, family, or the feeling you cannot shake."
                      className="hint-ritual-input min-h-[132px] w-full resize-none border-0 bg-transparent px-1 py-1 pr-14 font-sans text-[17px] leading-8 outline-none"
                      style={{
                        color: IVORY.strong,
                        textShadow: TEXT_HALO.soft,
                      }}
                    />
                    <VoiceButton
                      active={listeningField === "question"}
                      onClick={() => toggleDictation("question")}
                      label={
                        listeningField === "question"
                          ? t("tarot.voice.stop")
                          : t("tarot.voice.start")
                      }
                    />
                    {voiceNotice && (
                      <p className="mt-2 font-sans text-[12px] leading-relaxed" style={{ color: IVORY.mute }}>
                        {voiceNotice}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <FieldLabel>Try a question</FieldLabel>
                        <p className="mt-1 font-sans text-[11px] leading-none" style={{ color: IVORY.dim }}>
                          {visibleQuestionGroup.label}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPromptSetIndex((current) => current + 1)}
                        className="rounded-full border px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] transition-opacity hover:opacity-80"
                        style={{
                          color: GOLD.ink,
                          borderColor: "rgba(228,198,138,0.24)",
                          background: "rgba(228,198,138,0.08)",
                        }}
                      >
                        More
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {visibleQuestionPrompts.map((prompt) => (
                        <button
                          key={prompt.text}
                          type="button"
                          onClick={() => useQuestionPrompt(prompt)}
                          className="min-h-[48px] rounded-[16px] border px-3 py-2 text-left font-sans text-[13px] font-medium leading-snug transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                          style={{
                            color: question === prompt.text ? IVORY.primary : IVORY.body,
                            borderColor: question === prompt.text ? GOLD.edge : "var(--hint-border)",
                            background: question === prompt.text
                              ? "linear-gradient(135deg, color-mix(in srgb, var(--hint-gold, #cba866) 16%, transparent), color-mix(in srgb, var(--hint-rose, #f0b6cf) 10%, transparent))"
                              : "color-mix(in srgb, var(--hint-card-surface-muted) 88%, transparent)",
                            boxShadow: question === prompt.text ? "0 0 20px rgba(228,198,138,0.10)" : "none",
                          }}
                        >
                          {prompt.text}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <FieldLabel>What kind of question is it?</FieldLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {TERRITORIES.map((item) => (
                        <Chip
                          key={item.id}
                          selected={focus.id === item.id}
                          onClick={() => updateFocus(item)}
                        >
                          {t(`territory.${item.id}.label`)}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <FieldLabel>Add context if it matters</FieldLabel>
                    <div className="relative">
                      <textarea
                        value={context}
                        onChange={(event) => setContext(event.target.value)}
                        maxLength={1600}
                        rows={3}
                        placeholder="One or two details are enough. You can also leave this blank and tell me after the cards reveal."
                        className="hint-ritual-input w-full resize-none rounded-[22px] border bg-transparent px-4 py-3 pr-14 font-sans text-[15px] leading-7 outline-none transition-[border-color,box-shadow,background] duration-300 focus:shadow-[var(--hint-chat-input-shadow-focus)]"
                        style={{
                          color: IVORY.strong,
                          borderColor: "var(--hint-border)",
                          background: "var(--hint-input-bg)",
                          textShadow: TEXT_HALO.soft,
                        }}
                      />
                      <VoiceButton
                        active={listeningField === "context"}
                        onClick={() => toggleDictation("context")}
                        label={
                          listeningField === "context"
                            ? t("tarot.voice.stop")
                            : t("tarot.voice.start")
                        }
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {panel === "spread" && (
                <motion.div
                  key="spread"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="space-y-4"
                >
                  <TarotIntakeArtwork spread={selectedSpread} />

                  <div className="space-y-2.5">
                    <FieldLabel>{t("tarot.intake.style")}</FieldLabel>
                    <button
                      type="button"
                      onClick={() => {
                        setSpreadTouched(true);
                        setSpreadType(recommendedSpread.spreadType);
                        setShowAllPositions(false);
                        if (!QUICK_SPREAD_IDS.includes(recommendedSpread.spreadType)) {
                          setShowAdvancedSpreads(true);
                        }
                      }}
                      className="w-full rounded-[8px] border p-3 text-left transition-all duration-300 hover:opacity-90"
                      style={{
                        borderColor: effectiveSpreadType === recommendedSpread.spreadType ? GOLD.edge : "rgba(228,198,138,0.28)",
                        background:
                          "linear-gradient(135deg, rgba(228,198,138,0.12), rgba(64,224,208,0.07))",
                        boxShadow: "0 0 22px rgba(228,198,138,0.08)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="font-sans text-[9px] font-semibold uppercase tracking-[0.22em]"
                            style={{ color: GOLD.ink }}
                          >
                            {t("tarot.spreadRecommendation.badge")}
                          </p>
                          <p className="mt-1 font-sans text-[14px] font-semibold leading-tight" style={{ color: IVORY.strong }}>
                            {recommendedSpreadChoice.label}
                          </p>
                          <p className="mt-1 font-sans text-[9.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: GOLD.ink }}>
                            {recommendedSpreadChoice.cardCount} {recommendedSpreadChoice.cardCount === 1 ? t("tarot.spreadChooser.card") : t("tarot.spreadChooser.cards")}
                          </p>
                        </div>
                        {effectiveSpreadType === recommendedSpread.spreadType ? (
                          <Check className="shrink-0" size={15} style={{ color: GOLD.ink }} />
                        ) : (
                          <Sparkles className="shrink-0" size={15} style={{ color: GOLD.ink }} />
                        )}
                      </div>
                      <p className="mt-2 font-sans text-[11px] leading-relaxed" style={{ color: IVORY.dim }}>
                        {t(recommendedSpread.reasonKey)}
                      </p>
                    </button>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {guidedReadingChoices.map((choice) => {
                        const selected = effectiveSpreadType === choice.spreadType;
                        const recommended = recommendedSpread.spreadType === choice.spreadType;
                        return (
                          <button
                            type="button"
                            key={choice.id}
                            onClick={() => {
                              setSpreadTouched(true);
                              setSpreadType(choice.spreadType);
                              setShowAllPositions(false);
                              setShowAdvancedSpreads(false);
                            }}
                            className="relative min-h-[78px] rounded-[8px] border p-2.5 text-left transition-all duration-500"
                            style={{
                              borderColor: selected ? GOLD.edge : "var(--hint-border)",
                              background: selected
                                ? "rgba(228,198,138,0.12)"
                                : "var(--hint-card-surface-muted)",
                              boxShadow: selected ? "0 0 20px rgba(228,198,138,0.10)" : "none",
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p
                                  className="font-sans text-[13px] font-semibold leading-tight"
                                  style={{ color: selected ? IVORY.primary : IVORY.body }}
                                >
                                  {choice.title}
                                </p>
                                <p className="mt-1 flex flex-wrap items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD.ink }}>
                                  <span>{choice.cardCount}</span>
                                  {recommended && (
                                    <span
                                      className="rounded-full border px-1.5 py-0.5"
                                      style={{
                                        color: IVORY.primary,
                                        borderColor: "rgba(228,198,138,0.28)",
                                      }}
                                    >
                                      {t("tarot.spreadRecommendation.badge")}
                                    </span>
                                  )}
                                  {choice.badge && (
                                    <span
                                      className="rounded-full border px-1.5 py-0.5"
                                      style={{
                                        color: IVORY.dim,
                                        borderColor: "rgba(228,198,138,0.22)",
                                      }}
                                    >
                                      {choice.badge}
                                    </span>
                                  )}
                                </p>
                              </div>
                              {selected && (
                                <Check
                                  className="shrink-0"
                                  size={14}
                                  style={{ color: GOLD.ink }}
                                />
                              )}
                            </div>
                            <p className="mt-1.5 line-clamp-2 font-sans text-[10.5px] leading-snug" style={{ color: IVORY.dim }}>
                              {choice.body}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-1.5">
                      <button
                        type="button"
                        aria-expanded={showAdvancedSpreads}
                        onClick={() => setShowAdvancedSpreads((current) => !current)}
                        className="flex w-full items-center justify-between gap-3 rounded-[8px] border p-2.5 text-left transition-all duration-500"
                        style={{
                          color: IVORY.body,
                          borderColor: "var(--hint-border)",
                          background: "var(--hint-card-surface-muted)",
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block font-sans text-[13px] font-semibold leading-tight" style={{ color: IVORY.strong }}>
                            {t("tarot.advancedSpreads.title")}
                          </span>
                          <span className="mt-1 block font-sans text-[11px] leading-snug" style={{ color: IVORY.dim }}>
                            {t("tarot.advancedSpreads.subtitle")}
                          </span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD.ink }}>
                          {showAdvancedSpreads ? t("tarot.advancedSpreads.close") : t("tarot.advancedSpreads.open")}
                          <ChevronRight
                            size={13}
                            className={showAdvancedSpreads ? "rotate-90 transition-transform" : "transition-transform"}
                          />
                        </span>
                      </button>

                      {showAdvancedSpreads && (
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {specializedSpreads.map((choice) => {
                            const selected = effectiveSpreadType === choice.id;
                            const recommended = recommendedSpread.spreadType === choice.id;
                            return (
                              <button
                                type="button"
                                key={choice.id}
                                onClick={() => {
                                  setSpreadTouched(true);
                                  setSpreadType(choice.id);
                                  setShowAllPositions(false);
                                }}
                                className="relative min-h-[54px] rounded-[8px] border p-2 text-left transition-all duration-500"
                                style={{
                                  borderColor: selected ? GOLD.edge : "var(--hint-border)",
                                  background: selected
                                    ? "rgba(228,198,138,0.12)"
                                    : "var(--hint-card-surface-muted)",
                                }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className="pr-2 font-sans text-[12.5px] font-semibold leading-tight"
                                    style={{ color: selected ? IVORY.primary : IVORY.body }}
                                  >
                                    {choice.label}
                                  </p>
                                  <span className="flex shrink-0 items-center gap-1">
                                    {recommended && (
                                      <span
                                        className="rounded-full border px-1.5 py-0.5 font-sans text-[8px] font-semibold uppercase tracking-[0.1em]"
                                        style={{
                                          color: IVORY.primary,
                                          borderColor: "rgba(228,198,138,0.26)",
                                        }}
                                      >
                                        {t("tarot.spreadRecommendation.badge")}
                                      </span>
                                    )}
                                    {selected && <Check size={13} style={{ color: GOLD.ink }} />}
                                  </span>
                                </div>
                                <p className="mt-0.5 font-sans text-[9.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD.ink }}>
                                  {choice.cardCount} {choice.cardCount === 1 ? t("tarot.spreadChooser.card") : t("tarot.spreadChooser.cards")}
                                </p>
                                <p className="mt-0.5 line-clamp-1 font-sans text-[10px] leading-snug" style={{ color: IVORY.dim }}>
                                  {choice.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div
                      className="grid gap-1.5 rounded-[8px] border p-2 sm:grid-cols-[78px_1fr]"
                      style={{
                        borderColor: "var(--hint-border)",
                        background: "var(--hint-card-surface-muted)",
                      }}
                    >
                      <MiniSpreadDiagram spread={selectedSpread} />
                      <div className="min-w-0 self-center">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-sans text-[15px] font-semibold leading-tight" style={{ color: IVORY.strong }}>
                              {selectedSpread.label}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border px-2 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD.ink, borderColor: "rgba(228,198,138,0.24)" }}>
                            {selectedSpread.cardCount} {selectedSpread.cardCount === 1 ? t("tarot.spreadChooser.card") : t("tarot.spreadChooser.cards")}
                          </span>
                        </div>
                      </div>

                      <p className="line-clamp-2 font-sans text-[10px] leading-relaxed sm:col-span-2" style={{ color: IVORY.dim }}>
                        <span className="font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD.ink }}>
                          {t("tarot.spreadExplanation.bestFor")}:
                        </span>{" "}
                        {selectedSpread.bestFor}
                      </p>

                      <div className="sm:col-span-2">
                        <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: GOLD.ink }}>
                          {t("tarot.spreadExplanation.positions")}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {visiblePositionLabels.map((label, index) => (
                            <span
                              key={`${selectedSpread.id}-${index}-${label}`}
                              className="inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 font-sans text-[10px] leading-none"
                              style={{
                                color: IVORY.body,
                                borderColor: "rgba(228,198,138,0.20)",
                                background: "rgba(255,255,255,0.035)",
                              }}
                            >
                              <span className="font-semibold" style={{ color: GOLD.ink }}>
                                {index + 1}
                              </span>
                              <span className="truncate">{label}</span>
                            </span>
                          ))}
                          {hiddenPositionCount > 0 && (
                            <button
                              type="button"
                              aria-label={`${t("tarot.spreadExplanation.showAll")} ${hiddenPositionCount} ${t("tarot.spreadExplanation.morePositions")}`}
                              onClick={() => setShowAllPositions(true)}
                              className="rounded-full border px-2 py-1 font-sans text-[10px] leading-none transition-opacity hover:opacity-80"
                              style={{
                                color: GOLD.ink,
                                borderColor: "rgba(228,198,138,0.24)",
                                background: "rgba(228,198,138,0.08)",
                              }}
                            >
                              +{hiddenPositionCount} {t("tarot.spreadExplanation.morePositions")}
                            </button>
                          )}
                          {showAllPositions && selectedSpread.positionLabels.length > positionChipLimit && (
                            <button
                              type="button"
                              onClick={() => setShowAllPositions(false)}
                              className="rounded-full border px-2 py-1 font-sans text-[10px] leading-none transition-opacity hover:opacity-80"
                              style={{
                                color: IVORY.dim,
                                borderColor: "rgba(255,255,255,0.12)",
                                background: "rgba(255,255,255,0.03)",
                              }}
                            >
                              {t("tarot.spreadExplanation.showLess")}
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="line-clamp-2 font-sans text-[10px] leading-relaxed sm:col-span-2" style={{ color: IVORY.dim }}>
                        <span className="font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD.ink }}>
                          {t("tarot.spreadExplanation.howItWorks")}:
                        </span>{" "}
                        {selectedSpread.positions}
                      </p>

                      <div className="space-y-1.5 sm:col-span-2">
                        <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: GOLD.ink }}>
                          {t("tarot.spreadExplanation.positionGuide")}
                        </p>
                        <div className="grid gap-1.5">
                          {visiblePositionLabels.map((label, index) => (
                            <div
                              key={`${selectedSpread.id}-guide-${index}-${label}`}
                              className="grid grid-cols-[1.75rem_1fr] gap-2 rounded-[14px] border px-2 py-1.5"
                              style={{
                                borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 16%, var(--hint-border))",
                                background: "color-mix(in srgb, var(--hint-card-surface-muted) 78%, transparent)",
                              }}
                            >
                              <span className="font-sans text-[10px] font-semibold" style={{ color: GOLD.ink }}>
                                {index + 1}
                              </span>
                              <span className="font-sans text-[10.5px] leading-snug" style={{ color: IVORY.dim }}>
                                <span style={{ color: IVORY.body }}>{label}</span>
                                {" - "}
                                {positionGuideText(label)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div
                      className="rounded-[18px] border p-2"
                      style={{
                        borderColor: "var(--hint-border)",
                        background: "var(--hint-card-surface-muted)",
                      }}
                    >
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div>
                          <p className="font-sans text-[9px] uppercase tracking-[0.20em]" style={{ color: IVORY.dim }}>
                            {t("tarot.intake.summaryFocus")}
                          </p>
                          <p className="mt-0.5 line-clamp-1 font-sans text-[12px] font-medium leading-relaxed" style={{ color: IVORY.body }}>
                            {t(`territory.${focus.id}.label`)}
                          </p>
                        </div>
                        <div>
                          <p className="font-sans text-[9px] uppercase tracking-[0.20em]" style={{ color: IVORY.dim }}>
                            {t("tarot.intake.summaryQuestion")}
                          </p>
                          <p className="mt-0.5 line-clamp-2 font-sans text-[12px] leading-relaxed" style={{ color: IVORY.strong }}>
                            {truncate(questionForReading, 110)}
                          </p>
                        </div>
                        {roomSetup && (
                          <div>
                            <p className="font-sans text-[9px] uppercase tracking-[0.20em]" style={{ color: IVORY.dim }}>
                              {t("tarot.intake.summaryRoom")}
                            </p>
                            <p className="mt-0.5 line-clamp-1 font-sans text-[12px] leading-relaxed" style={{ color: IVORY.mute }}>
                              {t(`tarot.cardFace.${roomSetup.cardFaceId}.label`)} · {t(`tarot.deck.${roomSetup.deckStyleId}.color`)}
                            </p>
                          </div>
                        )}
                      </div>
                      {context.trim() && (
                        <div className="mt-2">
                          <p className="font-sans text-[9px] uppercase tracking-[0.20em]" style={{ color: IVORY.dim }}>
                            {t("tarot.intake.summaryContext")}
                          </p>
                          <p className="mt-0.5 line-clamp-1 font-sans text-[11px] leading-relaxed" style={{ color: IVORY.mute }}>
                            {truncate(context.trim(), 150)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          </div>

          <footer
            className="flex items-center justify-between gap-3 border-t px-5 py-4"
            style={{
              borderColor: "var(--hint-border)",
              background: "color-mix(in srgb, var(--hint-surface) 74%, transparent)",
              backdropFilter: "blur(24px) saturate(1.24)",
              WebkitBackdropFilter: "blur(24px) saturate(1.24)",
            }}
          >
            <GhostButton onClick={goBack} disabled={panel === "context" || submitted}>
              <ArrowLeft size={14} />
              {t("common.back")}
            </GhostButton>

            {panel === "spread" ? (
              <PrimaryButton onClick={submit} disabled={submitted}>
                {submitted ? t("tarot.intake.starting") : "Set the room"}
                <Sparkles size={14} />
              </PrimaryButton>
            ) : (
              <PrimaryButton
                onClick={goNext}
                disabled={submitted}
              >
                Choose spread
                <ChevronRight size={14} />
              </PrimaryButton>
            )}
          </footer>
        </div>
      </div>
    </motion.div>
  );
}
