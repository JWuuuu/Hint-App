import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, Image, Layers, Palette, Shuffle, Sparkles } from "lucide-react";
import { Link } from "wouter";
import {
  BACKGROUND_STYLES,
  CARD_FACE_STYLES,
  DECK_STYLES,
  DEFAULT_TAROT_ROOM_SETUP,
  ROOM_PRESETS,
  SPREAD_CHOICES,
  type CardFaceId,
  type DeckStyleId,
  type RoomBackgroundId,
  type RoomPreset,
  type SpreadChoice,
  type TarotRoomSetup,
} from "../useHoldFlow";
import type { SpreadType } from "../chat/types";
import { getTarotCardImage } from "../../tarot/logic/cardImageMap";
import { GOLD, IVORY, TEXT_HALO } from "../atmosphere";
import { useLanguage } from "../../../lib/i18n";

interface Props {
  onStart: (setup: TarotRoomSetup) => void;
  initialSetup?: TarotRoomSetup;
}

const NEXT_STEP_KEYS = ["story", "question", "spread", "wash", "choose"] as const;
const ADVANCED_SPREAD_IDS: readonly SpreadType[] = [
  "futureLover",
  "peachBlossom",
  "reconciliation",
  "trueHeart",
  "loveTree",
  "xRelationship",
];
const POSITION_PREVIEW_LIMIT = 4;
const READING_SHAPE_CHOICES = [
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
  id: string;
  spreadType: SpreadType;
  titleKey: string;
  cardCountKey: string;
  bodyKey: string;
  badgeKey?: string;
}>;

function deckColorLabel(id: DeckStyleId): string {
  switch (id) {
    case "ivory":
      return "Ivory with warm gold";
    case "rose":
      return "Rose quartz with violet foil";
    default:
      return "Deep navy with gold linework";
  }
}

function SetupSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span style={{ color: GOLD.ink }}>{icon}</span>
        <p
          className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: IVORY.mute }}
        >
          {title}
        </p>
      </div>
      {children}
    </section>
  );
}

