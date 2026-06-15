import type { BirthProfile as StoredBirthProfile } from "../../../types/astrology";
import type { BirthProfileInput } from "../../../modules/astrology/types";
import { buildMockNatalChart } from "../mockAstroData";
import { MOCK_ASTROLOGY_REPORTS } from "../mockAstrologyReports";
import { buildMockDailyTransits } from "../mockDailyTransits";
import { buildMockRelationshipAstrology } from "../mockSynastry";
import type { AstroProvider, BirthProfile } from "./types";

function isStoredProfile(profile: BirthProfileInput | StoredBirthProfile): profile is StoredBirthProfile {
  return "birthDate" in profile;
}

function toStoredProfile(profile: BirthProfileInput | StoredBirthProfile): BirthProfile {
  if (isStoredProfile(profile)) {
    return {
      ...profile,
      birthday: profile.birthDate,
      birthCity: profile.birthPlace,
      userId: profile.id,
      displayName: profile.name,
    };
  }
  const now = new Date().toISOString();
  const birthPlace = [profile.birthCity, profile.birthCountry].filter(Boolean).join(", ");
  return {
    id: profile.userId || profile.name || profile.birthday || "guest",
    name: profile.name || "Guest",
    birthDate: profile.birthday,
    birthTime: profile.birthTime,
    birthPlace: birthPlace || "Unknown",
    timezone: profile.timezone !== undefined ? String(profile.timezone) : undefined,
    createdAt: now,
    updatedAt: now,
    birthday: profile.birthday,
    birthCity: profile.birthCity,
    birthCountry: profile.birthCountry,
    userId: profile.userId,
    displayName: profile.name,
  };
}

export const mockAstroProvider: AstroProvider = {
  id: "mock",
  label: "Hint astrology layer",
  isConfigured: () => true,
  async getNatalChart(profile) {
    return buildMockNatalChart(toStoredProfile(profile));
  },
  async getDailyTransits(profile, date = new Date()) {
    return buildMockDailyTransits(profile ? toStoredProfile(profile) : null, date);
  },
  async getRelationshipAstrology(user, friend) {
    return buildMockRelationshipAstrology(toStoredProfile(user), friend ? toStoredProfile(friend) : undefined);
  },
  async getReports() {
    return MOCK_ASTROLOGY_REPORTS;
  },
};
