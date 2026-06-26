import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Activity, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleDot, Compass, Copy, ExternalLink, FileText, HeartHandshake, Link2, LockKeyhole, MapPin, Orbit, Radar, Search, Share2, ShieldCheck, UserRound } from "lucide-react";
import { BirthProfileCard } from "../../components/astro/BirthProfileCard";
import { BirthProfileForm } from "../../components/astro/BirthProfileForm";
import { RealSkyTodayCard } from "../../components/astro/RealSkyTodayCard";
import { getAstroInterpretation, getGeoDetails, getNatalChart, getSynastry, getTimezoneDetails, getTransits, type AstroGeoPlace, type AstroNatalResponse } from "../../lib/astro/astroClient";
import { MOCK_ASTROLOGY_REPORTS } from "../../lib/astro/mockAstrologyReports";
import { ZODIAC_SIGNS } from "../../lib/astro/mockAstroData";
import { buildMockRelationshipAstrology } from "../../lib/astro/mockSynastry";
import { normalizeClientNatal } from "../../lib/astro/normalizeClientAstro";
import { SAMPLE_CHART, SAMPLE_RELATIONSHIP, SAMPLE_TRANSITS } from "../../lib/astro/sampleAstroData";
import { readBirthProfile, saveBirthProfile, saveBirthProfileFromAccountProfile } from "../../lib/astro/userBirthProfile";
import { apiUrl } from "../../lib/api";
import { useLocalAccount, type LocalAccount } from "../../lib/auth";
import { useLanguage, type HintLanguage } from "../../lib/i18n";
import { useProfile } from "../../lib/useProfile";
import { AppScreen } from "../../components/app/AppChrome";
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
  if (tab === "signs" || tab === "code") return "signs";
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
    url.searchParams.set("tab", tab === "signs" ? "code" : tab === "transits" ? "today" : tab);
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
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

