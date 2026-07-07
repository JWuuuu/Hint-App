import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Bird,
  Bookmark,
  Cat,
  Check,
  Compass,
  Feather,
  MessageCircle,
  Moon,
  PawPrint,
  Rabbit,
  RefreshCcw,
  Shield,
  Sparkles,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppScreen, GlassPanel, ScreenHeader, SectionLabel } from "../../components/app/AppChrome";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import { getAnonId, getLocalDateString } from "../../lib/identity";
import {
  getOrCreateDailyReceipt,
  openDailyReceipt,
  type DailyReceipt,
} from "../../lib/dailyReceipts";
import { RITUAL_TAROT_DECK } from "../../modules/tarot/logic/createHiddenDeck";
import { getTarotCardImage } from "../../modules/tarot/logic/cardImageMap";
import { saveLocalCollectionUnlock } from "../../shared/tarot/cardCollection";
import { SafeImage } from "../../shared/ui/SafeImage";
import "./animal-tarot.css";

type AnimalSpirit = {
  id: string;
  name: string;
  title: string;
  icon: LucideIcon;
  aura: string;
  companionCardId: string;
  emotionalMeaning: string;
  todaysMessage: string;
  reflectionPrompt: string;
  task: string;
};

type DrawPhase = "loading" | "intro" | "revealing" | "revealed";

const EMBER = "var(--hint-rose, #f0b6cf)";

const ANIMAL_SPIRITS: AnimalSpirit[] = [
  {
    id: "moon-moth",
    name: "Moon Moth",
    title: "Soft signal",
    icon: Feather,
    aura: "#b8d7ff",
    companionCardId: "2-high-priestess",
    emotionalMeaning: "You are picking up a quiet truth before it has words.",
    todaysMessage: "Move toward the thing that keeps glowing after everything else gets loud.",
    reflectionPrompt: "What small signal has been repeating, even when you try to ignore it?",
    task: "Choose one quiet action before asking for another sign.",
  },
  {
    id: "black-cat",
    name: "Black Cat",
    title: "Threshold",
    icon: Cat,
    aura: "#cba6c4",
    companionCardId: "18-moon",
    emotionalMeaning: "Your instinct noticed a doorway before your mind named it.",
    todaysMessage: "Trust the pause. You do not need to cross every threshold the moment it appears.",
    reflectionPrompt: "Where is your body asking you to slow down before you answer?",
    task: "Wait one breath longer before replying to anything emotionally loaded.",
  },
  {
    id: "white-stag",
    name: "White Stag",
    title: "Direction",
    icon: Compass,
    aura: "#e8cc96",
    companionCardId: "7-chariot",
    emotionalMeaning: "Dignity is the compass. Performance is only noise.",
    todaysMessage: "Choose the path that lets you stand taller tomorrow.",
    reflectionPrompt: "Which option feels quieter but more self-respecting?",
    task: "Make one clean decision and leave the explanation short.",
  },
  {
    id: "night-swan",
    name: "Night Swan",
    title: "Release",
    icon: Bird,
    aura: "#8bded6",
    companionCardId: "13-death",
    emotionalMeaning: "Something can be graceful and still be complete.",
    todaysMessage: "Let the old shape leave cleanly. Do not keep touching the ending to prove it mattered.",
    reflectionPrompt: "What are you ready to stop carrying with both hands?",
    task: "Remove one reminder that keeps reopening the same feeling.",
  },
  {
    id: "amber-fox",
    name: "Amber Fox",
    title: "Strategy",
    icon: Wind,
    aura: "#f1a66b",
    companionCardId: "1-magician",
    emotionalMeaning: "You do not need more force. You need cleaner timing.",
    todaysMessage: "Move lightly. Say less, observe more, and use the opening that is already there.",
    reflectionPrompt: "Where would subtlety work better than pressure today?",
    task: "Take the smallest useful step without announcing it first.",
  },
  {
    id: "silver-rabbit",
    name: "Silver Rabbit",
    title: "Sensitivity",
    icon: Rabbit,
    aura: "#d8d4ff",
    companionCardId: "14-temperance",
    emotionalMeaning: "Your sensitivity is information, not weakness.",
    todaysMessage: "Protect your pace. The right thing will not require you to abandon your nervous system.",
    reflectionPrompt: "What boundary would make today feel breathable again?",
    task: "Create a soft limit around one draining conversation or task.",
  },
  {
    id: "golden-lion",
    name: "Golden Lion",
    title: "Courage",
    icon: Shield,
    aura: "#ffd16f",
    companionCardId: "8-strength",
    emotionalMeaning: "Real courage is steady, not loud.",
    todaysMessage: "Hold your ground without hardening your heart.",
    reflectionPrompt: "What would calm confidence choose here?",
    task: "Name your position once, clearly, and do not negotiate with panic.",
  },
];

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function fallbackAnimalId(anonId = getAnonId(), dayKey = getLocalDateString()): AnimalSpirit["id"] {
  const index = hashString(`${anonId}:${dayKey}:animal-tarot`) % ANIMAL_SPIRITS.length;
  return (ANIMAL_SPIRITS[index] ?? ANIMAL_SPIRITS[0]!).id;
}