function PresetButton({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[66px] rounded-[8px] border p-2 text-left transition-all duration-500"
      style={{
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected ? "rgba(228,198,138,0.13)" : "var(--hint-card-surface-muted)",
        boxShadow: selected ? "0 0 24px rgba(228,198,138,0.12)" : "none",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="font-serif text-[14px] leading-tight sm:text-[17px]"
            style={{ color: selected ? IVORY.primary : IVORY.strong, textShadow: TEXT_HALO.soft }}
          >
            {label}
          </p>
          <p className="mt-1 line-clamp-1 font-sans text-[10px] leading-snug sm:text-[11px]" style={{ color: IVORY.mute }}>
            {description}
          </p>
        </div>
        {selected && <Check size={16} style={{ color: GOLD.ink }} />}
      </div>
    </button>
  );
}

function ChoiceButton({
  label,
  description,
  preview,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  preview: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[56px] items-center gap-2 rounded-[8px] border p-2 text-left transition-all duration-500 hover:brightness-105 active:scale-[0.99]"
      style={{
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected ? "rgba(228,198,138,0.11)" : "var(--hint-card-surface-muted)",
        boxShadow: selected ? "0 0 18px rgba(228,198,138,0.12)" : "none",
      }}
    >
      <span
        className="h-7 w-7 shrink-0 rounded-[8px] border"
        style={{
          background: preview,
          borderColor: selected ? "rgba(228,198,138,0.5)" : "var(--hint-border)",
          boxShadow: selected ? "0 0 18px rgba(228,198,138,0.15)" : "none",
        }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-sans text-[11.5px] font-semibold" style={{ color: IVORY.strong }}>
          {label}
        </span>
        <span className="hidden font-sans text-[10px] leading-snug" style={{ color: IVORY.dim }}>
          {description}
        </span>
      </span>
      {selected && <Check className="shrink-0" size={13} style={{ color: GOLD.ink }} />}
    </button>
  );
}

function CardFaceButton({
  label,
  description,
  cardArtId,
  previewCards,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  cardArtId: CardFaceId;
  previewCards: readonly string[];
  selected: boolean;
  onClick: () => void;
}) {
  const images = previewCards
    .map((cardId) => getTarotCardImage(cardId, cardArtId))
    .filter((image): image is string => Boolean(image));

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid min-h-[92px] grid-cols-[76px_1fr] gap-3 rounded-[8px] border p-2.5 text-left transition-all duration-500 hover:brightness-105 active:scale-[0.99]"
      style={{
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected
          ? "linear-gradient(135deg, rgba(228,198,138,0.14), rgba(255,255,255,0.05))"
          : "var(--hint-card-surface-muted)",
        boxShadow: selected ? "0 0 22px rgba(228,198,138,0.14)" : "none",
      }}
    >
      <span className="relative h-[70px]">
        {images.map((image, index) => (
          <span
            key={image}
            className="absolute top-0 block h-[70px] w-[45px] overflow-hidden rounded-[6px] border bg-black/30 shadow-[0_9px_18px_rgba(0,0,0,0.24)]"
            style={{
              left: `${index * 14}px`,
              transform: `rotate(${index === 0 ? -8 : index === 1 ? 0 : 8}deg)`,
              borderColor: selected ? "rgba(228,198,138,0.58)" : "rgba(255,255,255,0.20)",
              zIndex: index + 1,
            }}
          >
            <img src={image} alt="" aria-hidden="true" className="h-full w-full object-cover" draggable={false} />
          </span>
        ))}
      </span>
      <span className="min-w-0">
        <span className="flex items-start justify-between gap-2">
          <span className="block font-sans text-[12.5px] font-semibold leading-tight" style={{ color: selected ? "#fff7df" : IVORY.strong }}>
            {label}
          </span>
          {selected && <Check className="shrink-0" size={14} style={{ color: GOLD.ink }} />}
        </span>
        <span className="mt-1.5 block font-sans text-[10px] leading-snug" style={{ color: IVORY.dim }}>
          {description}
        </span>
      </span>
    </button>
  );
}

function RoomLivePreview({
  presetLabel,
  presetMood,
  deckLabel,
  deckPreview,
  backgroundLabel,
  backgroundPreview,
}: {
  presetLabel: string;
  presetMood: string;
  deckLabel: string;
  deckPreview: string;
  backgroundLabel: string;
  backgroundPreview: string;
}) {
  return (
    <aside
      className="relative min-h-[118px] overflow-hidden rounded-[8px] border p-3 transition-all duration-500"
      style={{
        borderColor: "rgba(180,160,120,0.22)",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.52), rgba(248,244,235,0.72))",
        boxShadow: "0 14px 34px rgba(80,70,50,0.07)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-70 transition-all duration-700"
        style={{ background: backgroundPreview }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.76), rgba(255,255,255,0.20))",
          backdropFilter: "blur(10px)",
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-4 right-4 h-10 w-24 rounded-full blur-xl"
        style={{ background: "rgba(228,198,138,0.34)" }}
      />
      <div className="relative z-10 grid grid-cols-[1fr_44px] gap-3">
        <div className="min-w-0">
          <p className="font-serif text-[18px] leading-tight" style={{ color: "#2f2a24" }}>
            {presetLabel}
          </p>
          <p className="mt-1 font-sans text-[11px] leading-snug" style={{ color: "#706a72" }}>
            {deckLabel} deck · {backgroundLabel} room
          </p>
          <p className="mt-3 line-clamp-2 font-sans text-[10.5px] leading-relaxed" style={{ color: "#81766a" }}>
            {presetMood}
          </p>
        </div>
        <div className="relative h-16">
          <span
            className="absolute bottom-1 right-1 h-12 w-8 rotate-6 rounded-[7px] border transition-all duration-700"
            style={{
              background: deckPreview,
              borderColor: "rgba(174,132,56,0.42)",
              boxShadow: "0 12px 22px rgba(80,70,50,0.18)",
            }}
          />
          <span
            className="absolute bottom-0 right-3 h-11 w-8 -rotate-6 rounded-[7px] border transition-all duration-700"
            style={{
              background: deckPreview,
              borderColor: "rgba(255,255,255,0.68)",
              boxShadow: "0 10px 20px rgba(80,70,50,0.16)",
            }}
          />
        </div>
      </div>
    </aside>
  );
}

function ReadingShapeButton({
  title,
  cardCount,
  body,
  badge,
  selected,
  onClick,
}: {
  title: string;
  cardCount: string;
  body: string;
  badge?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[78px] rounded-[8px] border p-2.5 text-left transition-all duration-500 hover:brightness-105 active:scale-[0.99]"
      style={{
        borderColor: selected ? "rgba(241, 205, 132, 0.78)" : "var(--hint-border)",
        background: selected
          ? "linear-gradient(135deg, rgba(241,205,132,0.18), rgba(255,255,255,0.05))"
          : "var(--hint-card-surface-muted)",
        boxShadow: selected ? "0 0 26px rgba(228,198,138,0.16)" : "none",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-sans text-[12.5px] font-semibold leading-tight sm:text-[13.5px]" style={{ color: selected ? "#fff7df" : IVORY.strong }}>
            {title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD.ink }}>
            <span>{cardCount}</span>
            {badge && (
              <>
                <span style={{ color: IVORY.dim }}>·</span>
                <span>{badge}</span>
              </>
            )}
          </p>
        </div>
        {selected && <Check size={15} style={{ color: GOLD.ink }} />}
      </div>
      <p className="mt-1 line-clamp-2 font-sans text-[10px] leading-snug" style={{ color: IVORY.dim }}>
        {body}
      </p>
    </button>
  );
}

function SpreadDiagram({
  layout,
  compact,
}: {
  layout: SpreadChoice["layout"];
  compact?: boolean;
}) {
  const points = layout.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div
      className={`${compact ? "h-[78px]" : "h-[132px]"} relative overflow-hidden rounded-[8px]`}
      style={{
        background:
          "linear-gradient(180deg, rgba(8, 12, 22, 0.96), rgba(16, 22, 36, 0.96))",
        boxShadow:
          "inset 0 0 0 1px rgba(228,198,138,0.22), inset 0 0 32px rgba(228,198,138,0.08)",
      }}
    >
      <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
        <circle cx="50" cy="45" r="44" fill="rgba(228,198,138,0.08)" />
        {layout.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="rgba(228,198,138,0.32)"
            strokeWidth="0.8"
            strokeDasharray="3 3"
          />
        )}
      </svg>
      {layout.map((point) => (
        <span
          key={`${point.n}-${point.x}-${point.y}`}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[5px] border"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: compact ? 18 : 22,
            height: compact ? 27 : 32,
            color: "#f2d48d",
            borderColor: "rgba(228,198,138,0.55)",
            background:
              "linear-gradient(160deg, rgba(5,9,16,0.96), rgba(14,20,33,0.96))",
            boxShadow: "0 8px 18px rgba(0,0,0,0.28)",
          }}
        >
          <span className="font-sans text-[11px] font-semibold">{point.n}</span>
        </span>
      ))}
    </div>
  );
}

