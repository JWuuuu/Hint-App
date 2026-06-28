import type {
  ModuleDefinition,
  SectionDefinition,
  SectionKey,
} from "../types/home.types";
import {
  AskSigil,
  JournalSigil,
  MoodSigil,
  DailyPullSigil,
  AvoidingSigil,
  TarotSigil,
  OneCardSigil,
  SpreadSigil,
  DrawAgainSigil,
  ArchiveSigil,
  CompatibilitySigil,
  RelationshipEnergySigil,
  YouThemSigil,
  UnfinishedSigil,
  NatalSigil,
  ReportSigil,
  MoonPhaseSigil,
  InnerTypeSigil,
  ShadowSigil,
  FutureSelfSigil,
  DreamSigil,
  PatternSigil,
  EnergySigil,
  StepSigil,
  ClaritySigil,
  WeeklySigil,
} from "./sigils";

/* ── Sections ──────────────────────────────────────────────────
   Six rooms-of-rooms. Order is the order they appear in the home
   rail and the All Rooms library. */

export const SECTIONS: SectionDefinition[] = [
  {
    key: "reflection",
    label: "Reflection",
    intro: "Say it, or just sit with it. The room is listening either way.",
  },
  {
    key: "tarot",
    label: "Tarot",
    intro: "Sit with what you brought. Let the cards do the talking.",
  },
  {
    key: "relationships",
    label: "Relationships",
    intro: "The people in the room you're not in.",
  },
  {
    key: "astrology",
    label: "Astrology",
    intro: "Your night sky, read from the inside.",
  },
  {
    key: "inner-self",
    label: "Inner Self",
    intro: "The parts of you that don't post.",
  },
  {
    key: "growth",
    label: "Growth",
    intro: "The slow becoming — hard to see from the inside.",
  },
];

const soon = (over?: string) => ({ href: null, lockedNote: over ?? "soon" });

export const HOME_MODULES: ModuleDefinition[] = [
  /* ── Reflection ── */
  {
    id: "ask",
    title: "Ask Hint",
    hint: "Say it out loud, even if quietly.",
    href: "/app/ask",
    sigil: AskSigil,
    section: "reflection",
  },
  {
    id: "journal",
    title: "Emotional Journal",
    hint: "A private page that listens back.",
    href: "/app/journal",
    sigil: JournalSigil,
    section: "reflection",
  },
  {
    id: "tonights-mood",
    title: "Tonight's Mood",
    hint: "Name the weather inside you.",
    ...soon(),
    sigil: MoodSigil,
    section: "reflection",
  },
  {
    id: "daily-pull",
    title: "Daily Draw",
    hint: "Your Sky Deck card, score, and small action for today.",
    href: "/app/daily",
    sigil: DailyPullSigil,
    section: "reflection",
  },
  {
    id: "avoiding",
    title: "What You're Avoiding",
    hint: "The thing you keep walking around.",
    ...soon(),
    sigil: AvoidingSigil,
    section: "reflection",
  },

  /* ── Tarot ── */
  {
    id: "tarot",
    title: "Tarot Room",
    hint: "Sit with what you brought.",
    href: "/app/tarot",
    sigil: TarotSigil,
    section: "tarot",
  },
  {
    id: "animal-tarot",
    title: "Animal Tarot",
    hint: "A gentler pull through instinct and symbols.",
    href: "/app/animal-tarot",
    sigil: DailyPullSigil,
    section: "tarot",
  },
  {
    id: "one-card",
    title: "One Card",
    hint: "A single card, turned in private.",
    ...soon(),
    sigil: OneCardSigil,
    section: "tarot",
  },
  {
    id: "relationship-spread",
    title: "Relationship Spread",
    hint: "Three cards for two people.",
    ...soon(),
    sigil: SpreadSigil,
    section: "tarot",
  },
  {
    id: "draw-again",
    title: "Draw Again",
    hint: "When the first answer wasn't it.",
    ...soon(),
    sigil: DrawAgainSigil,
    section: "tarot",
  },
  {
    id: "card-archive",
    title: "Card Collection",
    hint: "Every card you've met, kept in the deck.",
    href: "/app/collection",
    sigil: ArchiveSigil,
    section: "tarot",
  },

  /* ── Relationships ── */
  {
    id: "compatibility",
    title: "Compatibility",
    hint: "Two charts in the same room.",
    href: "/app/compatibility",
    sigil: CompatibilitySigil,
    section: "relationships",
  },
  {
    id: "relationship-energy",
    title: "Relationship Energy",
    hint: "Where it stands, without asking.",
    ...soon(),
    sigil: RelationshipEnergySigil,
    section: "relationships",
  },
  {
    id: "you-and-them",
    title: "You & Them",
    hint: "The space between two people.",
    ...soon(),
    sigil: YouThemSigil,
    section: "relationships",
  },
  {
    id: "unfinished",
    title: "Unfinished Feelings",
    hint: "What never got to land.",
    ...soon(),
    sigil: UnfinishedSigil,
    section: "relationships",
  },

  /* ── Astrology ── */
  {
    id: "natal",
    title: "Birth Chart",
    hint: "Your personal sky map.",
    href: "/app/astrology",
    sigil: NatalSigil,
    section: "astrology",
  },
  {
    id: "birth-chart-report",
    title: "Birth Chart Report",
    hint: "The long read of your sky.",
    ...soon(),
    sigil: ReportSigil,
    section: "astrology",
  },
  {
    id: "moon-phase",
    title: "Moon Phase",
    hint: "What the moon is doing to you tonight.",
    ...soon(),
    sigil: MoonPhaseSigil,
    section: "astrology",
  },
  /* ── Inner Self ── */
  {
    id: "personality",
    title: "Personalities",
    hint: "Your inner types and patterns.",
    href: "/app/personalities",
    sigil: InnerTypeSigil,
    section: "inner-self",
  },
  {
    id: "shadow",
    title: "Shadow Self",
    hint: "The parts that don't perform.",
    ...soon(),
    sigil: ShadowSigil,
    section: "inner-self",
  },
  {
    id: "future-self",
    title: "Future Self",
    hint: "A letter from a year from now.",
    ...soon(),
    sigil: FutureSelfSigil,
    section: "inner-self",
  },
  {
    id: "dreams",
    title: "Dreams",
    hint: "Tell me what you saw.",
    href: "/app/dream",
    sigil: DreamSigil,
    section: "inner-self",
  },
  {
    id: "emotional-pattern",
    title: "Emotional Pattern",
    hint: "The shape your weeks keep making.",
    ...soon(),
    sigil: PatternSigil,
    section: "inner-self",
  },

  /* ── Growth ── */
  {
    id: "energy-task",
    title: "Energy Task",
    hint: "One thing to move what's stuck.",
    ...soon(),
    sigil: EnergySigil,
    section: "growth",
  },
  {
    id: "meditation",
    title: "Meditation",
    hint: "A quiet reset for your nervous system.",
    ...soon(),
    sigil: MoodSigil,
    section: "growth",
  },
  {
    id: "small-step",
    title: "Small Step Tonight",
    hint: "Something gentle before sleep.",
    ...soon(),
    sigil: StepSigil,
    section: "growth",
  },
  {
    id: "clarity-report",
    title: "Clarity Report",
    hint: "Where the fog is, and where it lifts.",
    ...soon(),
    sigil: ClaritySigil,
    section: "growth",
  },
  {
    id: "weekly-reflection",
    title: "Weekly Reflection",
    hint: "Seven nights, read as one.",
    ...soon(),
    sigil: WeeklySigil,
    section: "growth",
  },
];

