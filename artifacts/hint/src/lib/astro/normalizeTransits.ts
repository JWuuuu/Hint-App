import type { DailyTransit } from "./providers/types";
import type { SkySignal } from "../tarot/skyGuidedTarot";
import type { TarotTheme } from "../tarot/tarotThemeMap";
import { ASPECT_THEMES, HOUSE_THEMES, PLANET_THEMES } from "../tarot/tarotThemeMap";

function hasRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function numberFrom(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function themesForTransit(transit: Pick<DailyTransit, "bodies" | "aspect" | "house" | "themes">): TarotTheme[] {
  return Array.from(
    new Set([
      ...transit.themes,
      ...transit.bodies.flatMap((body) => PLANET_THEMES[body.toLowerCase()] ?? []),
      ...(transit.aspect ? ASPECT_THEMES[transit.aspect] ?? [] : []),
      ...(transit.house ? HOUSE_THEMES[transit.house] ?? [] : []),
    ]),
  ) as TarotTheme[];
}

export function normalizeTransits(raw: unknown): DailyTransit[] {
  const rows = Array.isArray(raw) ? raw : hasRecord(raw) && Array.isArray(raw.transits) ? raw.transits : [];

  return rows
    .map((item, index): DailyTransit | null => {
      if (!hasRecord(item)) return null;
      const bodies = Array.isArray(item.bodies)
        ? item.bodies.map(String)
        : [item.body, item.planet, item.from, item.to].filter(Boolean).map(String);
      const aspect = typeof item.aspect === "string" ? item.aspect.toLowerCase() : undefined;
      const normalized: DailyTransit = {
        id: String(item.id ?? `transit-${index}`),
        label: String(item.label ?? item.name ?? (bodies.join(" ") || `Transit ${index + 1}`)),
        bodies,
        aspect:
          aspect === "conjunct" || aspect === "sextile" || aspect === "square" || aspect === "trine" || aspect === "opposite"
            ? aspect
            : undefined,
        house: numberFrom(item.house),
        strength: Math.max(1, Math.min(100, numberFrom(item.strength) ?? 60)),
        themes: Array.isArray(item.themes) ? (item.themes as string[]) : [],
        startsAt: typeof item.startsAt === "string" ? item.startsAt : undefined,
        endsAt: typeof item.endsAt === "string" ? item.endsAt : undefined,
        raw: item,
      };
      return {
        ...normalized,
        themes: themesForTransit(normalized),
      };
    })
    .filter((item): item is DailyTransit => Boolean(item))
    .sort((a, b) => b.strength - a.strength);
}

export function transitsToSkySignals(transits: DailyTransit[]): SkySignal[] {
  return transits.slice(0, 4).map((transit) => ({
    id: transit.id,
    label: transit.label,
    bodies: transit.bodies,
    aspect: transit.aspect,
    house: transit.house,
    strength: transit.strength,
    themes: transit.themes as TarotTheme[],
  }));
}
