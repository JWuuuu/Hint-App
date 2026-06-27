import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Check,
  ChevronRight,
  GraduationCap,
  Heart,
  Image,
  Layers,
  MessageCircle,
  Palette,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";
import {
  BACKGROUND_STYLES,
  CARD_FACE_STYLES,
  DECK_STYLES,
  DEFAULT_TAROT_ROOM_SETUP,
  ROOM_PRESETS,
  SPREAD_CHOICES,
  type CardBackId,
  type CardFaceId,
  type DeckStyleId,
  type RoomBackgroundId,
  type RoomPreset,
  type SpreadChoice,
  type TarotRoomSetup,
} from "../useHoldFlow";
import type { SpreadType } from "../chat/types";
import { getTarotCardImage } from "../../tarot/logic/cardImageMap";
import {
  getDefaultTarotCardBackForStyle,
  isTarotCardBackId,
  TAROT_CARD_BACK_CHOICES,
  type TarotCardBackChoice,
} from "../../tarot/logic/cardBacks";
import { GOLD, IVORY, TEXT_HALO } from "../atmosphere";
import { useLanguage } from "../../../lib/i18n";

interface Props {
  onStart: (setup: TarotRoomSetup) => void;
  initialSetup?: TarotRoomSetup;
}

const ADVANCED_SPREAD_IDS: readonly SpreadType[] = [
  "futureLover",
  "peachBlossom",
  "reconciliation",
  "trueHeart",
  "loveTree",
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
    spreadType: "loveTree",
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

type StudioTab = "deck" | "cards" | "room";
type ScenarioGroup = {
  id: string;
  titleKey: string;
  scenes: readonly ReadingScenario[];
};
type ReadingScenario = {
  id: string;
  icon: LucideIcon;
  titleKey: string;
  bodyKey: string;
  questionKey: string;
  spreadType: SpreadType;
};

const READING_SCENE_GROUPS: readonly ScenarioGroup[] = [
  {
    id: "love",
    titleKey: "tarot.scenes.love",
    scenes: [
      {
        id: "connection",
        icon: Heart,
        titleKey: "tarot.scene.connection.title",
        bodyKey: "tarot.scene.connection.body",
        questionKey: "tarot.scene.connection.question",
        spreadType: "relationship",
      },
      {
        id: "rightLove",
        icon: Search,
        titleKey: "tarot.scene.rightLove.title",
        bodyKey: "tarot.scene.rightLove.body",
        questionKey: "tarot.scene.rightLove.question",
        spreadType: "peachBlossom",
      },
      {
        id: "thoughts",
        icon: MessageCircle,
        titleKey: "tarot.scene.thoughts.title",
        bodyKey: "tarot.scene.thoughts.body",
        questionKey: "tarot.scene.thoughts.question",
        spreadType: "trueHeart",
      },
      {
        id: "reconcile",
        icon: RotateCcw,
        titleKey: "tarot.scene.reconcile.title",
        bodyKey: "tarot.scene.reconcile.body",
        questionKey: "tarot.scene.reconcile.question",
        spreadType: "reconciliation",
      },
    ],
  },
  {
    id: "life",
    titleKey: "tarot.scenes.life",
    scenes: [
      {
        id: "exam",
        icon: GraduationCap,
        titleKey: "tarot.scene.exam.title",
        bodyKey: "tarot.scene.exam.body",
        questionKey: "tarot.scene.exam.question",
        spreadType: "three",
      },
      {
        id: "people",
        icon: Users,
        titleKey: "tarot.scene.people.title",
        bodyKey: "tarot.scene.people.body",
        questionKey: "tarot.scene.people.question",
        spreadType: "relationship",
      },
      {
        id: "career",
        icon: BriefcaseBusiness,
        titleKey: "tarot.scene.career.title",
        bodyKey: "tarot.scene.career.body",
        questionKey: "tarot.scene.career.question",
        spreadType: "three",
      },
    ],
  },
];

function deckColorLabel(id: DeckStyleId): string {
  switch (id) {
    case "ivory":
      return "Ivory with warm gold";
    case "rose":
      return "Rose quartz with violet foil";
    default:
      return "Deep navy with gold sky linework";
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
    <section className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span style={{ color: GOLD.ink }}>{icon}</span>
        <p
          className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.17em]"
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
      className="relative min-h-[46px] rounded-[14px] border px-2.5 py-2 text-left transition-[border-color,background,box-shadow,filter,transform] duration-300 hover:-translate-y-0.5 active:translate-y-0"
      style={{
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected
          ? "linear-gradient(135deg, color-mix(in srgb, var(--hint-gold, #cba866) 18%, transparent), color-mix(in srgb, var(--hint-aqua, #86d6c7) 8%, transparent))"
          : "color-mix(in srgb, var(--hint-card-surface-muted) 86%, transparent)",
        boxShadow: selected ? "0 0 24px rgba(228,198,138,0.12)" : "none",
      }}
    >
      {selected && (
        <Check className="absolute right-1.5 top-1.5" size={12} style={{ color: GOLD.ink }} />
      )}
      <p
        className="truncate pr-4 font-sans text-[10px] font-semibold leading-tight sm:text-[10.5px]"
        style={{ color: IVORY.strong, textShadow: TEXT_HALO.soft }}
      >
        {label}
      </p>
      <p className="mt-1 line-clamp-1 font-sans text-[8px] leading-snug sm:text-[8.5px]" style={{ color: IVORY.mute }}>
        {description}
      </p>
    </button>
  );
}

