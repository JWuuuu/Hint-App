export type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type PlanetBody =
  | "sun"
  | "moon"
  | "rising"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

export type BirthProfile = {
  id: string;
  name: string;
  birthDate: string;
  birthTime?: string;
  birthPlace: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  timezoneOffset?: number;
  createdAt: string;
  updatedAt: string;
};

export type PlanetPlacement = {
  body: PlanetBody;
  sign?: ZodiacSign;
  degree?: number;
  house?: number;
  retrograde?: boolean;
  element?: ElementBalance["dominant"];
  modality?: ModalityBalance["dominant"];
  meaning: string;
};

export type Aspect = {
  from: PlanetBody | string;
  to: PlanetBody | string;
  type: "conjunction" | "sextile" | "square" | "trine" | "opposition";
  orb: number;
  meaning: string;
  strength?: number;
};

export type HouseCusp = {
  house: number;
  sign?: ZodiacSign;
  degree?: number;
  theme?: string;
};

export type ElementBalance = {
  fire: number;
  earth: number;
  air: number;
  water: number;
  dominant: "fire" | "earth" | "air" | "water";
  meaning: string;
};

export type ModalityBalance = {
  cardinal: number;
  fixed: number;
  mutable: number;
  dominant: "cardinal" | "fixed" | "mutable";
  meaning: string;
};

export type NatalChart = {
  id: string;
  provider: "mock" | "api" | "astrologyapi" | "fallback";
  source: "mock" | "api" | "astrologyapi" | "fallback" | "sample";
  mode?: "sample" | "live" | "fallback" | "partial";
  calculatedAt: string;
  birthProfile: BirthProfile;
  placements: PlanetPlacement[];
  aspects: Aspect[];
  houses: HouseCusp[];
  sunSign?: ZodiacSign;
  moonSign?: ZodiacSign;
  risingSign?: ZodiacSign;
  venusSign?: ZodiacSign;
  marsSign?: ZodiacSign;
  elementBalance: ElementBalance;
  modalityBalance: ModalityBalance;
  validation?: {
    partial: boolean;
    message?: string | null;
    missing?: string[];
  };
  summary: {
    headline: string;
    short: string;
    strengths: string[];
    watch: string[];
  };
};

export type TransitPeriod = {
  startsAt: string;
  endsAt: string;
  label: string;
};

export type DailyTransit = {
  id: string;
  label: string;
  bodies: string[];
  aspect?: "conjunct" | "sextile" | "square" | "trine" | "opposite";
  house?: number;
  strength: number;
  themes: string[];
  emotionalTheme?: string;
  affectedArea?: string;
  do?: string;
  dont?: string;
  why?: string;
  period?: TransitPeriod;
  startsAt?: string;
  endsAt?: string;
  raw?: unknown;
};

export type NormalizedTransit = {
  id: string;
  title: string;
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb?: number;
  area: string[];
  theme: string[];
  startDate?: string;
  peakDate?: string;
  endDate?: string;
  action: string;
  why: string;
  evidence: string[];
  strength?: number;
};

export type AstroTransitsResponse = {
  source: "astrologyapi" | "fallback";
  mode: "live" | "fallback";
  cached: boolean;
  fetchedAt: string;
  date: string;
  strongestTransit: NormalizedTransit;
  transits: NormalizedTransit[];
  validation?: {
    partial: boolean;
    missing: string[];
    message?: string | null;
  };
};

export type RelationshipAstrology = {
  id: string;
  provider: "mock" | "api";
  source: "mock" | "api" | "preview";
  calculatedAt: string;
  people: {
    user: BirthProfile;
    friend?: BirthProfile;
  };
  spaceBetween: string;
  consentCopy: string;
  highlights: string[];
  invitations: string[];
};

export type SynastryAspect = {
  from: string;
  to: string;
  type: string;
  tier: string;
  meaning: string;
};

export type SynastrySummary = {
  comfort: string;
  tension: string;
  communication: string;
  attraction: string;
  growth: string;
};

export type AstroSynastryResponse = {
  source: "astrologyapi" | "fallback";
  mode: "live" | "fallback";
  cached: boolean;
  fetchedAt: string;
  summary: SynastrySummary;
  aspects: SynastryAspect[];
  plainEnglish: {
    main: string;
    comfort: string;
    tension: string;
    advice: string;
  };
};

export type AstrologyReport = {
  id: string;
  title: string;
  subtitle: string;
  status: "locked" | "available";
  unlockHint: string;
  previewBullets?: string[];
};

export type AstroProviderStatus = {
  astrology: {
    configured: boolean;
    provider: "astrologyapi";
  };
  nasa: {
    configured: boolean;
  };
  gpt: {
    configured: boolean;
  };
};