function titleCase(value?: string) {
  if (!value) return "Open";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function signLabel(sign?: ZodiacSign) {
  return sign ? SIGN_LABELS[sign] : "Open";
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
  return "Ready for one controlled AstrologyAPI natal test.";
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
  const [status, setStatus] = useState<AstroProviderStatus | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(apiUrl("/api/astro/status"))
      .then((response) => (response.ok ? response.json() : null))
      .then((next) => {
        if (alive) setStatus(next);
      })
      .catch(() => {
        if (alive) setStatus(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  return status;
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

function TopTabs({ activeTab, onChange }: { activeTab: AstrologyTab; onChange: (tab: AstrologyTab) => void }) {
  const tabs: Array<{ tab: AstrologyTab; compact: string; full: string; icon: typeof Orbit }> = [
    { tab: "chart", compact: "Chart", full: "Chart wheel", icon: Orbit },
    { tab: "signs", compact: "Code", full: "Sign code", icon: CircleDot },
    { tab: "transits", compact: "Today", full: "Live transits", icon: Activity },
    { tab: "birth", compact: "Birth", full: "Birth profile", icon: CalendarDays },
    { tab: "together", compact: "Together", full: "Together invite", icon: HeartHandshake },
    { tab: "reports", compact: "Reports", full: "Reports", icon: FileText },
  ];

  return (
    <nav
      className="-mx-1 flex gap-1 overflow-x-auto py-1 font-sans text-[10px] font-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ color: ASTRO_TEXT }}
      aria-label="Astrology sections"
    >
      {tabs.map((item) => {
        const active = activeTab === item.tab;
        const Icon = item.icon;
        return (
          <button
            key={item.tab}
            type="button"
            onClick={() => onChange(item.tab)}
            aria-label={item.full}
            aria-pressed={active}
            className="relative inline-flex h-9 min-w-[64px] shrink-0 items-center justify-center gap-1.5 rounded-[8px] border px-2.5 transition-[opacity,transform] duration-200 active:scale-[0.98]"
            style={{
              opacity: active ? 1 : 0.62,
              color: active ? ASTRO_BUTTON_TEXT : ASTRO_MUTED,
              background: active ? ASTRO_BUTTON : ASTRO_INNER,
              borderColor: active ? ASTRO_TILE_BORDER : ASTRO_BORDER,
            }}
          >
            <Icon size={13} />
            {item.compact}
          </button>
        );
      })}
    </nav>
  );
}

function DataStatusRow({ hasProfile, hasSavedChart, natalResponse }: { hasProfile: boolean; hasSavedChart: boolean; natalResponse: AstroNatalResponse | null }) {
  const live = natalResponse?.source === "astrologyapi" && natalResponse.mode === "live";
  const rows = live
    ? ["Saved chart", "Live sky"]
    : hasSavedChart
      ? ["Saved chart", "Local cache"]
      : [hasProfile ? "Birth profile saved" : "Birth profile needed", "Chart not saved"];
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

function ProviderReadinessStrip({ status }: { status: AstroProviderStatus | null }) {
  const chartReady = Boolean(status?.astrology?.configured);
  const skyReady = Boolean(status?.nasa?.configured);
  const reportReady = Boolean(status?.gpt?.configured);
  const items = [
    {
      label: "Chart",
      value: status ? chartReady ? "Live" : "Local" : "Checking",
      ready: chartReady,
      icon: Orbit,
    },
    {
      label: "Sky",
      value: status ? skyReady ? "NASA" : "Local" : "Checking",
      ready: skyReady,
      icon: Radar,
    },
    {
      label: "Reports",
      value: status ? reportReady ? "AI" : "Curated" : "Checking",
      ready: reportReady,
      icon: FileText,
    },
  ];

  return (
    <section
      aria-label="Astrology provider readiness"
      className="rounded-[8px] border px-2.5 py-2"
      style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}
    >
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
                style={{ background: status ? ready ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT : ASTRO_FAINT }}
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
            Open
          </span>
        </div>
      </summary>
      <div className="mt-3 grid gap-4">
        {children}
      </div>
    </details>
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
      label: placement ? BODY_LENSES[placement.body].title : "Open",
      value: placement ? signName(placement.sign, language) : ui.pending,
      ready: Boolean(placement),
      tab: "chart" as AstrologyTab,
    })),
    {
      label: "Source",
      value: chart.source === "astrologyapi" || chart.source === "api" ? "Live" : "Saved",
      ready: true,
      tab: "chart" as AstrologyTab,
    },
  ];
  const statusLabel = hasSavedChart ? "Personal chart" : profile ? "Birth details ready" : "Birth details needed";
  const primaryTarget: AstrologyTab = !profile ? "birth" : !hasSavedChart ? "chart" : "birth";
  const primaryLabel = !account ? "Log in to save chart" : !profile ? "Add birth details" : !hasSavedChart ? "Create chart" : "Edit birth data";
  const showSetupCta = !account || !profile || !hasSavedChart || activeTab === "birth";
  const factRows = hasSavedChart ? chartFacts : setupFacts;
  const headline = hasSavedChart ? chartSignatureTitle(chart, language, ui) : profileReady ? "Ready to calculate your wheel" : "Add birth data once";
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
                  {activeTab}
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

        <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          {factRows.map((item) => (
            <button
              key={item.label}
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

function lockedTabCopy(activeTab: AstrologyTab) {
  switch (activeTab) {
    case "signs":
      return {
        label: "Signs",
        title: "Create your sign code",
        body: "Sign code uses the saved natal wheel, not a sample chart, so the core pattern stays personal.",
        after: "After chart",
      };
    case "transits":
      return {
        label: "Transits",
        title: "Create your transit base",
        body: "Transits need a saved natal wheel first, then Hint can rank live sky movement against it.",
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
        label: "Studio",
        title: "Create your chart wheel",
        body: "Use your saved birth details to create the wheel once. Then every astrology tab can open from the same chart.",
        after: "After chart",
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
  const title = needsLogin ? "Save your sky profile" : profile ? lockedCopy.title : "Add birth details once";
  const body = needsLogin
    ? "Log in or sign up before Hint calculates and stores a personal chart."
    : profile
      ? canPersonalize
        ? lockedCopy.body
        : liveProfileHint(profile)
      : "Save date, time, and place once. Hint will reuse it for chart, transits, reports, and together readings.";
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
      value: hasSavedChart ? "Open" : lockedCopy.after,
      active: hasSavedChart,
      icon: activeTab === "transits" ? Activity : activeTab === "reports" ? FileText : activeTab === "together" ? HeartHandshake : Radar,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[8px] border p-4 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_PREMIUM_PANEL, borderColor: ASTRO_STROKE }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 12% 10%, ${ASTRO_ROSE}, transparent 28%), radial-gradient(circle at 88% 20%, ${ASTRO_AQUA}, transparent 32%), linear-gradient(145deg, transparent, ${ASTRO_TILE})`,
          opacity: 0.13,
        }}
      />
      <div className="relative grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-[8px] border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: needsLogin ? ASTRO_GOLD_BRIGHT : ASTRO_AQUA }}>
              {needsLogin ? <LockKeyhole size={14} /> : <ShieldCheck size={14} />}
              {needsLogin ? "Account sync" : "Chart setup"}
            </span>
            <h2 className="mt-3 font-serif text-[24px] leading-[1.04]" style={{ color: ASTRO_TEXT_STRONG }}>{title}</h2>
            <p className="mt-2 text-[12px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{body}</p>
          </div>
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[8px] border" style={{ background: ASTRO_CHART_PANEL, borderColor: ASTRO_TILE_BORDER, color: hasSavedChart ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }}>
            <Orbit size={25} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {studioItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="rounded-[8px] border px-2 py-3 text-center" style={{ background: item.active ? ASTRO_TILE : ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
                <Icon className="mx-auto" size={17} style={{ color: item.active ? ASTRO_AQUA : ASTRO_FAINT }} />
                <p className="mt-2 text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>{item.label}</p>
                <p className="mt-1 truncate text-[12px] font-black" style={{ color: item.active ? ASTRO_TEXT_STRONG : ASTRO_MUTED }}>{item.value}</p>
              </article>
            );
          })}
        </div>

        {liveError ? (
          <p className="rounded-[8px] border p-3 text-[12px] font-semibold" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_ROSE }}>
            {liveError}
          </p>
        ) : null}

        <div className="grid gap-2">
          {needsLogin ? (
            <Link href="/app/login?mode=login" className="inline-flex h-12 items-center justify-center rounded-[8px] px-5 text-[13px] font-black shadow-[var(--astro-button-shadow)]" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
              Log in to continue
            </Link>
          ) : profile ? (
            <button type="button" onClick={onPersonalize} disabled={!canPersonalize || personalizing} className="h-12 rounded-[8px] px-5 text-[13px] font-black shadow-[var(--astro-button-shadow)] disabled:opacity-45" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
              {personalizing ? "Saving chart..." : "Calculate and save chart"}
            </button>
          ) : (
            <button type="button" onClick={onAddProfile} className="h-12 rounded-[8px] px-5 text-[13px] font-black shadow-[var(--astro-button-shadow)]" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
              Add birth details
            </button>
          )}
          <span className="text-center text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}>
            {needsLogin ? "Birth data is saved only after login" : hasSavedChart ? "Full astrology studio is active" : "No fake chart is saved until live data succeeds"}
          </span>
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

  return (
    <svg viewBox="-132 -132 264 264" className={className} role="img" aria-label="Detailed natal chart wheel">
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
            <text x={Math.cos(labelAngle) * 104} y={Math.sin(labelAngle) * 104} textAnchor="middle" dominantBaseline="middle" fontSize="5.8" fill={ASTRO_FAINT}>
              {SIGN_GLYPHS[sign]}
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
          <text x={point.x + 5.6} y={point.y - 1.1} fontSize="6.4" fill={BODY_COLORS[point.body]} fontWeight="900">{bodySymbol(point.body, language)}</text>
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
    <div className="relative z-10 mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                    <p className="truncate text-[9px] font-black uppercase tracking-[0.11em]" style={{ color: ASTRO_FAINT }}>{placement ? BODY_LENSES[placement.body].title : "Open"}</p>
                    <p className="mt-1 truncate text-[13px] font-black" style={{ color: ASTRO_TEXT }}>{placement ? signName(placement.sign, language) : ui.pending}</p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>{placementOneLine(placement)}</p>
              </article>
            ))}
          </div>
          <button type="button" onClick={onEditProfile} className="mt-3 inline-flex h-9 items-center gap-2 rounded-[8px] px-3 text-[12px] font-black shadow-[var(--astro-button-shadow)] transition-[transform,opacity] duration-200 hover:-translate-y-0.5" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
            {previewMode ? "Add birth profile" : `Using ${profile?.birthDate ?? "saved birth profile"}`} <ChevronRight size={15} />
          </button>
        </div>
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
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
      <div className="relative z-0 flex min-h-[190px] items-center justify-center py-2 sm:min-h-[230px]">
        <AstroWheel chart={chart} language={language} className="aspect-square w-full max-w-[276px]" />
      </div>
    </div>
  );
}

function PremiumChartHero({
  chart,
  previewMode,
  providerLabel,
  language,
  ui,
  onAddProfile,
  strongestAspect,
}: {
  chart: NatalChart;
  previewMode: boolean;
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
    { label: "Aspect", value: strongestAspect ? `${bodyLabel(strongestAspect.from)} ${strongestAspect.type}` : "Open", icon: CircleDot, color: ASTRO_AQUA },
  ];

  return (
    <section className="relative overflow-hidden rounded-[8px] border p-3 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_PREMIUM_PANEL, borderColor: ASTRO_STROKE }}>
      <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 18% 18%, ${ASTRO_GOLD_BRIGHT}, transparent 28%), radial-gradient(circle at 82% 20%, ${ASTRO_AQUA}, transparent 32%), radial-gradient(circle at 72% 82%, ${ASTRO_ROSE}, transparent 30%)`, opacity: 0.14 }} />
      <div className="relative grid gap-3">
        <div className="grid grid-cols-[minmax(0,1fr)_118px] items-start gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_136px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-[8px] border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_STROKE, color: ASTRO_GOLD_BRIGHT }}>
                <Orbit size={12} />
                {providerLabel}
              </span>
              <span className="rounded-[8px] border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_AQUA }}>
                {previewMode ? "Sample" : "Saved"}
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
                {placement ? bodyName(placement.body, language) : "Open"}
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
            Add birth details
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
  const live = natalResponse?.source === "astrologyapi" && natalResponse.mode === "live";
  const actionLabel = live ? (loading ? "Refreshing..." : "Refresh") : loading ? "Loading live chart..." : "Personalize with live data";
  return (
    <section className="rounded-[8px] border p-3 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: live ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }}>
            {live ? "AstrologyAPI live" : "Controlled live test"}
          </p>
          <p className="mt-1 text-[12px] font-semibold leading-snug" style={{ color: ASTRO_MUTED }}>
            {live ? `Live chart loaded${natalResponse.cached ? " from cache" : ""}.` : liveProfileHint(profile)}
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
  const providerLabel = previewMode ? "Sample chart" : chart.source === "astrologyapi" || chart.source === "api" ? "AstrologyAPI live" : chart.validation?.partial ? "Partial chart" : "Fallback chart";
  const partialMessage = chart.validation?.message ?? "Sun and planet signs can be previewed. Rising sign and houses need birth time and location.";
  const rankedAspects = [...chart.aspects].sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0) || (a.orb ?? 99) - (b.orb ?? 99));
  const visibleAspects = rankedAspects.slice(0, 5);
  const hiddenAspects = rankedAspects.slice(5);

  return (
    <section className="grid gap-4">
      <PremiumChartHero chart={chart} previewMode={previewMode} providerLabel={providerLabel} language={language} ui={ui} onAddProfile={onAddProfile} strongestAspect={visibleAspects[0]} />
      <LiveNatalControl profile={profile} canRun={canPersonalize} loading={personalizing} error={liveError} natalResponse={natalResponse} onAddProfile={onAddProfile} onRun={onPersonalize} />
      <details className="rounded-[8px] border p-3.5 shadow-[var(--astro-shadow-soft)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Analysis layers</p>
              <p className="mt-1 text-[13px] font-black" style={{ color: ASTRO_TEXT }}>Placements, aspects, elements, houses</p>
            </div>
            <span className="rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_FAINT }}>
              Expand
            </span>
          </div>
        </summary>
        <div className="mt-4 grid gap-4">
          <ChartGraphPanel chart={chart} language={language} ui={ui} />
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
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 rounded-[8px] border p-4 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_HERO, borderColor: ASTRO_BORDER }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-sans text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: ASTRO_GOLD_BRIGHT }}>{previewMode ? "Sample transits" : "Transit focus"}</p>
          <span className="rounded-[8px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_FAINT }}>{transits?.source === "astrologyapi" ? "AstrologyAPI Live" : "Sample fallback"}</span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
          <div>
            <h2 className="font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>{strongest.title}</h2>
            <p className="mt-2 max-w-2xl text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{strongest.action}</p>
          </div>
          <div className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
            <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>Current window</p>
            <p className="mt-1 text-[18px] font-black" style={{ color: ASTRO_AQUA }}>{selectedDateLabel}</p>
            <p className="mt-1 text-[12px] font-semibold" style={{ color: ASTRO_MUTED }}>{rows.length} live signals ranked</p>
          </div>
        </div>
        <div className="mt-4">
          <TransitTimelineVisual rows={rows} startDate={date} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[...strongest.area, ...strongest.theme].map((tag) => (
            <span key={tag} className="rounded-[8px] border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_GOLD_BRIGHT }}>{tag}</span>
          ))}
        </div>
        <details className="mt-4 rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
          <summary className="cursor-pointer text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>Why</summary>
          <p className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_TEXT }}>{strongest.why}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {strongest.evidence.map((item) => (
              <p key={item} className="rounded-[8px] border px-3 py-2 text-[12px] font-semibold" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_MUTED }}>{item}</p>
            ))}
          </div>
        </details>
        <div className="mt-4 rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{canLoadLive ? "Choose any date, then generate live transits for that day." : liveProfileHint(profile)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDateChange(shiftDateInputValue(date, -1))}
                  aria-label="Previous transit day"
                  className="grid size-10 place-items-center rounded-[8px] border"
                  style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}
                >
                  <ChevronLeft size={16} />
                </button>
                <label className="flex min-h-10 min-w-[210px] items-center gap-2 rounded-[8px] border px-3" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_TEXT }}>
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
                <span className="rounded-[8px] border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER, color: ASTRO_FAINT }}>
                  {selectedDateLabel}
                </span>
              </div>
            </div>
            <button type="button" onClick={onLoadLive} disabled={!canLoadLive || loading} className="h-11 shrink-0 rounded-[8px] px-5 text-[13px] font-black disabled:opacity-45" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
              {loading ? "Generating transits..." : "Generate transits"}
            </button>
          </div>
          {error ? <p className="mt-2 text-[12px] font-semibold" style={{ color: ASTRO_ROSE }}>{error}</p> : null}
        </div>
      </div>
      <aside className="grid min-w-0 gap-4">
        <AstroFoldout eyebrow="Sky visual" title="Real sky today and local fallback">
          <RealSkyTodayCard onModeChange={onNasaMode} />
        </AstroFoldout>
        <AstroFoldout eyebrow="7-day window" title="Transit list by day">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {transitWindow.map((transit, index) => (
              <article key={`${transit.title}-${transit.timelineDate}`} className="rounded-[8px] border p-3" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
                <div className="mb-2 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${astroColor(index)}, transparent)` }} />
                <p className="text-[13px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{transit.title}</p>
                <p className="mt-1 text-[11px] font-semibold" style={{ color: ASTRO_MUTED }}>{transit.timelineDate} · {transit.area.join(", ")}</p>
              </article>
            ))}
          </div>
        </AstroFoldout>
      </aside>
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
          <h3 className="mt-2 font-serif text-[24px] leading-none" style={{ color: ASTRO_TEXT }}>{dominant?.[0] ?? "Open"}</h3>
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

