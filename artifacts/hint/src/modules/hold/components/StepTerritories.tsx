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

interface Props {
  roomSetup?: TarotRoomSetup | null;
  onSubmit: (intake: TarotIntake) => void;
}

type IntakePanel = "context" | "question" | "spread";
type DictationField = "context" | "question";

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
const STEP_ORDER: IntakePanel[] = ["context", "question", "spread"];
const QUICK_SPREAD_IDS: readonly SpreadType[] = ["single", "three", "relationship"];
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
    spreadType: "xRelationship",
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
    <div className="flex items-center gap-2" aria-hidden>
      {STEP_ORDER.map((step, i) => (
        <span
          key={step}
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: i === active ? 22 : 6,
            background:
              i <= active ? "rgba(228, 198, 138, 0.78)" : "var(--hint-border)",
            boxShadow: i === active ? "0 0 12px rgba(228, 198, 138, 0.28)" : "none",
          }}
        />
      ))}
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
        background: "var(--hint-card-surface-muted)",
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
      className="inline-flex h-11 items-center gap-2 rounded-[8px] border px-4 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] transition-all duration-500 disabled:opacity-35"
      style={{
        color: IVORY.primary,
        borderColor: GOLD.edge,
        background:
          "linear-gradient(135deg, rgba(228,198,138,0.16), rgba(100,156,158,0.10))",
        boxShadow: "0 0 24px rgba(228,198,138,0.10)",
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
      className="flex min-h-[50px] items-center rounded-[8px] border px-3 py-2 text-left font-sans text-[13px] font-medium leading-snug transition-all duration-500"
      style={{
        color: selected ? IVORY.primary : IVORY.body,
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected ? "rgba(228,198,138,0.13)" : "var(--hint-card-surface-muted)",
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
      className="relative h-[70px] w-[84px] shrink-0 overflow-hidden rounded-[8px]"
      style={{
        background: "linear-gradient(180deg, rgba(8,12,22,0.95), rgba(18,23,38,0.95))",
        boxShadow: "inset 0 0 0 1px rgba(228,198,138,0.18)",
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
            color: "#f2d48d",
            borderColor: "rgba(228,198,138,0.5)",
            background: "rgba(5,9,16,0.96)",
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
  return terms.some((term) => value.includes(term));
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

  if (
    includesAny(text, [
      "ex",
      "break up",
      "breakup",
      "broke up",
      "broken",
      "come back",
      "reconcile",
      "reconciliation",
      "again",
      "复合",
      "前任",
    ])
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
      "未来",
    ])
  ) {
    return { spreadType: "futureLover", reasonKey: "tarot.spreadRecommendation.reason.futureLover" };
  }

  if (
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
    includesAny(text, [
      "feel",
      "feeling",
      "feelings",
      "think of me",
      "true heart",
      "honest",
      "inside",
      "really",
      "真心",
      "感觉",
      "想法",
    ])
  ) {
    return { spreadType: "trueHeart", reasonKey: "tarot.spreadRecommendation.reason.trueHeart" };
  }

  if (
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
    return { spreadType: "xRelationship", reasonKey: "tarot.spreadRecommendation.reason.xRelationship" };
  }

  if (focus.id === "someone" || includesAny(text, ["relationship", "connection", "between us", "we", "them", "him", "her", "关系"])) {
    return { spreadType: "relationship", reasonKey: "tarot.spreadRecommendation.reason.relationship" };
  }

  if (focus.id === "avoiding" || includesAny(text, ["decision", "choose", "choice", "should i", "next step", "what now", "决定", "选择"])) {
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

export function StepTerritories({ roomSetup, onSubmit }: Props) {
  const initialFocus = TERRITORIES[TERRITORIES.length - 1]!;
  const { language, t } = useLanguage();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [panel, setPanel] = useState<IntakePanel>("context");
  const [focus, setFocus] = useState<Territory>(initialFocus);
  const [context, setContext] = useState("");
  const [question, setQuestion] = useState(() => t(`territory.${initialFocus.id}.seed`));
  const [spreadType, setSpreadType] = useState<SpreadType>(
    roomSetup?.spreadType ?? initialFocus.spreadType
  );
  const [questionTouched, setQuestionTouched] = useState(false);
  const [spreadTouched, setSpreadTouched] = useState(false);
  const [listeningField, setListeningField] = useState<DictationField | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [showAdvancedSpreads, setShowAdvancedSpreads] = useState(false);

  const suggestions = [1, 2, 3].map((i) => t(`question.${focus.id}.${i}`));
  const localizedSpreads = useMemo(
    () => SPREAD_CHOICES.map((choice) => translateSpreadChoice(choice, t)),
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
  const recommendedSpread = useMemo(
    () => recommendSpreadType({ context, focus, question }),
    [context, focus, question]
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

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [panel]);

  useEffect(() => {
    if (!questionTouched) setQuestion(t(`territory.${focus.id}.seed`));
  }, [focus.id, questionTouched, t]);

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
    if (!questionTouched) setQuestion(t(`territory.${next.id}.seed`));
    if (!spreadTouched) setSpreadType(next.spreadType);
  };

  const addSpeech = (field: DictationField, spoken: string) => {
    if (field === "context") {
      setContext((current) => appendText(current, spoken));
      return;
    }
    setQuestionTouched(true);
    setQuestion((current) => appendText(current, spoken));
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
    if (i < STEP_ORDER.length - 1) setPanel(STEP_ORDER[i + 1]!);
  };

  const goBack = () => {
    const i = panelIndex(panel);
    if (i > 0) setPanel(STEP_ORDER[i - 1]!);
  };

  const submit = () => {
    if (submitted || !question.trim()) return;
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
          question,
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
      className="flex w-full max-w-[460px] flex-col px-4 lg:max-w-[540px]"
    >
      <div
        className="relative overflow-hidden rounded-[8px] border"
        style={{
          background: "var(--hint-card-surface)",
          borderColor: "var(--hint-border)",
          boxShadow: "var(--hint-elevated-shadow)",
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
            className="flex items-center justify-between border-b px-5 py-4"
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
            className="min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:py-4"
          >
            <>
              {panel === "context" && (
                <motion.div
                  key="context"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <FieldLabel>{t("tarot.intake.story")}</FieldLabel>
                    <div className="relative">
                      <textarea
                        value={context}
                        onChange={(event) => setContext(event.target.value)}
                        maxLength={1600}
                        rows={5}
                        placeholder={t("tarot.intake.storyPlaceholder")}
                        className="hint-ritual-input w-full resize-none rounded-[8px] border bg-transparent px-4 py-3 pr-14 font-sans text-[15px] leading-7 outline-none"
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
                    {voiceNotice && (
                      <p className="font-sans text-[12px] leading-relaxed" style={{ color: IVORY.mute }}>
                        {voiceNotice}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <FieldLabel>{t("tarot.intake.focus")}</FieldLabel>
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
                </motion.div>
              )}

              {panel === "question" && (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <FieldLabel>{t("tarot.intake.question")}</FieldLabel>
                    <div className="relative">
                      <textarea
                        value={question}
                        onChange={(event) => {
                          setQuestionTouched(true);
                          setQuestion(event.target.value);
                        }}
                        maxLength={1000}
                        rows={5}
                        placeholder={t("tarot.intake.questionPlaceholder")}
                        className="hint-ritual-input w-full resize-none rounded-[8px] border bg-transparent px-4 py-3 pr-14 font-sans text-[16px] leading-7 outline-none"
                        style={{
                          color: IVORY.strong,
                          borderColor: question.trim()
                            ? "rgba(228,198,138,0.34)"
                            : "var(--hint-border)",
                          background: "var(--hint-input-bg)",
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
                    </div>
                    {voiceNotice && (
                      <p className="font-sans text-[12px] leading-relaxed" style={{ color: IVORY.mute }}>
                        {voiceNotice}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <FieldLabel>{t("tarot.intake.suggestions")}</FieldLabel>
                    <div className="flex flex-col gap-2">
                      {suggestions.map((item) => (
                        <Chip
                          key={item}
                          selected={question.trim() === item}
                          onClick={() => {
                            setQuestionTouched(true);
                            setQuestion(item);
                          }}
                        >
                          {item}
                        </Chip>
                      ))}
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
                              className="grid grid-cols-[1.75rem_1fr] gap-2 rounded-[8px] border px-2 py-1.5"
                              style={{
                                borderColor: "rgba(228,198,138,0.14)",
                                background: "rgba(255,255,255,0.025)",
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
                      className="rounded-[8px] border p-2"
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
                            {truncate(question.trim(), 110)}
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
            style={{ borderColor: "var(--hint-border)" }}
          >
            <GhostButton onClick={goBack} disabled={panel === "context" || submitted}>
              <ArrowLeft size={14} />
              {t("common.back")}
            </GhostButton>

            {panel === "spread" ? (
              <PrimaryButton onClick={submit} disabled={!question.trim() || submitted}>
                {submitted ? t("tarot.intake.starting") : t("tarot.intake.startReading")}
                <Sparkles size={14} />
              </PrimaryButton>
            ) : (
              <PrimaryButton
                onClick={goNext}
                disabled={(panel === "question" && !question.trim()) || submitted}
              >
                {t("common.next")}
                <ChevronRight size={14} />
              </PrimaryButton>
            )}
          </footer>
        </div>
      </div>
    </motion.div>
  );
}
