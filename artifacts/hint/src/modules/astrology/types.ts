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

export type AstrologyBody =
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

export type BirthProfileInput = {
  userId?: string;
  name?: string;
  birthday: string;
  birthTime?: string;
  birthCity?: string;
  birthCountry?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string | number;
};

export type AstrologyPlacement = {
  body: AstrologyBody;
  sign?: ZodiacSign;
  degree?: number;
  house?: number;
  retrograde?: boolean;
  element?: "fire" | "earth" | "air" | "water";
  modality?: "cardinal" | "fixed" | "mutable";
};

export type NormalizedBirthChart = {
  provider: "astrologyapi" | "fallback";
  calculatedAt: string;
  input: BirthProfileInput;
  placements: AstrologyPlacement[];
  sunSign?: ZodiacSign;
  moonSign?: ZodiacSign;
  risingSign?: ZodiacSign;
  venusSign?: ZodiacSign;
  marsSign?: ZodiacSign;
  dominantElement?: "fire" | "earth" | "air" | "water";
  dominantModality?: "cardinal" | "fixed" | "mutable";
  moonPhase?: {
    name: string;
    illumination?: number;
    sign?: ZodiacSign;
  };
  natalWheel?: {
    svg?: string;
    base64?: string;
    source?: "api" | "symbolic";
  };
  aspects?: Array<{
    from: string;
    to: string;
    type: string;
    orb?: number;
    strength?: number;
  }>;
  houses?: Array<{
    house: number;
    sign?: ZodiacSign;
    degree?: number;
  }>;
  chartSummary: {
    headline: string;
    summary: string;
    strengths: string[];
    watchOut: string[];
  };
  source: "api" | "fallback";
  approximate?: boolean;
};

export type AstrologyStatus = {
  configured: boolean;
  provider: "astrologyapi";
  baseUrlConfigured: boolean;
  capabilities: {
    birthChart: boolean;
    westernAstrology: boolean;
    indianAstrology: boolean;
    horoscope: boolean;
    tarot: boolean;
    pdfReports: boolean;
    compatibility: boolean;
    transits: boolean;
  };
};

export type CompatibilityResult = {
  id: string;
  source: "api" | "preview";
  calculatedAt: string;
  people: {
    user: {
      name?: string;
      chart: NormalizedBirthChart;
    };
    friend: {
      name?: string;
      chart: NormalizedBirthChart;
    };
  };
  scores: {
    overall: number;
    attraction: number;
    communication: number;
    emotionalRhythm: number;
    stability: number;
    tension: number;
  };
  highlights: {
    strongestLink: string;
    easyPart: string;
    frictionPoint: string;
    advice: string;
  };
  sharedSeal?: string;
};
