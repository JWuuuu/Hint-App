import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, Image, Layers, Palette, Shuffle, Sparkles } from "lucide-react";
import {
  BACKGROUND_STYLES,
  DECK_STYLES,
  DEFAULT_TAROT_ROOM_SETUP,
  ROOM_PRESETS,
  SPREAD_CHOICES,
  type DeckStyleId,
  type RoomBackgroundId,
  type RoomPreset,
  type SpreadChoice,
  type TarotRoomSetup,
} from "../useHoldFlow";
import type { SpreadType } from "../chat/types";
import { GOLD, IVORY, TEXT_HALO } from "../atmosphere";
import { useLanguage } from "../../../lib/i18n";

interface Props {
  onStart: (setup: TarotRoomSetup) => void;
}

const METHOD_STEPS = ["wash", "cut", "draw", "flip"] as const;
const CORE_SPREAD_IDS: readonly SpreadType[] = ["single", "three", "relationship"];

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
      className="min-h-[104px] rounded-[8px] border p-3 text-left transition-all duration-500"
      style={{
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected ? "rgba(228,198,138,0.13)" : "var(--hint-card-surface-muted)",
        boxShadow: selected ? "0 0 24px rgba(228,198,138,0.12)" : "none",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="font-serif text-[19px] leading-none"
            style={{ color: selected ? IVORY.primary : IVORY.strong, textShadow: TEXT_HALO.soft }}
          >
            {label}
          </p>
          <p className="mt-2 font-sans text-[12px] leading-relaxed" style={{ color: IVORY.mute }}>
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
      className="grid min-h-[72px] grid-cols-[42px_1fr_auto] items-center gap-3 rounded-[8px] border p-3 text-left transition-all duration-500"
      style={{
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected ? "rgba(228,198,138,0.11)" : "var(--hint-card-surface-muted)",
      }}
    >
      <span
        className="h-10 w-10 rounded-[8px] border"
        style={{
          background: preview,
          borderColor: selected ? "rgba(228,198,138,0.5)" : "var(--hint-border)",
          boxShadow: selected ? "0 0 18px rgba(228,198,138,0.15)" : "none",
        }}
      />
      <span>
        <span className="block font-sans text-[13px] font-semibold" style={{ color: IVORY.strong }}>
          {label}
        </span>
        <span className="mt-1 block font-sans text-[11px] leading-snug" style={{ color: IVORY.dim }}>
          {description}
        </span>
      </span>
      {selected && <Check size={15} style={{ color: GOLD.ink }} />}
    </button>
  );
}

function MethodCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div
      className="rounded-[8px] border p-3"
      style={{
        borderColor: "var(--hint-border)",
        background: "var(--hint-card-surface-muted)",
      }}
    >
      <p className="font-sans text-[13px] font-semibold" style={{ color: IVORY.strong }}>
        {title}
      </p>
      <p className="mt-1 font-sans text-[11px] leading-relaxed" style={{ color: IVORY.dim }}>
        {body}
      </p>
    </div>
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
      className={`${compact ? "h-[98px]" : "h-[132px]"} relative overflow-hidden rounded-[8px]`}
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

