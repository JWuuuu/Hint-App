/** Small helpers for the Me account hub. */

import type { HintLanguage } from "../../lib/i18n";

const ZODIAC_ZH: Record<string, string> = {
  Capricorn: "摩羯座",
  Aquarius: "水瓶座",
  Pisces: "双鱼座",
  Aries: "白羊座",
  Taurus: "金牛座",
  Gemini: "双子座",
  Cancer: "巨蟹座",
  Leo: "狮子座",
  Virgo: "处女座",
  Libra: "天秤座",
  Scorpio: "天蝎座",
  Sagittarius: "射手座",
};

const ZODIAC_LOCALIZED: Partial<Record<HintLanguage, Record<string, string>>> = {
  zh: ZODIAC_ZH,
  es: {
    Capricorn: "Capricornio",
    Aquarius: "Acuario",
    Pisces: "Piscis",
    Aries: "Aries",
    Taurus: "Tauro",
    Gemini: "Géminis",
    Cancer: "Cáncer",
    Leo: "Leo",
    Virgo: "Virgo",
    Libra: "Libra",
    Scorpio: "Escorpio",
    Sagittarius: "Sagitario",
  },
  ja: {
    Capricorn: "山羊座",
    Aquarius: "水瓶座",
    Pisces: "魚座",
    Aries: "牡羊座",
    Taurus: "牡牛座",
    Gemini: "双子座",
    Cancer: "蟹座",
    Leo: "獅子座",
    Virgo: "乙女座",
    Libra: "天秤座",
    Scorpio: "蠍座",
    Sagittarius: "射手座",
  },
  ko: {
    Capricorn: "염소자리",
    Aquarius: "물병자리",
    Pisces: "물고기자리",
    Aries: "양자리",
    Taurus: "황소자리",
    Gemini: "쌍둥이자리",
    Cancer: "게자리",
    Leo: "사자자리",
    Virgo: "처녀자리",
    Libra: "천칭자리",
    Scorpio: "전갈자리",
    Sagittarius: "사수자리",
  },
};

/** Western (tropical) zodiac sign from an ISO YYYY-MM-DD birth date. */
export function zodiacSign(birthDate?: string | null, language: HintLanguage = "en"): string | null {
  if (!birthDate) return null;
  const parts = birthDate.split("-");
  if (parts.length < 3) return null;
  const mm = Number(parts[1]);
  const dd = Number(parts[2]);
  if (!mm || !dd) return null;
  const md = mm * 100 + dd;
  let sign = "Sagittarius";
  if (md >= 1222 || md <= 119) sign = "Capricorn";
  else if (md <= 218) sign = "Aquarius";
  else if (md <= 320) sign = "Pisces";
  else if (md <= 419) sign = "Aries";
  else if (md <= 520) sign = "Taurus";
  else if (md <= 620) sign = "Gemini";
  else if (md <= 722) sign = "Cancer";
  else if (md <= 822) sign = "Leo";
  else if (md <= 922) sign = "Virgo";
  else if (md <= 1022) sign = "Libra";
  else if (md <= 1121) sign = "Scorpio";
  return ZODIAC_LOCALIZED[language]?.[sign] ?? sign;
}

/** 1–2 letter initials for the avatar fallback. */
export function initialsFrom(name?: string | null): string {
  const base = (name ?? "").trim();
  if (!base) return "ME";
  return (
    base
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "ME"
  );
}