function getAnimalById(id: string): AnimalSpirit {
  return ANIMAL_SPIRITS.find((animal) => animal.id === id) ?? ANIMAL_SPIRITS[0]!;
}

function companionCard(cardId: string) {
  const card = RITUAL_TAROT_DECK.find((item) => item.cardId === cardId) ?? RITUAL_TAROT_DECK[0]!;
  return {
    ...card,
    image: getTarotCardImage(card.cardId, "hint-card-2") ?? getTarotCardImage(card.cardId),
  };
}

function SpiritCard({
  animal,
  cardImage,
  revealed,
  compact = false,
}: {
  animal: AnimalSpirit;
  cardImage: string | null;
  revealed: boolean;
  compact?: boolean;
}) {
  const Icon = animal.icon;
  return (
    <div className={`animal-spirit-card ${revealed ? "is-revealed" : ""} ${compact ? "is-compact" : ""}`}>
      <div className="animal-card-aura" style={{ background: animal.aura }} />
      <div className="animal-card-face animal-card-back">
        <div className="animal-card-inner-ring" />
        <PawPrint size={compact ? 26 : 34} strokeWidth={1.5} />
        <span>Animal Tarot</span>
      </div>
      <div className="animal-card-face animal-card-front">
        {cardImage && (
          <SafeImage
            src={cardImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fallbackClassName="absolute inset-0 h-full w-full rounded-[20px]"
            fallbackLabel="Spirit"
          />
        )}
        <div className="animal-card-veils" />
        <div className="animal-card-symbol" style={{ borderColor: animal.aura, color: animal.aura }}>
          <Icon size={compact ? 28 : 38} strokeWidth={1.45} />
        </div>
        <div className="animal-card-copy">
          <span>{animal.title}</span>
          <strong>{animal.name}</strong>
        </div>
      </div>
    </div>
  );
}

function ReadingBlock({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <div className="hint-subtle-card rounded-[18px] px-4 py-3">
      <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: GLASS.faint }}>
        {label}
      </p>
      <p className="mt-2 font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
        {children}
      </p>
    </div>
  );
}

