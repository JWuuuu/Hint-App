import { useMemo, useState } from "react";
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
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import { getAnonId, getLocalDateString } from "../../lib/identity";
import { RITUAL_TAROT_DECK } from "../../modules/tarot/logic/createHiddenDeck";
import { getTarotCardImage } from "../../modules/tarot/logic/cardImageMap";
import { saveLocalCollectionUnlock } from "../../shared/tarot/cardCollection";
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

type LocalAnimalReceipt = {
  anonId: string;
  dayKey: string;
  animalId: string;
  assignedAt: string;
  expiresAt: string;
  openedAt?: string;
  lastSeenAt?: string;
};

type DrawPhase = "intro" | "revealing" | "revealed";

const LOCAL_ANIMAL_RECEIPTS_KEY = "hint_animal_tarot_receipts_v1";
const EMBER = "#f1a66b";

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

function nextLocalMidnight(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

function readAnimalReceipts(): LocalAnimalReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_ANIMAL_RECEIPTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAnimalReceipts(receipts: LocalAnimalReceipt[]) {
  try {
    window.localStorage.setItem(LOCAL_ANIMAL_RECEIPTS_KEY, JSON.stringify(receipts));
  } catch {
    // Local animal receipts are best effort until this feature gets server receipts.
  }
}

function animalForReceipt(anonId: string, dayKey: string): AnimalSpirit {
  const index = hashString(`${anonId}:${dayKey}:animal-tarot`) % ANIMAL_SPIRITS.length;
  return ANIMAL_SPIRITS[index] ?? ANIMAL_SPIRITS[0]!;
}

function getOrCreateAnimalReceipt(anonId = getAnonId(), now = new Date()): LocalAnimalReceipt {
  const dayKey = getLocalDateString(now);
  const existing = readAnimalReceipts().find((item) => item.anonId === anonId && item.dayKey === dayKey);
  if (existing) return existing;

  const animal = animalForReceipt(anonId, dayKey);
  const receipt: LocalAnimalReceipt = {
    anonId,
    dayKey,
    animalId: animal.id,
    assignedAt: now.toISOString(),
    expiresAt: nextLocalMidnight(now).toISOString(),
    lastSeenAt: now.toISOString(),
  };

  writeAnimalReceipts([
    receipt,
    ...readAnimalReceipts().filter((item) => !(item.anonId === anonId && item.dayKey === dayKey)),
  ].slice(0, 90));

  return receipt;
}

function openAnimalReceipt(receipt: LocalAnimalReceipt, now = new Date()): LocalAnimalReceipt {
  const opened: LocalAnimalReceipt = {
    ...receipt,
    openedAt: receipt.openedAt ?? now.toISOString(),
    lastSeenAt: now.toISOString(),
  };

  writeAnimalReceipts([
    opened,
    ...readAnimalReceipts().filter((item) => !(item.anonId === opened.anonId && item.dayKey === opened.dayKey)),
  ].slice(0, 90));

  return opened;
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

function loadInitialReceipt() {
  const receipt = getOrCreateAnimalReceipt();
  return {
    receipt,
    phase: receipt.openedAt ? "revealed" as DrawPhase : "intro" as DrawPhase,
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
        {cardImage && <img src={cardImage} alt="" aria-hidden="true" />}
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
    <div className="rounded-[16px] border px-4 py-3" style={{ borderColor: GLASS.border, background: "rgba(255,255,255,0.035)" }}>
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
  const initial = useMemo(loadInitialReceipt, []);
  const [receipt, setReceipt] = useState(initial.receipt);
  const [phase, setPhase] = useState<DrawPhase>(initial.phase);
  const [saved, setSaved] = useState(false);

  const animal = getAnimalById(receipt.animalId);
  const companion = companionCard(animal.companionCardId);
  const revealed = phase === "revealed";
  const revealing = phase === "revealing";
  const canReplay = Boolean(receipt.openedAt);

  function drawAnimal() {
    setSaved(false);
    setPhase("revealing");
    window.setTimeout(() => {
      const opened = openAnimalReceipt(receipt);
      setReceipt(opened);
      setPhase("revealed");
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
      <header className="animal-tarot-hero mb-6">
        <div className="animal-hero-orbit" aria-hidden />
        <div className="relative z-10">
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ACCENT.gold }}>
            Animal Tarot
          </p>
          <h1 className="mt-2 font-serif text-[34px] leading-none sm:text-[42px]" style={{ color: GLASS.text }}>
            Animal Terrace
          </h1>
          <p className="mt-3 max-w-2xl font-sans text-[13px] leading-relaxed sm:text-[14px]" style={{ color: GLASS.muted }}>
            Draw the animal walking with you today. The card stays with this local session until tomorrow and can be wired to server receipts later.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Instinct", "Emotion", "Today"].map((item) => (
              <span
                key={item}
                className="rounded-full border px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.14em]"
                style={{ color: GLASS.text, borderColor: GLASS.border, background: "rgba(255,255,255,0.04)" }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </header>

      <GlassPanel hero className="animal-tarot-stage" padded={false}>
        <div className="animal-stage-sky" aria-hidden />
        <div className="relative z-10 grid gap-7 p-5 sm:p-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:p-7">
          <div className="animal-card-stage">
            {(revealing || revealed) && <div className="animal-burst-rings" aria-hidden />}
            <SpiritCard animal={animal} cardImage={companion.image} revealed={revealed || revealing} />
          </div>

          <div>
            <SectionLabel>{revealed ? animal.title : "Mystical animal ritual"}</SectionLabel>
            {!revealed && !revealing && (
              <>
                <h2 className="font-serif text-[32px] leading-tight sm:text-[38px]" style={{ color: GLASS.text }}>
                  Let one animal step forward.
                </h2>
                <p className="mt-4 max-w-lg font-sans text-[14px] leading-relaxed" style={{ color: GLASS.muted }}>
                  This is not a childish animal picker. Treat it like an instinct card: one animal, one companion tarot card, one clean message for today.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ["1", "Hold the question loosely"],
                    ["2", "Draw one animal"],
                    ["3", "Use the prompt today"],
                  ].map(([step, copy]) => (
                    <div key={step} className="rounded-[16px] border px-3 py-3" style={{ borderColor: GLASS.border, background: "rgba(255,255,255,0.035)" }}>
                      <span className="font-serif text-[22px]" style={{ color: ACCENT.gold }}>{step}</span>
                      <p className="mt-1 font-sans text-[11px] leading-snug" style={{ color: GLASS.muted }}>{copy}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {revealing && (
              <div className="py-6">
                <h2 className="font-serif text-[34px] leading-tight" style={{ color: GLASS.text }}>
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
                    <h2 className="mt-1 font-serif text-[42px] leading-none" style={{ color: GLASS.text }}>
                      {animal.name}
                    </h2>
                  </div>
                  <div className="rounded-full border px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ACCENT.gold, borderColor: "rgba(206,178,110,0.28)", background: "rgba(206,178,110,0.08)" }}>
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

            <div className="mt-6 flex flex-wrap gap-3">
              {!revealing && !revealed && (
                <button type="button" onClick={drawAnimal} className="animal-primary-button">
                  <Sparkles size={16} />
                  Draw animal card
                </button>
              )}
              {revealing && (
                <button type="button" className="animal-primary-button is-loading" disabled>
                  <Moon size={16} />
                  Revealing
                </button>
              )}
              {revealed && (
                <>
                  <button type="button" onClick={saveToCollection} className="animal-primary-button">
                    {saved ? <Check size={16} /> : <Bookmark size={16} />}
                    {saved ? "Saved locally" : "Save to Collection"}
                  </button>
                  <button type="button" onClick={canReplay ? replayReveal : drawAnimal} className="animal-secondary-button">
                    <RefreshCcw size={15} />
                    Replay reveal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </GlassPanel>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/app/tarot" className="animal-action-card">
          <Sparkles size={17} />
          <span>Draw in Tarot Room</span>
        </Link>
        <Link href="/app/sky-deck" className="animal-action-card">
          <Moon size={17} />
          <span>Open Sky Deck</span>
        </Link>
        <Link href="/app/collection" className="animal-action-card">
          <Bookmark size={17} />
          <span>Open Collection</span>
        </Link>
        <Link href="/ask" className="animal-action-card">
          <MessageCircle size={17} />
          <span>Ask Hint</span>
        </Link>
      </section>
    </AppScreen>
  );
}
