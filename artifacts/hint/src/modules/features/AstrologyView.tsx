import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { Activity, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDot, Compass, Copy, Download, Ellipsis, ExternalLink, Facebook, FileText, HeartHandshake, Instagram, Link2, LockKeyhole, LogIn, MapPin, MessageCircle, Orbit, Radar, RefreshCw, Search, Send, Share2, ShieldCheck, Sparkles, UserPlus, UserRound, X } from "lucide-react";
import { BirthProfileCard } from "../../components/astro/BirthProfileCard";
import { BirthProfileForm } from "../../components/astro/BirthProfileForm";
import { RealSkyTodayCard } from "../../components/astro/RealSkyTodayCard";
import { getAstroInterpretation, getGeoDetails, getNatalChart, getSynastry, getTimezoneDetails, getTransits, type AstroGeoPlace, type AstroNatalResponse } from "../../lib/astro/astroClient";
import { MOCK_ASTROLOGY_REPORTS } from "../../lib/astro/mockAstrologyReports";
import { buildMockNatalChart, ZODIAC_SIGNS } from "../../lib/astro/mockAstroData";
import { buildMockRelationshipAstrology } from "../../lib/astro/mockSynastry";
import { normalizeClientNatal } from "../../lib/astro/normalizeClientAstro";
import { SAMPLE_CHART, SAMPLE_RELATIONSHIP, SAMPLE_TRANSITS } from "../../lib/astro/sampleAstroData";
import { readBirthProfile, saveBirthProfile, saveBirthProfileFromAccountProfile } from "../../lib/astro/userBirthProfile";
import { apiUrl } from "../../lib/api";
import { useLocalAccount, type LocalAccount } from "../../lib/auth";
import { useLanguage, type HintLanguage } from "../../lib/i18n";
import { useProfile } from "../../lib/useProfile";
import type { AstroProviderStatus, AstroSynastryResponse, AstroTransitsResponse, AstrologyReport, BirthProfile, NatalChart, NormalizedTransit, PlanetBody, PlanetPlacement, RelationshipAstrology, ZodiacSign } from "../../types/astrology";

type AstrologyTab = "signs" | "chart" | "transits" | "birth" | "together" | "reports";

type BirthProfileSaveInput = Omit<BirthProfile, "id" | "createdAt" | "updatedAt" | "latitude" | "longitude" | "timezoneOffset"> &
  Partial<Pick<BirthProfile, "id" | "createdAt">> & {
    latitude?: string | number;
    longitude?: string | number;
    timezoneOffset?: string | number;
  };

type CompatibilityInviteResponse = {
  token: string;
  expiresAt: string;
  status: "pending" | "completed" | "expired";
  resultId?: string;
};

type ServiceMode = "Connected" | "Fallback";

type BackendStatusState = {
  status: AstroProviderStatus;
  online: boolean;
  loading: boolean;
  checkedAt: string | null;
  error?: string;
};

type SavedNatalChartRecord = {
  accountKey: string;
  profileId: string;
  profileUpdatedAt: string;
  chart: NatalChart;
  natalResponse: AstroNatalResponse;
  savedAt: string;
};

const ASTRO_TEXT = "var(--astro-text)";
const ASTRO_TEXT_STRONG = "var(--astro-text-strong)";
const ASTRO_MUTED = "var(--astro-muted)";
const ASTRO_FAINT = "var(--astro-faint)";
const ASTRO_GOLD = "var(--astro-gold)";
const ASTRO_GOLD_BRIGHT = "var(--astro-gold-bright)";
const ASTRO_AQUA = "var(--astro-aqua)";
const ASTRO_ROSE = "var(--astro-rose)";
const ASTRO_BORDER = "var(--astro-border)";
const ASTRO_SURFACE = "var(--astro-surface)";
const ASTRO_HERO = "var(--astro-hero)";
const ASTRO_INNER = "var(--astro-inner)";
const ASTRO_LOCKED = "var(--astro-locked)";
const ASTRO_PREMIUM_PANEL = "var(--astro-panel)";
const ASTRO_PREMIUM_INNER = "var(--astro-panel-inner)";
const ASTRO_STROKE = "var(--astro-stroke)";
const ASTRO_BUTTON = "var(--astro-button)";
const ASTRO_BUTTON_TEXT = "var(--astro-button-text)";
const ASTRO_TILE = "var(--astro-tile)";
const ASTRO_TILE_BORDER = "var(--astro-tile-border)";
const ASTRO_INPUT = "var(--astro-input)";
const ASTRO_CHART_PANEL = "var(--astro-chart-panel)";
const ASTRO_CHART_HEADER = "var(--astro-chart-header)";
const ASTRO_WHEEL_OUTER = "var(--astro-wheel-outer)";
const ASTRO_WHEEL_CORE = "var(--astro-wheel-core)";
const ASTRO_WHEEL_DOT = "var(--astro-wheel-dot-bg)";
const ASTRO_WHEEL_GLOW_CENTER = "var(--astro-wheel-glow-center)";
const ASTRO_WHEEL_GLOW_MID = "var(--astro-wheel-glow-mid)";
const ASTRO_WHEEL_GLOW_EDGE = "var(--astro-wheel-glow-edge)";
const ASTRO_WHEEL_LINE = "var(--astro-wheel-line)";
const ASTRO_WHEEL_AXIS = "var(--astro-wheel-axis)";
const SAVED_NATAL_CHART_PREFIX = "hint.astrology.savedNatalChart.v1";
const ASTROLOGY_HOME_STYLE = {
  background: "var(--hint-page-bg)",
  color: ASTRO_TEXT,
  "--astro-text": "var(--hint-text)",
  "--astro-text-strong": "var(--hint-text)",
  "--astro-muted": "var(--hint-muted)",
  "--astro-faint": "var(--hint-faint)",
  "--astro-gold": "var(--hint-gold)",
  "--astro-gold-bright": "var(--hint-gold-bright)",
  "--astro-aqua": "var(--hint-aqua)",
  "--astro-rose": "var(--hint-rose)",
  "--astro-lavender": "var(--hint-lavender)",
  "--astro-green": "color-mix(in srgb, var(--hint-aqua) 58%, var(--hint-gold))",
  "--astro-orange": "var(--hint-ember)",
  "--astro-border": "color-mix(in srgb, var(--hint-rose) 16%, var(--hint-border))",
  "--astro-stroke": "color-mix(in srgb, var(--hint-rose) 24%, var(--hint-border-strong))",
  "--astro-surface": "var(--hint-liquid-panel)",
  "--astro-hero": "var(--hint-liquid-panel-strong)",
  "--astro-inner": "var(--hint-control-bg)",
  "--astro-locked": "var(--hint-subtle-card-bg)",
  "--astro-panel": "var(--hint-liquid-panel)",
  "--astro-panel-inner": "var(--hint-control-bg)",
  "--astro-tile": "var(--hint-control-bg)",
  "--astro-tile-border": "var(--hint-control-border)",
  "--astro-input": "var(--hint-field-bg)",
  "--astro-chart-panel": "var(--hint-liquid-panel)",
  "--astro-chart-header": "var(--hint-control-bg-strong)",
  "--astro-wheel-outer": "var(--hint-control-bg-strong)",
  "--astro-wheel-core": "color-mix(in srgb, var(--hint-surface-soft) 74%, transparent)",
  "--astro-wheel-dot-bg": "var(--hint-field-bg)",
  "--astro-wheel-glow-center": "color-mix(in srgb, var(--hint-aqua) 18%, transparent)",
  "--astro-wheel-glow-mid": "color-mix(in srgb, var(--hint-gold) 14%, transparent)",
  "--astro-wheel-glow-edge": "color-mix(in srgb, var(--hint-surface) 84%, transparent)",
  "--astro-wheel-line": "color-mix(in srgb, var(--hint-text) 18%, transparent)",
  "--astro-wheel-axis": "color-mix(in srgb, var(--hint-text) 28%, transparent)",
  "--astro-button": "var(--hint-special-action-bg)",
  "--astro-button-text": "var(--hint-special-action-text)",
  "--astro-shadow": "var(--hint-liquid-shadow)",
  "--astro-shadow-soft": "var(--hint-liquid-shadow)",
  "--astro-button-shadow": "0 12px 24px color-mix(in srgb, var(--hint-rose) 12%, transparent)",
} as CSSProperties;

const FALLBACK_PROVIDER_STATUS: AstroProviderStatus = {
  astrology: {
    configured: false,
    provider: "astrologyapi",
  },
  nasa: {
    configured: false,
  },
  gpt: {
    configured: false,
  },
};

const SIGN_LABELS: Record<ZodiacSign, string> = {
  aries: "Aries",
  taurus: "Taurus",
  gemini: "Gemini",
  cancer: "Cancer",
  leo: "Leo",
  virgo: "Virgo",
  libra: "Libra",
  scorpio: "Scorpio",
  sagittarius: "Sagittarius",
  capricorn: "Capricorn",
  aquarius: "Aquarius",
  pisces: "Pisces",
};

const SIGN_GLYPHS: Record<ZodiacSign, string> = {
  aries: "Ar",
  taurus: "Ta",
  gemini: "Ge",
  cancer: "Ca",
  leo: "Le",
  virgo: "Vi",
  libra: "Li",
  scorpio: "Sc",
  sagittarius: "Sa",
  capricorn: "Cp",
  aquarius: "Aq",
  pisces: "Pi",
};

const BODY_LABELS: Record<PlanetBody, string> = {
  sun: "Sun",
  moon: "Moon",
  rising: "Rising",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptune",
  pluto: "Pluto",
};

const BODY_MARKS: Record<PlanetBody, string> = {
  sun: "Su",
  moon: "Mo",
  rising: "Asc",
  mercury: "Me",
  venus: "Ve",
  mars: "Ma",
  jupiter: "Ju",
  saturn: "Sa",
  uranus: "Ur",
  neptune: "Ne",
  pluto: "Pl",
};

const ZODIAC_GLYPHS: Record<ZodiacSign, string> = {
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpio: "♏",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓",
};

const BODY_GLYPHS: Record<PlanetBody, string> = {
  sun: "☉",
  moon: "☽",
  rising: "AC",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
};

const SIGN_NAMES_BY_LANGUAGE: Record<HintLanguage, Record<ZodiacSign, string>> = {
  en: SIGN_LABELS,
  zh: {
    aries: "白羊",
    taurus: "金牛",
    gemini: "双子",
    cancer: "巨蟹",
    leo: "狮子",
    virgo: "处女",
    libra: "天秤",
    scorpio: "天蝎",
    sagittarius: "射手",
    capricorn: "摩羯",
    aquarius: "水瓶",
    pisces: "双鱼",
  },
  es: {
    aries: "Aries",
    taurus: "Tauro",
    gemini: "Geminis",
    cancer: "Cancer",
    leo: "Leo",
    virgo: "Virgo",
    libra: "Libra",
    scorpio: "Escorpio",
    sagittarius: "Sagitario",
    capricorn: "Capricornio",
    aquarius: "Acuario",
    pisces: "Piscis",
  },
  ja: {
    aries: "牡羊座",
    taurus: "牡牛座",
    gemini: "双子座",
    cancer: "蟹座",
    leo: "獅子座",
    virgo: "乙女座",
    libra: "天秤座",
    scorpio: "蠍座",
    sagittarius: "射手座",
    capricorn: "山羊座",
    aquarius: "水瓶座",
    pisces: "魚座",
  },
  ko: {
    aries: "양자리",
    taurus: "황소자리",
    gemini: "쌍둥이자리",
    cancer: "게자리",
    leo: "사자자리",
    virgo: "처녀자리",
    libra: "천칭자리",
    scorpio: "전갈자리",
    sagittarius: "사수자리",
    capricorn: "염소자리",
    aquarius: "물병자리",
    pisces: "물고기자리",
  },
};

const BODY_NAMES_BY_LANGUAGE: Record<HintLanguage, Record<PlanetBody, string>> = {
  en: BODY_LABELS,
  zh: {
    sun: "太阳",
    moon: "月亮",
    rising: "上升",
    mercury: "水星",
    venus: "金星",
    mars: "火星",
    jupiter: "木星",
    saturn: "土星",
    uranus: "天王星",
    neptune: "海王星",
    pluto: "冥王星",
  },
  es: {
    sun: "Sol",
    moon: "Luna",
    rising: "Ascendente",
    mercury: "Mercurio",
    venus: "Venus",
    mars: "Marte",
    jupiter: "Jupiter",
    saturn: "Saturno",
    uranus: "Urano",
    neptune: "Neptuno",
    pluto: "Pluton",
  },
  ja: {
    sun: "太陽",
    moon: "月",
    rising: "アセンダント",
    mercury: "水星",
    venus: "金星",
    mars: "火星",
    jupiter: "木星",
    saturn: "土星",
    uranus: "天王星",
    neptune: "海王星",
    pluto: "冥王星",
  },
  ko: {
    sun: "태양",
    moon: "달",
    rising: "상승궁",
    mercury: "수성",
    venus: "금성",
    mars: "화성",
    jupiter: "목성",
    saturn: "토성",
    uranus: "천왕성",
    neptune: "해왕성",
    pluto: "명왕성",
  },
};

const BODY_SYMBOLS_BY_LANGUAGE: Record<HintLanguage, Record<PlanetBody, string>> = {
  en: BODY_MARKS,
  es: BODY_MARKS,
  zh: {
    sun: "日",
    moon: "月",
    rising: "升",
    mercury: "水",
    venus: "金",
    mars: "火",
    jupiter: "木",
    saturn: "土",
    uranus: "天",
    neptune: "海",
    pluto: "冥",
  },
  ja: {
    sun: "日",
    moon: "月",
    rising: "Asc",
    mercury: "水",
    venus: "金",
    mars: "火",
    jupiter: "木",
    saturn: "土",
    uranus: "天",
    neptune: "海",
    pluto: "冥",
  },
  ko: BODY_MARKS,
};

const SIGN_SHORT_BY_LANGUAGE: Record<HintLanguage, Record<ZodiacSign, string>> = {
  en: SIGN_GLYPHS,
  es: SIGN_GLYPHS,
  ko: SIGN_GLYPHS,
  zh: {
    aries: "羊",
    taurus: "牛",
    gemini: "双",
    cancer: "蟹",
    leo: "狮",
    virgo: "处",
    libra: "秤",
    scorpio: "蝎",
    sagittarius: "射",
    capricorn: "摩",
    aquarius: "瓶",
    pisces: "鱼",
  },
  ja: {
    aries: "羊",
    taurus: "牛",
    gemini: "双",
    cancer: "蟹",
    leo: "獅",
    virgo: "乙",
    libra: "秤",
    scorpio: "蠍",
    sagittarius: "射",
    capricorn: "山",
    aquarius: "水",
    pisces: "魚",
  },
};

type AstrologyPlacementCopy = Record<PlanetBody, { label: string; subtitle: string; fallback: string }>;

type AstrologyUiCopy = {
  signatureBadge: string;
  sampleSignatureBadge: string;
  patternBlend: string;
  rareTitle: string;
  rareDescription: (percent: string) => string;
  hintLens: string;
  arcLove: string;
  arcSupport: string;
  arcResources: string;
  arcPublic: string;
  arcLoveFoot: string;
  arcSupportFoot: string;
  arcResourcesFoot: string;
  arcPublicFoot: string;
  codeEyebrow: string;
  codeTitle: string;
  codeSummary: string;
  oneLine: string;
  firstImpression: string;
  operatingMode: string;
  quietAdvantage: string;
  bestFit: string;
  firstImpressionValue: string;
  operatingModeValue: string;
  quietAdvantageValue: string;
  todayFocus: string;
  focusCue: string;
  luckyAnchor: string;
  anchorValue: string;
  coreEyebrow: string;
  coreTitle: string;
  bestFitNote: string;
  reminderLabel: string;
  elementBalance: string;
  everyPlanet: string;
  socialPlanetsEyebrow: string;
  socialPlanetsTitle: string;
  house: string;
  housePending: string;
  degreePending: string;
  pending: string;
  signPending: string;
  fullDataNeeded: string;
  chartTitle: (sun: string, moon: string, rising: string) => string;
  chartLine: string;
  todayReminderAir: string;
  todayReminderFire: string;
  todayReminderEarth: string;
  todayReminderWater: string;
  placements: AstrologyPlacementCopy;
};

const ASTRO_UI_COPY: Record<HintLanguage, AstrologyUiCopy> = {
  en: {
    signatureBadge: "Anna LUO chart code",
    sampleSignatureBadge: "Sample chart code",
    patternBlend: "Pattern blend",
    rareTitle: "Fast mind, soft entrance",
    rareDescription: (percent) => `${percent}% pattern overlap with this air-forward, mutable chart blend.`,
    hintLens: "Hint lens",
    arcLove: "Steady love",
    arcSupport: "Social reach",
    arcResources: "Visible growth",
    arcPublic: "Soft magnetism",
    arcLoveFoot: "Love",
    arcSupportFoot: "Support",
    arcResourcesFoot: "Resources",
    arcPublicFoot: "Public signal",
    codeEyebrow: "Chart code",
    codeTitle: "At-a-glance reading",
    codeSummary: "Future-minded, quick to connect, and softer on the outside than the mind suggests.",
    oneLine: "One-line summary",
    firstImpression: "First impression",
    operatingMode: "Actual operating mode",
    quietAdvantage: "Quiet advantage",
    bestFit: "Best-fit signs",
    firstImpressionValue: "Gentle but observant",
    operatingModeValue: "Understated strategist",
    quietAdvantageValue: "Reads the room fast",
    todayFocus: "Today's focus",
    focusCue: "Focus cue",
    luckyAnchor: "Anchor",
    anchorValue: "Clear notes",
    coreEyebrow: "Core signatures",
    coreTitle: "Clean placement cues",
    bestFitNote: "Matched from element balance, Venus style, and Mars drive. Use it as a conversation starter, not a verdict.",
    reminderLabel: "Today reminder",
    elementBalance: "Element balance",
    everyPlanet: "Every planet gets one useful sentence",
    socialPlanetsEyebrow: "Planet detail strip",
    socialPlanetsTitle: "Mind, affection, drive, growth, structure",
    house: "House",
    housePending: "House pending",
    degreePending: "Degree pending",
    pending: "Pending",
    signPending: "sign pending",
    fullDataNeeded: "Complete birth data will sharpen this placement.",
    chartTitle: (sun, moon, rising) => `${sun} Sun / ${moon} Moon / ${rising} Rising`,
    chartLine: "A future-minded chart with quick social intelligence and a softer first impression than the mind suggests.",
    todayReminderAir: "Write the idea down first, then choose one concrete next action.",
    todayReminderFire: "Move early, but let one trusted person check the timing before the push.",
    todayReminderEarth: "Make the practical next step visible; proof calms the whole chart.",
    todayReminderWater: "Protect quiet time before answering everyone else's emotional noise.",
    placements: {
      sun: { label: "Independent center", subtitle: "Sun identity", fallback: "The core self thinks independently and needs enough room to stay clear." },
      moon: { label: "Quick emotional processor", subtitle: "Moon rhythm", fallback: "Emotions move through information, conversation, and fresh context." },
      rising: { label: "Soft entrance", subtitle: "Rising signal", fallback: "The first impression is gentle, receptive, and quietly perceptive." },
      mercury: { label: "Structured voice", subtitle: "Mercury mind", fallback: "Communication works best when the thought has shape before it is shared." },
      venus: { label: "Steady affection", subtitle: "Venus style", fallback: "Closeness builds through patience, consistency, and earned trust." },
      mars: { label: "Explorer drive", subtitle: "Mars action", fallback: "Action needs meaning, distance, and a wider horizon to stay alive." },
      jupiter: { label: "Visible growth", subtitle: "Jupiter expansion", fallback: "Luck grows when confidence becomes something visible and generous." },
      saturn: { label: "Learning discipline", subtitle: "Saturn lesson", fallback: "The work is turning quick intelligence into a durable system." },
      uranus: { label: "Original pattern", subtitle: "Uranus edge", fallback: "Freedom matters most where old rules feel too small." },
      neptune: { label: "Intuitive filter", subtitle: "Neptune field", fallback: "Imagination is strong; boundaries keep the signal clean." },
      pluto: { label: "Deep rewrite", subtitle: "Pluto pressure", fallback: "Real change begins when hidden motives become visible." },
    },
  },
  zh: {
    signatureBadge: "Anna LUO 星盘代码",
    sampleSignatureBadge: "样本星盘代码",
    patternBlend: "配置组合",
    rareTitle: "脑子快，入口软",
    rareDescription: (percent) => `${percent}% 的配置重叠：风象突出，变动能量强。`,
    hintLens: "Hint 视角",
    arcLove: "稳定亲密",
    arcSupport: "社交触达",
    arcResources: "可见成长",
    arcPublic: "柔软吸引力",
    arcLoveFoot: "关系",
    arcSupportFoot: "支持",
    arcResourcesFoot: "资源",
    arcPublicFoot: "外在信号",
    codeEyebrow: "星盘代码",
    codeTitle: "一眼读懂这张盘",
    codeSummary: "未来感强、连接速度快，外在比脑内节奏柔软很多。",
    oneLine: "一句话总结",
    firstImpression: "第一印象",
    operatingMode: "真实运作模式",
    quietAdvantage: "隐藏优势",
    bestFit: "契合星座",
    firstImpressionValue: "柔软但很会观察",
    operatingModeValue: "低调策略型",
    quietAdvantageValue: "很快读懂场域",
    todayFocus: "今日焦点",
    focusCue: "行动提示",
    luckyAnchor: "锚点",
    anchorValue: "清晰笔记",
    coreEyebrow: "核心签名",
    coreTitle: "更干净的点位提示",
    bestFitNote: "由元素比例、金星风格和火星行动模式综合推导。适合作为参考，不是定论。",
    reminderLabel: "今日提醒",
    elementBalance: "元素比例",
    everyPlanet: "每个行星都有一句有用提示",
    socialPlanetsEyebrow: "行星细节",
    socialPlanetsTitle: "思维、亲密、行动、成长、结构",
    house: "宫",
    housePending: "宫位待定",
    degreePending: "度数待定",
    pending: "待定",
    signPending: "星座待定",
    fullDataNeeded: "完整出生资料会让这个点位更准确。",
    chartTitle: (sun, moon, rising) => `日${sun} / 月${moon} / 升${rising}`,
    chartLine: "这是一张未来感强、社交反应快，但第一印象更柔软的盘。",
    todayReminderAir: "先写下想法，再选择一个具体下一步。",
    todayReminderFire: "可以先动，但推进前让一个信任的人帮你看时机。",
    todayReminderEarth: "把实际下一步摆出来；证据会让整张盘安定。",
    todayReminderWater: "先保留安静时间，再回应别人的情绪噪音。",
    placements: {
      sun: { label: "独立核心", subtitle: "太阳人格", fallback: "核心自我很独立，需要足够空间保持清醒。" },
      moon: { label: "快速情绪处理", subtitle: "月亮节奏", fallback: "情绪通过信息、对话和新鲜语境被消化。" },
      rising: { label: "柔软入口", subtitle: "上升信号", fallback: "第一印象温和、接收力强，同时很会观察。" },
      mercury: { label: "结构化表达", subtitle: "水星思维", fallback: "表达前先整理结构，沟通会更稳。" },
      venus: { label: "稳定亲密", subtitle: "金星风格", fallback: "亲密感来自耐心、一致性和被时间证明的信任。" },
      mars: { label: "探索驱动", subtitle: "火星行动", fallback: "行动需要意义、远方和更大的空间。" },
      jupiter: { label: "可见成长", subtitle: "木星扩张", fallback: "当自信变成能被看见的作品，机会会变多。" },
      saturn: { label: "学习纪律", subtitle: "土星课题", fallback: "课题是把聪明和表达变成稳定系统。" },
      uranus: { label: "原创模式", subtitle: "天王边界", fallback: "旧规则太窄的地方，就是自由最重要的地方。" },
      neptune: { label: "直觉滤镜", subtitle: "海王场域", fallback: "想象力很强，边界会让信号更干净。" },
      pluto: { label: "深层改写", subtitle: "冥王压力", fallback: "真正的改变从看清隐藏动机开始。" },
    },
  },
  es: {
    signatureBadge: "Codigo de carta de Anna LUO",
    sampleSignatureBadge: "Codigo de carta de muestra",
    patternBlend: "Mezcla de patron",
    rareTitle: "Mente rapida, entrada suave",
    rareDescription: (percent) => `${percent}% de solapamiento con esta mezcla mutable y de aire.`,
    hintLens: "Lente Hint",
    arcLove: "Amor estable",
    arcSupport: "Alcance social",
    arcResources: "Crecimiento visible",
    arcPublic: "Magnetismo suave",
    arcLoveFoot: "Amor",
    arcSupportFoot: "Apoyo",
    arcResourcesFoot: "Recursos",
    arcPublicFoot: "Senal publica",
    codeEyebrow: "Codigo de carta",
    codeTitle: "Lectura de un vistazo",
    codeSummary: "Mentalidad de futuro, conexion rapida y una entrada mas suave de lo que sugiere la mente.",
    oneLine: "Resumen en una linea",
    firstImpression: "Primera impresion",
    operatingMode: "Modo real",
    quietAdvantage: "Ventaja silenciosa",
    bestFit: "Signos afines",
    firstImpressionValue: "Suave pero observadora",
    operatingModeValue: "Estratega discreta",
    quietAdvantageValue: "Lee rapido el ambiente",
    todayFocus: "Foco de hoy",
    focusCue: "Pista de enfoque",
    luckyAnchor: "Ancla",
    anchorValue: "Notas claras",
    coreEyebrow: "Firmas centrales",
    coreTitle: "Pistas limpias de posiciones",
    bestFitNote: "Se calcula desde el balance elemental, Venus y Marte. Es un inicio de conversacion, no una sentencia.",
    reminderLabel: "Recordatorio de hoy",
    elementBalance: "Balance elemental",
    everyPlanet: "Cada planeta tiene una frase util",
    socialPlanetsEyebrow: "Detalle planetario",
    socialPlanetsTitle: "Mente, afecto, impulso, crecimiento, estructura",
    house: "Casa",
    housePending: "Casa pendiente",
    degreePending: "Grado pendiente",
    pending: "Pendiente",
    signPending: "signo pendiente",
    fullDataNeeded: "Los datos completos de nacimiento afinan esta posicion.",
    chartTitle: (sun, moon, rising) => `${sun} Sol / ${moon} Luna / ${rising} Ascendente`,
    chartLine: "Una carta orientada al futuro, con inteligencia social rapida y una primera impresion mas suave.",
    todayReminderAir: "Escribe primero la idea; despues elige una accion concreta.",
    todayReminderFire: "Muevete pronto, pero revisa el momento con alguien de confianza.",
    todayReminderEarth: "Haz visible el siguiente paso practico; la prueba calma la carta.",
    todayReminderWater: "Protege un rato de silencio antes de responder al ruido emocional ajeno.",
    placements: {
      sun: { label: "Centro independiente", subtitle: "Identidad solar", fallback: "El yo central piensa de forma independiente y necesita espacio para estar claro." },
      moon: { label: "Procesador emocional rapido", subtitle: "Ritmo lunar", fallback: "Las emociones se mueven por informacion, conversacion y contexto fresco." },
      rising: { label: "Entrada suave", subtitle: "Senal ascendente", fallback: "La primera impresion es gentil, receptiva y discretamente perceptiva." },
      mercury: { label: "Voz estructurada", subtitle: "Mente mercurial", fallback: "La comunicacion funciona mejor cuando la idea ya tiene forma." },
      venus: { label: "Afecto estable", subtitle: "Estilo venusino", fallback: "La cercania crece con paciencia, consistencia y confianza ganada." },
      mars: { label: "Impulso explorador", subtitle: "Accion marciana", fallback: "La accion necesita sentido, distancia y un horizonte mas amplio." },
      jupiter: { label: "Crecimiento visible", subtitle: "Expansion jupiteriana", fallback: "La suerte crece cuando la confianza se vuelve visible y generosa." },
      saturn: { label: "Disciplina de aprendizaje", subtitle: "Leccion saturnina", fallback: "El trabajo es convertir inteligencia rapida en sistema durable." },
      uranus: { label: "Patron original", subtitle: "Borde uraniano", fallback: "La libertad importa donde las reglas viejas quedan chicas." },
      neptune: { label: "Filtro intuitivo", subtitle: "Campo neptuniano", fallback: "La imaginacion es fuerte; los limites limpian la senal." },
      pluto: { label: "Reescritura profunda", subtitle: "Presion plutoniana", fallback: "El cambio real empieza cuando los motivos ocultos se vuelven visibles." },
    },
  },
  ja: {
    signatureBadge: "Anna LUO のチャートコード",
    sampleSignatureBadge: "サンプルチャートコード",
    patternBlend: "配置ブレンド",
    rareTitle: "速い思考、やわらかな入口",
    rareDescription: (percent) => `この風が強い柔軟宮ブレンドとの重なりは ${percent}% です。`,
    hintLens: "Hint レンズ",
    arcLove: "安定した愛情",
    arcSupport: "社交の広がり",
    arcResources: "見える成長",
    arcPublic: "やわらかな引力",
    arcLoveFoot: "愛情",
    arcSupportFoot: "支援",
    arcResourcesFoot: "資源",
    arcPublicFoot: "外向きの印象",
    codeEyebrow: "チャートコード",
    codeTitle: "ひと目で読む",
    codeSummary: "未来志向でつながるのが速く、外側は思考よりもやわらかい印象です。",
    oneLine: "一文サマリー",
    firstImpression: "第一印象",
    operatingMode: "実際の動き方",
    quietAdvantage: "静かな強み",
    bestFit: "相性のよいサイン",
    firstImpressionValue: "穏やかで観察力がある",
    operatingModeValue: "控えめな戦略家",
    quietAdvantageValue: "場を読むのが速い",
    todayFocus: "今日の焦点",
    focusCue: "フォーカスの合図",
    luckyAnchor: "アンカー",
    anchorValue: "クリアなメモ",
    coreEyebrow: "コア署名",
    coreTitle: "すっきりした配置ヒント",
    bestFitNote: "元素バランス、金星スタイル、火星の動きから見た参考です。決めつけではありません。",
    reminderLabel: "今日のリマインダー",
    elementBalance: "元素バランス",
    everyPlanet: "各惑星に使える一文を添えました",
    socialPlanetsEyebrow: "惑星ディテール",
    socialPlanetsTitle: "思考、愛情、行動、成長、構造",
    house: "ハウス",
    housePending: "ハウス未定",
    degreePending: "度数未定",
    pending: "未定",
    signPending: "サイン未定",
    fullDataNeeded: "出生データがそろうと、この配置はより正確になります。",
    chartTitle: (sun, moon, rising) => `${sun} 太陽 / ${moon} 月 / ${rising} ASC`,
    chartLine: "未来志向、速い社交知性、そして思考よりもやわらかな第一印象を持つチャートです。",
    todayReminderAir: "まずアイデアを書き出し、次の具体的な一手を選びましょう。",
    todayReminderFire: "早めに動いてよいですが、押す前に信頼できる人とタイミングを確認して。",
    todayReminderEarth: "実務的な次の一歩を見える形に。根拠がチャートを落ち着かせます。",
    todayReminderWater: "他人の感情ノイズに答える前に、静かな時間を守って。",
    placements: {
      sun: { label: "独立した中心", subtitle: "太陽の自己", fallback: "中心の自己は独立して考え、明晰さには余白が必要です。" },
      moon: { label: "速い感情処理", subtitle: "月のリズム", fallback: "感情は情報、会話、新しい文脈を通して流れます。" },
      rising: { label: "やわらかな入口", subtitle: "上昇のサイン", fallback: "第一印象はやさしく受容的で、静かな観察力があります。" },
      mercury: { label: "構造ある声", subtitle: "水星の思考", fallback: "考えに形があるほど、伝え方が安定します。" },
      venus: { label: "安定した愛情", subtitle: "金星スタイル", fallback: "親密さは忍耐、一貫性、積み重ねた信頼で育ちます。" },
      mars: { label: "探索する推進力", subtitle: "火星の行動", fallback: "行動には意味、距離、広い地平が必要です。" },
      jupiter: { label: "見える成長", subtitle: "木星の拡大", fallback: "自信が見える形になるほど、チャンスが広がります。" },
      saturn: { label: "学びの規律", subtitle: "土星の課題", fallback: "速い知性を長く使える仕組みにすることが課題です。" },
      uranus: { label: "独自のパターン", subtitle: "天王星の縁", fallback: "古いルールが狭すぎる場所で、自由が重要になります。" },
      neptune: { label: "直感フィルター", subtitle: "海王星の場", fallback: "想像力は強く、境界線が信号をきれいにします。" },
      pluto: { label: "深い書き換え", subtitle: "冥王星の圧", fallback: "隠れた動機が見えた時、本当の変化が始まります。" },
    },
  },
  ko: {
    signatureBadge: "Anna LUO 차트 코드",
    sampleSignatureBadge: "샘플 차트 코드",
    patternBlend: "패턴 조합",
    rareTitle: "빠른 생각, 부드러운 입구",
    rareDescription: (percent) => `공기 기운이 강한 변동성 차트 조합과 ${percent}% 겹칩니다.`,
    hintLens: "Hint 렌즈",
    arcLove: "안정적인 애정",
    arcSupport: "사회적 확장",
    arcResources: "보이는 성장",
    arcPublic: "부드러운 매력",
    arcLoveFoot: "사랑",
    arcSupportFoot: "지원",
    arcResourcesFoot: "자원",
    arcPublicFoot: "외부 신호",
    codeEyebrow: "차트 코드",
    codeTitle: "한눈에 읽기",
    codeSummary: "미래지향적이고 연결이 빠르며, 겉인상은 머릿속 속도보다 부드럽습니다.",
    oneLine: "한 줄 요약",
    firstImpression: "첫인상",
    operatingMode: "실제 작동 방식",
    quietAdvantage: "조용한 강점",
    bestFit: "잘 맞는 별자리",
    firstImpressionValue: "부드럽지만 관찰력이 좋음",
    operatingModeValue: "조용한 전략가",
    quietAdvantageValue: "분위기를 빠르게 읽음",
    todayFocus: "오늘의 초점",
    focusCue: "집중 힌트",
    luckyAnchor: "앵커",
    anchorValue: "정리된 메모",
    coreEyebrow: "핵심 시그니처",
    coreTitle: "깔끔한 배치 힌트",
    bestFitNote: "원소 균형, 금성 스타일, 화성 추진력에서 계산한 참고값입니다. 단정은 아닙니다.",
    reminderLabel: "오늘의 리마인더",
    elementBalance: "원소 균형",
    everyPlanet: "각 행성마다 쓸모 있는 한 문장",
    socialPlanetsEyebrow: "행성 디테일",
    socialPlanetsTitle: "생각, 애정, 추진력, 성장, 구조",
    house: "하우스",
    housePending: "하우스 대기",
    degreePending: "도수 대기",
    pending: "대기",
    signPending: "별자리 대기",
    fullDataNeeded: "완전한 출생 정보가 있으면 이 배치가 더 선명해집니다.",
    chartTitle: (sun, moon, rising) => `${sun} 태양 / ${moon} 달 / ${rising} 상승궁`,
    chartLine: "미래지향적이고 사회적 반응이 빠르며, 첫인상은 생각보다 부드러운 차트입니다.",
    todayReminderAir: "먼저 생각을 적고, 그다음 하나의 구체적인 행동을 고르세요.",
    todayReminderFire: "일찍 움직이되, 밀어붙이기 전 믿는 사람과 타이밍을 확인하세요.",
    todayReminderEarth: "실제 다음 단계를 보이게 만드세요. 근거가 차트를 안정시킵니다.",
    todayReminderWater: "다른 사람의 감정 소음에 답하기 전에 조용한 시간을 지키세요.",
    placements: {
      sun: { label: "독립적인 중심", subtitle: "태양 정체성", fallback: "핵심 자아는 독립적으로 생각하며 명료함을 위해 공간이 필요합니다." },
      moon: { label: "빠른 감정 처리", subtitle: "달 리듬", fallback: "감정은 정보, 대화, 새로운 맥락을 통해 움직입니다." },
      rising: { label: "부드러운 입구", subtitle: "상승 신호", fallback: "첫인상은 부드럽고 수용적이며 조용히 예리합니다." },
      mercury: { label: "구조적인 목소리", subtitle: "수성 사고", fallback: "생각에 구조가 있을수록 말이 안정됩니다." },
      venus: { label: "안정적인 애정", subtitle: "금성 스타일", fallback: "친밀감은 인내, 일관성, 쌓인 신뢰로 커집니다." },
      mars: { label: "탐험가 추진력", subtitle: "화성 행동", fallback: "행동에는 의미, 거리, 더 넓은 시야가 필요합니다." },
      jupiter: { label: "보이는 성장", subtitle: "목성 확장", fallback: "자신감이 보이는 형태가 될수록 기회가 커집니다." },
      saturn: { label: "학습 규율", subtitle: "토성 과제", fallback: "빠른 지성을 오래 가는 시스템으로 바꾸는 것이 과제입니다." },
      uranus: { label: "독창적 패턴", subtitle: "천왕성 엣지", fallback: "오래된 규칙이 좁게 느껴지는 곳에서 자유가 중요합니다." },
      neptune: { label: "직관 필터", subtitle: "해왕성 장", fallback: "상상력이 강하며, 경계가 신호를 깨끗하게 만듭니다." },
      pluto: { label: "깊은 재작성", subtitle: "명왕성 압력", fallback: "숨은 동기가 보일 때 진짜 변화가 시작됩니다." },
    },
  },
};