export function AnimalTarotView() {
  const anonId = useMemo(() => getAnonId(), []);
  const fallbackAssignedCardId = useMemo(() => fallbackAnimalId(anonId), [anonId]);
  const [receipt, setReceipt] = useState<DailyReceipt | null>(null);
  const [phase, setPhase] = useState<DrawPhase>("loading");
  const [saved, setSaved] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPhase("loading");
    getOrCreateDailyReceipt("animal-tarot", { anonId, fallbackAssignedCardId })
      .then((nextReceipt) => {
        if (cancelled) return;
        setReceipt(nextReceipt);
        setPhase(nextReceipt.openedAt ? "revealed" : "intro");
        setReceiptError(nextReceipt.source === "local-fallback"
          ? "This draw is saved on this device for today."
          : null);
      })
      .catch(() => {
        if (cancelled) return;
        setReceipt(null);
        setPhase("intro");
        setReceiptError("Animal Tarot will save this draw on this device for today.");
      });
    return () => {
      cancelled = true;
    };
  }, [anonId, fallbackAssignedCardId]);

  const animal = getAnimalById(receipt?.assignedCardId ?? fallbackAssignedCardId);
  const companion = companionCard(animal.companionCardId);
  const revealed = phase === "revealed";
  const revealing = phase === "revealing";
  const loading = phase === "loading";
  const canReplay = Boolean(receipt?.openedAt);
  const fallbackMode = receipt?.source === "local-fallback";

  function drawAnimal() {
    if (!receipt) {
      setReceiptError("Animal Tarot is preparing today's draw. Try again in a moment.");
      return;
    }
    setSaved(false);
    setPhase("revealing");
    window.setTimeout(() => {
      openDailyReceipt("animal-tarot", { anonId, fallbackAssignedCardId })
        .then((opened) => {
          setReceipt(opened);
          setReceiptError(opened.source === "local-fallback"
            ? "This opened draw is saved on this device for today."
            : null);
          setPhase("revealed");
        })
        .catch(() => {
          setReceiptError("Animal Tarot could not finish this draw. Try again in a moment.");
          setPhase(receipt.openedAt ? "revealed" : "intro");
        });
    }, 1280);
  }

  function replayReveal() {
    setSaved(false);
    setPhase("revealing");
    window.setTimeout(() => setPhase("revealed"), 1180);
  }

  function saveToCollection() {
    saveLocalCollectionUnlock(companion.cardId, "animal");
    setSaved(true);
  }

  return (
    <AppScreen>
      <ScreenHeader
        eyebrow="Animal Tarot"
        title="Animal Terrace"
        subtitle="One animal, one companion card, one clean message for today."
        sigil={PawPrint}
        backHref="/app"
        backLabel="Home"
      />

      <GlassPanel hero className="animal-tarot-stage" padded={false}>
        <div className="animal-stage-sky" aria-hidden />
        <div className="relative z-10 grid gap-4 p-4 sm:p-5">
          <div className="animal-card-stage">
            {(revealing || revealed) && <div className="animal-burst-rings" aria-hidden />}
            <SpiritCard animal={animal} cardImage={companion.image} revealed={revealed || revealing} />
          </div>

          <div>
            {receiptError && (
              <div className="hint-info-callout mb-4 rounded-[18px] px-4 py-3">
                <p className="font-sans text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: EMBER }}>
                  {fallbackMode ? "Saved for today" : "Draw is preparing"}
                </p>
                <p className="mt-1 font-sans text-[12px] leading-relaxed" style={{ color: GLASS.muted }}>
                  {receiptError}
                </p>
              </div>
            )}
            <SectionLabel>{revealed ? animal.title : "Mystical animal ritual"}</SectionLabel>
            {loading && (
              <div className="py-6">
                <h2 className="font-sans text-[24px] font-black leading-tight" style={{ color: GLASS.text }}>
                  Finding today’s animal.
                </h2>
                <p className="mt-4 font-sans text-[14px] leading-relaxed" style={{ color: GLASS.muted }}>
                  Preparing today’s locked draw.
                </p>
              </div>
            )}

            {!loading && !revealed && !revealing && (
              <>
                <h2 className="font-sans text-[24px] font-black leading-tight" style={{ color: GLASS.text }}>
                  Let one animal step forward.
                </h2>
                <p className="mt-3 max-w-lg font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
                  Treat it like an instinct card: one animal, one companion tarot card, one clean message for today.
                </p>
                <button type="button" onClick={drawAnimal} className="animal-primary-button hint-tap-sparkle mt-4" disabled={!receipt}>
                  <Sparkles size={16} />
                  Draw animal card
                </button>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    ["1", "Hold the question loosely"],
                    ["2", "Draw one animal"],
                    ["3", "Use the prompt today"],
                  ].map(([step, copy]) => (
                    <div key={step} className="hint-subtle-card hint-card-lift rounded-[18px] px-3 py-3">
                      <span className="font-serif text-[22px]" style={{ color: ACCENT.gold }}>{step}</span>
                      <p className="mt-1 font-sans text-[11px] leading-snug" style={{ color: GLASS.muted }}>{copy}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {revealing && (
              <div className="py-6">
                <h2 className="font-sans text-[24px] font-black leading-tight" style={{ color: GLASS.text }}>
                  The terrace is opening.
                </h2>
                <p className="mt-4 font-sans text-[14px] leading-relaxed" style={{ color: GLASS.muted }}>
                  The animal is stepping through the card. Stay with the first feeling you notice.
                </p>
              </div>
            )}

            {revealed && (
              <div className="animal-reading">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: ACCENT.aqua }}>
                      Today's animal
                    </p>
                    <h2 className="mt-1 font-sans text-[28px] font-black leading-none" style={{ color: GLASS.text }}>
                      {animal.name}
                    </h2>
                  </div>
                  <div className="hint-segment rounded-full px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.16em]" data-active="true">
                    Companion: {companion.name}
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <ReadingBlock label="Emotional meaning">{animal.emotionalMeaning}</ReadingBlock>
                  <ReadingBlock label="Today's message">{animal.todaysMessage}</ReadingBlock>
                  <ReadingBlock label="Reflection prompt">{animal.reflectionPrompt}</ReadingBlock>
                  <ReadingBlock label="Energy task">{animal.task}</ReadingBlock>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {loading && (
                <button type="button" className="animal-primary-button hint-tap-sparkle is-loading" disabled>
                  <Moon size={16} />
                  Loading lock
                </button>
              )}
              {revealing && (
                <button type="button" className="animal-primary-button hint-tap-sparkle is-loading" disabled>
                  <Moon size={16} />
                  Revealing
                </button>
              )}
              {revealed && (
                <>
                  <button type="button" onClick={saveToCollection} className="animal-primary-button hint-tap-sparkle">
                    {saved ? <Check size={16} /> : <Bookmark size={16} />}
                    {saved ? "Saved locally" : "Save to Collection"}
                  </button>
                  <button type="button" onClick={canReplay ? replayReveal : drawAnimal} className="animal-secondary-button hint-tap-sparkle">
                    <RefreshCcw size={15} />
                    Replay reveal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </GlassPanel>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/app/tarot" className="animal-action-card hint-tap-sparkle hint-card-lift">
          <Sparkles size={17} />
          <span>Draw in Tarot Room</span>
        </Link>
        <Link href="/app/daily" className="animal-action-card hint-tap-sparkle hint-card-lift">
          <Moon size={17} />
          <span>Open Daily Draw</span>
        </Link>
        <Link href="/app/collection" className="animal-action-card hint-tap-sparkle hint-card-lift">
          <Bookmark size={17} />
          <span>Open Collection</span>
        </Link>
        <Link href="/app/ask" className="animal-action-card hint-tap-sparkle hint-card-lift">
          <MessageCircle size={17} />
          <span>Ask Hint</span>
        </Link>
      </section>
    </AppScreen>
  );
}