function CompactSpreadPreview({
  spread,
  cardLabel,
  cardsLabel,
  showAllPositions,
  onShowAllPositions,
  onShowLessPositions,
  t,
}: {
  spread: SpreadChoice;
  cardLabel: string;
  cardsLabel: string;
  showAllPositions: boolean;
  onShowAllPositions: () => void;
  onShowLessPositions: () => void;
  t: (key: string) => string;
}) {
  const positionLimit = spread.positionLabels.length > POSITION_PREVIEW_LIMIT ? POSITION_PREVIEW_LIMIT : spread.positionLabels.length;
  const visiblePositions = showAllPositions
    ? spread.positionLabels
    : spread.positionLabels.slice(0, positionLimit);
  const hiddenPositionCount = spread.positionLabels.length - visiblePositions.length;
  const emotionalLine = t(`tarot.spreadEmotion.${spread.id}`);
  const selectedShapeTitle =
    spread.id === "single"
      ? t("tarot.readingShape.quick.title")
      : spread.id === "three"
        ? t("tarot.readingShape.simple.title")
        : spread.id === "relationship"
          ? t("tarot.readingShape.between.title")
          : spread.id === "xRelationship"
            ? t("tarot.readingShape.deep.title")
            : spread.label;
  const selectedShapeCount =
    spread.id === "xRelationship"
      ? t("tarot.readingShape.deep.cards")
      : `${spread.cardCount} ${spread.cardCount === 1 ? cardLabel : cardsLabel}`;

  return (
    <div
      className="rounded-[8px] border p-3"
      style={{
        borderColor: "rgba(241, 205, 132, 0.42)",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(228,198,138,0.08))",
        boxShadow: "0 0 26px rgba(228,198,138,0.10)",
      }}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#9d8452" }}>
              {t("tarot.spreadExplanation.selectedShape")}
            </p>
            <p className="mt-1 font-sans text-[15px] font-semibold leading-tight" style={{ color: "#2f2a35" }}>
              {selectedShapeTitle} · {selectedShapeCount}
            </p>
          </div>
          <Check className="shrink-0" size={15} style={{ color: GOLD.ink }} />
        </div>

        {emotionalLine !== `tarot.spreadEmotion.${spread.id}` && (
          <p className="font-serif text-[13px] italic leading-snug" style={{ color: "#6f604c" }}>
            {emotionalLine}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#9d8452" }}>
            {spread.cardCount === 1 ? t("tarot.spreadExplanation.position") : t("tarot.spreadExplanation.positions")}:
          </span>
          {visiblePositions.map((label, index) => (
            <span
              key={`${spread.id}-${index}-${label}`}
              className="inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 font-sans text-[10px] leading-none"
              style={{
                color: "#5c5661",
                borderColor: "rgba(174,132,56,0.20)",
                background: "rgba(255,255,255,0.34)",
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
              onClick={onShowAllPositions}
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
          {showAllPositions && spread.positionLabels.length > POSITION_PREVIEW_LIMIT && (
            <button
              type="button"
              onClick={onShowLessPositions}
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
    </div>
  );
}

function CollapsedSection({
  icon,
  title,
  subtitle,
  openLabel,
  closeLabel,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  openLabel: string;
  closeLabel: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-[8px] border p-2.5 text-left transition-all duration-500"
        style={{
          color: IVORY.body,
          borderColor: "var(--hint-border)",
          background: "var(--hint-card-surface-muted)",
        }}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="shrink-0" style={{ color: GOLD.ink }}>
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block font-sans text-[13px] font-semibold leading-tight" style={{ color: IVORY.strong }}>
              {title}
            </span>
            <span className="mt-1 block font-sans text-[11px] leading-snug" style={{ color: IVORY.dim }}>
              {subtitle}
            </span>
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD.ink }}>
          {open ? closeLabel : openLabel}
          <ChevronRight
            size={13}
            className={open ? "rotate-90 transition-transform" : "transition-transform"}
          />
        </span>
      </button>
      {open && children}
    </section>
  );
}

function translatedList(value: string): string[] {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function translateSpread(spread: SpreadChoice, t: (key: string) => string): SpreadChoice {
  const positionLabels = translatedList(t(`tarot.spread.${spread.id}.positionLabels`));

  return {
    ...spread,
    label: t(`tarot.spread.${spread.id}.label`),
    description: t(`tarot.spread.${spread.id}.description`),
    positions: t(`tarot.spread.${spread.id}.positions`),
    bestFor: t(`tarot.spread.${spread.id}.bestFor`),
    positionLabels: positionLabels.length ? positionLabels : spread.positionLabels,
  };
}

export function RoomSetup({ onStart, initialSetup = DEFAULT_TAROT_ROOM_SETUP }: Props) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [setup, setSetup] = useState<TarotRoomSetup>(initialSetup);
  const [showAdvancedSpreads, setShowAdvancedSpreads] = useState(false);
  const [showAllPositions, setShowAllPositions] = useState(false);

  const readingShapeChoices = useMemo(
    () =>
      READING_SHAPE_CHOICES.map((choice) => ({
        id: choice.id,
        spreadType: choice.spreadType,
        title: t(choice.titleKey),
        cardCount: t(choice.cardCountKey),
        body: t(choice.bodyKey),
        badge: "badgeKey" in choice ? t(choice.badgeKey) : undefined,
      })),
    [t],
  );
  const specializedSpreads = useMemo(
    () => SPREAD_CHOICES.filter((spread) => ADVANCED_SPREAD_IDS.includes(spread.id)).map((spread) => translateSpread(spread, t)),
    [t],
  );

  const selectedSpread = useMemo(
    () => translateSpread(SPREAD_CHOICES.find((item) => item.id === setup.spreadType) ?? SPREAD_CHOICES[0]!, t),
    [setup.spreadType, t],
  );
  const selectedPreset = useMemo(
    () => ROOM_PRESETS.find((item) => item.id === setup.presetId) ?? ROOM_PRESETS[0]!,
    [setup.presetId],
  );
  const selectedDeck = useMemo(
    () => DECK_STYLES.find((item) => item.id === setup.deckStyleId) ?? DECK_STYLES[0]!,
    [setup.deckStyleId],
  );
  const selectedCardFace = useMemo(
    () => CARD_FACE_STYLES.find((item) => item.id === setup.cardFaceId) ?? CARD_FACE_STYLES[0]!,
    [setup.cardFaceId],
  );
  const selectedBackground = useMemo(
    () => BACKGROUND_STYLES.find((item) => item.id === setup.backgroundId) ?? BACKGROUND_STYLES[0]!,
    [setup.backgroundId],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  const choosePreset = (preset: RoomPreset) => {
    setSetup(preset.setup);
    setShowAllPositions(false);
  };

  const chooseDeck = (deckStyleId: DeckStyleId) => {
    setSetup((current) => ({
      ...current,
      deckStyleId,
      cardColor: deckColorLabel(deckStyleId),
    }));
  };

  const chooseCardFace = (cardFaceId: CardFaceId) => {
    setSetup((current) => ({ ...current, cardFaceId }));
  };

  const chooseBackground = (backgroundId: RoomBackgroundId) => {
    setSetup((current) => ({ ...current, backgroundId }));
  };

  const chooseSpread = (spreadType: SpreadType) => {
    setSetup((current) => ({ ...current, spreadType }));
    setShowAllPositions(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="flex h-full w-full max-w-[960px] flex-col justify-center px-4 py-12 sm:py-8"
    >
      <div
        className="relative flex max-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-[8px] border"
        style={{
          background: "var(--hint-card-surface)",
          borderColor: "var(--hint-border)",
          boxShadow: "var(--hint-elevated-shadow)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 82% 8%, rgba(228,198,138,0.12), transparent 30%), radial-gradient(circle at 12% 22%, rgba(64,224,208,0.10), transparent 34%)",
          }}
        />

        <div ref={scrollRef} className="relative flex-1 space-y-3.5 overflow-y-auto p-4 pb-4 sm:p-5 sm:pb-4">
          <header>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} strokeWidth={1.7} style={{ color: GOLD.ink }} />
                <p
                  className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: IVORY.mute }}
                >
                  {t("tarot.room")}
                </p>
              </div>
              <h1
                className="mt-2 font-serif text-[32px] leading-none sm:text-[40px]"
                style={{ color: IVORY.primary, textShadow: TEXT_HALO.strong }}
              >
                {t("tarot.setup.title")}
              </h1>
              <p className="mt-2 max-w-md font-sans text-[12px] leading-relaxed" style={{ color: IVORY.mute }}>
                {t("tarot.setup.body")}
              </p>
              <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.16em]" style={{ color: GOLD.ink }}>
                {t(`tarot.cardFace.${selectedCardFace.id}.label`)} · {t(`tarot.deck.${selectedDeck.id}.label`)}
              </p>
            </div>
          </header>

          <SetupSection icon={<Sparkles size={15} />} title="Preview">
            <RoomLivePreview
              presetLabel={t(`tarot.preset.${selectedPreset.id}.label`)}
              presetMood={t(`tarot.presetMood.${selectedPreset.id}`)}
              deckLabel={t(`tarot.deck.${selectedDeck.id}.label`)}
              deckPreview={selectedDeck.preview}
              backgroundLabel={t(`tarot.background.${selectedBackground.id}.label`)}
              backgroundPreview={selectedBackground.preview}
            />
          </SetupSection>

          <SetupSection icon={<Sparkles size={15} />} title={t("tarot.setup.presets")}>
            <div className="grid gap-2 min-[520px]:grid-cols-3">
              {ROOM_PRESETS.map((preset) => (
                <PresetButton
                  key={preset.id}
                  label={t(`tarot.preset.${preset.id}.label`)}
                  description={t(`tarot.preset.${preset.id}.description`)}
                  selected={setup.presetId === preset.id}
                  onClick={() => choosePreset(preset)}
                />
              ))}
            </div>
          </SetupSection>

          <div className="grid gap-4 min-[560px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="min-w-0 space-y-4">
              <SetupSection icon={<Palette size={15} />} title={t("tarot.setup.deck")}>
                <div className="grid gap-2 min-[520px]:grid-cols-3 min-[560px]:grid-cols-1">
                  {DECK_STYLES.map((deck) => (
                    <ChoiceButton
                      key={deck.id}
                      label={t(`tarot.deck.${deck.id}.label`)}
                      description={t(`tarot.deck.${deck.id}.description`)}
                      preview={deck.preview}
                      selected={setup.deckStyleId === deck.id}
                      onClick={() => chooseDeck(deck.id)}
                    />
                  ))}
                </div>
              </SetupSection>

              <SetupSection icon={<Layers size={15} />} title={t("tarot.setup.cardArt")}>
                <div className="grid gap-2 min-[520px]:grid-cols-2 min-[560px]:grid-cols-1">
                  {CARD_FACE_STYLES.map((cardFace) => (
                    <CardFaceButton
                      key={cardFace.id}
                      label={t(`tarot.cardFace.${cardFace.id}.label`)}
                      description={t(`tarot.cardFace.${cardFace.id}.description`)}
                      cardArtId={cardFace.id}
                      previewCards={cardFace.previewCards}
                      selected={setup.cardFaceId === cardFace.id}
                      onClick={() => chooseCardFace(cardFace.id)}
                    />
                  ))}
                </div>
              </SetupSection>

              <SetupSection icon={<Image size={15} />} title={t("tarot.setup.background")}>
                <div className="grid gap-2 min-[520px]:grid-cols-3 min-[560px]:grid-cols-1">
                  {BACKGROUND_STYLES.map((background) => (
                    <ChoiceButton
                      key={background.id}
                      label={t(`tarot.background.${background.id}.label`)}
                      description={t(`tarot.background.${background.id}.description`)}
                      preview={background.preview}
                      selected={setup.backgroundId === background.id}
                      onClick={() => chooseBackground(background.id)}
                    />
                  ))}
                </div>
              </SetupSection>
            </div>

            <div className="min-w-0 space-y-3">
              <section className="rounded-[8px] border px-3 py-3" style={{
                borderColor: "rgba(180,160,120,0.18)",
                background: "rgba(255,255,255,0.22)",
              }}>
                <div className="mb-2 flex items-center gap-2">
                  <Shuffle size={13} strokeWidth={1.7} style={{ color: GOLD.ink }} />
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: IVORY.mute }}>
                    {t("tarot.next.title")}
                  </p>
                </div>
                <ol className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {NEXT_STEP_KEYS.map((step, index) => (
                    <li
                      key={step}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5"
                      style={{
                        borderColor: "rgba(180,160,120,0.16)",
                        background: "rgba(255,255,255,0.24)",
                        color: IVORY.body,
                      }}
                    >
                      <span className="font-sans text-[9px] font-semibold leading-none" style={{ color: GOLD.ink }}>
                        {index + 1}
                      </span>
                      <span className="whitespace-nowrap font-sans text-[10.5px] leading-none" style={{ color: IVORY.mute }}>
                        {t(`tarot.next.${step}`)}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </div>

        <div
          className="relative z-10 shrink-0 border-t px-4 py-2 text-center font-serif text-[13px] italic"
          style={{
            color: "rgba(99, 88, 76, 0.76)",
            borderColor: "rgba(180,160,120,0.18)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.46), rgba(248,244,235,0.66))",
            backdropFilter: "blur(18px)",
          }}
        >
          {t("tarot.setup.ritualLine")}
        </div>

        <footer
          className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-t p-3 sm:p-4"
          style={{
            borderColor: "rgba(180,160,120,0.22)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.68), rgba(248,244,235,0.88))",
            backdropFilter: "blur(18px)",
            boxShadow: "0 -12px 32px rgba(80,70,50,0.06)",
          }}
        >
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-[8px] border px-4 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 hover:border-[#8f806f]/40 hover:bg-white/65 active:scale-[0.98]"
            style={{
              color: "#5f5a66",
              borderColor: "rgba(120,110,100,0.22)",
              background: "rgba(255,255,255,0.45)",
              boxShadow: "none",
            }}
          >
            {t("common.back")}
          </Link>
          <button
            type="button"
            onClick={() => onStart(setup)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border px-5 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ae8438]/75 hover:shadow-[0_14px_34px_rgba(196,160,82,0.30)] active:translate-y-0 active:scale-[0.98]"
            style={{
              color: "#2f2a24",
              borderColor: "rgba(174,132,56,0.55)",
              background:
                "linear-gradient(135deg, #fff2c7, #e8c772)",
              boxShadow:
                "0 10px 26px rgba(196,160,82,0.22), inset 0 0 0 1px rgba(255,255,255,0.22)",
            }}
          >
            {t("tarot.setup.continue")}
            <ChevronRight size={15} />
          </button>
        </footer>
      </div>
    </motion.div>
  );
}