function readInitialAstrologyTab(): AstrologyTab {
  if (typeof window === "undefined") return "chart";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "signs" || tab === "code" || tab === "placements") return "signs";
  if (tab === "transits" || tab === "today") return "transits";
  if (tab === "chart" || tab === "birth" || tab === "together" || tab === "reports") return tab;
  return "chart";
}

function writeAstrologyTab(tab: AstrologyTab) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (tab === "chart") {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", tab === "signs" ? "placements" : tab === "transits" ? "today" : tab);
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function astrologyShareUrl(tab: AstrologyTab) {
  if (typeof window === "undefined") return "/app/astrology";
  const url = new URL("/app/astrology", window.location.origin);
  if (tab !== "chart") {
    url.searchParams.set("tab", tab === "signs" ? "placements" : tab === "transits" ? "today" : tab);
  }
  return url.toString();
}

function astrologyShareMessage(profile: BirthProfile | null, tab: AstrologyTab, hasSavedChart: boolean) {
  const room = tabDisplayName(tab).toLowerCase();
  const name = profile?.name?.trim() || "me";
  if (hasSavedChart) {
    return `Open my Hint astrology ${room} room with ${name}. Compare your chart with me and ask Hint what it means.`;
  }
  return "Open Hint with me and build an astrology room from birth data, signs, and chart insights.";
}

function fallbackCopyText(value: string) {
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    textarea.remove();
  }
  return copied;
}

function accountStorageKey(account: LocalAccount | null, anonId: string) {
  if (!account) return "";
  return account.identifier || account.email || account.phone || anonId;
}

function savedNatalChartStorageKey(account: LocalAccount | null, anonId: string) {
  const key = accountStorageKey(account, anonId);
  return key ? `${SAVED_NATAL_CHART_PREFIX}:${key}` : "";
}

function readSavedNatalChart(account: LocalAccount | null, anonId: string, profile: BirthProfile | null) {
  if (typeof window === "undefined" || !account || !profile) return null;
  try {
    const raw = window.localStorage.getItem(savedNatalChartStorageKey(account, anonId));
    if (!raw) return null;
    const record = JSON.parse(raw) as SavedNatalChartRecord;
    if (record.accountKey !== accountStorageKey(account, anonId)) return null;
    if (record.profileId !== profile.id || record.profileUpdatedAt !== profile.updatedAt) return null;
    return record;
  } catch {
    return null;
  }
}

function writeSavedNatalChart(account: LocalAccount | null, anonId: string, profile: BirthProfile, chart: NatalChart, natalResponse: AstroNatalResponse) {
  if (typeof window === "undefined" || !account) return;
  const accountKey = accountStorageKey(account, anonId);
  if (!accountKey) return;
  const record: SavedNatalChartRecord = {
    accountKey,
    profileId: profile.id,
    profileUpdatedAt: profile.updatedAt,
    chart,
    natalResponse,
    savedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(savedNatalChartStorageKey(account, anonId), JSON.stringify(record));
  } catch {
    // Local chart history is best-effort until real account storage exists.
  }
}

function buildFallbackNatalResponse(profile: BirthProfile, chart: NatalChart): AstroNatalResponse {
  const fetchedAt = chart.calculatedAt || new Date().toISOString();
  return {
    source: "fallback",
    mode: "fallback",
    cached: false,
    fetchedAt,
    profileHash: chart.id || `fallback-${profile.id}`,
    validation: {
      partial: false,
      message: "Local chart preview generated from saved birth details.",
    },
    chart: {
      placements: chart.placements.map((placement) => ({
        body: placement.body,
        sign: placement.sign,
        degree: placement.degree,
        house: placement.house,
        retrograde: placement.retrograde,
        element: placement.element,
        modality: placement.modality,
      })),
      houses: chart.houses.map((house) => ({
        house: house.house,
        sign: house.sign,
        degree: house.degree,
        theme: house.theme,
      })),
      aspects: chart.aspects.map((aspect) => ({
        from: aspect.from,
        to: aspect.to,
        type: aspect.type,
        orb: aspect.orb,
        strength: aspect.strength,
      })),
      elementBalance: chart.elementBalance,
      modalityBalance: chart.modalityBalance,
      dominantElement: chart.elementBalance.dominant,
      dominantModality: chart.modalityBalance.dominant,
      summary: {
        headline: chart.summary.headline,
        summary: chart.summary.short,
        strengths: chart.summary.strengths,
        watchOut: chart.summary.watch,
      },
    },
  };
}

function titleCase(value?: string) {
  if (!value) return "Pending";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function signLabel(sign?: ZodiacSign) {
  return sign ? SIGN_LABELS[sign] : "Pending";
}

function uiCopy(language: HintLanguage) {
  return ASTRO_UI_COPY[language] ?? ASTRO_UI_COPY.en;
}

function signName(sign: ZodiacSign | undefined, language: HintLanguage) {
  if (!sign) return uiCopy(language).pending;
  return SIGN_NAMES_BY_LANGUAGE[language]?.[sign] ?? SIGN_LABELS[sign];
}

function signShort(sign: ZodiacSign, language: HintLanguage) {
  return SIGN_SHORT_BY_LANGUAGE[language]?.[sign] ?? SIGN_GLYPHS[sign];
}

function bodyName(body: PlanetBody, language: HintLanguage) {
  return BODY_NAMES_BY_LANGUAGE[language]?.[body] ?? BODY_LABELS[body];
}

function bodySymbol(body: PlanetBody, language: HintLanguage) {
  return BODY_SYMBOLS_BY_LANGUAGE[language]?.[body] ?? BODY_MARKS[body];
}

function bodyLabel(body: string) {
  return BODY_LABELS[body as PlanetBody] ?? titleCase(body);
}

function tabDisplayName(tab: AstrologyTab) {
  switch (tab) {
    case "signs":
      return "Zodiac";
    case "chart":
      return "Chart";
    case "transits":
      return "Today";
    case "birth":
      return "Birth data";
    case "together":
      return "Together";
    case "reports":
      return "Reports";
    default:
      return titleCase(tab);
  }
}

function tabGuideCopy(tab: AstrologyTab) {
  switch (tab) {
    case "signs":
      return {
        eyebrow: "Zodiac layer",
        title: "Signs, translated into strengths",
        body: "Start with the quick snapshot. Deeper placements stay behind View details so the page stays readable.",
        nextTab: "transits" as AstrologyTab,
        nextLabel: "Today",
        color: ASTRO_ROSE,
        icon: CircleDot,
      };
    case "transits":
      return {
        eyebrow: "Today layer",
        title: "The sky, ranked for right now",
        body: "Use the strongest transit first. The timeline and real-sky visual are optional details.",
        nextTab: "reports" as AstrologyTab,
        nextLabel: "Reports",
        color: "var(--astro-lavender)",
        icon: Activity,
      };
    case "birth":
      return {
        eyebrow: "Source data",
        title: "One saved profile powers everything",
        body: "Birthday, time, and place unlock chart, zodiac, today, reports, and pair readings.",
        nextTab: "chart" as AstrologyTab,
        nextLabel: "Chart",
        color: ASTRO_GOLD_BRIGHT,
        icon: CalendarDays,
      };
    case "together":
      return {
        eyebrow: "Pair mode",
        title: "Compare charts only with consent",
        body: "Create a private invite or enter partner data. Keep heavier synastry receipts folded until needed.",
        nextTab: "reports" as AstrologyTab,
        nextLabel: "Reports",
        color: ASTRO_AQUA,
        icon: HeartHandshake,
      };
    case "reports":
      return {
        eyebrow: "Report room",
        title: "Deep reads stay intentional",
        body: "Preview the theme first, then ask Hint or unlock a specific report when the user wants more.",
        nextTab: "chart" as AstrologyTab,
        nextLabel: "Chart",
        color: ASTRO_GOLD_BRIGHT,
        icon: FileText,
      };
    case "chart":
    default:
      return {
        eyebrow: "Chart map",
        title: "Start with Sun, Moon, and Rising",
        body: "The wheel is the source. The readable summary and strengths should answer the first question fast.",
        nextTab: "signs" as AstrologyTab,
        nextLabel: "Zodiac",
        color: ASTRO_AQUA,
        icon: Orbit,
      };
  }
}

function astroColor(index: number) {
  return [ASTRO_GOLD_BRIGHT, ASTRO_AQUA, ASTRO_ROSE, "var(--astro-lavender)", "var(--astro-green)", "var(--astro-orange)"][index % 6]!;
}

function balanceColor(label: string) {
  const key = label.toLowerCase();
  if (key.includes("fire") || key.includes("cardinal")) return ASTRO_ROSE;
  if (key.includes("earth") || key.includes("fixed")) return ASTRO_GOLD_BRIGHT;
  if (key.includes("air") || key.includes("mutable")) return ASTRO_AQUA;
  return "var(--astro-lavender)";
}

type ElementKey = "fire" | "earth" | "air" | "water";
type ModalityKey = "cardinal" | "fixed" | "mutable";

const ELEMENT_KEYS: ElementKey[] = ["fire", "earth", "air", "water"];
const STORY_BODIES: PlanetBody[] = ["sun", "moon", "rising", "mercury", "venus", "mars", "jupiter", "saturn"];
const PLACEMENT_INDEX_BODIES: PlanetBody[] = ["sun", "moon", "rising", "mercury", "venus", "mars", "jupiter", "saturn"];
const SOCIAL_PLANETS: PlanetBody[] = ["mercury", "venus", "mars", "jupiter", "saturn"];

const ELEMENT_META: Record<ElementKey, { label: string; role: string; color: string; soft: string; line: string }> = {
  fire: {
    label: "Fire",
    role: "Action",
    color: "#ff6f7d",
    soft: "rgba(255,111,125,0.18)",
    line: "Turns feeling into motion, risk, and visible courage.",
  },
  earth: {
    label: "Earth",
    role: "Grounding",
    color: "#f5b45e",
    soft: "rgba(245,180,94,0.2)",
    line: "Builds trust through proof, craft, and steady follow-through.",
  },
  air: {
    label: "Air",
    role: "Social mind",
    color: "#55d79b",
    soft: "rgba(85,215,155,0.2)",
    line: "Reads rooms through language, ideas, timing, and social pattern.",
  },
  water: {
    label: "Water",
    role: "Feeling",
    color: "#77c8ff",
    soft: "rgba(119,200,255,0.2)",
    line: "Notices emotional weather, memory, tenderness, and subtle shifts.",
  },
};

const MODALITY_META: Record<ModalityKey, { label: string; color: string; line: string }> = {
  cardinal: {
    label: "Cardinal",
    color: "#ff8dad",
    line: "Starts cleanly and stabilizes by making the first move.",
  },
  fixed: {
    label: "Fixed",
    color: "#f5b45e",
    line: "Holds a line once the value, person, or mission matters.",
  },
  mutable: {
    label: "Mutable",
    color: "#7fc7ff",
    line: "Adapts quickly and turns change into readable information.",
  },
};

const BODY_COLORS: Record<PlanetBody, string> = {
  sun: "#ff6f61",
  moon: "#4f9dff",
  rising: "#8a7cff",
  mercury: "#4fcf9f",
  venus: "#c58a42",
  mars: "#f25f5c",
  jupiter: "#6aa9ff",
  saturn: "#9a7a42",
  uranus: "#46c4a7",
  neptune: "#2f87d6",
  pluto: "#7046d8",
};

const BODY_LENSES: Record<PlanetBody, { title: string; role: string; question: string }> = {
  sun: {
    title: "Actual self",
    role: "core personality",
    question: "What keeps Anna centered?",
  },
  moon: {
    title: "Inner weather",
    role: "emotional rhythm",
    question: "How does Anna process feelings?",
  },
  rising: {
    title: "Surface signal",
    role: "first impression",
    question: "What do people notice first?",
  },
  mercury: {
    title: "Mind and voice",
    role: "communication",
    question: "How does Anna think out loud?",
  },
  venus: {
    title: "Love style",
    role: "closeness",
    question: "What makes trust feel real?",
  },
  mars: {
    title: "Drive",
    role: "momentum",
    question: "What lights action up?",
  },
  jupiter: {
    title: "Growth luck",
    role: "expansion",
    question: "Where does confidence grow?",
  },
  saturn: {
    title: "Discipline lesson",
    role: "structure",
    question: "What has to mature?",
  },
  uranus: {
    title: "Originality",
    role: "breakthrough",
    question: "Where does Anna need freedom?",
  },
  neptune: {
    title: "Dream field",
    role: "imagination",
    question: "Where does intuition blur the edge?",
  },
  pluto: {
    title: "Deep change",
    role: "transformation",
    question: "Where does power get rebuilt?",
  },
};

const SIGN_TONES: Record<ZodiacSign, string> = {
  aries: "direct, brave, fast to act, and allergic to stale energy",
  taurus: "steady, sensual, loyal, and focused on what can last",
  gemini: "curious, verbal, funny, and hungry for fresh information",
  cancer: "protective, intuitive, private, and deeply shaped by atmosphere",
  leo: "expressive, warm, proud, and drawn to visible creative impact",
  virgo: "precise, observant, useful, and quietly excellent at improving systems",
  libra: "socially intelligent, diplomatic, beautiful in taste, and fairness-oriented",
  scorpio: "intense, private, magnetic, and unwilling to accept shallow answers",
  sagittarius: "wide-looking, candid, adventurous, and guided by meaning",
  capricorn: "strategic, self-controlled, mature, and serious about earned results",
  aquarius: "independent, future-facing, original, and hard to box in",
  pisces: "soft, empathic, imaginative, and highly tuned to invisible signals",
};

const BODY_ACTIONS: Record<PlanetBody, string> = {
  sun: "leads with",
  moon: "regulates through",
  rising: "enters the room with",
  mercury: "explains through",
  venus: "bonds through",
  mars: "moves through",
  jupiter: "expands through",
  saturn: "matures through",
  uranus: "breaks patterns through",
  neptune: "dreams through",
  pluto: "transforms through",
};

const SIGN_ELEMENT: Record<ZodiacSign, ElementKey> = {
  aries: "fire",
  leo: "fire",
  sagittarius: "fire",
  taurus: "earth",
  virgo: "earth",
  capricorn: "earth",
  gemini: "air",
  libra: "air",
  aquarius: "air",
  cancer: "water",
  scorpio: "water",
  pisces: "water",
};

const SIGN_RULERS: Record<ZodiacSign, PlanetBody> = {
  aries: "mars",
  taurus: "venus",
  gemini: "mercury",
  cancer: "moon",
  leo: "sun",
  virgo: "mercury",
  libra: "venus",
  scorpio: "pluto",
  sagittarius: "jupiter",
  capricorn: "saturn",
  aquarius: "uranus",
  pisces: "neptune",
};

function balanceEntries(chart: NatalChart) {
  const values = ELEMENT_KEYS.map((key) => [key, chart.elementBalance[key]] as const);
  const total = values.reduce((sum, [, value]) => sum + value, 0) || 1;
  return values.map(([key, value]) => ({
    key,
    raw: value,
    percent: Math.round((value / total) * 100),
    ...ELEMENT_META[key],
  }));
}

function dominantElementLine(chart: NatalChart) {
  const element = chart.elementBalance.dominant;
  const modality = chart.modalityBalance.dominant;
  const elementLine = ELEMENT_META[element].line;
  const modalityLine = MODALITY_META[modality].line;
  return `${titleCase(element)} dominant, ${titleCase(modality)} rhythm. ${elementLine} ${modalityLine}`;
}

function chartRulerPlacement(chart: NatalChart) {
  const risingSign = corePlacement(chart, "rising")?.sign ?? chart.risingSign;
  if (!risingSign) return undefined;
  const ruler = SIGN_RULERS[risingSign];
  return corePlacement(chart, ruler);
}

function chartRulerLine(chart: NatalChart, language: HintLanguage) {
  const risingSign = corePlacement(chart, "rising")?.sign ?? chart.risingSign;
  if (!risingSign) return "Rising sign needed";
  const ruler = SIGN_RULERS[risingSign];
  const placement = corePlacement(chart, ruler);
  const sign = signName(placement?.sign, language);
  return `${bodyName(ruler, language)} through ${sign}`;
}

function strongestAspectLine(chart: NatalChart) {
  const aspect = chart.aspects.slice().sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0) || (a.orb ?? 99) - (b.orb ?? 99))[0];
  if (!aspect) return "No major aspect yet";
  return `${bodyLabel(aspect.from)} ${aspect.type} ${bodyLabel(aspect.to)}`;
}

function retrogradeLine(chart: NatalChart) {
  const retrogrades = chart.placements.filter((placement) => placement.retrograde);
  if (!retrogrades.length) return "No major retrograde emphasis";
  return retrogrades.slice(0, 2).map((placement) => bodyLabel(placement.body)).join(" / ");
}

function placementOneLine(placement?: PlanetPlacement) {
  if (!placement?.sign) return "Add full birth data to make this placement precise.";
  const body = BODY_LABELS[placement.body];
  const sign = signLabel(placement.sign);
  return `${body} in ${sign} ${BODY_ACTIONS[placement.body]} ${SIGN_TONES[placement.sign]}.`;
}

function placementCopyLine(placement: PlanetPlacement | undefined, ui: AstrologyUiCopy) {
  if (!placement?.sign) return ui.fullDataNeeded;
  return ui.placements[placement.body]?.fallback ?? placement.meaning ?? ui.fullDataNeeded;
}

function placementEvidence(placement: PlanetPlacement | undefined, language: HintLanguage, ui: AstrologyUiCopy) {
  if (!placement) return "No placement yet";
  const evidence = [
    placement.sign ? `${bodyName(placement.body, language)} in ${signName(placement.sign, language)}` : `${bodyName(placement.body, language)} ${ui.signPending}`,
    placement.house ? `${ui.house} ${placement.house}` : ui.housePending,
    placement.degree !== undefined ? `${Number(placement.degree).toFixed(1)}°` : ui.degreePending,
  ];
  if (placement.retrograde) evidence.push("Retrograde");
  return evidence.join(" / ");
}

function chartSignatureTitle(chart: NatalChart, language: HintLanguage, ui: AstrologyUiCopy) {
  return ui.chartTitle(signName(chart.sunSign, language), signName(chart.moonSign, language), signName(chart.risingSign, language));
}

function chartSignatureLine(chart: NatalChart, ui: AstrologyUiCopy) {
  const sun = corePlacement(chart, "sun");
  const moon = corePlacement(chart, "moon");
  const rising = corePlacement(chart, "rising");
  if (sun?.sign === "aquarius" && moon?.sign === "gemini" && rising?.sign === "pisces") {
    return ui.chartLine;
  }
  return `${dominantElementLine(chart)} ${placementOneLine(sun)}`;
}

function traitPill(chart: NatalChart) {
  const element = chart.elementBalance.dominant;
  const modality = chart.modalityBalance.dominant;
  const elementRole = ELEMENT_META[element].role;
  const modalityRole = MODALITY_META[modality].label;
  return `${modalityRole} ${elementRole}`;
}

function deterministicScore(chart: NatalChart, min = 7, max = 18) {
  const sun = corePlacement(chart, "sun");
  const moon = corePlacement(chart, "moon");
  const rising = corePlacement(chart, "rising");
  if (sun?.sign === "aquarius" && moon?.sign === "gemini" && rising?.sign === "pisces") return "8.46";
  const seed = chart.placements.reduce((sum, placement, index) => {
    const signScore = placement.sign ? ZODIAC_SIGNS.indexOf(placement.sign) + 1 : 3;
    return sum + signScore * (index + 3) + (placement.house ?? index + 1);
  }, chart.id.length);
  const value = min + (seed % ((max - min) * 100)) / 100;
  return value.toFixed(2);
}

function bestFitSignIds(chart: NatalChart) {
  const venus = corePlacement(chart, "venus")?.sign;
  const mars = corePlacement(chart, "mars")?.sign;
  const dominant = chart.elementBalance.dominant;
  const byElement: Record<ElementKey, ZodiacSign[]> = {
    fire: ["aries", "leo", "sagittarius"],
    earth: ["taurus", "virgo", "capricorn"],
    air: ["gemini", "libra", "aquarius"],
    water: ["cancer", "scorpio", "pisces"],
  };
  const signs = [...byElement[dominant]];
  if (venus && !signs.includes(venus)) signs.unshift(venus);
  if (mars && !signs.includes(mars)) signs.push(mars);
  return signs.slice(0, 3);
}

function bestFitSigns(chart: NatalChart, language: HintLanguage) {
  return bestFitSignIds(chart).map((sign) => signName(sign, language));
}

function todayReminder(chart: NatalChart, ui: AstrologyUiCopy) {
  const element = chart.elementBalance.dominant;
  if (element === "air") return ui.todayReminderAir;
  if (element === "fire") return ui.todayReminderFire;
  if (element === "earth") return ui.todayReminderEarth;
  return ui.todayReminderWater;
}