function SpreadPreviewButton({
  spread,
  selected,
  onClick,
  cardLabel,
  selectableLabel,
}: {
  spread: SpreadChoice;
  selected: boolean;
  onClick: () => void;
  cardLabel: string;
  selectableLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[8px] border p-3 text-left transition-all duration-500"
      style={{
        borderColor: selected ? GOLD.edge : "var(--hint-border)",
        background: selected ? "rgba(228,198,138,0.12)" : "var(--hint-card-surface-muted)",
        boxShadow: selected ? "0 0 24px rgba(228,198,138,0.10)" : "none",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-sans text-[15px] font-semibold leading-snug" style={{ color: IVORY.strong }}>
            {spread.label}
          </p>
          <p className="mt-1 line-clamp-2 font-sans text-[11px] leading-snug" style={{ color: IVORY.dim }}>
            {spread.description}
          </p>
        </div>
        {selected && <Check size={15} style={{ color: GOLD.ink }} />}
      </div>

      <div className="mt-3">
        <SpreadDiagram layout={spread.layout} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: IVORY.body, borderColor: "rgba(228,198,138,0.22)" }}>
          {spread.cardCount} {cardLabel}
        </span>
        <span className="rounded-full border px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: IVORY.body, borderColor: "rgba(228,198,138,0.22)" }}>
          {selectableLabel}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 font-sans text-[11px] leading-relaxed" style={{ color: IVORY.mute }}>
        {spread.bestFor}
      </p>
      <p className="mt-2 line-clamp-2 font-sans text-[10px] leading-relaxed" style={{ color: IVORY.dim }}>
        {spread.positionLabels.map((label, index) => `${index + 1}. ${label}`).join("  /  ")}
      </p>
    </button>
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

export function RoomSetup({ onStart }: Props) {
  const { t } = useLanguage();
  const [setup, setSetup] = useState<TarotRoomSetup>(DEFAULT_TAROT_ROOM_SETUP);
  const coreSpreads = useMemo(
    () => SPREAD_CHOICES.filter((spread) => CORE_SPREAD_IDS.includes(spread.id)).map((spread) => translateSpread(spread, t)),
    [t],
  );
  const specializedSpreads = useMemo(
    () => SPREAD_CHOICES.filter((spread) => !CORE_SPREAD_IDS.includes(spread.id)).map((spread) => translateSpread(spread, t)),
    [t],
  );

  const selectedSpread = useMemo(
    () => translateSpread(SPREAD_CHOICES.find((item) => item.id === setup.spreadType) ?? SPREAD_CHOICES[0]!, t),
    [setup.spreadType, t],
  );

  const choosePreset = (preset: RoomPreset) => {
    setSetup(preset.setup);
  };

  const chooseDeck = (deckStyleId: DeckStyleId) => {
    setSetup((current) => ({
      ...current,
      deckStyleId,
      cardColor: deckColorLabel(deckStyleId),
    }));
  };

  const chooseBackground = (backgroundId: RoomBackgroundId) => {
    setSetup((current) => ({ ...current, backgroundId }));
  };

  const chooseSpread = (spreadType: SpreadType) => {
    setSetup((current) => ({ ...current, spreadType }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="flex w-full max-w-[860px] flex-col px-4"
    >
      <div
        className="relative max-h-[86vh] overflow-y-auto rounded-[8px] border"
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

        <div className="relative space-y-7 p-5 sm:p-6">
          <header className="flex items-start justify-between gap-4">
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
                className="mt-3 font-serif text-[36px] leading-none sm:text-[44px]"
                style={{ color: IVORY.primary, textShadow: TEXT_HALO.strong }}
              >
                {t("tarot.setup.title")}
              </h1>
              <p className="mt-3 max-w-md font-sans text-[13px] leading-relaxed" style={{ color: IVORY.mute }}>
                {t("tarot.setup.body")}
              </p>
            </div>
          </header>

          <SetupSection icon={<Sparkles size={15} />} title={t("tarot.setup.presets")}>
            <div className="grid gap-2 sm:grid-cols-3">
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

          <div className="grid gap-7 sm:grid-cols-2">
            <SetupSection icon={<Palette size={15} />} title={t("tarot.setup.deck")}>
              <div className="grid gap-2">
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

            <SetupSection icon={<Image size={15} />} title={t("tarot.setup.background")}>
              <div className="grid gap-2">
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

          <SetupSection icon={<Layers size={15} />} title={t("tarot.setup.spread")}>
            <p className="font-sans text-[12px] leading-relaxed" style={{ color: IVORY.mute }}>
              {t("tarot.spreadChooser.body")}
            </p>
            <div className="space-y-3">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: IVORY.dim }}>
                {t("tarot.spreadChooser.quick")}
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {coreSpreads.map((spread) => (
                  <SpreadPreviewButton
                    key={spread.id}
                    spread={spread}
                    selected={setup.spreadType === spread.id}
                    onClick={() => chooseSpread(spread.id)}
                    cardLabel={spread.cardCount === 1 ? t("tarot.spreadChooser.card") : t("tarot.spreadChooser.cards")}
                    selectableLabel={t("tarot.spreadChooser.selectable")}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: IVORY.dim }}>
                {t("tarot.spreadChooser.loveLibrary")}
              </p>
              <div
                className="rounded-[8px] border p-4"
                style={{
                  borderColor: "var(--hint-border)",
                  background: "var(--hint-card-surface-muted)",
                }}
              >
                <p className="font-sans text-[12px] leading-relaxed" style={{ color: IVORY.mute }}>
                  {t("tarot.library.body")}
                </p>
                <p className="mt-2 font-sans text-[11px] leading-relaxed" style={{ color: IVORY.dim }}>
                  {t("tarot.library.referenceBody")}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {specializedSpreads.map((spread) => (
                  <SpreadPreviewButton
                    key={spread.id}
                    spread={spread}
                    selected={setup.spreadType === spread.id}
                    onClick={() => chooseSpread(spread.id)}
                    cardLabel={spread.cardCount === 1 ? t("tarot.spreadChooser.card") : t("tarot.spreadChooser.cards")}
                    selectableLabel={t("tarot.spreadChooser.selectable")}
                  />
                ))}
              </div>
            </div>
            <p className="font-sans text-[13px] leading-relaxed" style={{ color: IVORY.mute }}>
              {t(`tarot.spread.${selectedSpread.id}.positions`)}
            </p>
          </SetupSection>

          <SetupSection icon={<Shuffle size={15} />} title={t("tarot.method.title")}>
            <div className="grid gap-2 sm:grid-cols-2">
              {METHOD_STEPS.map((step) => (
                <MethodCard
                  key={step}
                  title={t(`tarot.method.${step}.title`)}
                  body={t(`tarot.method.${step}.body`)}
                />
              ))}
            </div>
          </SetupSection>

          <footer
            className="flex flex-col gap-3 rounded-[8px] border p-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              borderColor: "var(--hint-border)",
              background: "var(--hint-card-surface-muted)",
            }}
          >
            <div>
              <p className="font-sans text-[11px] uppercase tracking-[0.18em]" style={{ color: IVORY.dim }}>
                {t("tarot.setup.ready")}
              </p>
              <p className="mt-1 font-sans text-[13px]" style={{ color: IVORY.strong }}>
                {t(`tarot.deck.${setup.deckStyleId}.color`)} / {t(`tarot.spread.${selectedSpread.id}.label`)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStart(setup)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border px-5 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] transition-all duration-500 hover:opacity-90"
              style={{
                color: IVORY.primary,
                borderColor: GOLD.edge,
                background:
                  "linear-gradient(135deg, rgba(228,198,138,0.18), rgba(64,224,208,0.10))",
                boxShadow: "0 0 24px rgba(228,198,138,0.10)",
              }}
            >
              {t("tarot.setup.enter")}
              <ChevronRight size={15} />
            </button>
          </footer>
        </div>
      </div>
    </motion.div>
  );
}
