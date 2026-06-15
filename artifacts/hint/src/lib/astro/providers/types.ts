import type {
  Aspect,
  AstrologyReport,
  BirthProfile as StoredBirthProfile,
  DailyTransit,
  NatalChart,
  PlanetPlacement,
  RelationshipAstrology,
} from "../../../types/astrology";
import type { BirthProfileInput } from "../../../modules/astrology/types";

export type AstroProviderId = "mock" | "freeastrologyapi" | "astrologyapi";

export type BirthProfile = StoredBirthProfile & {
  birthday?: string;
  birthCity?: string;
  birthCountry?: string;
  userId?: string;
  displayName?: string;
};

export type NatalPlacement = PlanetPlacement;
export type NatalAspect = Aspect;
export type { AstrologyReport, DailyTransit, NatalChart, RelationshipAstrology };

export type AstroProvider = {
  id: AstroProviderId;
  label: string;
  isConfigured: () => boolean;
  getNatalChart: (profile: BirthProfileInput | StoredBirthProfile) => Promise<NatalChart>;
  getDailyTransits: (profile: BirthProfileInput | StoredBirthProfile | null, date?: Date) => Promise<DailyTransit[]>;
  getRelationshipAstrology: (
    user: BirthProfileInput | StoredBirthProfile,
    friend?: BirthProfileInput | StoredBirthProfile,
  ) => Promise<RelationshipAstrology>;
  getReports: (profile: BirthProfileInput | StoredBirthProfile | null) => Promise<AstrologyReport[]>;
};