function polarPoint(radius: number, degrees: number) {
  const angle = ((degrees - 90) * Math.PI) / 180;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

function passwordCards(chart: NatalChart, language: HintLanguage, ui: AstrologyUiCopy) {
  const primaryBodies: PlanetBody[] = ["sun", "moon", "rising", "venus", "mars", "mercury", "jupiter", "saturn"];
  return primaryBodies.map((body) => {
    const placement = corePlacement(chart, body);
    const copy = ui.placements[body];
    return {
      id: body,
      label: copy.label,
      subtitle: copy.subtitle,
      placement,
      body,
      value: placement?.sign ? `${bodyName(body, language)} in ${signName(placement.sign, language)}` : `${bodyName(body, language)} ${ui.signPending}`,
      line: placementCopyLine(placement, ui),
    };
  });
}

function selfSecretCards(chart: NatalChart, language: HintLanguage, ui: AstrologyUiCopy) {
  const rising = corePlacement(chart, "rising");
  const sun = corePlacement(chart, "sun");
  const moon = corePlacement(chart, "moon");
  const venus = corePlacement(chart, "venus");
  const fitSigns = bestFitSigns(chart, language);
  return [
    {
      title: ui.firstImpression,
      value: rising?.sign === "pisces" ? ui.firstImpressionValue : `${signName(rising?.sign, language)} first impression`,
      body: "rising" as PlanetBody,
    },
    {
      title: ui.operatingMode,
      value: sun?.sign === "aquarius" && moon?.sign === "gemini" ? ui.operatingModeValue : `${signName(sun?.sign, language)} core + ${signName(moon?.sign, language)} response`,
      body: "sun" as PlanetBody,
    },
    {
      title: ui.quietAdvantage,
      value: moon?.sign === "gemini" ? ui.quietAdvantageValue : "Turns noise into usable signals",
      body: "moon" as PlanetBody,
    },
    {
      title: ui.bestFit,
      value: fitSigns.join(" / "),
      body: venus?.body ?? ("venus" as PlanetBody),
    },
  ];
}

function placementStrengthScore(placement: PlanetPlacement | undefined, offset = 0) {
  const signSeed = placement?.sign ? ZODIAC_SIGNS.indexOf(placement.sign) + 1 : 5;
  const houseSeed = placement?.house ?? 4;
  return 62 + ((signSeed * 7 + houseSeed * 5 + offset) % 32);
}

function zodiacStrengthRows(chart: NatalChart, language: HintLanguage) {
  const sun = corePlacement(chart, "sun");
  const moon = corePlacement(chart, "moon");
  const rising = corePlacement(chart, "rising");
  const mercury = corePlacement(chart, "mercury");
  const venus = corePlacement(chart, "venus");
  const mars = corePlacement(chart, "mars");
  const jupiter = corePlacement(chart, "jupiter");
  const saturn = corePlacement(chart, "saturn");
  const neptune = corePlacement(chart, "neptune");
  return [
    {
      label: "Communication",
      value: mercury ? `${bodyName("mercury", language)} · ${signName(mercury.sign, language)}` : "Mercury",
      score: placementStrengthScore(mercury, chart.elementBalance.air),
      color: BODY_COLORS.mercury,
    },
    {
      label: "Emotional rhythm",
      value: moon ? `${bodyName("moon", language)} · ${signName(moon.sign, language)}` : "Moon",
      score: placementStrengthScore(moon, chart.elementBalance.water),
      color: BODY_COLORS.moon,
    },
    {
      label: "Love and bonding",
      value: venus ? `${bodyName("venus", language)} · ${signName(venus.sign, language)}` : "Venus",
      score: placementStrengthScore(venus, chart.elementBalance.earth),
      color: BODY_COLORS.venus,
    },
    {
      label: "Discipline",
      value: saturn ? `${bodyName("saturn", language)} · ${signName(saturn.sign, language)}` : "Saturn",
      score: placementStrengthScore(saturn, chart.elementBalance.earth),
      color: BODY_COLORS.saturn,
    },
    {
      label: "Creativity",
      value: sun ? `${bodyName("sun", language)} · ${signName(sun.sign, language)}` : "Sun",
      score: Math.round((placementStrengthScore(sun, 4) + placementStrengthScore(jupiter, 6)) / 2),
      color: BODY_COLORS.sun,
    },
    {
      label: "Social presence",
      value: rising ? `${bodyName("rising", language)} · ${signName(rising.sign, language)}` : "Rising",
      score: placementStrengthScore(rising, chart.elementBalance.air),
      color: BODY_COLORS.rising,
    },
    {
      label: "Intuition",
      value: neptune ? `${bodyName("neptune", language)} · ${signName(neptune.sign, language)}` : "Neptune",
      score: Math.round((placementStrengthScore(neptune, 9) + placementStrengthScore(moon, 12)) / 2),
      color: BODY_COLORS.neptune,
    },
    {
      label: "Leadership",
      value: mars ? `${bodyName("mars", language)} · ${signName(mars.sign, language)}` : "Mars",
      score: Math.round((placementStrengthScore(mars, 10) + placementStrengthScore(sun, 14)) / 2),
      color: BODY_COLORS.mars,
    },
  ];
}

function zodiacModuleItems(chart: NatalChart, language: HintLanguage): AstroModuleItem[] {
  const sun = corePlacement(chart, "sun");
  const moon = corePlacement(chart, "moon");
  const rising = corePlacement(chart, "rising");
  const mercury = corePlacement(chart, "mercury");
  const venus = corePlacement(chart, "venus");
  const mars = corePlacement(chart, "mars");
  return [
    {
      label: "Strength snapshot",
      value: traitPill(chart),
      note: "A quick read on what tends to come naturally.",
      color: ELEMENT_META[chart.elementBalance.dominant].color,
    },
    {
      label: "Personality stack",
      value: `${signName(sun?.sign, language)} / ${signName(moon?.sign, language)}`,
      note: "Core self and inner weather, without needing the full wheel.",
      color: BODY_COLORS.sun,
    },
    {
      label: "Mind style",
      value: mercury ? signName(mercury.sign, language) : "Mercury needed",
      note: "How thoughts, language, and curiosity usually move.",
      color: BODY_COLORS.mercury,
    },
    {
      label: "Love style",
      value: venus ? signName(venus.sign, language) : "Venus needed",
      note: "How trust, taste, and closeness become readable.",
      color: BODY_COLORS.venus,
    },
    {
      label: "Drive style",
      value: mars ? signName(mars.sign, language) : "Mars needed",
      note: "Where action, frustration, and desire pick up speed.",
      color: BODY_COLORS.mars,
    },
    {
      label: "Social pattern",
      value: rising ? signName(rising.sign, language) : "Rising needed",
      note: "First impression and the way others read the entrance.",
      color: BODY_COLORS.rising,
    },
  ];
}

function topStrengthReceipts(chart: NatalChart) {
  const receipts = chart.summary.strengths.filter(Boolean);
  return receipts.length ? receipts.slice(0, 3) : [dominantElementLine(chart), chart.summary.short, "Use the chart as a practical mirror, not a verdict."];
}

function wheelPlacementRows(chart: NatalChart, language: HintLanguage, ui: AstrologyUiCopy) {
  return chart.placements.slice(0, 11).map((placement) => ({
    placement,
    label: `${bodyName(placement.body, language)} · ${signName(placement.sign, language)}`,
    meta: `${placement.house ? `${ui.house} ${placement.house}` : ui.housePending} · ${placement.degree !== undefined ? `${Number(placement.degree).toFixed(1)}°` : ui.degreePending}`,
  }));
}

function useLocalBirthProfile() {
  const [profile, setProfile] = useState<BirthProfile | null>(() => readBirthProfile());

  useEffect(() => {
    const update = () => setProfile(readBirthProfile());
    window.addEventListener("storage", update);
    window.addEventListener("hint.birthProfile.updated", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("hint.birthProfile.updated", update);
    };
  }, []);

  return [profile, setProfile] as const;
}

function liveProfileMissing(profile: BirthProfile | null) {
  if (!profile) return ["profile"];
  const missing: string[] = [];
  if (!profile.birthTime) missing.push("birth time");
  if (profile.latitude === undefined || profile.longitude === undefined) missing.push("birth place");
  if (profile.timezoneOffset === undefined) missing.push("timezone");
  return missing;
}

function liveProfileReady(profile: BirthProfile | null) {
  return liveProfileMissing(profile).length === 0;
}

function liveProfileHint(profile: BirthProfile | null) {
  const missing = liveProfileMissing(profile);
  if (missing.includes("profile")) return "Add birth details first.";
  if (missing.includes("birth time")) return "Birth time is needed for rising sign and houses.";
  if (missing.includes("birth place") || missing.includes("timezone")) return "Select a birth place so coordinates and timezone can be saved.";
  return "Birth details are complete. Hint can calculate the full chart.";
}

function isLiveNatal(response: AstroNatalResponse | null): response is AstroNatalResponse & { source: "astrologyapi"; mode: "live" } {
  return response?.source === "astrologyapi" && response.mode === "live";
}

function chartSourceLabel(response: AstroNatalResponse | null, chart?: NatalChart | null) {
  if (isLiveNatal(response) || chart?.source === "astrologyapi" || chart?.source === "api") return "Live chart";
  if (response?.mode === "partial" || chart?.validation?.partial) return "Partial preview";
  if (response || chart?.source === "fallback") return "Saved preview";
  return "Profile preview";
}

function transitSourceLabel(transits: AstroTransitsResponse | null) {
  if (transits?.source === "astrologyapi" && transits.mode === "live") return "Live timing";
  if (transits?.source === "fallback") return "Saved timing";
  return "Preview timing";
}

function useAstrologyData(profile: BirthProfile | null) {
  const [relationship, setRelationship] = useState<RelationshipAstrology | null>(null);
  const [reports, setReports] = useState<AstrologyReport[]>([]);

  useEffect(() => {
    setRelationship(profile ? buildMockRelationshipAstrology(profile) : null);
    setReports(MOCK_ASTROLOGY_REPORTS);
  }, [profile]);

  return { relationship, reports };
}

function useAstroBackendStatus() {
  const [requestId, setRequestId] = useState(0);
  const [state, setState] = useState<BackendStatusState>({
    status: FALLBACK_PROVIDER_STATUS,
    online: false,
    loading: true,
    checkedAt: null,
  });

  useEffect(() => {
    let alive = true;
    setState((current) => ({ ...current, loading: true, error: undefined }));
    fetch(apiUrl("/api/astro/status"), { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`ASTRO_STATUS_${response.status}`);
        return response.json() as Promise<AstroProviderStatus>;
      })
      .then((next) => {
        if (!alive) return;
        setState({
          status: next ?? FALLBACK_PROVIDER_STATUS,
          online: true,
          loading: false,
          checkedAt: new Date().toISOString(),
        });
      })
      .catch(() => {
        if (!alive) return;
        setState({
          status: FALLBACK_PROVIDER_STATUS,
          online: false,
          loading: false,
          checkedAt: new Date().toISOString(),
          error: "Live sky service unavailable",
        });
      });
    return () => {
      alive = false;
    };
  }, [requestId]);

  const refresh = useCallback(() => setRequestId((current) => current + 1), []);
  return { ...state, refresh };
}

function cleanGptLines(text?: string) {
  const lines = (text ?? "").split(/\n|•/g).map((line) => line.trim()).filter(Boolean);
  const bulletLines = lines.filter((line) => /^[-*]/.test(line));
  return (bulletLines.length ? bulletLines : lines)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").replace(/\*\*/g, "").trim())
    .filter((line) => line.length <= 90)
    .filter((line) => !/:$/.test(line))
    .filter(Boolean)
}

function cleanGptBullets(text?: string) {
  return cleanGptLines(text).slice(0, 3);
}

function useReportPreviewBullets(requestId: number, reports: AstrologyReport[], chart: NatalChart) {
  const [mode, setMode] = useState<ServiceMode>("Fallback");
  const [bulletsByReport, setBulletsByReport] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (requestId <= 0) return;
    let alive = true;
    setLoading(true);
    setError("");
    getAstroInterpretation("reportPreview", {
      chartSummary: chart.summary.headline,
      reportTitles: reports.map((report) => report.title),
      existingBullets: reports.map((report) => ({ title: report.title, bullets: report.previewBullets ?? [] })),
    })
      .then((response) => {
        if (!alive) return;
        const cleanedLines = response.bullets?.length ? response.bullets : cleanGptLines(response.text);
        const byReport: Record<string, string[]> = {};
        for (const report of reports) {
          const aliases = [report.title.toLowerCase(), report.title.toLowerCase().replace(/^\d{4}\s+/, "")];
          const matches = cleanedLines
            .map((line) => {
              const lower = line.toLowerCase();
              const alias = aliases.find((item) => lower.startsWith(`${item}:`));
              return alias ? line.slice(alias.length + 1).trim() : "";
            })
            .filter(Boolean)
            .slice(0, 3);
          if (matches.length) byReport[report.id] = matches;
        }
        const globalBullets = cleanGptBullets(response.text);
        if (response.mode !== "live" || (!Object.keys(byReport).length && !globalBullets.length)) {
          setMode("Fallback");
          setBulletsByReport({});
          setError("GPT preview fell back to local copy.");
          return;
        }
        setMode("Connected");
        setBulletsByReport(Object.keys(byReport).length ? byReport : Object.fromEntries(reports.map((report) => [report.id, globalBullets])));
      })
      .catch(() => {
        if (!alive) return;
        setMode("Fallback");
        setBulletsByReport({});
        setError("GPT preview is unavailable right now.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [requestId, chart.summary.headline, reports]);

  return { mode, bulletsByReport, loading, error };
}

function AstrologyHomeBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute -left-20 top-8 h-[22rem] w-[30rem] opacity-[0.22]"
        viewBox="0 0 520 360"
        fill="none"
      >
        <path d="M24 212 C136 98 312 68 488 132" stroke="rgba(209,165,111,0.42)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M2 244 C148 312 340 292 520 182" stroke="rgba(163,107,154,0.22)" strokeWidth="1" strokeLinecap="round" />
        <path d="M88 66 C222 132 344 236 438 338" stroke="rgba(109,156,153,0.22)" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <svg
        className="absolute -right-28 top-[18rem] h-[24rem] w-[28rem] opacity-[0.20]"
        viewBox="0 0 500 420"
        fill="none"
      >
        <path d="M42 292 C156 174 320 112 486 98" stroke="rgba(209,165,111,0.38)" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M16 142 C154 214 274 286 398 398" stroke="rgba(143,122,174,0.24)" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <span className="absolute left-[12%] top-[8.5rem] text-[13px]" style={{ color: "rgba(209,165,111,0.42)" }}>✦</span>
      <span className="absolute right-[14%] top-[15rem] text-[10px]" style={{ color: "rgba(143,122,174,0.34)" }}>✦</span>
      <span className="absolute left-[58%] top-[4.8rem] h-1.5 w-1.5 rounded-full" style={{ background: "rgba(209,165,111,0.42)" }} />
      <span className="absolute right-[22%] top-[31rem] h-1 w-1 rounded-full" style={{ background: "rgba(109,156,153,0.38)" }} />
    </div>
  );
}

function TopTabs({ activeTab, onChange }: { activeTab: AstrologyTab; onChange: (tab: AstrologyTab) => void }) {
  const activeButtonRef = useRef<HTMLButtonElement | null>(null);
  const tabs: Array<{ tab: AstrologyTab; compact: string; full: string; icon: typeof Orbit }> = [
    { tab: "chart", compact: "Chart", full: "Birth chart", icon: Orbit },
    { tab: "signs", compact: "Zodiac", full: "Zodiac placements", icon: CircleDot },
    { tab: "transits", compact: "Today", full: "Live transits", icon: Activity },
    { tab: "birth", compact: "Data", full: "Birth data", icon: CalendarDays },
    { tab: "together", compact: "Pair", full: "Shared chart", icon: HeartHandshake },
    { tab: "reports", compact: "Reports", full: "Reports", icon: FileText },
  ];

  useEffect(() => {
    const node = activeButtonRef.current;
    if (!node) return;
    const behavior: ScrollBehavior =
      document.documentElement.dataset.hintReduceMotion === "true" ? "auto" : "smooth";
    node.scrollIntoView({ block: "nearest", inline: "center", behavior });
  }, [activeTab]);

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-[14px] border p-1 font-sans [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        color: ASTRO_TEXT,
        background: "color-mix(in srgb, var(--hint-control-bg) 84%, transparent)",
        borderColor: "color-mix(in srgb, var(--hint-control-border) 46%, transparent)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
      aria-label="Astrology sections"
    >
      {tabs.map((item) => {
        const active = activeTab === item.tab;
        const Icon = item.icon;
        return (
          <button
            key={item.tab}
            ref={(node) => {
              if (active) activeButtonRef.current = node;
            }}
            type="button"
            onClick={() => onChange(item.tab)}
            aria-label={item.full}
            aria-pressed={active}
            className="relative inline-flex h-8 min-w-[72px] shrink-0 items-center justify-center gap-1 rounded-[10px] border px-2 text-[10px] font-black leading-none transition-[opacity,transform] duration-200 active:scale-[0.98]"
            style={{
              opacity: active ? 1 : 0.78,
              color: active ? ASTRO_BUTTON_TEXT : ASTRO_MUTED,
              background: active ? ASTRO_BUTTON : "transparent",
              borderColor: active ? "color-mix(in srgb, var(--hint-gold) 30%, var(--hint-border-strong))" : "transparent",
              boxShadow: active ? "0 8px 18px color-mix(in srgb, var(--hint-rose) 10%, transparent), inset 0 1px 0 rgba(255,255,255,0.42)" : "none",
            }}
          >
            <Icon size={12} />
            {item.compact}
          </button>
        );
      })}
    </nav>
  );
}

function DataStatusRow({ hasProfile, hasSavedChart, natalResponse }: { hasProfile: boolean; hasSavedChart: boolean; natalResponse: AstroNatalResponse | null }) {
  const live = isLiveNatal(natalResponse);
  const rows = live
    ? ["Saved chart", "Live sky"]
    : hasSavedChart
      ? ["Saved chart", "Preview timing"]
      : [hasProfile ? "Birth profile saved" : "Birth profile needed", "Chart not calculated"];
  return (
    <section className="rounded-[8px] border px-3 py-2" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: live ? ASTRO_AQUA : ASTRO_FAINT }}>
        {rows.map((value, index) => (
          <span key={value} className="inline-flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true" style={{ color: ASTRO_BORDER }}>·</span> : null}
            {value}
          </span>
        ))}
      </div>
    </section>
  );
}

function accountShortLabel(account: LocalAccount | null) {
  if (!account) return "Guest";
  if (account.name?.trim()) return account.name.trim();
  if (account.email) return account.email.split("@")[0] || account.email;
  if (account.phone) return account.phone;
  return account.identifier;
}

function AstrologyShareCardPreview({
  chart,
  profileLabel,
  activeTab,
  hasSavedChart,
  language,
  ui,
}: {
  chart: NatalChart;
  profileLabel: string;
  activeTab: AstrologyTab;
  hasSavedChart: boolean;
  language: HintLanguage;
  ui: AstrologyUiCopy;
}) {
  const coreRows = (["sun", "moon", "rising"] as PlanetBody[]).map((body) => {
    const placement = corePlacement(chart, body);
    return {
      body,
      label: bodyName(body, language),
      value: signName(placement?.sign, language),
      color: BODY_COLORS[body],
    };
  });
  const headline = chartSignatureTitle(chart, language, ui);

  return (
    <article
      aria-label="Astrology share card preview"
      className="relative overflow-hidden rounded-[18px] border p-3"
      style={{
        background:
          "radial-gradient(circle at 20% 18%, rgba(255, 205, 225, 0.34), transparent 32%), radial-gradient(circle at 86% 12%, rgba(158, 239, 241, 0.24), transparent 30%), linear-gradient(145deg, rgba(54, 42, 68, 0.96), rgba(24, 23, 36, 0.98))",
        borderColor: ASTRO_TILE_BORDER,
        color: ASTRO_TEXT,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "linear-gradient(110deg, transparent 0 38%, rgba(255,255,255,0.12) 39% 40%, transparent 41% 100%), radial-gradient(circle at 58% 58%, rgba(255,255,255,0.18), transparent 1px)",
          backgroundSize: "100% 100%, 38px 38px",
        }}
      />
      <div className="relative grid grid-cols-[minmax(0,1fr)_94px] gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_GOLD_BRIGHT }}>
              Hint astrology
            </span>
            <span className="rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_AQUA }}>
              {tabDisplayName(activeTab)}
            </span>
          </div>
          <h3 className="mt-3 line-clamp-2 font-serif text-[22px] leading-[1.02]" style={{ color: ASTRO_TEXT_STRONG }}>
            {headline}
          </h3>
          <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>
            {profileLabel}'s {hasSavedChart ? "saved chart" : "chart preview"} · {traitPill(chart)}
          </p>
        </div>
        <div className="grid aspect-square place-items-center overflow-hidden rounded-[16px] border" style={{ background: ASTRO_CHART_PANEL, borderColor: ASTRO_TILE_BORDER }}>
          <AstroWheel chart={chart} language={language} className="aspect-square w-[138%] max-w-[138px]" />
        </div>
      </div>
      <div className="relative mt-3 grid gap-1.5" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {coreRows.map((item) => (
          <div key={item.body} className="min-w-0 rounded-[10px] border px-2 py-2" style={{ background: "rgba(255,255,255,0.055)", borderColor: ASTRO_TILE_BORDER }}>
            <p className="truncate text-[8px] font-black uppercase tracking-[0.1em]" style={{ color: ASTRO_FAINT }}>{item.label}</p>
            <p className="mt-1 truncate text-[12px] font-black" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function AstrologyTopBar({
  account,
  profile,
  chart,
  hasSavedChart,
  activeTab,
  language,
  ui,
  onEditProfile,
}: {
  account: LocalAccount | null;
  profile: BirthProfile | null;
  chart: NatalChart;
  hasSavedChart: boolean;
  activeTab: AstrologyTab;
  language: HintLanguage;
  ui: AstrologyUiCopy;
  onEditProfile: () => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [sharingImage, setSharingImage] = useState(false);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const profileLabel = profile?.name?.trim() || accountShortLabel(account);
  const profileMeta = profile ? [profile.birthDate, profile.birthPlace].filter(Boolean).join(" · ") : "Add birthday and place";
  const accountLabel = accountShortLabel(account);
  const shareUrl = astrologyShareUrl(activeTab);
  const shareTitle = `Hint astrology ${tabDisplayName(activeTab)}`;
  const shareText = astrologyShareMessage(profile, activeTab, hasSavedChart);
  const shareCopy = `${shareText} ${shareUrl}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedCopy = encodeURIComponent(shareCopy);
  const encodedText = encodeURIComponent(shareText);
  const shareTargets = [
    {
      label: "Instagram",
      helper: "Copy + open",
      icon: Instagram,
      color: ASTRO_ROSE,
      href: "https://www.instagram.com/",
      copyFirst: true,
    },
    {
      label: "Facebook",
      helper: "Post link",
      icon: Facebook,
      color: "#7CA7FF",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      copyFirst: false,
    },
    {
      label: "LINE",
      helper: "Send chat",
      icon: MessageCircle,
      color: "var(--astro-green)",
      href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedText}`,
      copyFirst: false,
    },
    {
      label: "Messages",
      helper: "Text invite",
      icon: MessageCircle,
      color: ASTRO_AQUA,
      href: `sms:?&body=${encodedCopy}`,
      copyFirst: false,
    },
    {
      label: "WhatsApp",
      helper: "Send chat",
      icon: MessageCircle,
      color: "var(--astro-green)",
      href: `https://wa.me/?text=${encodedCopy}`,
      copyFirst: false,
    },
    {
      label: "Telegram",
      helper: "Send link",
      icon: Send,
      color: "var(--astro-lavender)",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      copyFirst: false,
    },
  ];

  async function copyShareText(value = shareUrl, status = "Link copied") {
    if (typeof window === "undefined") return;
    setShareStatus(status);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (!fallbackCopyText(value)) {
        setShareStatus("Link ready above");
      }
    } catch {
      if (!fallbackCopyText(value)) {
        setShareStatus("Link ready above");
      }
    }
    window.setTimeout(() => setShareStatus(""), 1800);
  }

  async function shareWithSystemSheet() {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(() => undefined);
      setShareStatus("Share sheet opened");
      return;
    }
    await copyShareText(shareCopy, "Copied for sharing");
  }

  async function shareCardImage() {
    if (typeof window === "undefined" || typeof document === "undefined" || !shareCardRef.current) return;
    setSharingImage(true);
    setShareStatus("Preparing image...");
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: null,
        logging: false,
        scale: Math.min(2, window.devicePixelRatio || 2),
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
      if (!blob) throw new Error("Could not render astrology share card.");

      const slug = tabDisplayName(activeTab).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "card";
      const file = new File([blob], `hint-astrology-${slug}.png`, { type: "image/png" });
      const shareData = { title: shareTitle, text: shareText, url: shareUrl, files: [file] } as ShareData & { files: File[] };
      const navigatorWithFiles = navigator as Navigator & { canShare?: (data: ShareData & { files?: File[] }) => boolean };

      if (navigator.share && (!navigatorWithFiles.canShare || navigatorWithFiles.canShare(shareData))) {
        await navigator.share(shareData).catch(() => undefined);
        setShareStatus("Image share opened");
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setShareStatus("Image saved");
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      }
    } catch (error) {
      console.error("Could not create astrology share card", error);
      await copyShareText(shareCopy, "Copied instead");
    } finally {
      setSharingImage(false);
      window.setTimeout(() => setShareStatus(""), 1800);
    }
  }

  async function openShareTarget(href: string, copyFirst: boolean, label: string) {
    if (typeof window === "undefined") return;
    if (copyFirst) {
      await copyShareText(shareCopy, `Copied for ${label}`);
    }
    setShareOpen(false);
    if (href.startsWith("sms:")) {
      window.location.href = href;
      return;
    }
    const opened = window.open(href, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = href;
    }
  }

  function openProfileEditor() {
    setProfileOpen(false);
    setMembersOpen(false);
    onEditProfile();
  }

  const sheetBackdrop = "color-mix(in srgb, var(--hint-obsidian, #161020) 58%, transparent)";
  const sheetBaseStyle: CSSProperties = {
    left: "12px",
    right: "12px",
    bottom: "calc(6.35rem + var(--hint-safe-bottom, 0px))",
    background: ASTRO_PREMIUM_PANEL,
    borderColor: ASTRO_STROKE,
    color: ASTRO_TEXT,
    boxShadow: "var(--astro-shadow)",
    backdropFilter: "blur(28px) saturate(1.18)",
    WebkitBackdropFilter: "blur(28px) saturate(1.18)",
  };

  return (
    <>
    <header className="relative z-30 grid grid-cols-[38px_minmax(0,1fr)_82px] items-center gap-1.5">
      <Link
        href="/app"
        aria-label="Back to main page"
        className="grid h-[38px] w-[38px] place-items-center rounded-[13px] border transition active:scale-[0.98]"
        style={{ background: "color-mix(in srgb, var(--hint-control-bg) 82%, transparent)", borderColor: "color-mix(in srgb, var(--hint-control-border) 48%, transparent)", color: ASTRO_TEXT, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)" }}
      >
        <ChevronLeft size={18} />
      </Link>

      <button
        type="button"
        aria-label="Open self profile"
        aria-expanded={profileOpen}
        onClick={() => {
          setProfileOpen((value) => !value);
          setMembersOpen(false);
          setShareOpen(false);
        }}
        className="flex h-[38px] min-w-0 items-center justify-center gap-1.5 rounded-[13px] border px-3 text-center transition active:scale-[0.98]"
        style={{ background: profileOpen ? ASTRO_BUTTON : "color-mix(in srgb, var(--hint-control-bg) 82%, transparent)", borderColor: profileOpen ? "color-mix(in srgb, var(--hint-gold) 30%, var(--hint-border-strong))" : "color-mix(in srgb, var(--hint-control-border) 48%, transparent)", color: profileOpen ? ASTRO_BUTTON_TEXT : ASTRO_TEXT, boxShadow: profileOpen ? "0 8px 18px color-mix(in srgb, var(--hint-rose) 10%, transparent), inset 0 1px 0 rgba(255,255,255,0.42)" : "inset 0 1px 0 rgba(255,255,255,0.16)" }}
      >
        <span className="min-w-0">
          <span className="block truncate text-[11.5px] font-black leading-none">{profileLabel}</span>
          <span className="mt-0.5 block truncate text-[7px] font-black uppercase tracking-[0.08em]" style={{ color: profileOpen ? "rgba(25,22,34,0.72)" : ASTRO_FAINT }}>
            {profile ? "Self · birth data" : "Set self data"}
          </span>
        </span>
        <ChevronDown className={`shrink-0 transition ${profileOpen ? "rotate-180" : ""}`} size={13} />
      </button>

      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          aria-label="Open profile list"
          aria-expanded={membersOpen}
          onClick={() => {
            setMembersOpen((value) => !value);
            setProfileOpen(false);
            setShareOpen(false);
          }}
          className="grid h-[38px] w-[38px] place-items-center rounded-[13px] border transition active:scale-[0.98]"
          style={{ background: membersOpen ? ASTRO_BUTTON : "color-mix(in srgb, var(--hint-control-bg) 82%, transparent)", borderColor: membersOpen ? "color-mix(in srgb, var(--hint-gold) 30%, var(--hint-border-strong))" : "color-mix(in srgb, var(--hint-control-border) 48%, transparent)", color: membersOpen ? ASTRO_BUTTON_TEXT : ASTRO_TEXT, boxShadow: membersOpen ? "0 8px 18px color-mix(in srgb, var(--hint-rose) 10%, transparent), inset 0 1px 0 rgba(255,255,255,0.42)" : "inset 0 1px 0 rgba(255,255,255,0.16)" }}
        >
          <UserRound size={16} />
        </button>
        <div className="relative">
          <button
            type="button"
            aria-label="Open share options"
            aria-expanded={shareOpen}
            onClick={() => {
              setShareOpen((value) => !value);
              setProfileOpen(false);
              setMembersOpen(false);
            }}
            className="grid h-[38px] w-[38px] place-items-center rounded-[13px] border transition active:scale-[0.98]"
            style={{ background: shareOpen || shareStatus ? ASTRO_BUTTON : "color-mix(in srgb, var(--hint-control-bg) 82%, transparent)", borderColor: shareOpen || shareStatus ? "color-mix(in srgb, var(--hint-gold) 30%, var(--hint-border-strong))" : "color-mix(in srgb, var(--hint-control-border) 48%, transparent)", color: shareOpen || shareStatus ? ASTRO_BUTTON_TEXT : ASTRO_TEXT, boxShadow: shareOpen || shareStatus ? "0 8px 18px color-mix(in srgb, var(--hint-rose) 10%, transparent), inset 0 1px 0 rgba(255,255,255,0.42)" : "inset 0 1px 0 rgba(255,255,255,0.16)" }}
          >
            {shareStatus ? <CheckCircle2 size={16} /> : <Share2 size={16} />}
          </button>
          {shareOpen && typeof document !== "undefined" ? createPortal(
            <>
              <button
                type="button"
                aria-label="Dismiss share options"
                onClick={() => setShareOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
                style={{ background: sheetBackdrop, backdropFilter: "blur(4px)" }}
              />
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: [0.2, 0.78, 0.2, 1] }}
                className="fixed z-50 max-h-[min(82vh,720px)] overflow-y-auto rounded-[20px] border p-4"
                style={{
                  ...sheetBaseStyle,
                  zIndex: 50,
                }}
              >
                <div className="mx-auto mb-3 h-1.5 w-11 rounded-full" style={{ background: ASTRO_BORDER }} />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Share with friends</p>
                    <h2 className="mt-1 truncate text-[17px] font-black" style={{ color: ASTRO_TEXT }}>Send your astrology card</h2>
                    <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>Share the image preview, copy the link, or open any app on this phone.</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close share options"
                    onClick={() => setShareOpen(false)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] border"
                    style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}
                  >
                    <X size={15} />
                  </button>
                </div>
                <div ref={shareCardRef} className="mt-3">
                  <AstrologyShareCardPreview chart={chart} profileLabel={profileLabel} activeTab={activeTab} hasSavedChart={hasSavedChart} language={language} ui={ui} />
                </div>
                <button
                  type="button"
                  aria-label="Share or save astrology image"
                  disabled={sharingImage}
                  onClick={() => void shareCardImage()}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border px-4 text-[12px] font-black uppercase tracking-[0.12em] transition active:scale-[0.99] disabled:opacity-70"
                  style={{ background: ASTRO_BUTTON, borderColor: ASTRO_TILE_BORDER, color: ASTRO_BUTTON_TEXT }}
                >
                  <Download size={15} />
                  {sharingImage ? "Preparing image" : "Share / save image"}
                </button>
                <section className="mt-3 rounded-[14px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Copy this link</p>
                      <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: ASTRO_FAINT }}>No private birth data sent</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Copy astrology share link"
                      onPointerDown={() => setShareStatus("Link copied")}
                      onClick={() => void copyShareText(shareUrl)}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[8px] px-3 text-[11px] font-black"
                      style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                  <div className="mt-3 rounded-[8px] border px-3 py-2" style={{ background: ASTRO_INPUT, borderColor: ASTRO_TILE_BORDER }}>
                    <input
                      aria-label="Astrology share link"
                      readOnly
                      value={shareUrl}
                      onFocus={(event) => event.currentTarget.select()}
                      className="w-full bg-transparent text-[11px] font-bold outline-none"
                      style={{ color: ASTRO_MUTED }}
                    />
                  </div>
                </section>
                <section className="mt-3 rounded-[14px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Share using</p>
                    <p className="truncate text-[10px] font-bold" style={{ color: ASTRO_FAINT }}>Installed apps appear in More</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      aria-label="Open native share sheet"
                      onClick={() => void shareWithSystemSheet()}
                      className="min-w-0 rounded-[12px] border p-2 text-center transition active:scale-[0.98]"
                      style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}
                    >
                      <span className="mx-auto grid h-9 w-9 place-items-center rounded-full border" style={{ background: ASTRO_BUTTON, borderColor: ASTRO_TILE_BORDER, color: ASTRO_BUTTON_TEXT }}>
                        <Ellipsis size={16} />
                      </span>
                      <span className="mt-1.5 block truncate text-[10px] font-black">More</span>
                      <span className="block truncate text-[8px] font-black uppercase tracking-[0.06em]" style={{ color: ASTRO_FAINT }}>Apps</span>
                    </button>
                    {shareTargets.map((target) => {
                      const Icon = target.icon;
                      return (
                        <button
                          key={target.label}
                          type="button"
                          aria-label={`Share astrology on ${target.label}`}
                          onClick={() => void openShareTarget(target.href, target.copyFirst, target.label)}
                          className="min-w-0 rounded-[12px] border p-2 text-center transition active:scale-[0.98]"
                          style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}
                        >
                          <span className="mx-auto grid h-9 w-9 place-items-center rounded-full border" style={{ background: `${target.color}18`, borderColor: `${target.color}55`, color: target.color }}>
                            <Icon size={16} />
                          </span>
                          <span className="mt-1.5 block truncate text-[10px] font-black">{target.label}</span>
                          <span className="block truncate text-[8px] font-black uppercase tracking-[0.06em]" style={{ color: ASTRO_FAINT }}>{target.helper}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
                <p className="mt-3 line-clamp-2 min-h-[16px] text-center text-[11px] font-black" style={{ color: shareStatus ? ASTRO_AQUA : ASTRO_FAINT }}>
                  {shareStatus || shareText}
                </p>
              </motion.div>
            </>,
            document.body,
          ) : null}
        </div>
      </div>
    </header>
    {profileOpen && typeof document !== "undefined" ? createPortal(
      <>
        <button
          type="button"
          aria-label="Close self profile"
          onClick={() => setProfileOpen(false)}
          className="fixed inset-0 cursor-default"
          style={{ zIndex: 50, background: sheetBackdrop, backdropFilter: "blur(4px)" }}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Self profile"
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: [0.2, 0.78, 0.2, 1] }}
          className="fixed max-h-[min(60vh,420px)] overflow-y-auto rounded-[20px] border p-4"
          style={{
            zIndex: 60,
            ...sheetBaseStyle,
          }}
        >
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full" style={{ background: ASTRO_BORDER }} />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Self profile</p>
              <h2 className="mt-1 truncate text-[21px] font-black leading-tight" style={{ color: ASTRO_TEXT_STRONG }}>{profileLabel}</h2>
              <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{profileMeta}</p>
            </div>
            <button
              type="button"
              aria-label="Close self profile"
              onClick={() => setProfileOpen(false)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border"
              style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}
            >
              <X size={15} />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Profile", value: "Self" },
              { label: "Birth data", value: profile ? "Saved" : "Needed" },
              { label: "Chart", value: hasSavedChart ? "Saved" : "Preview" },
            ].map((item) => (
              <div key={`${item.label}-${item.value}`} className="min-w-0 rounded-[12px] border p-2.5" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
                <p className="truncate text-[8px] font-black uppercase tracking-[0.1em]" style={{ color: ASTRO_FAINT }}>{item.label}</p>
                <p className="mt-1 truncate text-[12px] font-black" style={{ color: ASTRO_TEXT }}>{item.value}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={openProfileEditor}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] px-4 text-[13px] font-black"
            style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}
          >
            <CalendarDays size={16} />
            Edit birthday / place
          </button>
        </motion.div>
      </>,
      document.body,
    ) : null}
    {membersOpen && typeof document !== "undefined" ? createPortal(
      <>
        <button
          type="button"
          aria-label="Close profile list"
          onClick={() => setMembersOpen(false)}
          className="fixed inset-0 cursor-default"
          style={{ zIndex: 50, background: sheetBackdrop, backdropFilter: "blur(4px)" }}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Profile list"
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: [0.2, 0.78, 0.2, 1] }}
          className="fixed max-h-[min(58vh,380px)] overflow-y-auto rounded-[20px] border p-4"
          style={{
            zIndex: 60,
            ...sheetBaseStyle,
          }}
        >
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full" style={{ background: ASTRO_BORDER }} />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Profiles</p>
              <h2 className="mt-1 truncate text-[20px] font-black leading-tight" style={{ color: ASTRO_TEXT_STRONG }}>{accountLabel}</h2>
              <p className="mt-1 text-[12px] font-semibold" style={{ color: ASTRO_MUTED }}>{profile ? "Current astrology member" : "No birth profile yet"}</p>
            </div>
            <button
              type="button"
              aria-label="Close profile list"
              onClick={() => setMembersOpen(false)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border"
              style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}
            >
              <X size={15} />
            </button>
          </div>
          <div className="mt-4 rounded-[14px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_AQUA }}>
                <UserRound size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-black" style={{ color: ASTRO_TEXT }}>{profileLabel}</p>
                <p className="mt-0.5 truncate text-[11px] font-semibold" style={{ color: ASTRO_MUTED }}>{profileMeta}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={openProfileEditor}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] px-4 text-[13px] font-black"
            style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}
          >
            <UserRound size={16} />
            Switch / add member
          </button>
        </motion.div>
      </>,
      document.body,
    ) : null}
    </>
  );
}

