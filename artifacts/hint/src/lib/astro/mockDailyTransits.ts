import type { BirthProfile, DailyTransit } from "../../types/astrology";
import { hashAstroSeed } from "./mockAstroData";

const TRANSIT_LIBRARY: Array<Omit<DailyTransit, "id" | "period" | "startsAt" | "endsAt">> = [
  {
    label: "Moon trine Venus",
    bodies: ["moon", "venus"],
    aspect: "trine",
    house: 5,
    strength: 84,
    themes: ["emotional ease", "soft contact", "beauty"],
    emotionalTheme: "A softer signal wants contact without pressure.",
    affectedArea: "Love, creativity, and the way you ask for warmth.",
    do: "Send one honest message or make the room more beautiful.",
    dont: "Do not turn a small delay into proof that nothing is there.",
    why: "The Moon describes the day mood and Venus describes attachment, pleasure, and attraction. A trine reads as support rather than force.",
  },
  {
    label: "Mercury square Saturn",
    bodies: ["mercury", "saturn"],
    aspect: "square",
    house: 3,
    strength: 78,
    themes: ["communication", "delay", "precision"],
    emotionalTheme: "Words may feel heavier, but cleaner boundaries help.",
    affectedArea: "Messages, decisions, and conversations that need structure.",
    do: "Make the request specific and short.",
    dont: "Do not over-explain to earn a simple answer.",
    why: "Mercury governs language and Saturn governs limits. A square adds friction, which makes precision more useful than volume.",
  },
  {
    label: "Sun sextile Jupiter",
    bodies: ["sun", "jupiter"],
    aspect: "sextile",
    house: 10,
    strength: 73,
    themes: ["confidence", "growth", "direction"],
    emotionalTheme: "A practical opportunity opens when you act visibly.",
    affectedArea: "Work, reputation, and long-range choices.",
    do: "Take one visible step toward the bigger plan.",
    dont: "Do not wait until the plan feels grand enough.",
    why: "The Sun describes focus and Jupiter describes growth. A sextile is usable support: it rewards one concrete move.",
  },
  {
    label: "Mars opposite Moon",
    bodies: ["mars", "moon"],
    aspect: "opposite",
    house: 7,
    strength: 69,
    themes: ["reactivity", "desire", "relationship mirror"],
    emotionalTheme: "Fast reactions may be covering a more tender need.",
    affectedArea: "Partnership, attraction, and conflict pacing.",
    do: "Pause before replying and name the real need.",
    dont: "Do not confuse urgency with truth.",
    why: "Mars pushes and the Moon protects. An opposition can make another person feel like the mirror for an inner conflict.",
  },
];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildMockDailyTransits(profile: BirthProfile | null, date = new Date()): DailyTransit[] {
  const seed = hashAstroSeed(`${profile?.id ?? "guest"}|${isoDate(date)}`);
  const first = seed % TRANSIT_LIBRARY.length;
  const ordered = [TRANSIT_LIBRARY[first]!, ...TRANSIT_LIBRARY.filter((_, index) => index !== first)];
  return ordered.map((transit, index) => {
    const startsAt = new Date(date);
    startsAt.setHours(6 + index * 3, 0, 0, 0);
    const endsAt = new Date(startsAt);
    endsAt.setHours(startsAt.getHours() + 6);
    return {
      ...transit,
      id: `mock-transit-${isoDate(date)}-${index}`,
      strength: Math.max(52, Math.min(92, transit.strength + ((seed + index * 7) % 9) - 4)),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      period: {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        label: index === 0 ? "Strongest today" : "Supporting transit",
      },
    };
  });
}