function BirthDataVisual({ profile }: { profile: BirthProfile | null }) {
  const ready = Boolean(profile?.birthTime && profile.latitude !== undefined && profile.longitude !== undefined && profile.timezoneOffset !== undefined);
  const facts = [
    { icon: CalendarDays, label: "Date", value: profile?.birthDate ?? "Needed" },
    { icon: Compass, label: "Time", value: profile?.birthTime ?? "Needed" },
    { icon: MapPin, label: "Location", value: profile?.latitude !== undefined && profile.longitude !== undefined ? "Coordinates saved" : "Needed" },
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
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {facts.map(({ icon: Icon, label, value }, index) => (
          <div key={label} className="rounded-[8px] border p-2.5" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: ASTRO_FAINT }}><Icon size={12} /> {label}</p>
            <p className="mt-1 text-[14px] font-black" style={{ color: ASTRO_TEXT }}>{value}</p>
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
  canPersonalize: boolean;
  personalizing: boolean;
  liveError?: string;
  onPersonalize: () => void;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="grid gap-4">
        <BirthDataVisual profile={profile} />
        {profile ? <BirthProfileCard profile={profile} onEdit={() => setEditing(true)} /> : null}
        <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_GOLD_BRIGHT }}>Chart readiness</p>
              <h2 className="mt-2 font-serif text-[22px] leading-tight" style={{ color: ASTRO_TEXT }}>Saved profile status</h2>
            </div>
            <span className="rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: natalResponse?.source === "astrologyapi" ? ASTRO_AQUA : ASTRO_FAINT }}>
              {natalResponse?.source === "astrologyapi" ? "Live chart saved" : "Chart not saved"}
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              ["Birth details", profile ? "Saved for this account" : "Add profile details"],
              ["Chart source", natalResponse?.source === "astrologyapi" ? "AstrologyAPI live" : "Waiting for live chart"],
              ["Chart depth", profile?.birthTime && profile.latitude !== undefined && profile.longitude !== undefined && profile.timezoneOffset !== undefined ? "Rising sign and houses ready" : "Needs time and place"],
              ["Cache state", natalResponse?.cached ? "Loaded from saved chart" : natalResponse ? "Fresh live response" : "No live call yet"],
              ["Sky visual", nasaMode === "Connected" ? "NASA connected" : "Local sky visual"],
              ["Report copy", gptMode === "Connected" ? "GPT connected" : "Curated fallback"],
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
              {personalizing ? "Loading live chart..." : "Personalize with live data"}
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
      <div className="relative grid min-h-[240px] items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div className="mx-auto grid h-36 w-36 place-items-center rounded-full border text-center" style={{ background: `radial-gradient(circle, ${ASTRO_TILE}, ${ASTRO_CHART_HEADER} 70%)`, borderColor: ASTRO_BORDER }}>
          <div>
            <UserRound className="mx-auto" size={24} style={{ color: ASTRO_GOLD_BRIGHT }} />
            <p className="mt-3 px-4 text-[13px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{profileName}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>Chart A</p>
          </div>
        </div>
        <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full border" style={{ background: `radial-gradient(circle, ${ASTRO_TILE}, ${ASTRO_CHART_HEADER})`, borderColor: active ? ASTRO_AQUA : ASTRO_BORDER }}>
          <span className="absolute -left-24 top-1/2 hidden h-px w-24 -translate-y-1/2 sm:block" style={{ background: `linear-gradient(90deg, transparent, ${ASTRO_GOLD_BRIGHT})` }} />
          <span className="absolute -right-24 top-1/2 hidden h-px w-24 -translate-y-1/2 sm:block" style={{ background: `linear-gradient(90deg, ${ASTRO_AQUA}, transparent)` }} />
          <HeartHandshake size={30} style={{ color: active ? ASTRO_AQUA : ASTRO_GOLD_BRIGHT }} />
        </div>
        <div className="mx-auto grid h-36 w-36 place-items-center rounded-full border text-center" style={{ background: `radial-gradient(circle, ${ASTRO_TILE}, ${ASTRO_CHART_HEADER} 70%)`, borderColor: ASTRO_ROSE }}>
          <div>
            <UserRound className="mx-auto" size={24} style={{ color: ASTRO_ROSE }} />
            <p className="mt-3 px-4 text-[13px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{partnerName || "Partner"}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>Chart B</p>
          </div>
        </div>
      </div>
      <div className="relative mt-4 grid gap-2 sm:grid-cols-3">
        {[
          ["Comfort", ASTRO_GOLD_BRIGHT],
          ["Signal", ASTRO_AQUA],
          ["Friction", ASTRO_ROSE],
        ].map(([label, color]) => (
          <div key={label} className="rounded-[8px] border px-3 py-2" style={{ background: ASTRO_INPUT, borderColor: ASTRO_TILE_BORDER }}>
            <div className="mb-2 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
            <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_FAINT }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
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
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {relationship.highlights.map((item) => (
            <p key={item} className="rounded-[8px] border p-3 text-[13px] font-semibold leading-relaxed" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_TEXT }}>{item}</p>
          ))}
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
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
                {synastry.source === "astrologyapi" ? "AstrologyAPI live synastry" : "Fallback synastry preview"}
              </p>
            </div>
          </section>
        ) : null}
      </div>
      <aside className="rounded-[8px] border p-5 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[8px] border" style={{ background: ASTRO_INNER, borderColor: ASTRO_TILE_BORDER }}>
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
                {partnerPlaceMode ? <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: ASTRO_MUTED }}>{partnerPlaceMode === "live" ? "AstrologyAPI place match" : "Fallback place match"}</p> : null}
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
          <div className="mt-5 rounded-[8px] border p-4 text-[13px] font-semibold leading-relaxed" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_MUTED }}>
            Sample preview is active. Save your profile to create a web invite.
          </div>
        )}
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
  const bulletsFor = (report: AstrologyReport) => {
    const generated = previewBulletsByReport[report.id] ?? [];
    const curated = report.previewBullets ?? fallbackBullets;
    return [...generated, ...curated.filter((bullet) => !generated.includes(bullet))].slice(0, 3);
  };

  return (
    <section className="rounded-[8px] border p-4 shadow-[var(--astro-shadow)]" style={{ background: ASTRO_SURFACE, borderColor: ASTRO_BORDER }}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 font-sans text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: ASTRO_GOLD_BRIGHT }}><FileText size={14} /> Reports</p>
          <h2 className="mt-2 font-serif text-[24px] leading-tight" style={{ color: ASTRO_TEXT }}>Premium report room</h2>
          <p className="mt-2 max-w-2xl text-[13px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>Each module previews the evidence it will use: chart pattern, timing, and reflection prompts.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-[8px] border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_GOLD_BRIGHT }}>5 report modules</span>
            <span className="rounded-[8px] border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: gptMode === "Connected" ? ASTRO_AQUA : ASTRO_FAINT }}>GPT {gptMode}</span>
          </div>
          <button type="button" onClick={onGeneratePreview} disabled={gptLoading} className="mt-4 h-11 rounded-[8px] px-5 text-[13px] font-black disabled:opacity-45" style={{ background: ASTRO_BUTTON, color: ASTRO_BUTTON_TEXT }}>
            {gptLoading ? "Generating preview..." : "Generate GPT preview bullets"}
          </button>
          {gptError ? <p className="mt-2 text-[12px] font-semibold" style={{ color: ASTRO_ROSE }}>{gptError}</p> : null}
        </div>
        <div className="rounded-[8px] border p-3" style={{ background: ASTRO_LOCKED, borderColor: ASTRO_BORDER }}>
          <div className="grid h-24 place-items-center rounded-[8px] border" style={{ background: `radial-gradient(circle, ${ASTRO_TILE}, ${ASTRO_CHART_HEADER})`, borderColor: ASTRO_TILE_BORDER }}>
            <FileText size={32} style={{ color: ASTRO_GOLD_BRIGHT }} />
          </div>
          <p className="mt-3 text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: ASTRO_FAINT }}>Report archive</p>
          <p className="mt-1 text-[18px] font-black" style={{ color: ASTRO_TEXT }}>{reports.length} modules</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {reports.map((report, index) => (
          <article key={report.id} className="relative overflow-hidden rounded-[8px] border p-4 transition-[transform,opacity] duration-200 hover:-translate-y-0.5" style={{ background: ASTRO_LOCKED, borderColor: ASTRO_BORDER }}>
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${astroColor(index)}, transparent)` }} />
            <div className="flex items-center justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[8px] border" style={{ background: ASTRO_TILE, borderColor: ASTRO_TILE_BORDER }}>
                <FileText size={18} style={{ color: astroColor(index) }} />
              </span>
              <span className="rounded-[8px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: report.status === "available" ? ASTRO_AQUA : ASTRO_GOLD }}>Member report</span>
            </div>
            <p className="mt-3 text-[15px] font-black leading-tight" style={{ color: ASTRO_TEXT }}>{report.title}</p>
            <p className="mt-2 text-[12px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{report.subtitle}</p>
            <div className="mt-3 grid gap-2">
              {bulletsFor(report).map((bullet) => (
                <p key={bullet} className="flex gap-2 text-[11px] font-semibold leading-snug" style={{ color: ASTRO_TEXT }}><span style={{ color: astroColor(index) }}>•</span>{bullet}</p>
              ))}
            </div>
            <details className="mt-4 rounded-[8px] border px-3 py-2" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER }}>
              <summary className="cursor-pointer text-[12px] font-black" style={{ color: ASTRO_TEXT }}>
                <span className="inline-flex items-center gap-2"><LockKeyhole size={13} /> Preview report</span>
              </summary>
              <p className="mt-3 text-[12px] font-semibold leading-relaxed" style={{ color: ASTRO_MUTED }}>{report.unlockHint}</p>
            </details>
          </article>
        ))}
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
  const autoTransitKeyRef = useRef<string | null>(null);
  const backendStatus = useAstroBackendStatus();
  const { relationship, reports } = useAstrologyData(profile);
  const activeChart = chart ?? savedNatalRecord?.chart ?? SAMPLE_CHART;
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
      if (nextNatal.source !== "astrologyapi" || nextNatal.mode !== "live") {
        setLiveError(nextNatal.validation?.message ?? "AstrologyAPI did not return a live chart. No saved chart was changed.");
        setNatalResponse(nextNatal);
        setChart(null);
        return;
      }
      const nextChart = normalizeClientNatal(profile, nextNatal);
      if (!nextChart) {
        setLiveError("Live chart response could not be normalized. No saved chart was changed.");
        setNatalResponse(nextNatal);
        setChart(null);
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
      setLiveError("Live natal chart is unavailable right now. No saved chart was changed.");
      setNatalResponse(null);
      setChart(null);
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
      if (nextTransits.source !== "astrologyapi" || nextTransits.mode !== "live") {
        setTransitError(nextTransits.validation?.message ?? "Live transits were unavailable. Saved chart remains active without live transit updates.");
        setTransits(null);
        return;
      }
      setTransits(nextTransits);
    } catch {
      setTransitError("Live transits are unavailable right now. Saved chart remains active without live transit updates.");
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

  return (
    <AppScreen>
      <div className="grid w-full gap-4" style={{ color: ASTRO_TEXT }}>
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
        {hasSavedChart ? <TopTabs activeTab={activeTab} onChange={handleTabChange} /> : null}
        <ProviderReadinessStrip status={backendStatus} />
        {activeTab !== "chart" ? statusRow : null}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-4"
        >
          {activeTab === "signs" ? (
            !account || !profile || !hasSavedChart ? chartGate : <section className="grid gap-5">
              <SignatureSelfPanel profile={profile} chart={activeChart} previewMode={previewMode} language={language} ui={ui} onEditProfile={() => handleTabChange("birth")} />
              <AstroFoldout eyebrow="Pattern" title="Visual blend and rare chart cues">
                <TraitArcGraph chart={activeChart} language={language} ui={ui} />
              </AstroFoldout>
              <AstroFoldout eyebrow="Self code" title="First impression, mode, and best-fit signs">
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
            !account || !profile || !hasSavedChart ? chartGate : <section className="grid gap-5">
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
              {statusRow}
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
              chart={chart}
              natalResponse={activeNatalResponse}
              nasaMode={nasaMode}
              gptMode={reportPreview.mode}
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
        <p className="rounded-[8px] border p-4 text-[11px] font-semibold leading-relaxed" style={{ background: ASTRO_INNER, borderColor: ASTRO_BORDER, color: ASTRO_MUTED }}>
          Astrology in Hint is for reflection, not guaranteed prediction. Saved charts stay attached to the signed-in local profile.
        </p>
      </div>
    </AppScreen>
  );
}