function ProviderReadinessStrip({ state }: { state: BackendStatusState & { refresh: () => void } }) {
  const { status, online, loading, checkedAt, refresh } = state;
  const items = [
    {
      label: "Chart",
      value: loading && !checkedAt ? "Checking" : status.astrology.configured ? "Live" : "Local",
      ready: status.astrology.configured,
      icon: Orbit,
    },
    {
      label: "Sky",
      value: loading && !checkedAt ? "Checking" : status.nasa.configured ? "NASA" : "Local",
      ready: status.nasa.configured,
      icon: Radar,
    },
    {
      label: "Reports",
      value: loading && !checkedAt ? "Checking" : status.gpt.configured ? "AI" : "Curated",
      ready: status.gpt.configured,
      icon: FileText,
    },
  ];
  const providerLine = online
    ? status.astrology.configured
      ? "AstrologyAPI connected"
      : "Chart preview active"
    : "Saved preview active";

  return (
    <section
      aria-label="Astrology provider readiness"
      className="rounded-[8px] border p-2.5"
      style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.13em]" style={{ color: online ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }}>
            {loading && !checkedAt ? "Checking astrology API" : providerLine}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold" style={{ color: ASTRO_FAINT }}>
            {checkedAt ? `Updated ${new Date(checkedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Preparing chart status"}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] border px-2.5 text-[10px] font-black uppercase tracking-[0.1em] disabled:opacity-50"
          disabled={loading}
          style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}
        >
          <RefreshCw size={12} />
          {loading ? "Checking" : "Refresh"}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {items.map(({ label, value, ready, icon: Icon }) => (
          <div key={label} className="min-w-0 rounded-[8px] border px-2 py-2" style={{ background: ASTRO_TILE, borderColor: ASTRO_BORDER }}>
            <div className="flex items-center gap-1.5">
              <Icon size={12} style={{ color: ready ? ASTRO_AQUA : ASTRO_FAINT }} />
              <p className="truncate text-[8px] font-black uppercase tracking-[0.1em]" style={{ color: ASTRO_FAINT }}>
                {label}
              </p>
              <span
                aria-hidden="true"
                className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: ready ? ASTRO_AQUA : online ? ASTRO_GOLD_BRIGHT : ASTRO_FAINT }}
              />
            </div>
            <p className="mt-1 truncate text-[11px] font-black" style={{ color: ready ? ASTRO_TEXT_STRONG : ASTRO_MUTED }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AstroFoldout({
  eyebrow,
  title,
  children,
  defaultOpen = false,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-[8px] border p-3 shadow-[var(--astro-shadow-soft)]"
      style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_GOLD_BRIGHT }}>
              {eyebrow}
            </p>
            <p className="mt-1 truncate text-[13px] font-black" style={{ color: ASTRO_TEXT }}>
              {title}
            </p>
          </div>
          <span className="shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_FAINT }}>
            Details
          </span>
        </div>
      </summary>
      <div className="mt-3 grid gap-4">
        {children}
      </div>
    </details>
  );
}

type AstroModuleItem = {
  label: string;
  value: string;
  note: string;
  color?: string;
};

function AstroModuleMap({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: AstroModuleItem[];
}) {
  return (
    <section className="min-w-0 rounded-[8px] border p-3 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_GOLD_BRIGHT }}>{eyebrow}</p>
          <h3 className="mt-1 font-serif text-[21px] leading-tight" style={{ color: ASTRO_TEXT }}>{title}</h3>
        </div>
        <span className="shrink-0 rounded-[8px] border px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.1em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_FAINT }}>
          Guide
        </span>
      </div>
      <div className="grid gap-2 min-[720px]:grid-cols-2">
        {items.map((item, index) => {
          const color = item.color ?? astroColor(index);
          return (
            <article key={item.label} className="min-w-0 rounded-[8px] border p-2.5" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
              <div className="mb-2 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
              <p className="truncate text-[8px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{item.label}</p>
              <p className="mt-1 truncate text-[13px] font-black" style={{ color }}>{item.value}</p>
              <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{item.note}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AstrologyAppSummary({
  account,
  chart,
  profile,
  hasSavedChart,
  language,
  ui,
  activeTab,
  onTabChange,
}: {
  account: LocalAccount | null;
  chart: NatalChart;
  profile: BirthProfile | null;
  hasSavedChart: boolean;
  language: HintLanguage;
  ui: AstrologyUiCopy;
  activeTab: AstrologyTab;
  onTabChange: (tab: AstrologyTab) => void;
}) {
  const trio = (["sun", "moon", "rising"] as PlanetBody[]).map((body) => corePlacement(chart, body));
  const profileReady = liveProfileReady(profile);
  const chartIsLive = chart.source === "astrologyapi" || chart.source === "api";
  const setupFacts = profile
    ? [
        { label: "Date", value: profile.birthDate, ready: true, tab: "birth" as AstrologyTab },
        { label: "Time", value: profile.birthTime ? "Saved" : "Needed", ready: Boolean(profile.birthTime), tab: "birth" as AstrologyTab },
        {
          label: "Place",
          value: profile.latitude !== undefined && profile.longitude !== undefined ? "Coordinates" : profile.birthPlace ? "Place" : "Needed",
          ready: Boolean(profile.birthPlace),
          tab: "birth" as AstrologyTab,
        },
        { label: "Chart", value: hasSavedChart ? "Saved" : profileReady ? "Ready" : "Locked", ready: hasSavedChart, tab: "chart" as AstrologyTab },
      ]
    : [
        { label: "Date", value: "Needed", ready: false, tab: "birth" as AstrologyTab },
        { label: "Time", value: "Needed", ready: false, tab: "birth" as AstrologyTab },
        { label: "Place", value: "Needed", ready: false, tab: "birth" as AstrologyTab },
        { label: "Chart", value: "Locked", ready: false, tab: "chart" as AstrologyTab },
      ];
  const chartFacts = [
    ...trio.map((placement) => ({
      label: placement ? BODY_LENSES[placement.body].title : "Pending",
      value: placement ? signName(placement.sign, language) : ui.pending,
      ready: Boolean(placement),
      tab: "chart" as AstrologyTab,
    })),
    {
      label: "Source",
      value: chartIsLive ? "Live" : "Preview",
      ready: true,
      tab: "chart" as AstrologyTab,
    },
  ];
  const statusLabel = hasSavedChart ? (chartIsLive ? "Personal chart" : "Chart preview") : profile ? "Birth details ready" : "Birth details needed";
  const primaryTarget: AstrologyTab = !profile ? "birth" : !hasSavedChart ? "chart" : "birth";
  const primaryLabel = !account ? "Log in to save chart" : !profile ? "Add birth details" : !hasSavedChart ? "Create chart" : "Edit birth data";
  const showSetupCta = !account || !profile || !hasSavedChart || activeTab === "birth";
  const factRows = hasSavedChart ? chartFacts : setupFacts;
  const headline = hasSavedChart ? chartSignatureTitle(chart, language, ui) : profileReady ? "Ready to create your birth chart" : "Add birth data once";
  const helper = hasSavedChart
    ? `${titleCase(chart.elementBalance.dominant)} / ${titleCase(chart.modalityBalance.dominant)} · ${chart.placements.length} placements`
    : profile
      ? liveProfileHint(profile)
      : "Date, time, and place unlock chart, today, reports, and together.";

  return (
    <section
      className="relative overflow-hidden rounded-[8px] border p-3 shadow-[var(--astro-shadow-soft)]"
      style={{ background: ASTRO_PREMIUM_PANEL, borderColor: ASTRO_STROKE, color: ASTRO_TEXT }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            `radial-gradient(circle at 18% 12%, ${ASTRO_ROSE}, transparent 30%), radial-gradient(circle at 84% 14%, ${ASTRO_AQUA}, transparent 34%), radial-gradient(circle at 50% 100%, ${ASTRO_GOLD_BRIGHT}, transparent 36%)`,
          opacity: 0.13,
        }}
      />
      <div className="relative grid gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border" style={{ background: ASTRO_CHART_PANEL, borderColor: ASTRO_TILE_BORDER, color: hasSavedChart ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }}>
              {hasSavedChart ? <Radar size={18} /> : <MapPin size={18} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[9px] font-black uppercase tracking-[0.13em]" style={{ color: hasSavedChart ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }}>
                  {statusLabel}
                </span>
                <span aria-hidden style={{ color: ASTRO_FAINT }}>·</span>
                <span className="truncate text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>
                  {tabDisplayName(activeTab)}
                </span>
              </div>
              <h1 className="mt-0.5 line-clamp-2 font-serif text-[18px] leading-tight" style={{ color: ASTRO_TEXT_STRONG }}>
                {headline}
              </h1>
            </div>
          </div>
          {showSetupCta ? (
            !account ? (
              <Link
                href="/app/login?mode=login"
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-[8px] px-3 text-[11px] font-black shadow-[var(--astro-button-shadow)]"
                style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}
              >
                Log in
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onTabChange(primaryTarget)}
                className="h-9 shrink-0 rounded-[8px] px-3 text-[11px] font-black shadow-[var(--astro-button-shadow)]"
                style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}
              >
                {primaryLabel}
              </button>
            )
          ) : null}
        </div>

        <p className="line-clamp-2 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>
          {helper}
        </p>

        <div className="grid grid-cols-2 gap-1.5 min-[560px]:grid-cols-4">
          {factRows.map((item) => (
            <button
              key={`${item.tab}-${item.label}`}
              type="button"
              onClick={() => onTabChange(item.tab)}
              className="min-w-0 rounded-[8px] border px-2 py-2 text-left active:scale-[0.98]"
              style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}
            >
              <p className="truncate text-[8px] font-black uppercase tracking-[0.11em]" style={{ color: ASTRO_FAINT }}>
                {item.label}
              </p>
              <p className="mt-1 truncate text-[12px] font-black leading-none" style={{ color: item.ready ? ASTRO_AQUA : item.value === "Needed" || item.value === "Locked" ? ASTRO_GOLD_BRIGHT : ASTRO_TEXT_STRONG }}>
                {item.value}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function AstrologyMapOverview({
  chart,
  profile,
  hasSavedChart,
  activeTab,
  language,
  onTabChange,
}: {
  chart: NatalChart;
  profile: BirthProfile | null;
  hasSavedChart: boolean;
  activeTab: AstrologyTab;
  language: HintLanguage;
  onTabChange: (tab: AstrologyTab) => void;
}) {
  const sun = corePlacement(chart, "sun");
  const moon = corePlacement(chart, "moon");
  const rising = corePlacement(chart, "rising");
  const trio = [sun, moon, rising].filter(Boolean) as PlanetPlacement[];
  const placementLine = trio.length
    ? trio.map((placement) => `${bodySymbol(placement.body, language)} ${signName(placement.sign, language)}`).join(" / ")
    : "Sun / Moon / Rising";
  const birthReady = Boolean(profile?.birthDate && profile.birthTime && profile.birthPlace);
  const fullBirthReady = Boolean(profile?.birthTime && profile.latitude !== undefined && profile.longitude !== undefined && profile.timezoneOffset !== undefined);
  const lanes: Array<{
    tab: AstrologyTab;
    label: string;
    title: string;
    value: string;
    icon: typeof Orbit;
    tone: string;
    ready: boolean;
  }> = [
    {
      tab: "birth",
      label: "Source",
      title: "Birth data",
      value: fullBirthReady ? "Time and place saved" : birthReady ? "Needs coordinates" : "Date, time, place",
      icon: CalendarDays,
      tone: ASTRO_GOLD_BRIGHT,
      ready: birthReady,
    },
    {
      tab: "chart",
      label: "Map",
      title: "Chart",
      value: hasSavedChart ? `${chart.placements.length} placements` : "Create once",
      icon: Orbit,
      tone: ASTRO_AQUA,
      ready: hasSavedChart,
    },
    {
      tab: "signs",
      label: "Layer",
      title: "Zodiac",
      value: placementLine,
      icon: CircleDot,
      tone: ASTRO_ROSE,
      ready: Boolean(trio.length),
    },
    {
      tab: "transits",
      label: "Timing",
      title: "Today",
      value: hasSavedChart ? "Transits ranked" : "After chart",
      icon: Activity,
      tone: "var(--astro-lavender)",
      ready: hasSavedChart,
    },
  ];

  return (
    <section className="rounded-[8px] border p-3 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>Astrology map</p>
          <h2 className="mt-1 font-serif text-[21px] leading-tight" style={{ color: ASTRO_TEXT }}>Chart and zodiac</h2>
        </div>
        <span className="shrink-0 rounded-[8px] border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_AQUA }}>
          {tabDisplayName(activeTab)}
        </span>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {lanes.map((lane) => {
          const Icon = lane.icon;
          const active = activeTab === lane.tab;
          return (
            <button
              key={lane.tab}
              type="button"
              onClick={() => onTabChange(lane.tab)}
              className="min-w-0 rounded-[8px] border p-2.5 text-left transition-[transform,opacity] duration-200 active:scale-[0.98]"
              style={{
                background: active ? ASTRO_PREMIUM_INNER : ASTRO_INNER,
                borderColor: active ? lane.tone : ASTRO_TILE_BORDER,
                opacity: lane.ready || active ? 1 : 0.76,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] border" style={{ background: `${lane.tone}20`, borderColor: `${lane.tone}55`, color: lane.tone }}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[8px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{lane.label}</p>
                  <p className="mt-0.5 truncate text-[13px] font-black leading-none" style={{ color: ASTRO_TEXT_STRONG }}>{lane.title}</p>
                </div>
              </div>
              <p className="mt-2 truncate text-[11px] font-semibold" style={{ color: lane.ready ? lane.tone : ASTRO_MUTED }}>
                {lane.value}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AstrologyGuidedCard({ activeTab, onTabChange }: { activeTab: AstrologyTab; onTabChange: (tab: AstrologyTab) => void }) {
  const guide = tabGuideCopy(activeTab);
  const Icon = guide.icon;

  return (
    <section className="rounded-[8px] border p-3 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-[8px] border" style={{ background: `${guide.color}1f`, borderColor: `${guide.color}55`, color: guide.color }}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: guide.color }}>{guide.eyebrow}</p>
          <h2 className="mt-1 truncate text-[15px] font-black" style={{ color: ASTRO_TEXT_STRONG }}>{guide.title}</h2>
          <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{guide.body}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <Link
          href="/app/ask"
          className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-[8px] px-3 text-[11px] font-black shadow-[var(--astro-button-shadow)]"
          style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}
        >
          <Sparkles size={14} />
          Ask Hint
        </Link>
        <button
          type="button"
          onClick={() => onTabChange(guide.nextTab)}
          className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-[8px] border px-3 text-[11px] font-black"
          style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}
        >
          {guide.nextLabel}
          <ChevronRight size={14} />
        </button>
      </div>
    </section>
  );
}

function lockedTabCopy(activeTab: AstrologyTab) {
  switch (activeTab) {
    case "signs":
      return {
        label: "Zodiac",
        title: "Create your zodiac layer",
        body: "The zodiac page reads the signs inside the saved chart: Sun, Moon, Rising, and each planet's sign, house, and degree.",
        after: "After chart",
      };
    case "transits":
      return {
        label: "Transits",
        title: "Create your timing base",
        body: "Transits need a saved birth chart first, then Hint can rank live sky movement against it.",
        after: "After chart",
      };
    case "together":
      return {
        label: "Together",
        title: "Create your side of the map",
        body: "Together readings need your saved chart before invites or partner comparisons can make sense.",
        after: "After chart",
      };
    case "reports":
      return {
        label: "Reports",
        title: "Create your report base",
        body: "Reports open after the saved chart gives Hint real placements, houses, and aspects to reference.",
        after: "After chart",
      };
    case "birth":
      return {
        label: "Birth",
        title: "Add birth details once",
        body: "Save date, time, and place once. Hint will reuse it for chart, transits, reports, and together readings.",
        after: "Needed",
      };
    case "chart":
    default:
      return {
        label: "Chart",
        title: "Set your sky once",
        body: "Birth date, exact time, and place create the chart. The rest of Astrology stays summary-first until you ask Hint for depth.",
        after: "Needed",
      };
  }
}

function lockedTabPreview(activeTab: AstrologyTab) {
  switch (activeTab) {
    case "signs":
      return {
        eyebrow: "Summary preview",
        title: "What you are good at",
        body: "Sun, moon, rising, and key planets become a short strengths snapshot first. Deeper placement notes stay behind Ask Hint.",
        rows: ["Strengths", "Love style", "Mind style", "Growth edge", "Hidden skill"],
        icon: Radar,
      };
    case "transits":
      return {
        eyebrow: "Today preview",
        title: "What matters right now",
        body: "Today ranks live timing into simple signals: act, wait, protect energy, or ask for more detail.",
        rows: ["Current window", "Moon phase", "Transit hits", "Signal map", "Do / avoid"],
        icon: Activity,
      };
    case "birth":
      return {
        eyebrow: "Data preview",
        title: "One private profile",
        body: "Date, time, and place stay in one saved profile, then power chart, zodiac, today, pair, and reports.",
        rows: ["Date", "Time", "Place", "Accuracy", "House system", "Privacy"],
        icon: CalendarDays,
      };
    case "together":
      return {
        eyebrow: "Pair preview",
        title: "The space between two charts",
        body: "Pair stays consent-first: invite a friend or add partner data before showing comfort, tension, and growth.",
        rows: ["Comfort", "Tension", "Growth", "Love style", "Communication", "Timing"],
        icon: HeartHandshake,
      };
    case "reports":
      return {
        eyebrow: "Report preview",
        title: "Summary first, detail later",
        body: "Reports show the topic and short bullets first. Long-form reads should open after Ask Hint or a token action.",
        rows: ["Career", "Love", "Year ahead", "Money", "Shadow", "Timing"],
        icon: FileText,
      };
    case "chart":
    default:
      return {
        eyebrow: "Chart preview",
        title: "Map first, interpretation second",
        body: "Chart shows the wheel, placements, houses, and aspects. Hint then turns that structure into plain language.",
        rows: ["Wheel", "Placements", "Houses", "Aspects", "Elements", "Chart ruler"],
        icon: Orbit,
      };
  }
}

function AstrologyAccessGate({
  account,
  profile,
  hasSavedChart,
  activeTab,
  canPersonalize,
  personalizing,
  liveError,
  onAddProfile,
  onPersonalize,
}: {
  account: LocalAccount | null;
  profile: BirthProfile | null;
  hasSavedChart: boolean;
  activeTab: AstrologyTab;
  canPersonalize: boolean;
  personalizing: boolean;
  liveError?: string;
  onAddProfile: () => void;
  onPersonalize: () => void;
}) {
  const needsLogin = !account;
  const lockedCopy = lockedTabCopy(activeTab);
  const previewCopy = lockedTabPreview(activeTab);
  const PreviewIcon = previewCopy.icon;

  if (needsLogin) {
    return (
      <section className="relative grid min-h-[calc(100vh-13rem)] content-start gap-5 overflow-hidden px-1 pb-4 pt-2">
        <div aria-hidden="true" className="relative mx-auto h-[238px] w-full max-w-[360px]">
          <div
            className="absolute left-1/2 top-1/2 h-[224px] w-[224px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              border: "1px solid color-mix(in srgb, var(--hint-gold) 24%, transparent)",
              boxShadow: "0 0 0 44px color-mix(in srgb, var(--hint-rose) 4%, transparent), 0 0 0 88px color-mix(in srgb, var(--hint-gold) 4%, transparent)",
            }}
          />
          <div
            className="absolute left-[18%] top-[46%] h-[76px] w-[250px] rounded-full"
            style={{
              border: "1px solid color-mix(in srgb, var(--hint-gold) 20%, transparent)",
              transform: "rotate(-18deg)",
            }}
          />
          <div
            className="absolute left-[19%] top-[40%] h-[82px] w-[252px] rounded-full"
            style={{
              border: "1px solid color-mix(in srgb, var(--hint-lavender) 16%, transparent)",
              transform: "rotate(31deg)",
            }}
          />
          <div
            className="absolute left-[calc(50%-82px)] top-[34px] h-[156px] w-[128px] rounded-[24px] border"
            style={{
              background: "linear-gradient(160deg, rgba(255,249,244,0.92), rgba(239,226,236,0.72) 56%, rgba(255,253,248,0.88))",
              borderColor: "color-mix(in srgb, var(--hint-gold) 34%, white)",
              boxShadow: "0 26px 64px color-mix(in srgb, var(--hint-plum, #2b1d39) 18%, transparent), inset 0 1px 0 rgba(255,255,255,0.78)",
              transform: "rotate(-8deg)",
            }}
          />
          <div
            className="absolute left-[calc(50%-34px)] top-[38px] h-[154px] w-[128px] rounded-[24px] border"
            style={{
              background: "linear-gradient(155deg, rgba(255,249,244,0.98), rgba(245,232,236,0.76) 48%, rgba(236,228,243,0.72))",
              borderColor: "color-mix(in srgb, var(--hint-gold) 36%, white)",
              boxShadow: "0 30px 72px color-mix(in srgb, var(--hint-plum, #2b1d39) 18%, transparent), inset 0 1px 0 rgba(255,255,255,0.84)",
              transform: "rotate(7deg)",
            }}
          />
          <div
            className="absolute left-1/2 top-[25px] grid h-[172px] w-[132px] -translate-x-1/2 place-items-center overflow-hidden rounded-[24px] border"
            style={{
              background: "linear-gradient(150deg, #fff9f4 0%, color-mix(in srgb, var(--hint-gold-bright) 30%, white) 45%, color-mix(in srgb, var(--hint-rose) 16%, white))",
              borderColor: "color-mix(in srgb, var(--hint-gold) 42%, white)",
              color: ASTRO_TEXT_STRONG,
              boxShadow: "0 34px 82px color-mix(in srgb, var(--hint-plum, #2b1d39) 20%, transparent), 0 0 44px color-mix(in srgb, var(--hint-rose) 14%, transparent), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            <span className="absolute left-4 top-4 font-sans text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>Sky</span>
            <Orbit size={54} strokeWidth={1.55} />
            <span className="absolute right-5 top-7 text-[24px] leading-none" style={{ color: ASTRO_GOLD_BRIGHT }}>✕</span>
            <span className="absolute bottom-5 h-[1px] w-16" style={{ background: "color-mix(in srgb, var(--hint-gold) 36%, transparent)" }} />
          </div>
          <div
            className="absolute bottom-2 left-1/2 grid w-[190px] -translate-x-1/2 grid-cols-[1fr_0.72fr_0.54fr] gap-2 rounded-full border p-2"
            style={{
              background: "linear-gradient(145deg, rgba(255,249,244,0.78), rgba(255,252,248,0.48))",
              borderColor: ASTRO_TILE_BORDER,
              boxShadow: "0 18px 44px color-mix(in srgb, var(--hint-plum, #2b1d39) 12%, transparent), inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            <span className="h-1.5 rounded-full" style={{ background: "linear-gradient(90deg, var(--hint-rose), var(--hint-lavender), var(--hint-gold-bright))" }} />
            <span className="h-1.5 rounded-full" style={{ background: "color-mix(in srgb, var(--hint-muted) 18%, transparent)" }} />
            <span className="h-1.5 rounded-full" style={{ background: "color-mix(in srgb, var(--hint-muted) 16%, transparent)" }} />
          </div>
        </div>

        <div className="grid gap-3">
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: ASTRO_ROSE }}>
            Astrology room
          </p>
          <h2 className="max-w-[21rem] font-serif text-[44px] font-semibold leading-[0.9]" style={{ color: ASTRO_TEXT_STRONG }}>
            Build your private sky.
          </h2>
          <p className="max-w-[22rem] text-[15px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>
            Save your birth details once. Hint turns the chart into a clean summary first, then deeper reads open only when you ask.
          </p>
        </div>

        <section
          className="grid gap-3 rounded-[18px] border p-3"
          style={{
            background: "linear-gradient(150deg, rgba(255,249,244,0.72), rgba(255,252,248,0.46))",
            borderColor: "color-mix(in srgb, var(--hint-gold) 24%, transparent)",
            boxShadow: "0 22px 64px color-mix(in srgb, var(--hint-plum, #2b1d39) 10%, transparent), inset 0 1px 0 rgba(255,255,255,0.54)",
          }}
        >
          <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-3">
            <span className="grid h-[38px] w-[38px] place-items-center rounded-[12px] border" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_GOLD_BRIGHT }}>
              <PreviewIcon size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_GOLD_BRIGHT }}>{previewCopy.eyebrow}</p>
              <h3 className="mt-1 font-serif text-[22px] font-semibold leading-none" style={{ color: ASTRO_TEXT_STRONG }}>{previewCopy.title}</h3>
              <p className="mt-2 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{previewCopy.body}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {previewCopy.rows.map((row) => (
              <span key={row} className="truncate rounded-full border px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.08em]" style={{ background: "rgba(255,255,255,0.25)", borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}>
                {row}
              </span>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <Link href="/app/signup?mode=signup&from=astrology" className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-4 text-[12px] font-black uppercase tracking-[0.11em]" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT, boxShadow: "var(--astro-button-shadow)" }}>
            <UserPlus size={15} />
            Sign up
          </Link>
          <Link href="/app/login?mode=login&from=astrology" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border px-4 text-[12px] font-black uppercase tracking-[0.11em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}>
            <LogIn size={15} />
            Log in
          </Link>
        </div>
      </section>
    );
  }

  const title = profile ? lockedCopy.title : activeTab === "birth" ? "Add birth details once" : lockedCopy.title;
  const body = profile
    ? canPersonalize
      ? lockedCopy.body
      : liveProfileHint(profile)
    : "Date, exact time, and birthplace turn Astrology into a clean chart, zodiac summary, today timing, pair view, and reports.";
  const studioItems = [
    {
      label: "Birth",
      value: profile ? "Ready" : "Needed",
      active: Boolean(profile),
      icon: CalendarDays,
    },
    {
      label: "Chart",
      value: hasSavedChart ? "Saved" : "Locked",
      active: hasSavedChart,
      icon: Orbit,
    },
    {
      label: lockedCopy.label,
      value: hasSavedChart ? "Ready" : lockedCopy.after,
      active: hasSavedChart,
      icon: activeTab === "transits" ? Activity : activeTab === "reports" ? FileText : activeTab === "together" ? HeartHandshake : Radar,
    },
  ];
  const setupSteps = profile
    ? studioItems
    : [
        {
          label: "Date",
          value: "Birth day",
          active: false,
          icon: CalendarDays,
        },
        {
          label: "Time",
          value: "Exact hour",
          active: false,
          icon: Activity,
        },
        {
          label: "Place",
          value: "City saved",
          active: false,
          icon: MapPin,
        },
      ];
  const statusLabel = hasSavedChart
    ? "Astrology studio is active"
    : profile
      ? "Ready to calculate your chart"
      : "Unlocks Chart, Zodiac, Today, Pair, and Reports";

  return (
    <section className="relative overflow-hidden rounded-[22px] border p-3 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_PREMIUM_PANEL, borderColor: ASTRO_STROKE }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 10% 7%, color-mix(in srgb, ${ASTRO_ROSE} 62%, transparent), transparent 25%), radial-gradient(circle at 92% 16%, color-mix(in srgb, ${ASTRO_AQUA} 58%, transparent), transparent 30%), radial-gradient(circle at 48% 98%, color-mix(in srgb, ${ASTRO_GOLD_BRIGHT} 34%, transparent), transparent 34%), linear-gradient(145deg, transparent, ${ASTRO_TILE})`,
          opacity: 0.2,
        }}
      />
      <div className="relative grid gap-2.5">
        <div className="relative overflow-hidden rounded-[20px] border p-3" style={{ background: ASTRO_PREMIUM_INNER, borderColor: ASTRO_TILE_BORDER }}>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at 24% 14%, rgba(255,255,255,0.16), transparent 24%), radial-gradient(circle at 74% 68%, rgba(216,185,110,0.16), transparent 26%)",
            }}
          />
          <div className="relative grid gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: hasSavedChart ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }}>
                  <ShieldCheck size={13} />
                  Private sky setup
                </span>
                <h2 className="mt-2.5 max-w-[15rem] font-serif text-[32px] font-semibold leading-[0.94]" style={{ color: ASTRO_TEXT_STRONG }}>{title}</h2>
                <p className="mt-2 max-w-[19rem] text-[12px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{body}</p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] border" style={{ background: ASTRO_CHART_PANEL, borderColor: ASTRO_TILE_BORDER, color: ASTRO_GOLD_BRIGHT }}>
                <Orbit size={23} />
              </span>
            </div>

            <div className="relative h-[128px] overflow-hidden rounded-[18px] border" style={{ background: "linear-gradient(150deg, color-mix(in srgb, var(--hint-plum, #2b1d39) 34%, transparent), color-mix(in srgb, var(--hint-surface-soft) 58%, transparent))", borderColor: ASTRO_TILE_BORDER }}>
              <motion.div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  border: `1px solid color-mix(in srgb, ${ASTRO_GOLD_BRIGHT} 36%, transparent)`,
                  boxShadow: `0 0 0 20px color-mix(in srgb, ${ASTRO_ROSE} 9%, transparent), 0 0 0 44px color-mix(in srgb, ${ASTRO_AQUA} 7%, transparent)`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
              />
              <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[78px] w-[184px] -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: "color-mix(in srgb, var(--hint-gold-bright) 34%, transparent)", transform: "translate(-50%, -50%) rotate(-19deg)" }} />
              <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[70px] w-[192px] -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: "color-mix(in srgb, var(--hint-lavender) 30%, transparent)", transform: "translate(-50%, -50%) rotate(24deg)" }} />
              <div className="absolute left-1/2 top-[17px] grid h-[88px] w-[72px] -translate-x-1/2 place-items-center rounded-[17px] border" style={{ background: "linear-gradient(155deg, rgba(255,249,244,0.92), rgba(245,221,236,0.74), rgba(226,238,242,0.78))", borderColor: "color-mix(in srgb, var(--hint-gold-bright) 42%, white)", color: ASTRO_TEXT_STRONG, boxShadow: "0 24px 60px color-mix(in srgb, var(--hint-plum, #2b1d39) 26%, transparent)" }}>
                <span className="absolute left-3 top-3 text-[8px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>Sky</span>
                <Orbit size={29} strokeWidth={1.55} />
                <span className="absolute bottom-2.5 h-[1px] w-9" style={{ background: "color-mix(in srgb, var(--hint-gold-bright) 42%, transparent)" }} />
              </div>
              <div className="absolute bottom-2 left-3 right-3 grid grid-cols-3 gap-1.5">
                {["Birth", "Chart", "Ask"].map((label, index) => (
                  <span key={label} className="rounded-full border px-2 py-1.5 text-center text-[8px] font-black uppercase tracking-[0.12em]" style={{ background: index === 0 ? ASTRO_TILE : "rgba(255,255,255,0.08)", borderColor: ASTRO_TILE_BORDER, color: index === 0 ? ASTRO_GOLD_BRIGHT : ASTRO_FAINT }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {setupSteps.map((item, index) => {
            const Icon = item.icon;
            const active = item.active || (!profile && index === 0);
            return (
              <article key={`${item.label}-${item.value}`} className="rounded-[16px] border px-2 py-2.5 text-center" style={{ background: active ? ASTRO_TILE : ASTRO_INNER, borderColor: active ? "color-mix(in srgb, var(--hint-gold-bright) 34%, var(--hint-control-border))" : ASTRO_TILE_BORDER }}>
                <Icon className="mx-auto" size={16} style={{ color: active ? ASTRO_GOLD_BRIGHT : ASTRO_FAINT }} />
                <p className="mt-2 text-[8px] font-black uppercase tracking-[0.13em]" style={{ color: ASTRO_FAINT }}>{item.label}</p>
                <p className="mt-1 truncate text-[12px] font-black" style={{ color: active ? ASTRO_TEXT_STRONG : ASTRO_MUTED }}>{item.value}</p>
              </article>
            );
          })}
        </div>

        <section className="rounded-[18px] border p-2.5" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
          <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-3">
            <span className="grid h-[38px] w-[38px] place-items-center rounded-[13px] border" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_AQUA }}>
              <PreviewIcon size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_GOLD_BRIGHT }}>{previewCopy.eyebrow}</p>
              <h3 className="mt-1 font-serif text-[20px] font-semibold leading-none" style={{ color: ASTRO_TEXT_STRONG }}>{previewCopy.title}</h3>
              <p className="mt-1.5 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{previewCopy.body}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {previewCopy.rows.map((row) => (
              <span key={row} className="truncate rounded-full border px-2 py-2 text-center text-[8px] font-black uppercase tracking-[0.08em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}>
                {row}
              </span>
            ))}
          </div>
        </section>

        {liveError ? (
          <p className="rounded-[8px] border p-3 text-[12px] font-semibold" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_ROSE }}>
            {liveError}
          </p>
        ) : null}

        <div className="grid gap-2">
          <span className="text-center text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>
            {statusLabel}
          </span>
          {profile ? (
            <button type="button" onClick={onPersonalize} disabled={!canPersonalize || personalizing} className="h-11 rounded-[16px] px-5 text-[13px] font-black shadow-[var(--astro-button-shadow)] disabled:opacity-45" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
              {personalizing ? "Saving chart..." : "Calculate chart"}
            </button>
          ) : (
            <button type="button" onClick={onAddProfile} className="h-11 rounded-[16px] px-5 text-[13px] font-black shadow-[var(--astro-button-shadow)]" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
              Add birth details
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function AstroWheel({ chart, language, className = "aspect-square w-full max-w-[440px]" }: { chart: NatalChart; language: HintLanguage; className?: string }) {
  const points = chart.placements.slice(0, 11).map((item, index) => {
    const signIndex = item.sign ? ZODIAC_SIGNS.indexOf(item.sign) : index;
    const degree = signIndex * 30 + (item.degree ?? 0);
    const angle = ((degree - 90) * Math.PI) / 180;
    const radius = index < 7 ? 78 : 58;
    return { ...item, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
  const pointMap = new Map(points.map((point) => [point.body, point]));
  const aspectLines = [...chart.aspects]
    .sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0) || (a.orb ?? 99) - (b.orb ?? 99))
    .slice(0, 8)
    .map((aspect, index) => {
      const from = pointMap.get(aspect.from as PlanetBody);
      const to = pointMap.get(aspect.to as PlanetBody);
      return from && to ? { aspect, from, to, index } : null;
    })
    .filter((line): line is { aspect: NatalChart["aspects"][number]; from: (typeof points)[number]; to: (typeof points)[number]; index: number } => Boolean(line));
  const aspectColor: Record<NatalChart["aspects"][number]["type"], string> = {
    conjunction: "#f4b761",
    sextile: "#55d79b",
    square: "#ff6f7d",
    trine: "#7ea6ff",
    opposition: "#c7a7ff",
  };
  const degreeTicks = Array.from({ length: 72 }, (_, index) => {
    const degree = index * 5;
    const angle = ((degree - 90) * Math.PI) / 180;
    const major = index % 6 === 0;
    return {
      degree,
      major,
      x1: Math.cos(angle) * (major ? 116 : 121),
      y1: Math.sin(angle) * (major ? 116 : 121),
      x2: Math.cos(angle) * 126,
      y2: Math.sin(angle) * 126,
    };
  });

  return (
    <svg data-testid="astro-wheel" viewBox="-132 -132 264 264" className={className} role="img" aria-label="Natal chart wheel with zodiac signs, houses, planet placements, and aspect lines">
      <defs>
        <radialGradient id="hint-wheel-glow" cx="50%" cy="48%" r="58%">
          <stop offset="0%" stopColor={ASTRO_WHEEL_GLOW_CENTER} />
          <stop offset="48%" stopColor={ASTRO_WHEEL_GLOW_MID} />
          <stop offset="100%" stopColor={ASTRO_WHEEL_GLOW_EDGE} />
        </radialGradient>
        <filter id="hint-wheel-soft-glow">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle r="128" fill={ASTRO_WHEEL_OUTER} />
      <circle r="122" fill="none" stroke={ASTRO_TILE_BORDER} strokeWidth="0.6" strokeDasharray="1.5 4" />
      <circle r="108" fill="none" stroke={ASTRO_TILE_BORDER} strokeWidth="0.75" />
      <circle r="99" fill="url(#hint-wheel-glow)" stroke={ASTRO_STROKE} strokeWidth="1.1" />
      <circle r="90" fill="none" stroke={ASTRO_AQUA} strokeOpacity="0.22" strokeWidth="0.7" />
      <circle r="78" fill={ASTRO_WHEEL_CORE} stroke={ASTRO_TILE_BORDER} strokeWidth="0.8" />
      <circle r="58" fill="none" stroke={ASTRO_STROKE} strokeOpacity="0.54" strokeWidth="0.7" />
      {degreeTicks.map((tick) => (
        <line
          key={`tick-${tick.degree}`}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke={tick.major ? ASTRO_GOLD_BRIGHT : ASTRO_WHEEL_LINE}
          strokeOpacity={tick.major ? "0.58" : "0.38"}
          strokeWidth={tick.major ? "0.75" : "0.45"}
        />
      ))}
      {ZODIAC_SIGNS.map((sign, index) => {
        const angle = ((index * 30 - 90) * Math.PI) / 180;
        const labelAngle = ((index * 30 - 75) * Math.PI) / 180;
        const houseAngle = ((index * 30 - 75) * Math.PI) / 180;
        const house = chart.houses[index];
        return (
          <g key={sign}>
            <line x1={Math.cos(angle) * 58} y1={Math.sin(angle) * 58} x2={Math.cos(angle) * 126} y2={Math.sin(angle) * 126} stroke={ASTRO_WHEEL_LINE} strokeWidth="0.75" />
            <text x={Math.cos(labelAngle) * 117} y={Math.sin(labelAngle) * 117} textAnchor="middle" dominantBaseline="middle" fontSize="7.2" fontWeight="900" fill={ASTRO_TEXT}>
              {signShort(sign, language)}
            </text>
            <text x={Math.cos(labelAngle) * 104} y={Math.sin(labelAngle) * 104} textAnchor="middle" dominantBaseline="middle" fontSize="8.6" fontWeight="900" fill={ASTRO_FAINT}>
              {ZODIAC_GLYPHS[sign]}
            </text>
            <text x={Math.cos(houseAngle) * 86} y={Math.sin(houseAngle) * 86} textAnchor="middle" dominantBaseline="middle" fontSize="6.4" fontWeight="800" fill={index % 2 ? ASTRO_AQUA : ASTRO_GOLD}>
              {house?.house ?? index + 1}
            </text>
          </g>
        );
      })}
      {aspectLines.map(({ aspect, from, to, index }) => (
        <line
          key={`${aspect.from}-${aspect.to}-${aspect.type}`}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={aspectColor[aspect.type] ?? (index % 2 ? ASTRO_AQUA : ASTRO_ROSE)}
          strokeOpacity="0.72"
          strokeWidth={aspect.type === "square" || aspect.type === "opposition" ? "1.15" : "0.9"}
          strokeDasharray={aspect.type === "square" || aspect.type === "opposition" ? "2 2" : undefined}
          filter="url(#hint-wheel-soft-glow)"
        />
      ))}
      {points.map((point) => (
        <g key={point.body}>
          <circle cx={point.x} cy={point.y} r="3.6" fill={ASTRO_WHEEL_DOT} stroke={BODY_COLORS[point.body]} strokeWidth="0.9" />
          <circle cx={point.x} cy={point.y} r="1.15" fill={BODY_COLORS[point.body]} />
          <text x={point.x + 5.6} y={point.y - 1.1} fontSize="8.2" fill={BODY_COLORS[point.body]} fontWeight="900">{BODY_GLYPHS[point.body]}</text>
          <text x={point.x + 5.6} y={point.y + 5.5} fontSize="4.4" fill={ASTRO_FAINT} fontWeight="700">{point.house ? `H${point.house}` : BODY_MARKS[point.body]}</text>
        </g>
      ))}
      <circle r="8" fill={ASTRO_CHART_HEADER} stroke={ASTRO_TILE_BORDER} strokeWidth="0.8" />
      <line x1="-126" y1="0" x2="126" y2="0" stroke={ASTRO_WHEEL_AXIS} strokeWidth="1" />
      <line x1="0" y1="-126" x2="0" y2="126" stroke={ASTRO_WHEEL_AXIS} strokeWidth="1" />
    </svg>
  );
}

function corePlacement(chart: NatalChart, body: PlanetBody) {
  return chart.placements.find((placement) => placement.body === body);
}

function placementSummary(chart: NatalChart, body: PlanetBody, language: HintLanguage) {
  const placement = corePlacement(chart, body);
  return {
    label: bodyName(body, language),
    mark: bodySymbol(body, language),
    sign: signName(placement?.sign, language),
    house: placement?.house ? `House ${placement.house}` : "House pending",
    meaning: placement?.meaning ?? "More birth data will sharpen this point.",
  };
}

function CoreSignatureRail({ chart, language }: { chart: NatalChart; language: HintLanguage }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {(["sun", "moon", "rising"] as PlanetBody[]).map((body) => {
        const item = placementSummary(chart, body, language);
        return (
          <article key={body} className="rounded-[8px] border px-3 py-3" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>{item.label}</p>
              <span className="text-[11px] font-black" style={{ color: ASTRO_GOLD_BRIGHT }}>{item.mark}</span>
            </div>
            <p className="mt-2 font-serif text-[24px] leading-none" style={{ color: ASTRO_TEXT_STRONG }}>{item.sign}</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{item.house}</p>
          </article>
        );
      })}
    </div>
  );
}

function PlanetDetailStrip({ chart, language, ui }: { chart: NatalChart; language: HintLanguage; ui: AstrologyUiCopy }) {
  const rows = wheelPlacementRows(chart, language, ui);
  return (
    <div className="relative z-10 mt-3 grid gap-2 min-[720px]:grid-cols-2 lg:grid-cols-3">
      {rows.map(({ placement, label, meta }) => (
        <article key={`${placement.body}-wheel-detail`} className="rounded-[8px] border px-3 py-2 backdrop-blur" style={{ background: ASTRO_CHART_HEADER, borderColor: ASTRO_TILE_BORDER }}>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-black" style={{ background: `${BODY_COLORS[placement.body]}20`, color: BODY_COLORS[placement.body] }}>
              {bodySymbol(placement.body, language)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-black" style={{ color: ASTRO_TEXT_STRONG }}>{label}</p>
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{meta}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function TraitArcGraph({ chart, language, ui }: { chart: NatalChart; language: HintLanguage; ui: AstrologyUiCopy }) {
  const items: Array<{ label: string; foot: string; body: PlanetBody; x: number; height: number }> = [
    { label: ui.arcLove, foot: ui.arcLoveFoot, body: "venus", x: 44, height: 78 },
    { label: ui.arcSupport, foot: ui.arcSupportFoot, body: "moon", x: 126, height: 58 },
    { label: ui.arcResources, foot: ui.arcResourcesFoot, body: "jupiter", x: 208, height: 88 },
    { label: ui.arcPublic, foot: ui.arcPublicFoot, body: "rising", x: 290, height: 70 },
  ];
  return (
    <div className="relative overflow-hidden rounded-[8px] border p-4" style={{ background: ASTRO_PREMIUM_INNER, borderColor: ASTRO_TILE_BORDER }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>{ui.patternBlend}</p>
          <p className="mt-1 text-[24px] font-black leading-none" style={{ color: ASTRO_TEXT }}>{ui.rareTitle}</p>
          <p className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>
            {ui.rareDescription(deterministicScore(chart))}
          </p>
        </div>
        <span className="rounded-[8px] border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_AQUA }}>
          {ui.hintLens}
        </span>
      </div>
      <svg viewBox="0 0 360 150" className="h-[150px] w-full" role="img" aria-label="Chart trait graph">
        <defs>
          <linearGradient id="hint-arc-pink" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff7fa6" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#ff7fa6" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="hint-arc-blue" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7ea6ff" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#7ea6ff" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="hint-arc-gold" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f4b761" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#f4b761" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="hint-arc-green" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#5fd49d" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#5fd49d" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <line x1="12" x2="348" y1="135" y2="135" stroke={ASTRO_TILE_BORDER} strokeWidth="2" />
        {items.map((item, index) => {
          const color = BODY_COLORS[item.body];
          const gradient = ["url(#hint-arc-pink)", "url(#hint-arc-blue)", "url(#hint-arc-gold)", "url(#hint-arc-green)"][index]!;
          const top = 135 - item.height;
          return (
            <g key={item.label}>
              <path d={`M ${item.x - 44} 135 Q ${item.x} ${top} ${item.x + 44} 135 Z`} fill={gradient} />
              <circle cx={item.x} cy={top + 4} r="6" fill={ASTRO_CHART_HEADER} stroke={color} strokeWidth="3" />
              <text x={item.x} y={top - 8} textAnchor="middle" fontSize="12" fontWeight="900" fill={color}>
                {item.label}
              </text>
              <text x={item.x} y="126" textAnchor="middle" fontSize="10" fontWeight="700" fill={ASTRO_FAINT}>
                {item.foot}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.map((item) => {
          const placement = corePlacement(chart, item.body);
          return (
            <p key={`${item.label}-meta`} className="rounded-[8px] border px-3 py-2 text-[11px] font-black" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: BODY_COLORS[item.body] }}>
              {item.label} · {placement ? `${bodyName(item.body, language)} in ${signName(placement.sign, language)}` : ui.pending}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function SignatureSelfPanel({
  profile,
  chart,
  previewMode,
  language,
  ui,
  onEditProfile,
}: {
  profile: BirthProfile | null;
  chart: NatalChart;
  previewMode: boolean;
  language: HintLanguage;
  ui: AstrologyUiCopy;
  onEditProfile: () => void;
}) {
  const trio = (["sun", "moon", "rising"] as PlanetBody[]).map((body) => corePlacement(chart, body));
  return (
    <section className="relative overflow-hidden rounded-[8px] border p-3 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_PREMIUM_PANEL, borderColor: ASTRO_STROKE }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
          "radial-gradient(circle at 14% 18%, rgba(126,166,255,0.26), transparent 32%), radial-gradient(circle at 84% 12%, rgba(95,212,157,0.22), transparent 34%), radial-gradient(circle at 72% 92%, rgba(255,127,166,0.18), transparent 34%)",
        }}
      />
      <div className="relative grid gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[8px] border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.13em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_AQUA }}>
              {previewMode ? ui.sampleSignatureBadge : ui.signatureBadge}
            </span>
            <span className="rounded-[8px] border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.13em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ELEMENT_META[chart.elementBalance.dominant].color }}>
              {traitPill(chart)}
            </span>
          </div>
          <h2 className="mt-3 max-w-3xl font-serif text-[20px] leading-tight tracking-normal" style={{ color: ASTRO_TEXT_STRONG }}>
            {chartSignatureTitle(chart, language, ui)}
          </h2>
          <p className="mt-2 max-w-3xl rounded-[8px] border px-3 py-2 text-[12px] font-semibold leading-snug" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}>
            {chartSignatureLine(chart, ui)}
          </p>
          <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {trio.map((placement) => (
              <article key={placement?.body ?? "open"} className="min-w-0 rounded-[8px] border p-2.5" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-black" style={{ background: placement ? `${BODY_COLORS[placement.body]}22` : ASTRO_INNER, color: placement ? BODY_COLORS[placement.body] : ASTRO_GOLD }}>
                    {placement ? BODY_MARKS[placement.body] : "?"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[9px] font-black uppercase tracking-[0.11em]" style={{ color: ASTRO_FAINT }}>{placement ? BODY_LENSES[placement.body].title : "Pending"}</p>
                    <p className="mt-1 truncate text-[13px] font-black" style={{ color: ASTRO_TEXT }}>{placement ? signName(placement.sign, language) : ui.pending}</p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{placementOneLine(placement)}</p>
              </article>
            ))}
          </div>
          <button type="button" onClick={onEditProfile} className="mt-3 inline-flex h-9 items-center gap-2 rounded-[8px] px-3 text-[12px] font-black shadow-[var(--astro-button-shadow)] transition-[transform,opacity] duration-200 hover:-translate-y-0.5" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
            {profile ? `Using ${profile.birthDate}` : "Add birth data"} <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

function PlacementIndexPanel({ chart, language, ui }: { chart: NatalChart; language: HintLanguage; ui: AstrologyUiCopy }) {
  const houseFocus = chart.houses.filter((house) => house.sign || house.theme).slice(0, 4);

  return (
    <section className="rounded-[8px] border p-3 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_AQUA }}>Zodiac index</p>
          <h2 className="mt-1 font-serif text-[21px] leading-tight" style={{ color: ASTRO_TEXT }}>Zodiac placements</h2>
        </div>
        <div className="flex shrink-0 gap-1 rounded-[8px] border p-1" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
          {["Signs", "Houses"].map((label, index) => (
            <span
              key={label}
              className="rounded-[7px] px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em]"
              style={{ background: index === 0 ? ASTRO_BUTTON : "transparent", color: index === 0 ? ASTRO_BUTTON_TEXT : ASTRO_FAINT }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        {PLACEMENT_INDEX_BODIES.map((body) => {
          const placement = corePlacement(chart, body);
          const color = BODY_COLORS[body];
          return (
            <article key={`${body}-placement-index`} className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
              <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full text-[13px] font-black" style={{ background: `${color}22`, color }}>
                  {bodySymbol(body, language)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-[15px] font-black leading-tight" style={{ color: ASTRO_TEXT_STRONG }}>
                      {bodyName(body, language)} · {signName(placement?.sign, language)}
                    </h3>
                    <span className="rounded-[7px] border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color }}>
                      {placement?.house ? `${ui.house} ${placement.house}` : ui.housePending}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>
                    {BODY_LENSES[body].role}
                    {typeof placement?.degree === "number" ? ` · ${Math.round(placement.degree)} deg` : ""}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>
                    {placement?.meaning ?? ui.fullDataNeeded}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {houseFocus.length ? (
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {houseFocus.map((house) => (
            <article key={`house-focus-${house.house}`} className="min-w-0 rounded-[8px] border p-2.5" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
              <p className="text-[8px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{ui.house} {house.house}</p>
              <p className="mt-1 truncate text-[13px] font-black" style={{ color: ASTRO_TEXT }}>{signName(house.sign, language)}</p>
              {house.theme ? <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{house.theme}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ZodiacStrengthSummaryPanel({ chart, language, ui }: { chart: NatalChart; language: HintLanguage; ui: AstrologyUiCopy }) {
  const rows = zodiacStrengthRows(chart, language);
  const receipts = topStrengthReceipts(chart).slice(0, 2);
  const sun = corePlacement(chart, "sun");
  const moon = corePlacement(chart, "moon");
  const rising = corePlacement(chart, "rising");

  return (
    <section className="rounded-[8px] border p-3 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_PREMIUM_PANEL, borderColor: ASTRO_STROKE }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Top strengths</p>
          <h2 className="mt-1 font-serif text-[23px] leading-tight" style={{ color: ASTRO_TEXT_STRONG }}>Strength snapshot</h2>
        </div>
        <span className="shrink-0 rounded-[8px] border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ELEMENT_META[chart.elementBalance.dominant].color }}>
          {traitPill(chart)}
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        <article className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
          <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>Top read</p>
          <p className="mt-1 text-[14px] font-black leading-snug" style={{ color: ASTRO_TEXT }}>
            {chartSignatureTitle(chart, language, ui)}
          </p>
          <p className="mt-2 line-clamp-3 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>
            {chart.summary.short || chartSignatureLine(chart, ui)}
          </p>
        </article>

        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {[
            { label: "Core", placement: sun, color: BODY_COLORS.sun },
            { label: "Feeling", placement: moon, color: BODY_COLORS.moon },
            { label: "Signal", placement: rising, color: BODY_COLORS.rising },
            { label: "Mode", placement: undefined, color: MODALITY_META[chart.modalityBalance.dominant].color, value: MODALITY_META[chart.modalityBalance.dominant].label },
          ].map((item) => (
            <article key={item.label} className="min-w-0 rounded-[8px] border p-2.5" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
              <p className="text-[8px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{item.label}</p>
              <p className="mt-1 truncate text-[13px] font-black" style={{ color: item.color }}>
                {item.placement ? signName(item.placement.sign, language) : item.value}
              </p>
            </article>
          ))}
        </div>

        <div className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_AQUA }}>Ability graph</p>
            <p className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>summary only</p>
          </div>
          <div className="grid gap-2.5">
            {rows.map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black" style={{ color: ASTRO_TEXT }}>{row.label}</p>
                  <p className="truncate text-[10px] font-bold" style={{ color: row.color }}>{row.value}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: ASTRO_TILE }}>
                  <div className="h-full rounded-full" style={{ width: `${row.score}%`, background: `linear-gradient(90deg, ${row.color}, ${ASTRO_TEXT_STRONG})` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 min-[720px]:grid-cols-2">
          {receipts.map((line, index) => (
            <p key={`${line}-${index}`} className="line-clamp-2 rounded-[8px] border px-3 py-2 text-[11px] font-semibold leading-snug" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_MUTED }}>
              <span className="mr-2 font-black" style={{ color: ASTRO_GOLD_BRIGHT }}>{String(index + 1).padStart(2, "0")}</span>
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function TraditionLayerPanel() {
  const layers = [
    {
      label: "星宿",
      title: "28 lunar mansions",
      status: "Optional",
      body: "Good as a cultural side layer: mansion, daily mansion, relationship tone, and low-stakes ritual prompts.",
      color: ASTRO_AQUA,
      icon: Radar,
    },
    {
      label: "值日星宿",
      title: "Day mansion",
      status: "Today layer",
      body: "Useful for a daily card like good-for / avoid. It should stay reflective, not deterministic fortune.",
      color: ASTRO_GOLD_BRIGHT,
      icon: CalendarDays,
    },
    {
      label: "紫微",
      title: "Zi Wei palaces",
      status: "Later",
      body: "Worth adding only with a real Zi Wei engine. It is a separate 12-palace system, not another zodiac placement.",
      color: "var(--astro-lavender)",
      icon: Compass,
    },
  ];

  return (
    <section className="rounded-[8px] border p-3 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>Side layers</p>
          <h2 className="mt-1 font-serif text-[21px] leading-tight" style={{ color: ASTRO_TEXT }}>星宿 & 紫微</h2>
        </div>
        <span className="shrink-0 rounded-[8px] border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_AQUA }}>
          not core chart
        </span>
      </div>
      <p className="rounded-[8px] border px-3 py-2 text-[12px] font-semibold leading-snug" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_MUTED }}>
        Keep Western chart, Zodiac placements, and Today as the primary Hint astrology flow. Add Chinese systems as optional report lenses only when the calculation source is explicit.
      </p>
      <div className="mt-3 grid gap-2">
        {layers.map((layer) => {
          const Icon = layer.icon;
          return (
            <article key={layer.label} className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
              <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-[8px] border" style={{ background: `${layer.color}20`, borderColor: `${layer.color}55`, color: layer.color }}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-[14px] font-black leading-tight" style={{ color: ASTRO_TEXT_STRONG }}>{layer.label} · {layer.title}</h3>
                    <span className="rounded-[7px] border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: layer.color }}>
                      {layer.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{layer.body}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ElementSignaturePanel({ chart, ui }: { chart: NatalChart; ui: AstrologyUiCopy }) {
  const entries = balanceEntries(chart);
  let cursor = 0;
  const gradient = entries
    .map((entry, index) => {
      const start = cursor;
      const end = index === entries.length - 1 ? 100 : cursor + entry.percent;
      cursor = end;
      return `${entry.color} ${start}% ${end}%`;
    })
    .join(", ");
  return (
    <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: ASTRO_GOLD_BRIGHT }}>{ui.elementBalance}</p>
          <h2 className="mt-2 font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>{titleCase(chart.elementBalance.dominant)} leads the chart</h2>
        </div>
        <span className="rounded-[8px] border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em]" style={{ background: ELEMENT_META[chart.elementBalance.dominant].soft, borderColor: ASTRO_TILE_BORDER, color: ELEMENT_META[chart.elementBalance.dominant].color }}>
          {ELEMENT_META[chart.elementBalance.dominant].role}
        </span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[172px_minmax(0,1fr)] lg:items-center">
        <div className="mx-auto grid h-[160px] w-[160px] place-items-center rounded-full p-4" style={{ background: `conic-gradient(${gradient})`, boxShadow: `inset 0 0 0 1px ${ASTRO_TILE_BORDER}, 0 18px 50px rgba(0,0,0,0.10)` }}>
          <div className="grid h-[98px] w-[98px] place-items-center rounded-full border text-center" style={{ background: ASTRO_CHART_HEADER, borderColor: ASTRO_TILE_BORDER }}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>Dominant</p>
              <p className="mt-1 text-[22px] font-black leading-none" style={{ color: ELEMENT_META[chart.elementBalance.dominant].color }}>{titleCase(chart.elementBalance.dominant)}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          {entries.map((entry) => (
            <div key={entry.key} className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-black" style={{ color: ASTRO_TEXT }}>{entry.label} signs</p>
                  <p className="mt-1 text-[12px] font-semibold" style={{ color: ASTRO_MUTED }}>{entry.role} - {entry.line}</p>
                </div>
                <p className="text-[22px] font-black" style={{ color: entry.color }}>{entry.percent}%</p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full" style={{ background: ASTRO_TILE }}>
                <div className="h-full rounded-full" style={{ width: `${Math.max(8, entry.percent)}%`, background: `linear-gradient(90deg, ${entry.color}, ${ASTRO_TEXT_STRONG})` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-5 rounded-[8px] border p-4 text-[13px] font-semibold leading-relaxed" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}>
        {dominantElementLine(chart)}
      </p>
    </section>
  );
}

function StarSecretPanel({ chart, language, ui }: { chart: NatalChart; language: HintLanguage; ui: AstrologyUiCopy }) {
  const cards = selfSecretCards(chart, language, ui);
  return (
    <section className="rounded-[8px] border p-5 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: ASTRO_AQUA }}>{ui.codeEyebrow}</p>
          <h2 className="mt-2 font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>{chartSignatureTitle(chart, language, ui)}</h2>
        </div>
        <span className="rounded-[8px] border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_GOLD_BRIGHT }}>
          {ui.oneLine}
        </span>
      </div>
      <p className="mt-4 rounded-[8px] border p-4 text-[15px] font-black leading-relaxed" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}>
        {ui.codeSummary}
      </p>
      <div className="mt-5 grid gap-3 min-[720px]:grid-cols-2">
        {cards.map((card) => (
          <article key={card.title} className="rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[8px] text-[13px] font-black" style={{ background: `${BODY_COLORS[card.body]}20`, color: BODY_COLORS[card.body] }}>
                {bodySymbol(card.body, language)}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>{card.title}</p>
                <p className="mt-1 text-[20px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{card.value}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      <section className="mt-4 rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
        <p className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>{ui.todayFocus}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-[8px] border p-4" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
            <p className="text-[14px] font-black" style={{ color: ASTRO_TEXT }}>{ui.focusCue}</p>
            <p className="mt-2 text-[15px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{todayReminder(chart, ui)}</p>
          </div>
          <div className="rounded-[8px] border p-4" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
            <p className="text-[14px] font-black" style={{ color: ASTRO_TEXT }}>{ui.luckyAnchor}</p>
            <p className="mt-2 text-[20px] font-black" style={{ color: ASTRO_AQUA }}>{ui.anchorValue}</p>
          </div>
        </div>
      </section>
    </section>
  );
}

function AstroCodePanel({ chart, language, ui }: { chart: NatalChart; language: HintLanguage; ui: AstrologyUiCopy }) {
  const codeCards = passwordCards(chart, language, ui);
  const fitSigns = bestFitSigns(chart, language);
  return (
    <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_HERO, borderColor: ASTRO_BORDER }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: ASTRO_AQUA }}>{ui.coreEyebrow}</p>
          <h2 className="mt-2 font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>{ui.coreTitle}</h2>
        </div>
        <span className="rounded-[8px] border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_GOLD_BRIGHT }}>
          {fitSigns.join(" / ")}
        </span>
      </div>
      <div className="mt-5 grid gap-3 min-[720px]:grid-cols-2 lg:grid-cols-3">
        {codeCards.map(({ label, subtitle, placement, body, value, line }) => (
          <article key={label} className="relative overflow-hidden rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
            <div className="absolute right-3 top-3 h-12 w-12 rounded-full opacity-20" style={{ background: placement ? BODY_COLORS[body] : ASTRO_GOLD }} />
            <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>{subtitle}</p>
            <h3 className="mt-2 text-[22px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{label}</h3>
            <p className="mt-3 inline-flex rounded-[8px] px-3 py-2 text-[13px] font-black" style={{ background: placement ? `${BODY_COLORS[body]}1f` : ASTRO_TILE, color: placement ? BODY_COLORS[body] : ASTRO_GOLD }}>
              {value}
            </p>
            <p className="mt-3 text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{line}</p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>{placementEvidence(placement, language, ui)}</p>
          </article>
        ))}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <article className="rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
          <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>{ui.bestFit}</p>
          <p className="mt-2 text-[22px] font-black" style={{ color: ASTRO_TEXT }}>{fitSigns.join(" / ")}</p>
          <p className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{ui.bestFitNote}</p>
        </article>
        <article className="rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
          <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>{ui.reminderLabel}</p>
          <p className="mt-2 text-[18px] font-black leading-snug" style={{ color: ASTRO_TEXT }}>{todayReminder(chart, ui)}</p>
        </article>
      </div>
    </section>
  );
}

function PlacementStoryList({ chart, language, ui }: { chart: NatalChart; language: HintLanguage; ui: AstrologyUiCopy }) {
  return (
    <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Placement stories</p>
          <h2 className="mt-2 font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>{ui.everyPlanet}</h2>
        </div>
        <span className="rounded-[8px] border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_AQUA }}>
          API-backed
        </span>
      </div>
      <div className="mt-5 grid gap-4">
        {STORY_BODIES.map((body) => {
          const placement = corePlacement(chart, body);
          const color = BODY_COLORS[body];
          return (
            <article key={body} className="rounded-[8px] border p-4 sm:p-5" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
              <div className="grid gap-4 sm:grid-cols-[56px_minmax(0,1fr)]">
                <div className="grid h-14 w-14 place-items-center rounded-full text-[13px] font-black" style={{ background: `${color}20`, color }}>
                  {BODY_MARKS[body]}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[24px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>
                      {bodyName(body, language)} · {signName(placement?.sign, language)}
                    </h3>
                    <span className="rounded-[8px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color }}>
                      {BODY_LENSES[body].role}
                    </span>
                  </div>
                  <p className="mt-3 rounded-[8px] px-3 py-2 text-[14px] font-black leading-relaxed" style={{ background: `${color}17`, color: ASTRO_TEXT }}>
                    {placementOneLine(placement)}
                  </p>
                  <p className="mt-3 text-[14px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>
                    {placement?.meaning ?? ui.fullDataNeeded}
                  </p>
                  <p className="mt-3 text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>
                    {placementEvidence(placement, language, ui)}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SocialPlanetsPanel({ chart, language, ui }: { chart: NatalChart; language: HintLanguage; ui: AstrologyUiCopy }) {
  return (
    <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: ASTRO_AQUA }}>{ui.socialPlanetsEyebrow}</p>
          <h2 className="mt-2 font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>{ui.socialPlanetsTitle}</h2>
        </div>
      </div>
      <div className="mt-5 grid gap-3 min-[720px]:grid-cols-2 lg:grid-cols-5">
        {SOCIAL_PLANETS.map((body) => {
          const placement = corePlacement(chart, body);
          const color = BODY_COLORS[body];
          return (
            <article key={body} className="rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
              <div className="mb-3 h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
              <p className="text-[12px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>{bodyName(body, language)}</p>
              <p className="mt-2 text-[19px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{signName(placement?.sign, language)}</p>
              <p className="mt-2 text-[12px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{BODY_LENSES[body].question}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AspectLegend() {
  const items: Array<{ label: string; tone: string; dash?: string }> = [
    { label: "Trine", tone: "#7ea6ff" },
    { label: "Sextile", tone: "#55d79b" },
    { label: "Conjunction", tone: "#f4b761" },
    { label: "Square", tone: "#ff6f7d", dash: "4 4" },
    { label: "Opposition", tone: "#c7a7ff", dash: "4 4" },
  ];

  return (
    <div className="relative z-10 grid gap-1.5 rounded-[8px] border p-2 sm:grid-cols-5" style={{ background: ASTRO_CHART_HEADER, borderColor: ASTRO_TILE_BORDER }}>
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 items-center gap-2">
          <svg viewBox="0 0 32 6" className="h-2 w-8 shrink-0" aria-hidden="true">
            <line x1="1" y1="3" x2="31" y2="3" stroke={item.tone} strokeWidth="2" strokeDasharray={item.dash} strokeLinecap="round" />
          </svg>
          <span className="truncate text-[9px] font-black uppercase tracking-[0.11em]" style={{ color: ASTRO_FAINT }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ChartGraphPanel({ chart, language, ui }: { chart: NatalChart; language: HintLanguage; ui: AstrologyUiCopy }) {
  const sun = placementSummary(chart, "sun", language);
  const moon = placementSummary(chart, "moon", language);
  const rising = placementSummary(chart, "rising", language);
  return (
    <div className="relative overflow-hidden rounded-[8px] border p-2.5 sm:p-3" style={{ background: ASTRO_CHART_PANEL, borderColor: ASTRO_TILE_BORDER }}>
      <div className="pointer-events-none absolute inset-2.5 rounded-[8px] border opacity-70" style={{ borderColor: ASTRO_STROKE }} />
      <div className="relative z-10 flex flex-col gap-2 rounded-[8px] border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between" style={{ background: ASTRO_CHART_HEADER, borderColor: ASTRO_STROKE }}>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: ASTRO_GOLD_BRIGHT }}><Radar size={13} /> Chart graph</p>
          <p className="mt-1 truncate text-[12px] font-black" style={{ color: ASTRO_MUTED }}>{ui.chartTitle(sun.sign, moon.sign, rising.sign)}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_AQUA }}>
          {chart.placements.length} placements
        </span>
      </div>
      <div className="relative z-0 flex min-h-[280px] items-center justify-center py-3 sm:min-h-[360px]">
        <AstroWheel chart={chart} language={language} className="aspect-square w-full max-w-[340px] sm:max-w-[420px]" />
      </div>
      <AspectLegend />
    </div>
  );
}

function PremiumChartHero({
  chart,
  previewMode,
  profile,
  providerLabel,
  language,
  ui,
  onAddProfile,
  strongestAspect,
}: {
  chart: NatalChart;
  previewMode: boolean;
  profile: BirthProfile | null;
  providerLabel: string;
  language: HintLanguage;
  ui: AstrologyUiCopy;
  onAddProfile: () => void;
  strongestAspect?: NatalChart["aspects"][number];
}) {
  const headline = chartSignatureTitle(chart, language, ui);
  const trio = (["sun", "moon", "rising"] as PlanetBody[]).map((body) => corePlacement(chart, body));
  const quickFacts = [
    { label: "Element", value: titleCase(chart.elementBalance.dominant), icon: Activity, color: ELEMENT_META[chart.elementBalance.dominant].color },
    { label: "Mode", value: titleCase(chart.modalityBalance.dominant), icon: Compass, color: MODALITY_META[chart.modalityBalance.dominant].color },
    { label: "Aspect", value: strongestAspect ? `${bodyLabel(strongestAspect.from)} ${strongestAspect.type}` : "Pending", icon: CircleDot, color: ASTRO_AQUA },
  ];

  return (
    <section className="relative overflow-hidden rounded-[8px] border p-3 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_PREMIUM_PANEL, borderColor: ASTRO_STROKE }}>
      <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 18% 18%, ${ASTRO_GOLD_BRIGHT}, transparent 28%), radial-gradient(circle at 82% 20%, ${ASTRO_AQUA}, transparent 32%), radial-gradient(circle at 72% 82%, ${ASTRO_ROSE}, transparent 30%)`, opacity: 0.14 }} />
      <div className="relative grid gap-3">
        <div className="grid grid-cols-[minmax(0,1fr)_118px] items-start gap-3 min-[720px]:grid-cols-[minmax(0,1fr)_136px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-[8px] border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_STROKE, color: ASTRO_GOLD_BRIGHT }}>
                <Orbit size={12} />
                {providerLabel}
              </span>
              <span className="rounded-[8px] border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_AQUA }}>
                {previewMode ? "Preview" : "Saved"}
              </span>
            </div>
            <h2 className="mt-2 font-serif text-[17px] leading-[1.12] tracking-normal" style={{ color: ASTRO_TEXT_STRONG }}>{headline}</h2>
            <p className="mt-2 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{chart.summary.short}</p>
          </div>
          <div className="relative grid aspect-square min-h-[118px] place-items-center overflow-hidden rounded-[8px] border" style={{ background: ASTRO_CHART_PANEL, borderColor: ASTRO_TILE_BORDER }}>
            <AstroWheel chart={chart} language={language} className="aspect-square w-[130%] max-w-[174px]" />
          </div>
        </div>

        <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {trio.map((placement) => (
            <article key={placement?.body ?? "open"} className="min-w-0 rounded-[8px] border px-2.5 py-2" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
              <p className="truncate text-[8px] font-black uppercase tracking-[0.11em]" style={{ color: ASTRO_FAINT }}>
                {placement ? bodyName(placement.body, language) : "Pending"}
              </p>
              <p className="mt-1 truncate text-[14px] font-black leading-none" style={{ color: placement ? BODY_COLORS[placement.body] : ASTRO_GOLD_BRIGHT }}>
                {placement ? signName(placement.sign, language) : ui.pending}
              </p>
            </article>
          ))}
        </div>

        <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {quickFacts.map(({ label, value, icon: Icon, color }) => (
            <article key={label} className="min-w-0 rounded-[8px] border px-2.5 py-2" style={{ background: ASTRO_PREMIUM_INNER, borderColor: ASTRO_TILE_BORDER }}>
              <p className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.11em]" style={{ color: ASTRO_FAINT }}>
                <Icon size={11} />
                {label}
              </p>
              <p className="mt-1 truncate text-[12px] font-black" style={{ color }}>{value}</p>
            </article>
          ))}
        </div>

        {previewMode ? (
          <button type="button" onClick={onAddProfile} className="h-10 rounded-[8px] px-5 text-[12px] font-black transition-[transform,opacity] duration-200 hover:-translate-y-0.5" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
            {profile ? "Edit birth details" : "Add birth details"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ChartHighlightCard({ chart, aspects }: { chart: NatalChart; aspects: NatalChart["aspects"] }) {
  return (
    <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: ASTRO_GOLD_BRIGHT }}>
            <Share2 size={14} />
            Chart highlight card
          </p>
          <h2 className="mt-2 font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>Three receipts from this chart</h2>
        </div>
        <span className="rounded-[8px] border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_AQUA }}>
          {signLabel(chart.sunSign)} / {signLabel(chart.moonSign)} / {signLabel(chart.risingSign)}
        </span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {aspects.map((aspect, index) => (
          <article key={`${aspect.from}-${aspect.to}-${aspect.type}-highlight`} className="rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
            <div className="mb-3 h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${astroColor(index)}, transparent)` }} />
            <p className="text-[14px] font-black" style={{ color: ASTRO_TEXT }}>{bodyLabel(aspect.from)} {aspect.type} {bodyLabel(aspect.to)}</p>
            <p className="mt-2 text-[12px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{aspect.meaning}</p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>Orb {aspect.orb} · Strength {aspect.strength ?? "ranked"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LiveNatalControl({
  profile,
  canRun,
  loading,
  error,
  natalResponse,
  onAddProfile,
  onRun,
}: {
  profile: BirthProfile | null;
  canRun: boolean;
  loading: boolean;
  error?: string;
  natalResponse: AstroNatalResponse | null;
  onAddProfile: () => void;
  onRun: () => void;
}) {
  const live = isLiveNatal(natalResponse);
  const sourceLabel = chartSourceLabel(natalResponse);
  const actionLabel = loading ? "Calculating..." : live ? "Refresh live chart" : "Calculate chart";
  return (
    <section className="rounded-[8px] border p-3 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: live ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }}>
            {sourceLabel}
          </p>
          <p className="mt-1 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>
            {live ? `Live chart loaded${natalResponse?.cached ? " from cache" : ""}.` : natalResponse ? "Your saved chart preview is ready to use." : liveProfileHint(profile)}
          </p>
          {error ? <p className="mt-2 text-[12px] font-semibold" style={{ color: ASTRO_ROSE }}>{error}</p> : null}
        </div>
        {profile ? (
          <button
            type="button"
            onClick={onRun}
            disabled={!canRun || loading}
            className="h-9 shrink-0 rounded-[8px] px-3 text-[12px] font-black shadow-[var(--astro-button-shadow)] transition-[transform,opacity] duration-200 hover:-translate-y-0.5 disabled:opacity-45"
            style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}
          >
            {actionLabel}
          </button>
        ) : (
          <button type="button" onClick={onAddProfile} className="h-9 shrink-0 rounded-[8px] px-3 text-[12px] font-black" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
            Add birth details
          </button>
        )}
      </div>
    </section>
  );
}

function ChartFocusPanel({
  chart,
  language,
  ui,
  providerLabel,
  onKnowMore,
}: {
  chart: NatalChart;
  language: HintLanguage;
  ui: AstrologyUiCopy;
  providerLabel: string;
  onKnowMore: () => void;
}) {
  const headline = chartSignatureTitle(chart, language, ui);
  const coreRows = (["sun", "moon", "rising"] as PlanetBody[]).map((body) => {
    const placement = corePlacement(chart, body);
    return {
      body,
      label: bodyName(body, language),
      value: signName(placement?.sign, language),
      detail: placement?.house ? `House ${placement.house}` : "Placement",
      color: BODY_COLORS[body],
    };
  });
  const strengthReceipts = topStrengthReceipts(chart).slice(0, 2);

  return (
    <section className="rounded-[8px] border p-3 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_PREMIUM_PANEL, borderColor: ASTRO_STROKE }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_AQUA }}>Birth chart</p>
          <h1 className="mt-1 font-serif text-[23px] leading-tight" style={{ color: ASTRO_TEXT_STRONG }}>{headline}</h1>
          <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{chart.summary.short}</p>
        </div>
        <span className="shrink-0 rounded-[8px] border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_GOLD_BRIGHT }}>
          {providerLabel}
        </span>
      </div>

      <div className="mt-3 rounded-[8px] border p-2" style={{ background: ASTRO_CHART_PANEL, borderColor: ASTRO_TILE_BORDER }}>
        <div className="relative grid min-h-[220px] place-items-center overflow-hidden rounded-[8px]" style={{ background: ASTRO_CHART_HEADER }}>
          <AstroWheel chart={chart} language={language} className="aspect-square w-full max-w-[232px]" />
        </div>
      </div>

      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {coreRows.map((item) => (
          <article key={item.body} className="min-w-0 rounded-[8px] border px-2.5 py-2" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
            <p className="truncate text-[8px] font-black uppercase tracking-[0.1em]" style={{ color: ASTRO_FAINT }}>{item.label}</p>
            <p className="mt-1 truncate text-[14px] font-black leading-none" style={{ color: item.color }}>{item.value}</p>
            <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-[0.08em]" style={{ color: ASTRO_FAINT }}>{item.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-3 rounded-[8px] border p-2.5" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Top strengths</p>
          <p className="truncate text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{traitPill(chart)}</p>
        </div>
        <div className="grid gap-1.5">
          {strengthReceipts.map((line, index) => (
            <p key={`${line}-${index}`} className="line-clamp-2 rounded-[7px] border px-2.5 py-2 text-[11px] font-semibold leading-snug" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}>
              <span className="mr-2 font-black" style={{ color: ASTRO_AQUA }}>{index + 1}</span>
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-2 min-[720px]:grid-cols-2">
        <Link
          href="/app/ask"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] px-4 text-[12px] font-black shadow-[var(--astro-button-shadow)]"
          style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}
        >
          <Sparkles size={15} />
          Ask Hint
        </Link>
        <button
          type="button"
          onClick={onKnowMore}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border px-4 text-[12px] font-black"
          style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}
        >
          View chart details
          <ChevronRight size={15} />
        </button>
      </div>
    </section>
  );
}

function ChartSection({
  chart,
  previewMode,
  profile,
  canPersonalize,
  personalizing,
  liveError,
  natalResponse,
  language,
  ui,
  onAddProfile,
  onPersonalize,
}: {
  chart: NatalChart;
  previewMode: boolean;
  profile: BirthProfile | null;
  canPersonalize: boolean;
  personalizing: boolean;
  liveError?: string;
  natalResponse: AstroNatalResponse | null;
  language: HintLanguage;
  ui: AstrologyUiCopy;
  onAddProfile: () => void;
  onPersonalize: () => void;
}) {
  const providerLabel = previewMode ? (profile ? "Profile preview" : "Example chart") : chartSourceLabel(natalResponse, chart);
  const partialMessage = chart.validation?.message ?? "Sun and planet signs can be previewed. Rising sign and houses need birth time and location.";
  const rankedAspects = [...chart.aspects].sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0) || (a.orb ?? 99) - (b.orb ?? 99));
  const visibleAspects = rankedAspects.slice(0, 5);
  const hiddenAspects = rankedAspects.slice(5);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const chartRuler = chartRulerPlacement(chart);
  const chartModules: AstroModuleItem[] = [
    {
      label: "Sky identity",
      value: chartSignatureTitle(chart, language, ui),
      note: "Big Three first, because this is the fastest orientation.",
      color: ASTRO_GOLD_BRIGHT,
    },
    {
      label: "Chart wheel",
      value: chart.validation?.partial ? "Partial wheel" : "12 houses",
      note: chart.validation?.partial ? "Birth time and place sharpen houses." : "The wheel stays the source map.",
      color: ASTRO_AQUA,
    },
    {
      label: "Placements",
      value: `${chart.placements.length} bodies`,
      note: "Planet-by-planet plain language stays available below.",
      color: "var(--astro-lavender)",
    },
    {
      label: "Houses",
      value: chart.validation?.partial ? "Needs time" : "Ready",
      note: "Houses explain where each placement shows up.",
      color: ASTRO_ROSE,
    },
    {
      label: "Aspects",
      value: strongestAspectLine(chart),
      note: "Strong patterns are ranked before the full list.",
      color: ASTRO_AQUA,
    },
    {
      label: "Elements",
      value: `${titleCase(chart.elementBalance.dominant)} / ${titleCase(chart.modalityBalance.dominant)}`,
      note: "Balance shows the overall temperament of the chart.",
      color: ELEMENT_META[chart.elementBalance.dominant].color,
    },
    {
      label: "Chart ruler",
      value: chartRuler ? chartRulerLine(chart, language) : "Rising needed",
      note: "A quick handle for how the whole chart tends to steer.",
      color: chartRuler ? BODY_COLORS[chartRuler.body] : ASTRO_FAINT,
    },
    {
      label: "Patterns",
      value: retrogradeLine(chart),
      note: "Retrogrades and clusters stay as context, not verdicts.",
      color: ASTRO_GOLD,
    },
  ];

  return (
    <section className="grid gap-4">
      <ChartFocusPanel chart={chart} language={language} ui={ui} providerLabel={providerLabel} onKnowMore={() => setDetailsOpen(true)} />
      <AstroModuleMap eyebrow="Chart system" title="What this chart contains" items={chartModules} />
      <details
        open={detailsOpen}
        onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
        className="rounded-[8px] border p-3.5 shadow-[var(--astro-shadow-soft)]"
        style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}
      >
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Chart details</p>
              <p className="mt-1 text-[13px] font-black" style={{ color: ASTRO_TEXT }}>Wheel, placements, houses, aspects</p>
            </div>
            <span className="rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_FAINT }}>
              {detailsOpen ? "Hide" : "View"}
            </span>
          </div>
        </summary>
        <div className="mt-4 grid gap-4">
          <LiveNatalControl profile={profile} canRun={canPersonalize} loading={personalizing} error={liveError} natalResponse={natalResponse} onAddProfile={onAddProfile} onRun={onPersonalize} />
          <AstroCodePanel chart={chart} language={language} ui={ui} />
          <ElementSignaturePanel chart={chart} ui={ui} />
          <SocialPlanetsPanel chart={chart} language={language} ui={ui} />
          <ChartHighlightCard chart={chart} aspects={rankedAspects.slice(0, 3)} />
          <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="grid gap-4">
              <BalanceCard title="Modality balance" rows={["cardinal", "fixed", "mutable"].map((key) => [titleCase(key), chart.modalityBalance[key as keyof typeof chart.modalityBalance] as number])} note={chart.modalityBalance.meaning} />
              <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Chart sentence</p>
                <p className="mt-3 text-[17px] font-black leading-snug" style={{ color: ASTRO_TEXT }}>{chartSignatureLine(chart, ui)}</p>
              </section>
            </aside>
            <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_AQUA }}>Natal aspects</p>
                  <h2 className="mt-2 font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>Strongest chart patterns</h2>
                </div>
                <span className="rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_GOLD }}>Top {visibleAspects.length}</span>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {visibleAspects.map((aspect) => (
                  <AspectCard key={`${aspect.from}-${aspect.to}-${aspect.type}`} aspect={aspect} />
                ))}
              </div>
              {hiddenAspects.length ? (
                <details className="mt-4 rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
                  <summary className="cursor-pointer text-[13px] font-black" style={{ color: ASTRO_TEXT }}>View all aspects</summary>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {hiddenAspects.map((aspect) => (
                      <AspectCard key={`${aspect.from}-${aspect.to}-${aspect.type}-hidden`} aspect={aspect} />
                    ))}
                  </div>
                </details>
              ) : null}
            </section>
          </section>
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
              <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD }}>Planet placements</p>
              <div className="mt-4 grid gap-3 min-[720px]:grid-cols-2">
                {chart.placements.map((placement) => (
                  <PlacementRow key={placement.body} placement={placement} />
                ))}
              </div>
            </section>
            <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
              <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD }}>House list</p>
              {chart.validation?.partial ? <p className="mt-2 text-[12px] font-semibold" style={{ color: ASTRO_MUTED }}>{partialMessage}</p> : null}
              <div className="mt-4 grid gap-3">
                {chart.houses.slice(0, 12).map((house) => (
                  <article key={house.house} className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: ASTRO_FAINT }}>House {house.house}</p>
                    <p className="mt-1 text-[14px] font-black" style={{ color: ASTRO_TEXT }}>{signLabel(house.sign)}</p>
                    {house.theme ? <p className="mt-1 text-[12px] font-semibold" style={{ color: ASTRO_MUTED }}>{house.theme}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          </section>
        </div>
      </details>
    </section>
  );
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromInputValue(value: string) {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function shiftDateInputValue(value: string, days: number) {
  const date = dateFromInputValue(value);
  date.setDate(date.getDate() + days);
  return formatDateInputValue(date);
}

function buildTransitWindow(rows: NormalizedTransit[], startDate: string) {
  const start = dateFromInputValue(startDate);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const transit = rows[index % rows.length] ?? rows[0]!;
    return { ...transit, timelineDate: formatDateInputValue(date) };
  });
}

function TransitTimelineVisual({ rows, startDate }: { rows: NormalizedTransit[]; startDate: string }) {
  const visible = buildTransitWindow(rows, startDate);
  return (
    <div className="relative min-w-0 overflow-hidden rounded-[8px] border p-3" style={{ background: ASTRO_CHART_PANEL, borderColor: ASTRO_TILE_BORDER }}>
      <div className="absolute left-8 right-8 top-[38px] h-px opacity-80" style={{ background: `linear-gradient(90deg, ${ASTRO_GOLD_BRIGHT}, ${ASTRO_AQUA}, ${ASTRO_ROSE})` }} />
      <div className="relative flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((transit, index) => (
          <div key={`${transit.id}-${transit.timelineDate}`} className="min-h-[128px] w-[132px] shrink-0 rounded-[8px] border p-2.5" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
            <div className="grid h-9 w-9 place-items-center rounded-full text-[12px] font-black" style={{ background: `radial-gradient(circle, ${astroColor(index)}, ${ASTRO_TILE})`, color: ASTRO_BUTTON_TEXT }}>{index + 1}</div>
            <p className="mt-3 line-clamp-2 text-[12px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{transit.title}</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{transit.timelineDate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function transitStrengthPercent(transit: NormalizedTransit | undefined, index = 0) {
  const raw = typeof transit?.strength === "number" ? transit.strength : 72 - index * 8;
  return Math.max(32, Math.min(100, Math.round(raw)));
}

function formatTransitDate(value?: string) {
  if (!value) return "Today";
  return dateFromInputValue(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function TransitSignalGraph({ rows, strongest }: { rows: NormalizedTransit[]; strongest: NormalizedTransit }) {
  const ranked = rows.slice(0, 4);
  return (
    <section className="rounded-[8px] border p-3 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Signal map</p>
          <h3 className="mt-1 truncate font-serif text-[21px] leading-tight" style={{ color: ASTRO_TEXT }}>What matters first</h3>
        </div>
        <span className="rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_AQUA }}>
          Ranked
        </span>
      </div>
      <div className="mt-3 grid gap-2.5">
        {ranked.map((transit, index) => {
          const percent = transitStrengthPercent(transit, index);
          const active = transit.id === strongest.id;
          return (
            <article key={transit.id} className="grid gap-2">
              <div className="grid grid-cols-[22px_minmax(0,1fr)_42px] items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-black" style={{ background: active ? ASTRO_BUTTON : ASTRO_TILE, color: active ? ASTRO_BUTTON_TEXT : ASTRO_MUTED }}>
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-black leading-tight" style={{ color: active ? ASTRO_TEXT_STRONG : ASTRO_TEXT }}>{transit.title}</p>
                  <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: ASTRO_FAINT }}>
                    {formatTransitDate(transit.peakDate ?? transit.startDate)} · {transit.area.slice(0, 2).join(" / ")}
                  </p>
                </div>
                <p className="text-right text-[11px] font-black tabular-nums" style={{ color: astroColor(index) }}>{percent}%</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: ASTRO_INPUT }}>
                <div className="h-full rounded-full" style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${astroColor(index)}, rgba(255,255,255,0.82))` }} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function moonPhaseForDate(value: string) {
  const date = dateFromInputValue(value);
  const knownNewMoon = new Date(2000, 0, 6, 18, 14).getTime();
  const lunarCycle = 29.530588853;
  const days = (date.getTime() - knownNewMoon) / 86400000;
  const age = ((days % lunarCycle) + lunarCycle) % lunarCycle;
  const phaseIndex = Math.floor(((age / lunarCycle) * 8) + 0.5) % 8;
  const phases = [
    { label: "New Moon", note: "Start quietly and set a clean intention." },
    { label: "Waxing Crescent", note: "Build one small proof before pushing harder." },
    { label: "First Quarter", note: "Choose the action that breaks the stall." },
    { label: "Waxing Gibbous", note: "Refine the plan before it becomes public." },
    { label: "Full Moon", note: "Notice what is visible, emotional, or ready to peak." },
    { label: "Waning Gibbous", note: "Share the lesson and keep what still works." },
    { label: "Last Quarter", note: "Release the old pattern before choosing again." },
    { label: "Waning Crescent", note: "Rest, close loops, and let the signal settle." },
  ];
  return {
    ...phases[phaseIndex],
    percent: Math.round((age / lunarCycle) * 100),
  };
}

function TodayDoAvoidCards({ strongest }: { strongest: NormalizedTransit }) {
  const focus = strongest.area[0] ?? strongest.theme[0] ?? "the signal";
  const avoid = `Do not force certainty around ${focus.toLowerCase()}. Let the chart point to the cleaner next question.`;
  return (
    <section className="grid min-w-0 gap-2 min-[720px]:grid-cols-2">
      <article className="min-w-0 rounded-[8px] border p-3" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
        <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_AQUA }}>Do</p>
        <p className="mt-2 text-[13px] font-black leading-snug" style={{ color: ASTRO_TEXT }}>{strongest.action}</p>
      </article>
      <article className="min-w-0 rounded-[8px] border p-3" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
        <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_ROSE }}>Avoid</p>
        <p className="mt-2 text-[13px] font-black leading-snug" style={{ color: ASTRO_TEXT }}>{avoid}</p>
      </article>
    </section>
  );
}

function MoonPhaseTimingCard({ date, strongest }: { date: string; strongest: NormalizedTransit }) {
  const phase = moonPhaseForDate(date);
  return (
    <section className="min-w-0 rounded-[8px] border p-3 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Moon phase</p>
          <h3 className="mt-1 font-serif text-[22px] leading-tight" style={{ color: ASTRO_TEXT }}>{phase.label}</h3>
          <p className="mt-2 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{phase.note}</p>
        </div>
        <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full border" style={{ background: ASTRO_CHART_PANEL, borderColor: ASTRO_TILE_BORDER }}>
          <div className="absolute inset-2 rounded-full" style={{ background: `conic-gradient(${ASTRO_AQUA} ${phase.percent}%, ${ASTRO_INPUT} 0)` }} />
          <div className="relative grid h-12 w-12 place-items-center rounded-full text-[12px] font-black" style={{ background: ASTRO_TILE, color: ASTRO_TEXT }}>
            {phase.percent}%
          </div>
        </div>
      </div>
      <p className="mt-3 rounded-[8px] border px-3 py-2 text-[11px] font-semibold leading-snug" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_MUTED }}>
        Timing lens: {strongest.title}. Moon phase is shown as a reflection cue, not a prediction.
      </p>
    </section>
  );
}

function SevenDayForecastPreview({ rows, startDate }: { rows: NormalizedTransit[]; startDate: string }) {
  const visible = buildTransitWindow(rows, startDate);
  return (
    <section className="min-w-0 rounded-[8px] border p-3 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_AQUA }}>7-day forecast</p>
          <h3 className="mt-1 font-serif text-[21px] leading-tight" style={{ color: ASTRO_TEXT }}>Upcoming signal window</h3>
        </div>
        <span className="rounded-[8px] border px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.1em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_FAINT }}>
          Preview
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((transit, index) => (
          <article key={`${transit.id}-${transit.timelineDate}-preview`} className="min-h-[116px] w-[118px] shrink-0 rounded-[8px] border p-2.5" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
            <p className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: astroColor(index) }}>{formatTransitDate(transit.timelineDate)}</p>
            <p className="mt-2 line-clamp-2 text-[12px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{transit.title}</p>
            <p className="mt-2 line-clamp-2 text-[10px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{transit.area.slice(0, 2).join(" / ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TransitsSection({
  transits,
  previewMode,
  canLoadLive,
  loading,
  error,
  profile,
  date,
  onLoadLive,
  onDateChange,
  onNasaMode,
}: {
  transits: AstroTransitsResponse | null;
  previewMode: boolean;
  canLoadLive: boolean;
  loading: boolean;
  error?: string;
  profile: BirthProfile | null;
  date: string;
  onLoadLive: () => void;
  onDateChange: (date: string) => void;
  onNasaMode: (mode: ServiceMode) => void;
}) {
  const rows: NormalizedTransit[] = transits?.transits?.length ? transits.transits : SAMPLE_TRANSITS;
  const strongest = transits?.strongestTransit ?? rows[0]!;
  const transitWindow = buildTransitWindow(rows, date);
  const selectedDateLabel = dateFromInputValue(date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const strongestStrength = transitStrengthPercent(strongest);
  const sourceLive = transits?.source === "astrologyapi";

  return (
    <section className="grid min-w-0 gap-3">
      <section className="relative min-w-0 overflow-hidden rounded-[8px] border p-3 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_HERO, borderColor: ASTRO_BORDER }}>
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 18% 8%, ${ASTRO_GOLD_BRIGHT}, transparent 26%), radial-gradient(circle at 92% 18%, ${ASTRO_AQUA}, transparent 30%)`, opacity: 0.12 }} />
        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: ASTRO_GOLD_BRIGHT }}>{previewMode ? "Today preview" : "Today timing"}</p>
            <span className="shrink-0 rounded-[8px] border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.11em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: sourceLive ? ASTRO_AQUA : ASTRO_FAINT }}>{transitSourceLabel(transits)}</span>
          </div>
          <h2 className="mt-3 font-serif text-[25px] leading-[1.05]" style={{ color: ASTRO_TEXT_STRONG }}>{strongest.title}</h2>
          <p className="mt-2 text-[13px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{strongest.action}</p>

          <div className="mt-3 grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2">
            <button
              type="button"
              onClick={() => onDateChange(shiftDateInputValue(date, -1))}
              aria-label="Previous transit day"
              className="grid size-10 place-items-center rounded-[8px] border"
              style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}
            >
              <ChevronLeft size={16} />
            </button>
            <label className="flex min-h-10 min-w-0 items-center gap-2 rounded-[8px] border px-3" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}>
              <CalendarDays size={15} style={{ color: ASTRO_GOLD_BRIGHT }} />
              <input
                type="date"
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[13px] font-black outline-none"
                style={{ color: ASTRO_TEXT, colorScheme: "dark" }}
              />
            </label>
            <button
              type="button"
              onClick={() => onDateChange(shiftDateInputValue(date, 1))}
              aria-label="Next transit day"
              className="grid size-10 place-items-center rounded-[8px] border"
              style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_104px] gap-2">
            <div className="min-w-0 rounded-[8px] border px-3 py-2" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
              <p className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>Current window</p>
              <p className="mt-1 truncate text-[13px] font-black" style={{ color: ASTRO_TEXT }}>{selectedDateLabel}</p>
            </div>
            <div className="rounded-[8px] border px-3 py-2 text-right" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
              <p className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>Signal</p>
              <p className="mt-1 text-[17px] font-black tabular-nums" style={{ color: ASTRO_AQUA }}>{strongestStrength}%</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {[...strongest.area, ...strongest.theme].slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-[8px] border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_GOLD_BRIGHT }}>{tag}</span>
            ))}
          </div>

          <div className="mt-3">
            <TodayDoAvoidCards strongest={strongest} />
          </div>

          <button type="button" onClick={onLoadLive} disabled={!canLoadLive || loading} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] px-5 text-[12px] font-black disabled:opacity-45" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
            <RefreshCw size={14} />
            {loading ? "Checking timing..." : sourceLive ? "Refresh live timing" : "Check live timing"}
          </button>
          {error ? <p className="mt-2 text-[12px] font-semibold" style={{ color: ASTRO_ROSE }}>{error}</p> : null}
          {!canLoadLive ? <p className="mt-2 text-[11px] font-semibold" style={{ color: ASTRO_MUTED }}>{liveProfileHint(profile)}</p> : null}
        </div>
      </section>

      <TransitSignalGraph rows={rows} strongest={strongest} />
      <MoonPhaseTimingCard date={date} strongest={strongest} />
      <SevenDayForecastPreview rows={rows} startDate={date} />

      <AstroFoldout eyebrow="Why this matters" title="Evidence behind the timing">
        <p className="text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_TEXT }}>{strongest.why}</p>
        <div className="mt-3 grid gap-2">
          {strongest.evidence.map((item) => (
            <p key={item} className="rounded-[8px] border px-3 py-2 text-[12px] font-semibold" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_MUTED }}>{item}</p>
          ))}
        </div>
      </AstroFoldout>

      <AstroFoldout eyebrow="7-day window" title="Transit path">
        <TransitTimelineVisual rows={rows} startDate={date} />
        <div className="mt-3 grid gap-2">
          {transitWindow.slice(0, 4).map((transit, index) => (
            <article key={`${transit.title}-${transit.timelineDate}`} className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
              <div className="mb-2 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${astroColor(index)}, transparent)` }} />
              <p className="text-[13px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{transit.title}</p>
              <p className="mt-1 text-[11px] font-semibold" style={{ color: ASTRO_MUTED }}>{transit.timelineDate} · {transit.area.join(", ")}</p>
            </article>
          ))}
        </div>
      </AstroFoldout>

      <AstroFoldout eyebrow="Sky visual" title="Real sky today and saved preview">
        <RealSkyTodayCard onModeChange={onNasaMode} />
      </AstroFoldout>
    </section>
  );
}

function BalanceCard({ title, rows, note }: { title: string; rows: Array<[string, number]>; note: string }) {
  const max = Math.max(...rows.map(([, value]) => value), 1);
  const dominant = rows.slice().sort((a, b) => b[1] - a[1])[0];
  return (
    <section className="overflow-hidden rounded-[8px] border p-5 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: ASTRO_GOLD_BRIGHT }}>{title}</p>
          <h3 className="mt-2 font-serif text-[24px] leading-none" style={{ color: ASTRO_TEXT }}>{dominant?.[0] ?? "Pending"}</h3>
        </div>
        <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${rows.map(([label, value], index) => `${balanceColor(label)} ${index * 25}% ${Math.min(100, index * 25 + (value / Math.max(rows.reduce((sum, [, rowValue]) => sum + rowValue, 1), 1)) * 100)}%`).join(", ")}, ${ASTRO_TILE} 0)`, boxShadow: `inset 0 0 0 1px ${ASTRO_TILE_BORDER}` }}>
          <div className="grid h-14 w-14 place-items-center rounded-full text-[18px] font-black" style={{ background: ASTRO_CHART_HEADER, color: ASTRO_TEXT }}>
            {dominant?.[1] ?? 0}
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="flex justify-between text-[12px] font-bold" style={{ color: ASTRO_MUTED }}>
              <span>{label}</span>
              <span>{value}</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full" style={{ background: ASTRO_TILE }}>
              <div className="h-full rounded-full" style={{ width: `${Math.max(12, (value / max) * 100)}%`, background: `linear-gradient(90deg, ${balanceColor(label)}, ${ASTRO_TEXT_STRONG})` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{note}</p>
    </section>
  );
}

function PlacementRow({ placement }: { placement: PlanetPlacement }) {
  return (
    <article className="relative overflow-hidden rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
      <div className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border text-[12px] font-black" style={{ borderColor: ASTRO_BORDER, color: ASTRO_GOLD_BRIGHT, background: ASTRO_TILE }}>{BODY_MARKS[placement.body]}</div>
      <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>{BODY_LABELS[placement.body]} · {placement.house ? `House ${placement.house}` : "House pending"}</p>
      <p className="mt-2 pr-12 font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>{signLabel(placement.sign)}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: ASTRO_TILE }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(16, Math.min(100, ((placement.degree ?? 12) / 30) * 100))}%`, background: `linear-gradient(90deg, ${ASTRO_GOLD_BRIGHT}, ${ASTRO_AQUA})` }} />
      </div>
      <p className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{placement.meaning}</p>
    </article>
  );
}

function AspectCard({ aspect }: { aspect: NatalChart["aspects"][number] }) {
  return (
    <article className="rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-[15px] font-black" style={{ color: ASTRO_TEXT }}>{bodyLabel(aspect.from)} {aspect.type} {bodyLabel(aspect.to)}</p>
        <span className="rounded-full px-2 py-1 text-[10px] font-black" style={{ background: ASTRO_TILE, color: ASTRO_AQUA }}>{aspect.strength ?? "ranked"}</span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className="h-1 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${ASTRO_GOLD_BRIGHT})` }} />
        <CircleDot size={16} style={{ color: ASTRO_ROSE }} />
        <span className="h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${ASTRO_AQUA}, transparent)` }} />
      </div>
      <p className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{aspect.meaning}</p>
      <p className="mt-3 text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>Orb {aspect.orb} · Strength {aspect.strength ?? "ranked"}</p>
    </article>
  );
}

function birthAccuracyStatus(profile: BirthProfile | null) {
  if (!profile) return { label: "No profile", value: "Birth details needed", ready: false };
  const hasTime = Boolean(profile.birthTime);
  const hasPlace = profile.latitude !== undefined && profile.longitude !== undefined;
  const hasTimezone = profile.timezoneOffset !== undefined;
  if (hasTime && hasPlace && hasTimezone) return { label: "High confidence", value: "Rising sign and houses ready", ready: true };
  if (!hasTime) return { label: "Unknown birth time mode", value: "Sun and planets only", ready: false };
  if (!hasPlace || !hasTimezone) return { label: "Place/timezone needed", value: "Houses stay approximate", ready: false };
  return { label: "Partial profile", value: "Chart preview only", ready: false };
}

function BirthDataVisual({ profile }: { profile: BirthProfile | null }) {
  const ready = Boolean(profile?.birthTime && profile.latitude !== undefined && profile.longitude !== undefined && profile.timezoneOffset !== undefined);
  const accuracy = birthAccuracyStatus(profile);
  const facts = [
    { icon: CalendarDays, label: "Date", value: profile?.birthDate ?? "Needed" },
    { icon: Compass, label: "Time", value: profile?.birthTime ?? "Needed" },
    { icon: MapPin, label: "Location", value: profile?.latitude !== undefined && profile.longitude !== undefined ? "Coordinates saved" : "Needed" },
    { icon: Radar, label: "Timezone", value: profile?.timezone ?? (profile?.timezoneOffset !== undefined ? `UTC ${profile.timezoneOffset >= 0 ? "+" : ""}${profile.timezoneOffset}` : "Needed") },
  ];

  return (
    <section className="relative overflow-hidden rounded-[8px] border p-4 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_HERO, borderColor: ASTRO_BORDER }}>
      <div className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-[8px] border" style={{ borderColor: ASTRO_BORDER, background: ASTRO_TILE }}>
        <MapPin size={20} style={{ color: ready ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Birth data</p>
      <h2 className="mt-2 max-w-sm font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>{ready ? "Full chart ready" : "Partial chart mode"}</h2>
      <p className="mt-2 max-w-xl pr-14 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>
        {ready ? "Time, location, and timezone are saved, so rising sign and houses can be calculated." : liveProfileHint(profile)}
      </p>
      <div className="mt-3 rounded-[8px] border px-3 py-2" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
        <p className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: accuracy.ready ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }}>Chart accuracy status</p>
        <p className="mt-1 text-[13px] font-black" style={{ color: ASTRO_TEXT }}>{accuracy.label} · {accuracy.value}</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-[8px] border p-2.5" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}><Icon size={12} /> {label}</p>
            <p className="mt-1 text-[14px] font-black" style={{ color: ASTRO_TEXT }}>{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DataTrustPanel({
  profile,
  chart,
  natalResponse,
  nasaMode,
  gptMode,
}: {
  profile: BirthProfile | null;
  chart: NatalChart | null;
  natalResponse: AstroNatalResponse | null;
  nasaMode: ServiceMode;
  gptMode: ServiceMode;
}) {
  const accuracy = birthAccuracyStatus(profile);
  const lastCalculated = natalResponse?.fetchedAt ?? chart?.calculatedAt;
  const rows = [
    ["Birth date", profile?.birthDate ?? "Needed"],
    ["Birth time", profile?.birthTime ?? "Unknown birth time mode"],
    ["Birth place", profile?.birthPlace ?? "Needed"],
    ["Timezone", profile?.timezone ?? (profile?.timezoneOffset !== undefined ? `UTC ${profile.timezoneOffset >= 0 ? "+" : ""}${profile.timezoneOffset}` : "Needed")],
    ["House system", profile?.birthTime ? "Whole-sign preview" : "Disabled until birth time"],
    ["Zodiac system", "Tropical / Western"],
    ["Calculation source", chartSourceLabel(natalResponse, chart)],
    ["Last calculated", lastCalculated ? new Date(lastCalculated).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Not calculated"],
    ["Saved profiles", profile ? "1 active self profile" : "None yet"],
    ["Privacy controls", "Local profile first, account save after login"],
  ];
  return (
    <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_AQUA }}>Trust center</p>
          <h2 className="mt-1 font-serif text-[22px] leading-tight" style={{ color: ASTRO_TEXT }}>Data, settings, and accuracy</h2>
        </div>
        <span className="shrink-0 rounded-[8px] border px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.1em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: accuracy.ready ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }}>
          {accuracy.label}
        </span>
      </div>
      <p className="mt-2 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>
        If birth time is missing, Hint keeps zodiac signs and planet placements visible but labels rising sign, houses, transits, and pair timing as approximate.
      </p>
      <div className="mt-4 grid gap-2 min-[720px]:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-[8px] border p-2.5" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
            <p className="truncate text-[8px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{label}</p>
            <p className="mt-1 truncate text-[12px] font-black" style={{ color: ASTRO_TEXT }}>{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          ["Sky visual", nasaMode === "Connected" ? "NASA connected" : "Local visual"],
          ["Report copy", gptMode === "Connected" ? "AI ready" : "Curated preview"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[8px] border px-3 py-2" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
            <p className="text-[8px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{label}</p>
            <p className="mt-1 text-[12px] font-black" style={{ color: ASTRO_GOLD_BRIGHT }}>{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BirthSection({
  profile,
  editing,
  setEditing,
  onSave,
  chart,
  natalResponse,
  nasaMode,
  gptMode,
  language,
  ui,
  canPersonalize,
  personalizing,
  liveError,
  onPersonalize,
}: {
  profile: BirthProfile | null;
  editing: boolean;
  setEditing: (value: boolean) => void;
  onSave: (profile: BirthProfileSaveInput) => void;
  chart: NatalChart | null;
  natalResponse: AstroNatalResponse | null;
  nasaMode: ServiceMode;
  gptMode: ServiceMode;
  language: HintLanguage;
  ui: AstrologyUiCopy;
  canPersonalize: boolean;
  personalizing: boolean;
  liveError?: string;
  onPersonalize: () => void;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="grid gap-4">
        <BirthDataVisual profile={profile} />
        <DataTrustPanel profile={profile} chart={chart} natalResponse={natalResponse} nasaMode={nasaMode} gptMode={gptMode} />
        {profile ? <BirthProfileCard profile={profile} onEdit={() => setEditing(true)} /> : null}
        {profile && chart ? (
          <AstroFoldout eyebrow="Chart preview" title="Wheel generated from this data">
            <section className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_AQUA }}>Profile preview</p>
                  <h2 className="mt-1 font-serif text-[22px] leading-tight" style={{ color: ASTRO_TEXT }}>Chart generated from saved data</h2>
                </div>
                <span className="rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_BORDER, color: isLiveNatal(natalResponse) ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }}>
                  {chartSourceLabel(natalResponse, chart)}
                </span>
              </div>
              <ChartGraphPanel chart={chart} language={language} ui={ui} />
              <div className="mt-3">
                <CoreSignatureRail chart={chart} language={language} />
              </div>
              <p className="mt-3 rounded-[8px] border p-3 text-[12px] font-semibold leading-relaxed" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_MUTED }}>
                This chart uses the saved birth profile and the best available sky data. Live astrology data replaces the saved preview automatically when connected.
              </p>
            </section>
          </AstroFoldout>
        ) : null}
        <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Chart readiness</p>
              <h2 className="mt-2 font-serif text-[22px] leading-tight" style={{ color: ASTRO_TEXT }}>Saved profile status</h2>
            </div>
            <span className="rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: natalResponse ? (isLiveNatal(natalResponse) ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT) : ASTRO_FAINT }}>
              {natalResponse ? chartSourceLabel(natalResponse, chart) : "Chart not calculated"}
            </span>
          </div>
          <div className="mt-4 grid gap-2 min-[720px]:grid-cols-2">
            {[
              ["Birth details", profile ? "Saved for this account" : "Add profile details"],
              ["Chart source", chartSourceLabel(natalResponse, chart)],
              ["Chart depth", profile?.birthTime && profile.latitude !== undefined && profile.longitude !== undefined && profile.timezoneOffset !== undefined ? "Rising sign and houses ready" : "Needs time and place"],
              ["Cache state", natalResponse?.cached ? "Loaded from saved chart" : natalResponse ? "Fresh API response" : "No API call yet"],
              ["Sky visual", nasaMode === "Connected" ? "NASA connected" : "Local sky visual"],
              ["Report copy", gptMode === "Connected" ? "AI connected" : "Curated preview"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[8px] border p-2.5" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{label}</p>
                <p className="mt-1 text-[13px] font-black" style={{ color: ASTRO_TEXT }}>{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>Complete profiles unlock the full saved chart: rising sign, houses, transits, together maps, and report previews.</p>
          {natalResponse?.validation?.message ? <p className="mt-3 rounded-[8px] border p-3 text-[12px] font-semibold leading-relaxed" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}>{natalResponse.validation.message}</p> : null}
          {liveError ? <p className="mt-3 rounded-[8px] border p-3 text-[12px] font-semibold leading-relaxed" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_ROSE }}>{liveError}</p> : null}
        </section>
      </div>
      {(editing || !profile) ? (
        <BirthProfileForm
          profile={profile}
          title={profile ? "Edit birth profile" : "Add birth profile"}
          submitLabel={profile ? "Update profile" : "Personalize astrology"}
          onSubmit={(draft) => {
            onSave(draft);
            setEditing(false);
          }}
        />
      ) : (
        <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
          <ShieldCheck size={28} style={{ color: ASTRO_AQUA }} />
          <h2 className="mt-4 font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>Profile is active.</h2>
          <p className="mt-2 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{liveProfileHint(profile)}</p>
          <div className="mt-4 grid gap-2">
            <button type="button" onClick={onPersonalize} disabled={!canPersonalize || personalizing} className="h-10 rounded-[8px] px-5 text-[12px] font-black disabled:opacity-45" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
              {personalizing ? "Calculating chart..." : "Calculate chart"}
            </button>
            <button type="button" onClick={() => setEditing(true)} className="h-10 rounded-[8px] border px-5 text-[12px] font-black" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}>Edit profile</button>
          </div>
        </section>
      )}
    </section>
  );
}

function RelationshipMapVisual({ profileName, partnerName, active }: { profileName: string; partnerName: string; active: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[8px] border p-4" style={{ background: ASTRO_CHART_PANEL, borderColor: ASTRO_TILE_BORDER }}>
      <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: `linear-gradient(115deg, ${ASTRO_TILE}, transparent 34%, ${ASTRO_PREMIUM_INNER} 70%, transparent)` }} />
      <div className="relative grid min-h-[188px] grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border text-center" style={{ background: `radial-gradient(circle, ${ASTRO_TILE}, ${ASTRO_CHART_HEADER} 70%)`, borderColor: ASTRO_BORDER }}>
          <div>
            <UserRound className="mx-auto" size={18} style={{ color: ASTRO_GOLD_BRIGHT }} />
            <p className="mt-2 px-2 text-[11px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{profileName}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>Chart A</p>
          </div>
        </div>
        <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-full border" style={{ background: `radial-gradient(circle, ${ASTRO_TILE}, ${ASTRO_CHART_HEADER})`, borderColor: active ? ASTRO_AQUA : ASTRO_BORDER }}>
          <span className="absolute -left-10 top-1/2 h-px w-10 -translate-y-1/2" style={{ background: `linear-gradient(90deg, transparent, ${ASTRO_GOLD_BRIGHT})` }} />
          <span className="absolute -right-10 top-1/2 h-px w-10 -translate-y-1/2" style={{ background: `linear-gradient(90deg, ${ASTRO_AQUA}, transparent)` }} />
          <HeartHandshake size={23} style={{ color: active ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }} />
        </div>
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border text-center" style={{ background: `radial-gradient(circle, ${ASTRO_TILE}, ${ASTRO_CHART_HEADER} 70%)`, borderColor: ASTRO_ROSE }}>
          <div>
            <UserRound className="mx-auto" size={18} style={{ color: ASTRO_ROSE }} />
            <p className="mt-2 px-2 text-[11px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{partnerName || "Partner"}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>Chart B</p>
          </div>
        </div>
      </div>
      <div className="relative mt-3 grid grid-cols-3 gap-1.5">
        {[
          ["Comfort", ASTRO_GOLD_BRIGHT],
          ["Growth", ASTRO_AQUA],
          ["Tension", ASTRO_ROSE],
        ].map(([label, color]) => (
          <div key={label} className="min-w-0 rounded-[8px] border px-2 py-2" style={{ background: ASTRO_INPUT, borderColor: ASTRO_TILE_BORDER }}>
            <div className="mb-2 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
            <p className="truncate text-[9px] font-black uppercase tracking-[0.1em]" style={{ color: ASTRO_FAINT }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function pairModuleItems(summary?: AstroSynastryResponse["summary"]): AstroModuleItem[] {
  return [
    {
      label: "Synastry preview",
      value: summary ? "Generated" : "Needs partner",
      note: "How two natal charts touch each other by aspect.",
      color: ASTRO_AQUA,
    },
    {
      label: "Composite preview",
      value: "Shared pattern",
      note: "A future layer for reading the relationship as one space.",
      color: "var(--astro-lavender)",
    },
    {
      label: "Comfort",
      value: summary ? "Mapped" : "Conversation cue",
      note: summary?.comfort ?? "Where the connection feels easier and safer.",
      color: ASTRO_GOLD_BRIGHT,
    },
    {
      label: "Tension",
      value: summary ? "Mapped" : "Useful friction",
      note: summary?.tension ?? "Where needs should be named before they become tests.",
      color: ASTRO_ROSE,
    },
    {
      label: "Communication",
      value: summary ? "Mapped" : "Ask directly",
      note: summary?.communication ?? "How to talk without guessing the hidden meaning.",
      color: BODY_COLORS.mercury,
    },
    {
      label: "Pair timing",
      value: "Optional",
      note: "Current transits can explain timing after both profiles are present.",
      color: ASTRO_AQUA,
    },
  ];
}

function compatibilityBirthProfile(profile: BirthProfile) {
  return {
    userId: profile.id,
    name: profile.name,
    birthday: profile.birthDate,
    birthTime: profile.birthTime,
    birthCity: profile.birthPlace,
    latitude: profile.latitude,
    longitude: profile.longitude,
    timezone: profile.timezone ?? profile.timezoneOffset,
  };
}

function TogetherSection({ relationship, previewMode, profile }: { relationship: RelationshipAstrology; previewMode: boolean; profile: BirthProfile | null }) {
  const [partner, setPartner] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    latitude: "",
    longitude: "",
    timezone: "America/Phoenix",
    timezoneOffset: "-7",
  });
  const [synastry, setSynastry] = useState<AstroSynastryResponse | null>(null);
  const [synastryLoading, setSynastryLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [partnerConsent, setPartnerConsent] = useState(false);
  const [partnerPlaceResults, setPartnerPlaceResults] = useState<AstroGeoPlace[]>([]);
  const [partnerPlaceLoading, setPartnerPlaceLoading] = useState(false);
  const [partnerPlaceMode, setPartnerPlaceMode] = useState<"live" | "fallback" | null>(null);
  const [partnerError, setPartnerError] = useState("");
  const themes = [
    ["Comfort", "Warmth grows when both people have room to move at a human pace."],
    ["Tension", "The useful friction is naming needs before they become tests."],
    ["Communication", "Clear words matter more than guessing the hidden meaning."],
    ["Growth", "The relationship improves when both people stay curious instead of scoring the chart."],
  ];
  const summary = synastry?.summary;
  const profileReadyForSynastry = Boolean(profile?.birthTime && profile.latitude !== undefined && profile.longitude !== undefined && profile.timezoneOffset !== undefined);
  const partnerReady = Boolean(
    profileReadyForSynastry &&
      partner.name.trim() &&
      partner.birthDate &&
      partner.birthTime &&
      partner.birthPlace.trim() &&
      partner.latitude.trim() &&
      partner.longitude.trim() &&
      partner.timezoneOffset.trim() &&
      partnerConsent,
  );

  function updatePartner(key: keyof typeof partner, value: string) {
    setPartner((current) => ({ ...current, [key]: value }));
  }

  async function searchPartnerPlace() {
    const query = partner.birthPlace.trim();
    if (!query) return;
    setPartnerPlaceLoading(true);
    setPartnerError("");
    try {
      const response = await getGeoDetails(query, 6);
      setPartnerPlaceResults(response.results);
      setPartnerPlaceMode(response.mode);
      if (!response.results.length) setPartnerError("No matching place found. You can still use Advanced.");
    } catch {
      setPartnerPlaceResults([]);
      setPartnerPlaceMode(null);
      setPartnerError("Location lookup is unavailable. You can still use Advanced.");
    } finally {
      setPartnerPlaceLoading(false);
    }
  }

  async function selectPartnerPlace(place: AstroGeoPlace) {
    const label = place.label ?? [place.name, place.region, place.country].filter(Boolean).join(", ");
    setPartner((current) => ({
      ...current,
      birthPlace: label || place.name,
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      timezone: place.timezoneId ?? place.timezone ?? current.timezone,
      timezoneOffset: typeof place.timezoneOffset === "number" ? String(place.timezoneOffset) : current.timezoneOffset,
    }));
    try {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(partner.birthDate) ? partner.birthDate : new Date().toISOString().slice(0, 10);
      const timezone = await getTimezoneDetails(place.latitude, place.longitude, date);
      setPartner((current) => ({
        ...current,
        timezone: timezone.timezoneId ?? place.timezoneId ?? place.timezone ?? current.timezone,
        timezoneOffset: typeof timezone.timezoneOffset === "number" ? String(timezone.timezoneOffset) : current.timezoneOffset,
      }));
    } catch {
      // Coordinates still improve the local relationship map if timezone lookup fails.
    }
  }

  async function createRelationshipMap() {
    if (!partnerReady || !profile) return;
    setSynastryLoading(true);
    setPartnerError("");
    const numeric = (value: string) => {
      const next = Number(value);
      return Number.isFinite(next) ? next : undefined;
    };
    const partnerProfile: BirthProfile = {
      id: `partner-${partner.name}-${partner.birthDate}`,
      name: partner.name,
      birthDate: partner.birthDate,
      birthTime: partner.birthTime || undefined,
      birthPlace: partner.birthPlace,
      latitude: numeric(partner.latitude),
      longitude: numeric(partner.longitude),
      timezone: partner.timezone || undefined,
      timezoneOffset: numeric(partner.timezoneOffset),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = await getSynastry(profile, partnerProfile).catch(() => null);
    if (!next) setPartnerError("Could not create the relationship map right now.");
    setSynastry(next);
    setSynastryLoading(false);
  }

  async function createInviteLink() {
    if (!profile) return;
    setInviteLoading(true);
    setInviteError("");
    setCopiedInvite(false);
    try {
      const response = await fetch(apiUrl("/api/compatibility/invite"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          createdByUserId: profile.id,
          relationshipType: "unclear",
          birthProfile: compatibilityBirthProfile(profile),
        }),
      });
      if (!response.ok) throw new Error("Could not create invite link.");
      const invite = (await response.json()) as CompatibilityInviteResponse;
      setInviteUrl(`${window.location.origin}/compatibility/invite/${invite.token}`);
      setInviteExpiresAt(invite.expiresAt);
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Could not create invite link.");
    } finally {
      setInviteLoading(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteUrl) return;
    await navigator.clipboard?.writeText(inviteUrl);
    setCopiedInvite(true);
  }

  async function shareInviteLink() {
    if (!inviteUrl) return;
    if (navigator.share) {
      await navigator.share({ title: "Hint shared chart invite", url: inviteUrl }).catch(() => undefined);
      return;
    }
    await copyInviteLink();
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[8px] border p-4 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_HERO, borderColor: ASTRO_BORDER }}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="inline-flex items-center gap-2 font-sans text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: ASTRO_GOLD_BRIGHT }}><HeartHandshake size={14} /> Together</p>
          {previewMode ? <span className="rounded-[8px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_FAINT }}>Preview map</span> : null}
        </div>
        <h2 className="mt-3 font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>The Space Between You</h2>
        <p className="mt-2 max-w-2xl rounded-[8px] border px-3 py-2.5 text-[13px] font-semibold leading-relaxed" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_MUTED }}>{relationship.spaceBetween}</p>
        <div className="mt-4">
          <RelationshipMapVisual profileName={profile?.name ?? "You"} partnerName={partner.name} active={Boolean(summary)} />
        </div>
        <div className="mt-4">
          <AstroModuleMap eyebrow="Pair system" title="Consent-first relationship map" items={pairModuleItems(summary)} />
        </div>
        <p className="mt-3 rounded-[8px] border px-3 py-2.5 text-[12px] font-semibold leading-snug" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_MUTED }}>
          Use signs as conversation prompts, not fixed judgments. Pair readings should make better questions, not rank the relationship.
        </p>
        <div className="mt-4 grid gap-2 min-[720px]:grid-cols-2">
          {relationship.highlights.slice(0, 2).map((item) => (
            <p key={item} className="rounded-[8px] border p-3 text-[12px] font-semibold leading-snug" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}>{item}</p>
          ))}
        </div>
        <div className="mt-4">
          <AstroFoldout eyebrow="Pair details" title="Comfort, tension, communication">
            <div className="grid gap-2.5 min-[720px]:grid-cols-2">
              {(summary
                ? [
                    ["Comfort", summary.comfort],
                    ["Tension", summary.tension],
                    ["Communication", summary.communication],
                    ["Attraction", summary.attraction],
                    ["Growth", summary.growth],
                  ]
                : themes
              ).map(([label, copy]) => (
                <article key={label} className="rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
                  <div className="mb-3 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${balanceColor(label)}, transparent)` }} />
                  <p className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>{label}</p>
                  <p className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_TEXT }}>{copy}</p>
                </article>
              ))}
            </div>
          </AstroFoldout>
        </div>
        {synastry ? (
          <section className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
              <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: ASTRO_GOLD_BRIGHT }}>
                <CheckCircle2 size={14} />
                Synastry receipts
              </p>
              <div className="mt-3 grid gap-2">
                {synastry.aspects.slice(0, 5).map((aspect, index) => (
                  <article key={`${aspect.from}-${aspect.to}-${aspect.type}-${index}`} className="rounded-[8px] border px-3 py-3" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
                    <p className="text-[13px] font-black" style={{ color: ASTRO_TEXT }}>{aspect.from} {aspect.type} {aspect.to}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{aspect.tier}</p>
                    <p className="mt-2 text-[12px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{aspect.meaning}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="rounded-[8px] border p-4" style={{ background: ASTRO_LOCKED, borderColor: ASTRO_BORDER }}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: ASTRO_FAINT }}>Space Between You card</p>
              <h3 className="mt-2 font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>{profile?.name ?? "You"} + {partner.name || "Partner"}</h3>
              <p className="mt-3 text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{synastry.plainEnglish.main}</p>
              <p className="mt-3 rounded-[8px] border p-3 text-[12px] font-black" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_GOLD_BRIGHT }}>
                {synastry.source === "astrologyapi" ? "Live synastry" : "Synastry preview"}
              </p>
            </div>
          </section>
        ) : null}
      </div>
      <aside className="min-w-0">
        <AstroFoldout eyebrow="Partner data" title="Invite or enter partner details">
          <section className="rounded-[8px] border p-4" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[8px] border" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
                <Link2 size={20} style={{ color: ASTRO_GOLD }} />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>Consent first</p>
                <h2 className="font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>Invite them in</h2>
              </div>
            </div>
            <p className="mt-3 text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>Send a private web link. They add their own birth details and consent before the shared chart opens.</p>
            {profile ? (
              <div className="mt-4 grid gap-3">
            <div className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
              <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>Your side</p>
              <p className="mt-1 text-[14px] font-black" style={{ color: ASTRO_TEXT }}>{profile.name}</p>
              <p className="mt-1 text-[12px] font-semibold" style={{ color: ASTRO_MUTED }}>{profile.birthDate} · {profile.birthPlace}</p>
            </div>
            <button type="button" onClick={createInviteLink} disabled={inviteLoading} className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] px-5 text-[13px] font-black transition-[transform,opacity] duration-200 hover:-translate-y-0.5 disabled:opacity-50" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
              <Link2 size={15} />
              {inviteLoading ? "Creating..." : inviteUrl ? "Create another invite" : "Create web invite"}
            </button>
            {inviteError ? <p className="rounded-[8px] border p-3 text-[12px] font-semibold" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_ROSE }}>{inviteError}</p> : null}
            {inviteUrl ? (
              <div className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>Invite link</p>
                <code className="mt-2 block break-all rounded-[8px] border px-3 py-2 text-[12px] font-semibold" style={{ background: ASTRO_INPUT, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}>{inviteUrl}</code>
                {inviteExpiresAt ? <p className="mt-2 text-[11px] font-bold" style={{ color: ASTRO_MUTED }}>Expires {new Date(inviteExpiresAt).toLocaleDateString()}</p> : null}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={copyInviteLink} className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border text-[12px] font-black" style={{ background: ASTRO_TILE, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}>
                    <Copy size={14} />
                    {copiedInvite ? "Copied" : "Copy"}
                  </button>
                  <button type="button" onClick={shareInviteLink} className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border text-[12px] font-black" style={{ background: ASTRO_TILE, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}>
                    <ExternalLink size={14} />
                    Share
                  </button>
                </div>
              </div>
            ) : null}
            <section className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
              <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>Partner profile</p>
              <div className="mt-3 grid gap-2">
                <input value={partner.name} onChange={(event) => updatePartner("name", event.target.value)} placeholder="Partner name" className="astro-themed-input h-10 rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} />
                <input value={partner.birthDate} onChange={(event) => updatePartner("birthDate", event.target.value)} placeholder="YYYY-MM-DD" className="astro-themed-input h-10 rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} />
                <input value={partner.birthTime} onChange={(event) => updatePartner("birthTime", event.target.value)} placeholder="Birth time" inputMode="numeric" className="astro-themed-input h-10 rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} />
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input value={partner.birthPlace} onChange={(event) => updatePartner("birthPlace", event.target.value)} placeholder="Birth place" className="astro-themed-input h-10 rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} />
                  <button type="button" onClick={() => void searchPartnerPlace()} disabled={partnerPlaceLoading || !partner.birthPlace.trim()} className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border px-3 text-[12px] font-black disabled:opacity-50" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}>
                    <Search size={13} />
                    {partnerPlaceLoading ? "Finding..." : "Find"}
                  </button>
                </div>
                {partnerPlaceMode ? <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_MUTED }}>{partnerPlaceMode === "live" ? "AstrologyAPI place match" : "Saved place match"}</p> : null}
                {partnerPlaceResults.length ? (
                  <div className="grid gap-2">
                    {partnerPlaceResults.map((place) => {
                      const label = place.label ?? [place.name, place.region, place.country].filter(Boolean).join(", ");
                      return (
                        <button key={`${place.name}-${place.latitude}-${place.longitude}`} type="button" onClick={() => void selectPartnerPlace(place)} className="rounded-[8px] border px-3 py-2 text-left" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}>
                          <span className="block text-[12px] font-black">{label || place.name}</span>
                          <span className="mt-1 block text-[10px] font-semibold" style={{ color: ASTRO_MUTED }}>
                            {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                            {typeof place.timezoneOffset === "number" ? ` · UTC ${place.timezoneOffset >= 0 ? "+" : ""}${place.timezoneOffset}` : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <label className="flex gap-3 rounded-[8px] border p-3 text-[12px] font-semibold leading-relaxed" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_MUTED }}>
                  <input type="checkbox" checked={partnerConsent} onChange={(event) => setPartnerConsent(event.target.checked)} className="mt-1 size-4" />
                  I have consent to use these details for this relationship preview.
                </label>
                <details className="rounded-[8px] border p-3" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
                  <summary className="cursor-pointer text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>Advanced</summary>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <input value={partner.latitude} onChange={(event) => updatePartner("latitude", event.target.value)} placeholder="Latitude" className="astro-themed-input h-10 rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} />
                    <input value={partner.longitude} onChange={(event) => updatePartner("longitude", event.target.value)} placeholder="Longitude" className="astro-themed-input h-10 rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} />
                    <input value={partner.timezone} onChange={(event) => updatePartner("timezone", event.target.value)} placeholder="Timezone" className="astro-themed-input h-10 rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} />
                    <input value={partner.timezoneOffset} onChange={(event) => updatePartner("timezoneOffset", event.target.value)} placeholder="UTC offset" className="astro-themed-input h-10 rounded-[8px] border px-3 text-[13px] font-semibold outline-none" style={{ background: ASTRO_INPUT, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }} />
                  </div>
                </details>
                {partnerError ? <p className="rounded-[8px] border p-3 text-[12px] font-semibold" style={{ background: ASTRO_TILE, borderColor: ASTRO_BORDER, color: ASTRO_ROSE }}>{partnerError}</p> : null}
                <button type="button" onClick={createRelationshipMap} disabled={!partnerReady || synastryLoading} className="h-11 rounded-[8px] px-5 text-[13px] font-black transition-[transform,opacity] duration-200 hover:-translate-y-0.5 disabled:opacity-45" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>{synastryLoading ? "Creating..." : "Create relationship map"}</button>
              </div>
            </section>
              </div>
            ) : (
              <div className="mt-5 rounded-[8px] border p-4 text-[13px] font-semibold leading-relaxed" style={{ background: ASTRO_TILE, borderColor: ASTRO_BORDER, color: ASTRO_MUTED }}>
                Sample preview is active. Save your profile to create a web invite.
              </div>
            )}
          </section>
        </AstroFoldout>
      </aside>
    </section>
  );
}

function ReportsSection({
  reports,
  previewBulletsByReport,
  gptMode,
  gptLoading,
  gptError,
  onGeneratePreview,
}: {
  reports: AstrologyReport[];
  previewBulletsByReport: Record<string, string[]>;
  gptMode: ServiceMode;
  gptLoading: boolean;
  gptError?: string;
  onGeneratePreview: () => void;
}) {
  const fallbackBullets = ["Chart evidence first", "Plain-English timing", "Reflection, not certainty"];
  const reportLenses = ["Chart", "Love", "Career", "Money", "Year", "Timing"];
  const bulletsFor = (report: AstrologyReport) => {
    const generated = previewBulletsByReport[report.id] ?? [];
    const curated = report.previewBullets ?? fallbackBullets;
    return [...generated, ...curated.filter((bullet) => !generated.includes(bullet))].slice(0, 3);
  };

  return (
    <section className="grid gap-3">
      <div className="overflow-hidden rounded-[20px] border p-3 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 font-sans text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD_BRIGHT }}><FileText size={13} /> Reports</p>
            <h2 className="mt-1 font-serif text-[28px] leading-tight" style={{ color: ASTRO_TEXT }}>Deep reading library</h2>
            <p className="mt-2 line-clamp-3 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>Each report starts as a short summary. Long-form sections open when someone asks Hint or spends a token.</p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-[16px] border" style={{ background: ASTRO_LOCKED, borderColor: ASTRO_TILE_BORDER }}>
            <FileText size={22} style={{ color: ASTRO_GOLD_BRIGHT }} />
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <span className="truncate rounded-full border px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.1em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_GOLD_BRIGHT }}>
            {reports.length} modules
          </span>
          <span className="truncate rounded-full border px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.1em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_AQUA }}>
            Summary first
          </span>
          <span className="truncate rounded-full border px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.1em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: gptMode === "Connected" ? ASTRO_AQUA : ASTRO_FAINT }}>
            {gptMode === "Connected" ? "AI ready" : "Curated"}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {reportLenses.map((lens, index) => (
            <span key={lens} className="truncate rounded-full border px-2 py-1.5 text-center text-[8px] font-black uppercase tracking-[0.1em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: astroColor(index) }}>
              {lens}
            </span>
          ))}
        </div>
        <button type="button" onClick={onGeneratePreview} disabled={gptLoading} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[14px] px-5 text-[12px] font-black disabled:opacity-45" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
          <Sparkles size={15} />
          {gptLoading ? "Preparing preview..." : "Ask Hint for preview"}
        </button>
        {gptError ? <p className="mt-2 text-[12px] font-semibold" style={{ color: ASTRO_ROSE }}>{gptError}</p> : null}
      </div>
      <div className="grid gap-2">
        {reports.map((report, index) => {
          const bullets = bulletsFor(report);
          return (
            <article key={report.id} className="relative overflow-hidden rounded-[18px] border p-3 transition-[transform,opacity] duration-200 active:scale-[0.99]" style={{ background: ASTRO_LOCKED, borderColor: ASTRO_BORDER }}>
              <div className="absolute bottom-0 left-0 top-0 w-1" style={{ background: `linear-gradient(180deg, ${astroColor(index)}, transparent)` }} />
              <div className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-[14px] border" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
                  <FileText size={18} style={{ color: astroColor(index) }} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{report.title}</p>
                  <p className="mt-1 line-clamp-1 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{report.subtitle}</p>
                </div>
                <span className="rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: report.status === "available" ? ASTRO_AQUA : ASTRO_GOLD }}>
                {report.status === "available" ? "Ready" : "Preview"}
                </span>
              </div>
              <div className="mt-3 grid gap-1.5">
                {bullets.slice(0, 3).map((bullet) => (
                  <p key={`${report.id}-${bullet}`} className="flex gap-2 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_TEXT }}>
                    <span style={{ color: astroColor(index) }}>•</span>
                    <span className="line-clamp-1">{bullet}</span>
                  </p>
                ))}
              </div>
              <details className="mt-3 rounded-[14px] border px-3 py-2" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
                <summary className="cursor-pointer text-[12px] font-black" style={{ color: ASTRO_TEXT }}>
                  <span className="inline-flex items-center gap-2"><LockKeyhole size={13} /> Summary and unlock path</span>
                </summary>
                <p className="mt-3 text-[12px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{report.unlockHint}</p>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {["Ask preview", "View summary", "Unlock full"].map((label, actionIndex) => (
                    <button
                      key={`${report.id}-${label}`}
                      type="button"
                      className="min-h-9 rounded-[8px] border px-1.5 text-[9px] font-black uppercase tracking-[0.08em]"
                      style={{
                        background: actionIndex === 0 ? ASTRO_BUTTON : ASTRO_TILE,
                        borderColor: ASTRO_TILE_BORDER,
                        color: actionIndex === 0 ? ASTRO_BUTTON_TEXT : actionIndex === 2 ? ASTRO_GOLD_BRIGHT : ASTRO_TEXT,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function AstrologyView() {
  const { language } = useLanguage();
  const ui = uiCopy(language);
  const [activeTab, setActiveTab] = useState<AstrologyTab>(() => readInitialAstrologyTab());
  const [profile, setProfile] = useLocalBirthProfile();
  const account = useLocalAccount();
  const { anonId, profile: accountProfile, saveProfile } = useProfile();
  const [editingProfile, setEditingProfile] = useState(false);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [savedNatalRecord, setSavedNatalRecord] = useState<SavedNatalChartRecord | null>(null);
  const [natalResponse, setNatalResponse] = useState<AstroNatalResponse | null>(null);
  const [transits, setTransits] = useState<AstroTransitsResponse | null>(null);
  const [transitDate, setTransitDate] = useState(() => formatDateInputValue(new Date()));
  const [personalizing, setPersonalizing] = useState(false);
  const [transitLoading, setTransitLoading] = useState(false);
  const [liveError, setLiveError] = useState("");
  const [transitError, setTransitError] = useState("");
  const [nasaMode, setNasaMode] = useState<ServiceMode>("Fallback");
  const [reportRequestId, setReportRequestId] = useState(0);
  const autoNatalKeyRef = useRef<string | null>(null);
  const autoLiveUpgradeKeyRef = useRef<string | null>(null);
  const autoTransitKeyRef = useRef<string | null>(null);
  const backendState = useAstroBackendStatus();
  const { relationship, reports } = useAstrologyData(profile);
  const previewChart = useMemo(() => (profile ? buildMockNatalChart(profile) : SAMPLE_CHART), [profile?.id, profile?.birthDate, profile?.birthTime, profile?.birthPlace, profile?.latitude, profile?.longitude, profile?.timezone, profile?.timezoneOffset, profile?.updatedAt]);
  const activeChart = chart ?? savedNatalRecord?.chart ?? previewChart;
  const activeRelationship = relationship ?? SAMPLE_RELATIONSHIP;
  const activeReports = reports.length ? reports : MOCK_ASTROLOGY_REPORTS;
  const reportPreview = useReportPreviewBullets(reportRequestId, activeReports, activeChart);
  const activeNatalResponse = natalResponse ?? savedNatalRecord?.natalResponse ?? null;
  const hasSavedChart = Boolean(chart || savedNatalRecord?.chart);
  const previewMode = !hasSavedChart;
  const canPersonalize = liveProfileReady(profile);

  useEffect(() => {
    const saved = readSavedNatalChart(account, anonId, profile);
    setSavedNatalRecord(saved);
    setChart(null);
    setNatalResponse(saved?.natalResponse ?? null);
    setTransits(null);
    setLiveError("");
    setTransitError("");
    setReportRequestId(0);
  }, [account?.identifier, anonId, profile?.id, profile?.updatedAt]);

  useEffect(() => {
    if (!account || profile || !accountProfile?.birthDate || !accountProfile.birthPlace) return;
    const next = saveBirthProfileFromAccountProfile(accountProfile, anonId);
    if (next) setProfile(next);
  }, [account, accountProfile, anonId, profile, setProfile]);

  useEffect(() => {
    if (!account || !profile || !canPersonalize || hasSavedChart) return;
    if (readSavedNatalChart(account, anonId, profile)) return;
    const key = `${profile.id}:${profile.updatedAt}:natal`;
    if (autoNatalKeyRef.current === key) return;
    autoNatalKeyRef.current = key;
    void handlePersonalizeLiveData();
  }, [account, anonId, canPersonalize, hasSavedChart, profile]);

  useEffect(() => {
    if (!account || !profile || !canPersonalize || !hasSavedChart || personalizing) return;
    if (!backendState.online || !backendState.status.astrology.configured) return;
    if (isLiveNatal(activeNatalResponse)) return;
    const key = `${account.identifier}:${profile.id}:${profile.updatedAt}:live-upgrade`;
    if (autoLiveUpgradeKeyRef.current === key) return;
    autoLiveUpgradeKeyRef.current = key;
    void handlePersonalizeLiveData();
  }, [
    account?.identifier,
    activeNatalResponse?.mode,
    activeNatalResponse?.source,
    backendState.online,
    backendState.status.astrology.configured,
    canPersonalize,
    hasSavedChart,
    personalizing,
    profile?.id,
    profile?.updatedAt,
  ]);

  useEffect(() => {
    if (!account || !profile || !canPersonalize || !hasSavedChart) return;
    const key = `${profile.id}:${profile.updatedAt}:${transitDate}:transits`;
    if (autoTransitKeyRef.current === key) return;
    autoTransitKeyRef.current = key;
    void handleLoadLiveTransits();
  }, [account?.identifier, canPersonalize, hasSavedChart, profile?.id, profile?.updatedAt, transitDate]);

  function handleTabChange(tab: AstrologyTab) {
    setActiveTab(tab);
    writeAstrologyTab(tab);
  }

  function handleSaveProfile(input: BirthProfileSaveInput) {
    if (!account) {
      setLiveError("Log in first so Hint can save birth details and the chart to your account.");
      return;
    }
    const numeric = (value: unknown) => {
      const next = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
      return Number.isFinite(next) ? next : undefined;
    };
    const next = saveBirthProfile({
      ...input,
      latitude: numeric(input.latitude),
      longitude: numeric(input.longitude),
      timezoneOffset: numeric(input.timezoneOffset),
    });
    void saveProfile({
      name: next.name,
      birthDate: next.birthDate,
      birthTime: next.birthTime,
      birthPlace: next.birthPlace,
    });
    setProfile(next);
    setActiveTab("chart");
    writeAstrologyTab("chart");
  }

  function handleTransitDateChange(nextDate: string) {
    setTransitDate(nextDate || formatDateInputValue(new Date()));
    setTransits(null);
    setTransitError("");
  }

  async function handlePersonalizeLiveData() {
    if (!account) {
      setLiveError("Log in first so Hint can save this astrology chart to the account.");
      return;
    }
    if (!profile || !canPersonalize) {
      setLiveError(liveProfileHint(profile));
      return;
    }
    setPersonalizing(true);
    setLiveError("");
    try {
      const nextNatal = await getNatalChart(profile);
      const nextChart = normalizeClientNatal(profile, nextNatal);
      if (!nextChart) {
        const fallbackChart = buildMockNatalChart(profile);
        const fallbackNatal = buildFallbackNatalResponse(profile, fallbackChart);
        setLiveError("Live chart response was incomplete, so Hint saved a local chart preview instead.");
        setNatalResponse(fallbackNatal);
        setChart(fallbackChart);
        setSavedNatalRecord({
          accountKey: accountStorageKey(account, anonId),
          profileId: profile.id,
          profileUpdatedAt: profile.updatedAt,
          chart: fallbackChart,
          natalResponse: fallbackNatal,
          savedAt: new Date().toISOString(),
        });
        writeSavedNatalChart(account, anonId, profile, fallbackChart, fallbackNatal);
        return;
      }
      setNatalResponse(nextNatal);
      setChart(nextChart);
      setSavedNatalRecord({
        accountKey: accountStorageKey(account, anonId),
        profileId: profile.id,
        profileUpdatedAt: profile.updatedAt,
        chart: nextChart,
        natalResponse: nextNatal,
        savedAt: new Date().toISOString(),
      });
      writeSavedNatalChart(account, anonId, profile, nextChart, nextNatal);
    } catch {
      const fallbackChart = buildMockNatalChart(profile);
      const fallbackNatal = buildFallbackNatalResponse(profile, fallbackChart);
      setLiveError("Live chart is unavailable right now. Hint saved a local preview so the page still works.");
      setNatalResponse(fallbackNatal);
      setChart(fallbackChart);
      setSavedNatalRecord({
        accountKey: accountStorageKey(account, anonId),
        profileId: profile.id,
        profileUpdatedAt: profile.updatedAt,
        chart: fallbackChart,
        natalResponse: fallbackNatal,
        savedAt: new Date().toISOString(),
      });
      writeSavedNatalChart(account, anonId, profile, fallbackChart, fallbackNatal);
    } finally {
      setPersonalizing(false);
    }
  }

  async function handleLoadLiveTransits() {
    if (!account) {
      setTransitError("Log in first so transit checks stay attached to the saved chart.");
      return;
    }
    if (!profile || !canPersonalize) {
      setTransitError(liveProfileHint(profile));
      return;
    }
    setTransitLoading(true);
    setTransitError("");
    try {
      const nextTransits = await getTransits(profile, transitDate);
      setTransits(nextTransits);
    } catch {
      setTransitError("Live timing is unavailable right now. Saved preview guidance remains visible.");
      setTransits(null);
    } finally {
      setTransitLoading(false);
    }
  }

  const statusRow = (
    account ? (
      <DataStatusRow
        hasProfile={Boolean(profile)}
        hasSavedChart={hasSavedChart}
        natalResponse={activeNatalResponse}
      />
    ) : null
  );

  const chartGate = (
    <AstrologyAccessGate
      account={account}
      profile={profile}
      hasSavedChart={hasSavedChart}
      activeTab={activeTab}
      canPersonalize={canPersonalize}
      personalizing={personalizing}
      liveError={liveError}
      onAddProfile={() => handleTabChange("birth")}
      onPersonalize={() => void handlePersonalizeLiveData()}
    />
  );
  const showReadingChrome = false;
  const showSetupMap = false;
  const showSetupStatus = false;
  const showGuidedCard = false;

  return (
    <div
      className="hint-astrology-home relative h-full w-full overflow-y-auto overscroll-none pb-[calc(7.25rem+var(--hint-safe-bottom))]"
      style={ASTROLOGY_HOME_STYLE}
    >
      <AstrologyHomeBackdrop />
      <div className="relative z-10 mx-auto grid w-full max-w-[var(--hint-app-width)] gap-3 px-4 pt-[calc(0.75rem+var(--hint-safe-top))]">
        <div
          className="sticky z-40 grid gap-1.5 rounded-[16px] border px-0 py-1.5"
          style={{
            top: "calc(0.35rem + var(--hint-safe-top))",
            background: "color-mix(in srgb, var(--hint-control-bg-strong) 72%, transparent)",
            borderColor: "transparent",
            boxShadow: "none",
            backdropFilter: "blur(18px) saturate(1.12)",
            WebkitBackdropFilter: "blur(18px) saturate(1.12)",
          }}
        >
          <AstrologyTopBar
            account={account}
            profile={profile}
            chart={activeChart}
            hasSavedChart={hasSavedChart}
            activeTab={activeTab}
            language={language}
            ui={ui}
            onEditProfile={() => handleTabChange("birth")}
          />
          <TopTabs activeTab={activeTab} onChange={handleTabChange} />
        </div>
        {showReadingChrome ? (
          <AstrologyAppSummary
            account={account}
            chart={activeChart}
            profile={profile}
            hasSavedChart={hasSavedChart}
            language={language}
            ui={ui}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        ) : null}
        {showSetupMap ? (
          <AstrologyMapOverview
            chart={activeChart}
            profile={profile}
            hasSavedChart={hasSavedChart}
            activeTab={activeTab}
            language={language}
            onTabChange={handleTabChange}
          />
        ) : null}
        {showSetupMap ? <ProviderReadinessStrip state={backendState} /> : null}
        {showSetupStatus ? statusRow : null}
        {showGuidedCard ? <AstrologyGuidedCard activeTab={activeTab} onTabChange={handleTabChange} /> : null}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-4"
        >
          {activeTab === "signs" ? (
            !account || !profile ? chartGate : <section className="grid gap-4">
              <ZodiacStrengthSummaryPanel chart={activeChart} language={language} ui={ui} />
              <AstroModuleMap eyebrow="Zodiac system" title="Signs translated into strengths" items={zodiacModuleItems(activeChart, language)} />
              <div className="grid gap-2 min-[720px]:grid-cols-2">
                <Link
                  href="/app/ask"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] px-4 text-[12px] font-black shadow-[var(--astro-button-shadow)]"
                  style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}
                >
                  <Sparkles size={15} />
                  Ask Hint
                </Link>
                <button
                  type="button"
                  onClick={() => handleTabChange("reports")}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border px-4 text-[12px] font-black"
                  style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}
                >
                  Deeper reads
                  <ChevronRight size={15} />
                </button>
              </div>
              <AstroFoldout eyebrow="Zodiac details" title="Placements, self code, and houses">
                <PlacementIndexPanel chart={activeChart} language={language} ui={ui} />
                <SignatureSelfPanel profile={profile} chart={activeChart} previewMode={previewMode} language={language} ui={ui} onEditProfile={() => handleTabChange("birth")} />
              </AstroFoldout>
              <AstroFoldout eyebrow="Side systems" title="星宿 and 紫微 stay optional">
                <TraditionLayerPanel />
              </AstroFoldout>
              <AstroFoldout eyebrow="Graphs" title="Pattern blend and rare chart cues">
                <TraitArcGraph chart={activeChart} language={language} ui={ui} />
              </AstroFoldout>
              <AstroFoldout eyebrow="Deep zodiac" title="First impression, mode, and best-fit signs">
                <StarSecretPanel chart={activeChart} language={language} ui={ui} />
              </AstroFoldout>
              <AstroFoldout eyebrow="Placements" title="Planet-by-planet plain language">
                <AstroCodePanel chart={activeChart} language={language} ui={ui} />
              </AstroFoldout>
              <AstroFoldout eyebrow="Balance" title="Elements and daily reminder">
                <ElementSignaturePanel chart={activeChart} ui={ui} />
              </AstroFoldout>
              <AstroFoldout eyebrow="Stories" title="Long-form placement notes">
                <PlacementStoryList chart={activeChart} language={language} ui={ui} />
              </AstroFoldout>
            </section>
          ) : null}
          {activeTab === "chart" ? (
            !account || !profile ? chartGate : <section className="grid gap-5">
              <ChartSection
                chart={activeChart}
                previewMode={previewMode}
                profile={profile}
                canPersonalize={canPersonalize}
                personalizing={personalizing}
                liveError={liveError}
                natalResponse={activeNatalResponse}
                language={language}
                ui={ui}
                onAddProfile={() => handleTabChange("birth")}
                onPersonalize={() => void handlePersonalizeLiveData()}
              />
            </section>
          ) : null}
          {activeTab === "transits" ? (
            !account || !profile || !hasSavedChart ? chartGate : <TransitsSection
              transits={transits}
              previewMode={!transits}
              canLoadLive={canPersonalize}
              loading={transitLoading}
              error={transitError}
              profile={profile}
              date={transitDate}
              onLoadLive={() => void handleLoadLiveTransits()}
              onDateChange={handleTransitDateChange}
              onNasaMode={setNasaMode}
            />
          ) : null}
          {activeTab === "birth" ? (
            !account ? chartGate : (
            <BirthSection
              profile={profile}
              editing={editingProfile || !profile}
              setEditing={setEditingProfile}
              onSave={handleSaveProfile}
              chart={activeChart}
              natalResponse={activeNatalResponse}
              nasaMode={nasaMode}
              gptMode={reportPreview.mode}
              language={language}
              ui={ui}
              canPersonalize={canPersonalize}
              personalizing={personalizing}
              liveError={liveError}
              onPersonalize={() => void handlePersonalizeLiveData()}
            />
            )
          ) : null}
          {activeTab === "together" ? (!account || !profile || !hasSavedChart ? chartGate : <TogetherSection relationship={activeRelationship} previewMode={previewMode} profile={profile} />) : null}
          {activeTab === "reports" ? (
            !account || !profile || !hasSavedChart ? chartGate : <ReportsSection
              reports={activeReports}
              previewBulletsByReport={reportPreview.bulletsByReport}
              gptMode={reportPreview.mode}
              gptLoading={reportPreview.loading}
              gptError={reportPreview.error}
              onGeneratePreview={() => setReportRequestId((value) => value + 1)}
            />
          ) : null}
        </motion.div>
        <p className="px-2 pb-3 pt-1 text-center text-[10px] font-semibold leading-relaxed" style={{ color: ASTRO_FAINT }}>
          Astrology in Hint is for reflection, timing awareness, and self-understanding — not guaranteed prediction, medical advice, legal advice, or financial advice.
        </p>
      </div>
    </div>
  );
}