function StudioTabButton({
  icon,
  label,
  detail,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-[14px] border px-1.5 py-2 text-center transition-[border-color,background,box-shadow,transform] duration-300 hover:-translate-y-0.5 active:translate-y-0"
      style={{
        borderColor: selected ? GOLD.edge : "transparent",
        background: selected
          ? "linear-gradient(135deg, color-mix(in srgb, var(--hint-gold, #cba866) 18%, transparent), color-mix(in srgb, var(--hint-card-inner) 74%, transparent))"
          : "transparent",
        boxShadow: selected ? "0 0 20px rgba(228,198,138,0.12)" : "none",
      }}
    >
      <span className="shrink-0" style={{ color: selected ? GOLD.ink : IVORY.dim }}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-sans text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: selected ? IVORY.strong : IVORY.mute }}>
          {label}
        </span>
        <span className="mt-0.5 block max-w-[82px] truncate font-sans text-[8px]" style={{ color: IVORY.dim }}>
          {detail}
        </span>
      </span>
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
      aria-label={`${label}. ${description}`}
      className="relative flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[14px] border p-1.5 text-center transition-[border-color,background,box-shadow,filter,transform] duration-300 hover:-translate-y-0.5 active:translate-y-0"
      style={{
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected
          ? "linear-gradient(135deg, color-mix(in srgb, var(--hint-gold, #cba866) 16%, transparent), color-mix(in srgb, var(--hint-rose, #cba6c4) 8%, transparent))"
          : "color-mix(in srgb, var(--hint-card-surface-muted) 86%, transparent)",
        boxShadow: selected ? "0 0 18px rgba(228,198,138,0.12)" : "none",
      }}
    >
      <span
        className="h-9 w-9 shrink-0 rounded-[11px] border"
        style={{
          background: preview,
          borderColor: selected ? "rgba(228,198,138,0.5)" : "var(--hint-border)",
          boxShadow: selected ? "0 0 18px rgba(228,198,138,0.15)" : "none",
        }}
      />
      <span className="min-w-0 max-w-full">
        <span className="block truncate font-sans text-[10px] font-semibold leading-tight sm:text-[10.5px]" style={{ color: IVORY.strong }}>
          {label}
        </span>
        <span className="sr-only">
          {description}
        </span>
      </span>
      {selected && <Check className="absolute right-1.5 top-1.5 shrink-0" size={12} style={{ color: GOLD.ink }} />}
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
      aria-label={`${label}. ${description}`}
      className="relative flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-[15px] border p-1.5 text-center transition-[border-color,background,box-shadow,filter,transform] duration-300 hover:-translate-y-0.5 active:translate-y-0"
      style={{
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected
          ? "linear-gradient(135deg, color-mix(in srgb, var(--hint-gold, #cba866) 16%, transparent), color-mix(in srgb, var(--hint-aqua, #86d6c7) 8%, transparent))"
          : "var(--hint-card-surface-muted)",
        boxShadow: selected ? "0 0 22px rgba(228,198,138,0.14)" : "none",
      }}
    >
      {selected && <Check className="absolute right-1.5 top-1.5 z-10 shrink-0" size={12} style={{ color: GOLD.ink }} />}
      <span className="relative h-[52px] w-[76px] shrink-0">
        {images.map((image, index) => (
          <span
            key={image}
            className="absolute left-1/2 top-0.5 block h-[50px] w-[31px] overflow-hidden rounded-[7px] border shadow-[0_5px_10px_rgba(0,0,0,0.12)]"
            style={{
              transform: `translateX(calc(-50% + ${(index - 1) * 12}px)) rotate(${index === 0 ? -6 : index === 1 ? 0 : 6}deg)`,
              borderColor: selected
                ? "color-mix(in srgb, var(--hint-gold, #cba866) 58%, var(--hint-liquid-border))"
                : "color-mix(in srgb, var(--hint-liquid-border) 62%, transparent)",
              background: "var(--hint-deck-card-bg)",
              zIndex: index + 1,
            }}
          >
            <img src={image} alt="" aria-hidden="true" className="h-full w-full object-cover" draggable={false} />
          </span>
        ))}
      </span>
      <span className="min-w-0 max-w-full">
        <span className="block truncate font-sans text-[10px] font-semibold leading-tight sm:text-[10.5px]" style={{ color: IVORY.strong }}>
          {label}
        </span>
      </span>
    </button>
  );
}