/** IDs surfaced in the compact home rail (live first, then notable rooms). */
const FEATURED_IDS = [
  "daily-pull",
  "natal",
  "animal-tarot",
  "meditation",
];

const SOON_IDS = [
  "tonights-mood",
  "one-card",
  "relationship-spread",
  "relationship-energy",
  "moon-phase",
  "personality",
  "small-step",
];

/** Title overrides for the home grid (broader, more app-like labels). */
const FEATURED_TITLES: Record<string, string> = {
  "daily-pull": "Daily Draw",
  natal: "Birth Chart",
};

/** A curated, ordered subset for the home dashboard rail. */
export function getFeaturedModules(): ModuleDefinition[] {
  const byId = new Map(HOME_MODULES.map((m) => [m.id, m]));
  const tiles = FEATURED_IDS.map((id) => byId.get(id))
    .filter((m): m is ModuleDefinition => Boolean(m))
    .map((m) =>
      FEATURED_TITLES[m.id] ? { ...m, title: FEATURED_TITLES[m.id]! } : m,
    );
  return tiles;
}

/** Unfinished ideas that should be visible without competing with live paths. */
export function getSoonModules(): ModuleDefinition[] {
  const byId = new Map(HOME_MODULES.map((m) => [m.id, m]));
  return SOON_IDS.map((id) => byId.get(id)).filter(
    (m): m is ModuleDefinition => Boolean(m),
  );
}

/** Modules grouped by section, in SECTIONS order. Empty sections omitted. */
export function getModulesBySection(): Array<{
  section: SectionDefinition;
  modules: ModuleDefinition[];
}> {
  const map = new Map<SectionKey, ModuleDefinition[]>();
  for (const m of HOME_MODULES) {
    const arr = map.get(m.section) ?? [];
    arr.push(m);
    map.set(m.section, arr);
  }
  return SECTIONS.filter((s) => map.has(s.key)).map((section) => ({
    section,
    modules: map.get(section.key) ?? [],
  }));
}
