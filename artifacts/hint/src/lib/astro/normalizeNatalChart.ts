import type { BirthProfileInput } from "../../modules/astrology/types";
import type { BirthProfile, NatalChart } from "./providers/types";
import { buildMockNatalChart } from "./mockAstroData";

function toBirthProfile(input: BirthProfileInput): BirthProfile {
  const now = new Date().toISOString();
  return {
    id: input.userId || input.name || input.birthday || "guest",
    name: input.name || "Guest",
    birthDate: input.birthday,
    birthTime: input.birthTime,
    birthPlace: [input.birthCity, input.birthCountry].filter(Boolean).join(", ") || "Unknown",
    timezone: input.timezone !== undefined ? String(input.timezone) : undefined,
    createdAt: now,
    updatedAt: now,
    birthday: input.birthday,
    birthCity: input.birthCity,
    birthCountry: input.birthCountry,
    userId: input.userId,
    displayName: input.name,
  };
}

export function normalizeNatalChart({
  input,
}: {
  raw: unknown;
  input: BirthProfileInput;
  provider?: string;
}): NatalChart {
  return buildMockNatalChart(toBirthProfile(input));
}