function CardBackButton({
  choice,
  selected,
  onClick,
}: {
  choice: TarotCardBackChoice;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${choice.label}. ${choice.collection}`}
      className="relative flex min-h-[104px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-[15px] border p-1.5 text-center transition-[border-color,background,box-shadow,filter,transform] duration-300 hover:-translate-y-0.5 active:translate-y-0"
      style={{
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected
          ? "linear-gradient(135deg, color-mix(in srgb, var(--hint-gold, #cba866) 16%, transparent), color-mix(in srgb, var(--hint-aqua, #86d6c7) 8%, transparent))"
          : "var(--hint-card-surface-muted)",
        boxShadow: selected ? "0 0 22px rgba(228,198,138,0.14)" : "none",
      }}
    >
      {selected && <Check className="absolute right-1.5 top-1.5 z-10 shrink-0" size={12} style={{ color: GOLD.ink }} />}
      <span
        className="block h-[68px] w-[44px] shrink-0 overflow-hidden rounded-[8px] border shadow-[0_7px_12px_rgba(0,0,0,0.18)]"
        style={{
          borderColor: selected
            ? "color-mix(in srgb, var(--hint-gold, #cba866) 58%, var(--hint-liquid-border))"
            : "color-mix(in srgb, var(--hint-liquid-border) 62%, transparent)",
          background: "var(--hint-deck-card-bg)",
        }}
      >
        <img src={choice.image} alt="" aria-hidden="true" className="h-full w-full object-cover" draggable={false} />
      </span>
      <span className="min-w-0 max-w-full">
        <span className="block max-w-full truncate font-sans text-[9px] font-semibold leading-tight" style={{ color: IVORY.strong }}>
          {choice.label}
        </span>
        <span className="block max-w-full truncate font-sans text-[7px] font-semibold leading-tight" style={{ color: IVORY.dim }}>
          {choice.collection}
        </span>
      </span>
    </button>
  );
}

function RoomLivePreview({
  title,
  moodLine,
  previewLabel,
  deckLabel,
  deckPreview,
  cardBackLabel,
  cardBackImage,
  cardFaceLabel,
  cardPreviewImages,
  backgroundLabel,
  backgroundPreview,
}: {
  title: string;
  moodLine: string;
  previewLabel: string;
  deckLabel: string;
  deckPreview: string;
  cardBackLabel: string;
  cardBackImage: string;
  cardFaceLabel: string;
  cardPreviewImages: readonly string[];
  backgroundLabel: string;
  backgroundPreview: string;
}) {
  return (
    <aside
      className="hint-liquid-panel relative overflow-hidden rounded-[24px] border p-3 transition-[border-color,background,box-shadow] duration-300"
      style={{
        borderColor: "var(--hint-liquid-border)",
        background: "var(--hint-liquid-panel-strong)",
        boxShadow: "var(--hint-liquid-shadow)",
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
            "linear-gradient(135deg, color-mix(in srgb, var(--hint-surface) 84%, transparent) 0%, color-mix(in srgb, var(--hint-card-inner) 92%, transparent) 100%)",
          backdropFilter: "blur(10px)",
        }}
      />
      <div className="relative z-10">
        <div className="mb-2.5 flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-sans text-[8.5px] font-semibold uppercase tracking-[0.17em]" style={{ color: GOLD.ink }}>
              {previewLabel}
            </p>
            <p className="mt-0.5 line-clamp-1 font-serif text-[22px] leading-none sm:text-[24px]" style={{ color: IVORY.strong, textShadow: TEXT_HALO.soft }}>
              {title}
            </p>
            <p className="mt-1 line-clamp-1 font-sans text-[9.5px] leading-snug sm:text-[10.5px]" style={{ color: IVORY.dim }}>
              {moodLine}
            </p>
          </div>
          <div className="flex max-w-[38%] flex-col items-end gap-1">
            {[deckLabel, cardBackLabel, backgroundLabel].map((item) => (
              <span
                key={item}
                className="max-w-full truncate rounded-full border px-1.5 py-0.5 font-sans text-[7.5px] font-semibold leading-none"
                style={{
                  color: IVORY.body,
                  borderColor: "var(--hint-border)",
                  background: "color-mix(in srgb, var(--hint-card-inner) 76%, transparent)",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div
          className="relative h-[178px] min-w-0 overflow-hidden rounded-[20px] border sm:h-[188px]"
          style={{
            borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 18%, var(--hint-border))",
            background:
              "radial-gradient(circle at 50% 58%, rgba(228,198,138,0.14), transparent 58%), var(--hint-card-inner)",
            boxShadow: "inset 0 0 0 1px var(--hint-border)",
          }}
        >
          <span
            className="absolute bottom-3 left-3 z-10 block h-[104px] w-[64px] overflow-hidden rounded-[12px] border shadow-[0_10px_18px_rgba(80,70,50,0.20)] sm:h-[112px] sm:w-[69px]"
            style={{
              borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 42%, var(--hint-liquid-border))",
              background: deckPreview,
            }}
          >
            <img src={cardBackImage} alt="" aria-hidden="true" className="h-full w-full object-cover" draggable={false} />
          </span>
          {cardPreviewImages.length
            ? cardPreviewImages.slice(0, 3).map((image, index) => (
                <span
                  key={image}
                  className="absolute bottom-3 left-1/2 block h-[154px] w-[96px] overflow-hidden rounded-[14px] border shadow-[0_10px_18px_rgba(80,70,50,0.16)] transition-[transform,opacity] duration-500 sm:h-[164px] sm:w-[102px]"
                  style={{
                    transform: `translateX(calc(-50% + ${(index - 1) * 44}px)) rotate(${index === 0 ? -7 : index === 1 ? 0 : 7}deg)`,
                    borderColor: index === 0
                      ? "color-mix(in srgb, var(--hint-gold, #cba866) 42%, var(--hint-liquid-border))"
                      : "color-mix(in srgb, var(--hint-liquid-border) 82%, transparent)",
                    zIndex: 4 - index,
                    background: "var(--hint-deck-card-bg)",
                  }}
                >
                  <img src={image} alt="" aria-hidden="true" className="h-full w-full object-cover" draggable={false} />
                </span>
              ))
            : [0, 1].map((index) => (
                <span
                  key={index}
                  className="absolute bottom-3 left-1/2 block h-[154px] w-[96px] rounded-[14px] border shadow-[0_10px_18px_rgba(80,70,50,0.16)] transition-[transform,opacity] duration-500 sm:h-[164px] sm:w-[102px]"
                  style={{
                    transform: `translateX(calc(-50% + ${(index - 0.5) * 48}px)) rotate(${index === 0 ? -7 : 7}deg)`,
                    background: deckPreview,
                    borderColor: index === 0
                      ? "color-mix(in srgb, var(--hint-gold, #cba866) 42%, var(--hint-liquid-border))"
                      : "color-mix(in srgb, var(--hint-liquid-border) 82%, transparent)",
                    zIndex: 3 - index,
                  }}
                />
              ))}
          <div
            className="absolute right-2 top-2 z-10 max-w-[62%] truncate rounded-full border px-2 py-1 font-sans text-[8px] font-semibold"
            style={{
              color: IVORY.body,
              borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 22%, var(--hint-border))",
              background: "color-mix(in srgb, var(--hint-card-inner) 74%, transparent)",
              backdropFilter: "blur(10px)",
            }}
          >
            {cardFaceLabel}
          </div>
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
      className="min-h-[78px] rounded-[18px] border p-2.5 text-left transition-all duration-500 hover:-translate-y-0.5 active:translate-y-0"
      style={{
        borderColor: selected ? "rgba(241, 205, 132, 0.78)" : "var(--hint-border)",
        background: selected
          ? "linear-gradient(135deg, color-mix(in srgb, var(--hint-gold, #cba866) 18%, transparent), color-mix(in srgb, var(--hint-aqua, #86d6c7) 8%, transparent))"
          : "var(--hint-card-surface-muted)",
        boxShadow: selected ? "0 0 26px rgba(228,198,138,0.16)" : "none",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-sans text-[12.5px] font-semibold leading-tight sm:text-[13.5px]" style={{ color: selected ? IVORY.primary : IVORY.strong }}>
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
      className={`${compact ? "h-[78px]" : "h-[132px]"} relative overflow-hidden rounded-[16px]`}
      style={{
        background: "var(--hint-liquid-panel-strong)",
        boxShadow:
          "inset 0 0 0 1px color-mix(in srgb, var(--hint-gold, #cba866) 22%, var(--hint-border)), inset 0 0 32px color-mix(in srgb, var(--hint-gold, #cba866) 8%, transparent)",
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
            color: "var(--hint-gold-bright, #f2d48d)",
            borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 55%, var(--hint-border))",
            background: "color-mix(in srgb, var(--hint-deck-card-bg) 72%, transparent)",
            boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
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
          : spread.id === "loveTree"
            ? t("tarot.readingShape.deep.title")
            : spread.label;
  const selectedShapeCount =
    spread.id === "loveTree"
      ? t("tarot.readingShape.deep.cards")
      : `${spread.cardCount} ${spread.cardCount === 1 ? cardLabel : cardsLabel}`;

  return (
    <div
      className="hint-liquid-panel rounded-[20px] border p-3"
      style={{
        borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 42%, var(--hint-liquid-border))",
        background: "var(--hint-liquid-panel)",
        boxShadow: "0 0 26px color-mix(in srgb, var(--hint-gold, #cba866) 10%, transparent)",
      }}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: GOLD.ink }}>
              {t("tarot.spreadExplanation.selectedShape")}
            </p>
            <p className="mt-1 font-sans text-[15px] font-semibold leading-tight" style={{ color: IVORY.strong }}>
              {selectedShapeTitle} · {selectedShapeCount}
            </p>
          </div>
          <Check className="shrink-0" size={15} style={{ color: GOLD.ink }} />
        </div>

        {emotionalLine !== `tarot.spreadEmotion.${spread.id}` && (
          <p className="font-serif text-[13px] italic leading-snug" style={{ color: IVORY.mute }}>
            {emotionalLine}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: GOLD.ink }}>
            {spread.cardCount === 1 ? t("tarot.spreadExplanation.position") : t("tarot.spreadExplanation.positions")}:
          </span>
          {visiblePositions.map((label, index) => (
            <span
              key={`${spread.id}-${index}-${label}`}
              className="inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 font-sans text-[10px] leading-none"
              style={{
                color: IVORY.body,
                borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 20%, var(--hint-border))",
                background: "color-mix(in srgb, var(--hint-surface-soft) 72%, transparent)",
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
                borderColor: "var(--hint-border)",
                background: "color-mix(in srgb, var(--hint-card-surface-muted) 78%, transparent)",
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

function StartReadingPanel({
  question,
  onQuestionChange,
}: {
  question: string;
  onQuestionChange: (value: string) => void;
}) {
  const { t } = useLanguage();
  const hasQuestion = question.trim().length > 0;

  return (
    <section
      className="relative overflow-hidden rounded-[24px] border p-3"
      style={{
        borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 38%, var(--hint-liquid-border))",
        background:
          "radial-gradient(circle at 92% 8%, color-mix(in srgb, var(--hint-gold, #cba866) 16%, transparent), transparent 34%), var(--hint-liquid-panel-strong)",
        boxShadow: "var(--hint-liquid-shadow)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in srgb, var(--hint-gold, #cba866) 52%, transparent), transparent)",
        }}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: GOLD.ink }}>
              {t("tarot.start.eyebrow")}
            </p>
            <h2 className="mt-1 font-serif text-[24px] leading-none sm:text-[27px]" style={{ color: IVORY.primary, textShadow: TEXT_HALO.strong }}>
              {t("tarot.start.title")}
            </h2>
            <p className="mt-1.5 max-w-[24rem] font-sans text-[11px] leading-snug" style={{ color: IVORY.mute }}>
              {t("tarot.start.body")}
            </p>
          </div>
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] border"
            style={{
              color: GOLD.ink,
              borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 34%, var(--hint-border))",
              background: "color-mix(in srgb, var(--hint-card-inner) 74%, transparent)",
            }}
          >
            <Sparkles size={20} strokeWidth={1.6} />
          </span>
        </div>

        <label className="mt-3 block">
          <span className="mb-1.5 block font-sans text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: IVORY.dim }}>
            {t("tarot.start.questionLabel")}
          </span>
          <textarea
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            placeholder={t("tarot.start.placeholder")}
            className="h-[78px] w-full resize-none rounded-[18px] border px-3 py-2.5 font-serif text-[14px] leading-snug outline-none transition"
            style={{
              color: IVORY.primary,
              borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 22%, var(--hint-border))",
              background: "color-mix(in srgb, var(--hint-card-inner) 76%, transparent)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          />
        </label>

        <div className="mt-2.5">
          <p className="min-w-0 font-sans text-[10px] leading-snug" style={{ color: IVORY.dim }}>
            {hasQuestion ? t("tarot.start.readyHint") : t("tarot.start.emptyHint")}
          </p>
        </div>
      </div>
    </section>
  );
}

function ScenarioCard({
  scene,
  selected,
  onSelect,
}: {
  scene: ReadingScenario;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useLanguage();
  const Icon = scene.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="hint-tap-sparkle flex min-h-[58px] w-full items-center gap-2.5 rounded-[14px] border px-2.5 py-2 text-left transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
      style={{
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected
          ? "linear-gradient(135deg, color-mix(in srgb, var(--hint-gold, #cba866) 13%, transparent), color-mix(in srgb, var(--hint-rose, #cba6c4) 8%, transparent))"
          : "color-mix(in srgb, var(--hint-card-surface-muted) 72%, transparent)",
        boxShadow: selected ? "0 0 18px rgba(228,198,138,0.12)" : "none",
      }}
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] border"
        style={{
          color: selected ? GOLD.ink : IVORY.mute,
          borderColor: selected ? GOLD.edge : "var(--hint-border)",
          background: "color-mix(in srgb, var(--hint-card-inner) 72%, transparent)",
        }}
      >
        <Icon size={15} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-[14px] leading-tight" style={{ color: IVORY.strong, textShadow: TEXT_HALO.soft }}>
          {t(scene.titleKey)}
        </span>
        <span className="mt-0.5 block truncate font-sans text-[10px] leading-snug" style={{ color: IVORY.mute }}>
          {t(scene.bodyKey)}
        </span>
      </span>
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full border"
        style={{
          color: selected ? GOLD.ink : IVORY.dim,
          borderColor: selected ? GOLD.edge : "color-mix(in srgb, var(--hint-border) 76%, transparent)",
          background: selected
            ? "color-mix(in srgb, var(--hint-gold, #cba866) 14%, transparent)"
            : "color-mix(in srgb, var(--hint-card-inner) 58%, transparent)",
        }}
      >
        {selected ? <Check size={13} strokeWidth={1.9} /> : <ChevronRight size={13} strokeWidth={1.9} />}
      </span>
    </button>
  );
}

function ScenarioGuide({
  selectedQuestion,
  onSelect,
}: {
  selectedQuestion: string;
  onSelect: (scene: ReadingScenario) => void;
}) {
  const { t } = useLanguage();

  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: GOLD.ink }}>
            {t("tarot.scenes.eyebrow")}
          </p>
          <h2 className="mt-0.5 font-serif text-[20px] leading-none" style={{ color: IVORY.strong, textShadow: TEXT_HALO.soft }}>
            {t("tarot.scenes.title")}
          </h2>
        </div>
        <p className="hidden max-w-[11rem] text-right font-sans text-[10px] leading-snug sm:block" style={{ color: IVORY.dim }}>
          {t("tarot.scenes.body")}
        </p>
      </div>

      {READING_SCENE_GROUPS.map((group) => (
        <div key={group.id} className="space-y-1.5">
          <p className="px-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: IVORY.dim }}>
            {t(group.titleKey)}
          </p>
          <div className="space-y-1">
            {group.scenes.map((scene) => {
              const sceneQuestion = t(scene.questionKey);
              return (
                <ScenarioCard
                  key={scene.id}
                  scene={scene}
                  selected={selectedQuestion.trim() === sceneQuestion.trim()}
                  onSelect={() => onSelect(scene)}
                />
              );
            })}
          </div>
        </div>
      ))}
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
  const [setup, setSetup] = useState<TarotRoomSetup>(() => ({
    ...initialSetup,
    cardBackId: isTarotCardBackId(initialSetup.cardBackId)
      ? initialSetup.cardBackId
      : getDefaultTarotCardBackForStyle(initialSetup.deckStyleId),
    spreadType: initialSetup.spreadType === "xRelationship" ? "loveTree" : initialSetup.spreadType,
  }));
  const [showAdvancedSpreads, setShowAdvancedSpreads] = useState(false);
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [showRoomStyle, setShowRoomStyle] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<StudioTab>("deck");

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
  const selectedCardPreviewImages = useMemo(
    () =>
      selectedCardFace.previewCards
        .map((cardId) => getTarotCardImage(cardId, selectedCardFace.id))
        .filter((image): image is string => Boolean(image)),
    [selectedCardFace],
  );
  const selectedCardBack = useMemo(
    () =>
      TAROT_CARD_BACK_CHOICES.find((item) => item.id === setup.cardBackId) ??
      TAROT_CARD_BACK_CHOICES.find((item) => item.id === getDefaultTarotCardBackForStyle(setup.deckStyleId)) ??
      TAROT_CARD_BACK_CHOICES[0]!,
    [setup.cardBackId, setup.deckStyleId],
  );
  const selectedBackground = useMemo(
    () => BACKGROUND_STYLES.find((item) => item.id === setup.backgroundId) ?? BACKGROUND_STYLES[0]!,
    [setup.backgroundId],
  );
  const presetStillMatches = selectedPreset.setup.deckStyleId === setup.deckStyleId &&
    selectedPreset.setup.cardFaceId === setup.cardFaceId &&
    selectedPreset.setup.cardBackId === setup.cardBackId &&
    selectedPreset.setup.backgroundId === setup.backgroundId;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  const choosePreset = (preset: RoomPreset) => {
    setSetup((current) => ({
      ...preset.setup,
      spreadType: current.spreadType,
      story: current.story,
      question: current.question,
      focusLabel: current.focusLabel,
    }));
    setShowAllPositions(false);
  };

  const chooseDeck = (deckStyleId: DeckStyleId) => {
    setSetup((current) => ({
      ...current,
      deckStyleId,
      cardBackId: getDefaultTarotCardBackForStyle(deckStyleId),
      cardColor: deckColorLabel(deckStyleId),
    }));
  };

  const chooseCardFace = (cardFaceId: CardFaceId) => {
    setSetup((current) => ({ ...current, cardFaceId }));
  };

  const chooseCardBack = (cardBackId: CardBackId) => {
    setSetup((current) => ({ ...current, cardBackId }));
  };

  const chooseBackground = (backgroundId: RoomBackgroundId) => {
    setSetup((current) => ({ ...current, backgroundId }));
  };

  const chooseSpread = (spreadType: SpreadType) => {
    setSetup((current) => ({ ...current, spreadType }));
    setShowAllPositions(false);
  };

  const updateQuestion = (question: string) => {
    setSetup((current) => ({ ...current, question }));
  };

  const chooseScenario = (scene: ReadingScenario) => {
    setSetup((current) => ({
      ...current,
      question: t(scene.questionKey),
      spreadType: scene.spreadType,
      focusLabel: t(scene.titleKey),
    }));
    setShowAllPositions(false);
    if (ADVANCED_SPREAD_IDS.includes(scene.spreadType)) {
      setShowAdvancedSpreads(true);
    }
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="flex h-full w-full max-w-[var(--hint-app-width)] flex-col justify-center px-3 py-2.5 sm:px-4"
    >
      <div
        className="hint-liquid-panel relative flex max-h-[calc(100vh-1rem)] flex-col overflow-hidden rounded-[28px] border"
        style={{
          background: "var(--hint-liquid-panel)",
          borderColor: "var(--hint-liquid-border)",
          boxShadow: "var(--hint-liquid-shadow)",
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

        <div ref={scrollRef} className="relative flex-1 space-y-2 overflow-y-auto p-2.5 pb-3 sm:p-3">
          <header className="min-w-0">
            <div className="min-w-0">
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
                className="mt-0.5 font-serif text-[24px] leading-none sm:text-[28px]"
                style={{ color: IVORY.primary, textShadow: TEXT_HALO.strong }}
              >
                {t("tarot.setup.title")}
              </h1>
              <p className="mt-1 line-clamp-1 max-w-xl font-sans text-[10.5px] leading-snug" style={{ color: IVORY.mute }}>
                {t("tarot.setup.body")}
              </p>
            </div>
          </header>

          <StartReadingPanel
            question={setup.question ?? ""}
            onQuestionChange={updateQuestion}
          />

          <ScenarioGuide
            selectedQuestion={setup.question ?? ""}
            onSelect={chooseScenario}
          />

          <CollapsedSection
            icon={<Palette size={15} />}
            title={t("tarot.style.title")}
            subtitle={t("tarot.style.subtitle")}
            openLabel={t("tarot.style.open")}
            closeLabel={t("tarot.style.close")}
            open={showRoomStyle}
            onToggle={() => setShowRoomStyle((open) => !open)}
          >
            <div className="space-y-2">
              <RoomLivePreview
                title={presetStillMatches ? t(`tarot.preset.${selectedPreset.id}.label`) : t("tarot.setup.customPreviewTitle")}
                moodLine={presetStillMatches ? t(`tarot.presetMood.${selectedPreset.id}`) : t("tarot.setup.customPreviewMood")}
                previewLabel={t("tarot.setup.previewLabel")}
                deckLabel={t(`tarot.deck.${selectedDeck.id}.label`)}
                deckPreview={selectedDeck.preview}
                cardBackLabel={selectedCardBack.label}
                cardBackImage={selectedCardBack.image}
                cardFaceLabel={t(`tarot.cardFace.${selectedCardFace.id}.label`)}
                cardPreviewImages={selectedCardPreviewImages}
                backgroundLabel={t(`tarot.background.${selectedBackground.id}.label`)}
                backgroundPreview={selectedBackground.preview}
              />

              <SetupSection icon={<Sparkles size={15} />} title={t("tarot.setup.presets")}>
                <div className="grid grid-cols-3 gap-1.5">
                  {ROOM_PRESETS.map((preset) => (
                    <PresetButton
                      key={preset.id}
                      label={t(`tarot.preset.${preset.id}.label`)}
                      description={t(`tarot.preset.${preset.id}.description`)}
                      selected={setup.presetId === preset.id && presetStillMatches}
                      onClick={() => choosePreset(preset)}
                    />
                  ))}
                </div>
              </SetupSection>

              <section
                className="rounded-[20px] border p-2"
                style={{
                  borderColor: "var(--hint-border)",
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--hint-card-surface-muted) 94%, transparent), color-mix(in srgb, var(--hint-card-inner) 78%, transparent))",
                }}
              >
                <div className="grid grid-cols-3 gap-1 rounded-[17px] border p-1" style={{ borderColor: "var(--hint-border)", background: "color-mix(in srgb, var(--hint-card-inner) 74%, transparent)" }}>
                  <StudioTabButton
                    icon={<Palette size={14} />}
                    label={t("tarot.studio.deck")}
                    detail={selectedCardBack.label}
                    selected={activeStudioTab === "deck"}
                    onClick={() => setActiveStudioTab("deck")}
                  />
                  <StudioTabButton
                    icon={<Layers size={14} />}
                    label={t("tarot.studio.cards")}
                    detail={t(`tarot.cardFace.${selectedCardFace.id}.label`)}
                    selected={activeStudioTab === "cards"}
                    onClick={() => setActiveStudioTab("cards")}
                  />
                  <StudioTabButton
                    icon={<Sparkles size={14} />}
                    label={t("tarot.studio.room")}
                    detail={t(`tarot.background.${selectedBackground.id}.label`)}
                    selected={activeStudioTab === "room"}
                    onClick={() => setActiveStudioTab("room")}
                  />
                </div>

                <div className="mt-2">
                  {activeStudioTab === "deck" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1.5">
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
                      <div className="grid max-h-[254px] grid-cols-3 gap-1.5 overflow-y-auto pr-1">
                        {TAROT_CARD_BACK_CHOICES.map((cardBack) => (
                          <CardBackButton
                            key={cardBack.id}
                            choice={cardBack}
                            selected={setup.cardBackId === cardBack.id}
                            onClick={() => chooseCardBack(cardBack.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {activeStudioTab === "cards" && (
                    <div className="grid grid-cols-3 gap-1.5">
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
                  )}

                  {activeStudioTab === "room" && (
                    <div className="grid grid-cols-3 gap-1.5">
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
                  )}
                </div>
              </section>
            </div>
          </CollapsedSection>
        </div>

        <footer
          className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-t p-2.5 sm:p-3"
          style={{
            borderColor: "var(--hint-border)",
            background: "var(--hint-nav-bg)",
            backdropFilter: "blur(18px)",
            boxShadow: "var(--hint-nav-shadow)",
          }}
        >
          <Link
            href="/app"
            className="inline-flex h-10 items-center justify-center rounded-[16px] border px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              color: IVORY.body,
              borderColor: "var(--hint-border)",
              background: "color-mix(in srgb, var(--hint-card-surface-muted) 88%, transparent)",
              boxShadow: "none",
            }}
          >
            {t("common.back")}
          </Link>
          <button
            type="button"
            onClick={() => onStart(setup)}
            className="hint-prism-action inline-flex h-10 items-center justify-center gap-2 rounded-[16px] px-5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            style={{
              color: "var(--hint-special-action-text)",
            }}
          >
            {t("tarot.start.button")}
            <ChevronRight size={15} />
          </button>
        </footer>
      </div>
    </motion.div>
  );
}
