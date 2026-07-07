import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, GlassPanel, ScreenHeader, SectionLabel } from "../../components/app/AppChrome";
import { InnerTypeSigil } from "../home/data/sigils";
import { readBirthProfile } from "../../lib/astro/userBirthProfile";
import type { BirthProfile } from "../../types/astrology";

type QuizAxis = "avoid" | "delulu" | "control" | "mess" | "please" | "think" | "escape" | "vision";

type ResultName =
  | "The Professional Avoider"
  | "The Delulu"
  | "The Control Freak"
  | "The Hot Mess"
  | "The People Pleaser"
  | "The Overthinker"
  | "The Emotional Escape Artist"
  | "The Visionary"
  | "The Walking Contradiction"
  | "The Challenger"
  | "The Main Character"
  | "The Lover"
  | "The Self-Saboteur"
  | "The Walking Red Flag"
  | "The Attention Addict"
  | "The Disaster Magnet"
  | "The Delayed Realizer"
  | "The Commitment Phobe";

type ZodiacSign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

type QuizOption = {
  label: string;
  axis: QuizAxis;
};

type QuizQuestion = {
  prompt: string;
  options: QuizOption[];
};

type ResultCopy = {
  subtitle: string;
  body: string;
  traits: string[];
};

const STORAGE_KEY = "hint.personalities.result.v2";
const ANSWERS_STORAGE_KEY = "hint.personalities.answers.v2";
const MOTION_EASE = [0.2, 0.78, 0.2, 1] as const;
const PANEL_MOTION = {
  initial: { opacity: 0, y: 10, scale: 0.992 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.996 },
  transition: { duration: 0.32, ease: MOTION_EASE },
} as const;

const AXES: QuizAxis[] = ["avoid", "delulu", "control", "mess", "please", "think", "escape", "vision"];

const AXIS_LABELS: Record<QuizAxis, string> = {
  avoid: "Distance",
  delulu: "Romance",
  control: "Structure",
  mess: "Drama",
  please: "Approval",
  think: "Analysis",
  escape: "Freedom",
  vision: "Vision",
};

const AXIS_AFFINITY: Record<QuizAxis, Partial<Record<QuizAxis, number>>> = {
  avoid: { escape: 0.35, think: 0.15 },
  delulu: { vision: 0.35, mess: 0.15 },
  control: { think: 0.3, avoid: 0.1 },
  mess: { delulu: 0.25, control: 0.1 },
  please: { control: 0.2, avoid: 0.1 },
  think: { control: 0.3, avoid: 0.1 },
  escape: { avoid: 0.35, vision: 0.15 },
  vision: { delulu: 0.35, escape: 0.15 },
};

const QUESTIONS: QuizQuestion[] = [
  {
    prompt: "When you are stressed, you usually:",
    options: [
      { label: "Take space", axis: "avoid" },
      { label: "Stay hopeful", axis: "delulu" },
      { label: "Make a plan", axis: "control" },
      { label: "React fast", axis: "mess" },
    ],
  },
  {
    prompt: "When your mood feels messy, you usually:",
    options: [
      { label: "Try to stay nice", axis: "please" },
      { label: "Think too much", axis: "think" },
      { label: "Distract yourself", axis: "escape" },
      { label: "Imagine better things", axis: "vision" },
    ],
  },
  {
    prompt: "When things go wrong, you think:",
    options: [
      { label: "I'll deal with it later", axis: "avoid" },
      { label: "It happened for a reason", axis: "delulu" },
      { label: "I need to fix this", axis: "control" },
      { label: "This is too much", axis: "mess" },
    ],
  },
  {
    prompt: "You feel best when:",
    options: [
      { label: "People need you", axis: "please" },
      { label: "People get you", axis: "think" },
      { label: "You feel free", axis: "escape" },
      { label: "You feel special", axis: "vision" },
    ],
  },
  {
    prompt: "When someone criticizes you, you:",
    options: [
      { label: "Shut down", axis: "avoid" },
      { label: "Explain yourself", axis: "delulu" },
      { label: "Defend myself", axis: "control" },
      { label: "Get emotional", axis: "mess" },
    ],
  },
  {
    prompt: "Pick the one that sounds like you:",
    options: [
      { label: "I say yes too much", axis: "please" },
      { label: "I overthink a lot", axis: "think" },
      { label: "I avoid feelings", axis: "escape" },
      { label: "I dream big", axis: "vision" },
    ],
  },
];

const RESULT_COPY: Record<ResultName, ResultCopy> = {
  "The Professional Avoider": {
    subtitle: "You can dodge an emotional bill with Olympic precision.",
    body: "You protect your peace by stepping back before things overwhelm you. Distance gives you time to sort the feeling from the pressure. You may look calm, but inside you are deciding what is safe to reveal. When you return, your honesty is usually more careful than cold.",
    traits: ["strategic distance", "private processing", "late but honest"],
  },
  "The Delulu": {
    subtitle: "Reality arrives, and you ask if it has better lighting.",
    body: "You lead with imagination and possibility. You can turn small signs into a full emotional storyline. The magic is real, but sometimes you hold onto the prettier version first. Your heart wants meaning before it wants evidence.",
    traits: ["hopeful spin", "symbolic thinker", "selective evidence"],
  },
  "The Control Freak": {
    subtitle: "You call it standards. The group chat calls it a system takeover.",
    body: "You feel safest with structure, plans, and clear next steps. When life gets uncertain, you grip harder. You notice what could go wrong before most people do. Control becomes your way of calming the room and yourself.",
    traits: ["high standards", "prepared", "grip-tightening"],
  },
  "The Hot Mess": {
    subtitle: "Chaotic, charming, somehow still standing.",
    body: "You move through life with speed, feeling, and beautiful chaos. You can be brilliant under pressure because you do not freeze easily. The problem is that your emotions often catch up later. Somehow, you still make the mess look interesting.",
    traits: ["improviser", "reactive", "oddly resilient"],
  },
  "The People Pleaser": {
    subtitle: "You can read the room, then abandon yourself inside it.",
    body: "You are highly tuned to other people's comfort. You notice tension quickly and often try to soften it. This makes you caring, but it can also make you disappear inside other people's needs. The pattern gets heavy when peace matters more than your truth.",
    traits: ["attuned", "conflict-averse", "approval-sensitive"],
  },
  "The Overthinker": {
    subtitle: "Your mind has a mind, and that mind has a podcast.",
    body: "You try to understand everything before you relax. Your mind tracks tone, timing, and tiny changes. One small signal can become a full emotional investigation. You are not dramatic; you are just mentally over-prepared.",
    traits: ["pattern scanning", "hyper-verbal", "scenario builder"],
  },
  "The Emotional Escape Artist": {
    subtitle: "Feelings enter. You locate the nearest exit.",
    body: "You feel deeply, then move away when it gets too intense. You may need space before you can speak clearly. Distance helps you breathe, but it can also become a habit. The real growth is staying present without feeling trapped.",
    traits: ["slippery under pressure", "freedom-seeking", "softly guarded"],
  },
  "The Visionary": {
    subtitle: "You see the future, then trip over today's laundry.",
    body: "You see what something could become before others do. Your imagination moves faster than the practical details. You are drawn to potential, patterns, and future versions of yourself. Your challenge is turning the vision into one grounded next step.",
    traits: ["big-picture", "magnetic", "future-facing"],
  },
  "The Walking Contradiction": {
    subtitle: "Two truths, one body, no clean explanation.",
    body: "You carry multiple truths at once. You may want closeness and freedom in the same moment. You can be soft and guarded, open and private, steady and impossible to predict. The contradiction is not fake; it is layered.",
    traits: ["dual nature", "hard to label", "context-dependent"],
  },
  "The Challenger": {
    subtitle: "You do not start conflict. You simply notice weak arguments.",
    body: "You sense what feels false or unfair. You are not afraid to question the thing everyone else is avoiding. Your directness can be protective, but it can also feel intense. You push back because pretending everything is fine feels worse.",
    traits: ["direct", "provocative", "protective"],
  },
  "The Main Character": {
    subtitle: "The plot finds you because, respectfully, you keep narrating it.",
    body: "You experience life through meaning and storyline. Every moment has a lesson, a mood, and a plot twist. You bring presence into the room without trying very hard. The shadow is forgetting that other people have full storylines too.",
    traits: ["expressive", "dramatic clarity", "story-driven"],
  },
  "The Lover": {
    subtitle: "You romanticize, attach, forgive, and call it depth.",
    body: "You move with your heart close to the surface. Love, beauty, and tenderness matter deeply to you. You can forgive more than people expect because connection feels sacred. Still, devotion needs boundaries to stay healthy.",
    traits: ["devoted", "sensual", "heart-led"],
  },
  "The Self-Saboteur": {
    subtitle: "You find the door, then argue with the handle.",
    body: "You may interrupt good things right as they stabilize. A protective part of you tries to beat disappointment to the door. You can mistake uncertainty for danger. The lesson is learning to receive without preparing for loss.",
    traits: ["almost-ready", "protective chaos", "growth-resistant"],
  },
  "The Walking Red Flag": {
    subtitle: "Not a warning sign. A full illuminated billboard.",
    body: "Your presence is intense and hard to ignore. You feel with force and react with heat. Small moments can become unforgettable around you. The power is real, but repair matters just as much as passion.",
    traits: ["intense", "magnetic", "messy honesty"],
  },
  "The Attention Addict": {
    subtitle: "You do not need the spotlight. You just notice when it leaves.",
    body: "Being seen matters more than you admit. Attention can feel like proof that your presence counts. When it fades, part of you may start performing for reassurance. You shine best when visibility is a bonus, not the whole meal.",
    traits: ["performative charm", "visibility-hungry", "responsive"],
  },
  "The Disaster Magnet": {
    subtitle: "Somehow the plot twist has your location enabled.",
    body: "Life around you rarely stays boring. You move fast and follow impulses before the full map appears. This makes you exciting, but also very familiar with plot twists. Somehow, you usually survive with a story.",
    traits: ["eventful", "impulsive", "survivor energy"],
  },
  "The Delayed Realizer": {
    subtitle: "You understand everything, unfortunately, three business days later.",
    body: "Your clarity often arrives after the moment. You may seem calm while something is happening. Later, the emotional truth finally catches up. Your wisdom is real; it just takes a little time to land.",
    traits: ["late clarity", "deep processor", "after-the-fact wisdom"],
  },
  "The Commitment Phobe": {
    subtitle: "You want the thing. You also want 14 exits from the thing.",
    body: "You want closeness, but you need room to breathe. Commitment can feel like a locked door when it arrives too fast. You may pull back even when the connection is real. Safety grows when choice and closeness can exist together.",
    traits: ["freedom-first", "hot-cold", "option-preserving"],
  },
};

const AXIS_RESULT_POOL: Record<QuizAxis, ResultName[]> = {
  avoid: ["The Professional Avoider", "The Commitment Phobe", "The Delayed Realizer"],
  delulu: ["The Delulu", "The Lover", "The Main Character"],
  control: ["The Control Freak", "The Challenger", "The Self-Saboteur"],
  mess: ["The Hot Mess", "The Disaster Magnet", "The Walking Red Flag"],
  please: ["The People Pleaser", "The Lover", "The Attention Addict"],
  think: ["The Overthinker", "The Walking Contradiction", "The Delayed Realizer"],
  escape: ["The Emotional Escape Artist", "The Commitment Phobe", "The Professional Avoider"],
  vision: ["The Visionary", "The Main Character", "The Walking Contradiction"],
};

const PERSONALITY_ICON_INDEX: Record<ResultName, number> = {
  "The Professional Avoider": 0,
  "The Delulu": 1,
  "The Control Freak": 2,
  "The Hot Mess": 3,
  "The People Pleaser": 4,
  "The Overthinker": 5,
  "The Emotional Escape Artist": 6,
  "The Visionary": 7,
  "The Walking Contradiction": 8,
  "The Challenger": 9,
  "The Main Character": 10,
  "The Lover": 11,
  "The Self-Saboteur": 12,
  "The Walking Red Flag": 13,
  "The Attention Addict": 14,
  "The Disaster Magnet": 15,
  "The Delayed Realizer": 16,
  "The Commitment Phobe": 17,
};

function personalityIconPosition(resultName: ResultName) {
  const index = PERSONALITY_ICON_INDEX[resultName];
  const col = index % 6;
  const row = Math.floor(index / 6);
  return `calc(${(col / 5) * 100}% - 8px) ${(row / 2) * 100}%`;
}

const SIGN_TRAITS: Record<ZodiacSign, { element: "fire" | "earth" | "air" | "water"; mode: "cardinal" | "fixed" | "mutable" }> = {
  Aries: { element: "fire", mode: "cardinal" },
  Taurus: { element: "earth", mode: "fixed" },
  Gemini: { element: "air", mode: "mutable" },
  Cancer: { element: "water", mode: "cardinal" },
  Leo: { element: "fire", mode: "fixed" },
  Virgo: { element: "earth", mode: "mutable" },
  Libra: { element: "air", mode: "cardinal" },
  Scorpio: { element: "water", mode: "fixed" },
  Sagittarius: { element: "fire", mode: "mutable" },
  Capricorn: { element: "earth", mode: "cardinal" },
  Aquarius: { element: "air", mode: "fixed" },
  Pisces: { element: "water", mode: "mutable" },
};

function getSunSign(birthDate?: string): ZodiacSign | null {
  if (!birthDate) return null;
  const [, monthRaw, dayRaw] = birthDate.split("-").map(Number);
  const month = monthRaw;
  const day = dayRaw;
  if (!month || !day) return null;
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

function readStoredResult(): ResultName | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved && saved in RESULT_COPY ? (saved as ResultName) : null;
}

function readStoredAnswers(): QuizAxis[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ANSWERS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is QuizAxis => AXES.includes(value)) : [];
  } catch {
    return [];
  }
}

function tallyAnswers(answers: QuizAxis[]) {
  return answers.reduce((acc, axis) => {
    acc[axis] += 3;
    Object.entries(AXIS_AFFINITY[axis]).forEach(([relatedAxis, weight]) => {
      acc[relatedAxis as QuizAxis] += weight ?? 0;
    });
    return acc;
  }, { avoid: 0, delulu: 0, control: 0, mess: 0, please: 0, think: 0, escape: 0, vision: 0 } satisfies Record<QuizAxis, number>);
}

function astrologyPatternBoost(profile: BirthProfile | null) {
  const sign = getSunSign(profile?.birthDate);
  const boost = { avoid: 0, delulu: 0, control: 0, mess: 0, please: 0, think: 0, escape: 0, vision: 0 } satisfies Record<QuizAxis, number>;
  if (!profile || !sign) return boost;

  const traits = SIGN_TRAITS[sign];
  const elementBoost: Record<typeof traits.element, Partial<Record<QuizAxis, number>>> = {
    fire: { mess: 0.55, vision: 0.45 },
    earth: { control: 0.55, avoid: 0.35 },
    air: { think: 0.55, vision: 0.35 },
    water: { delulu: 0.45, escape: 0.45 },
  };
  const modeBoost: Record<typeof traits.mode, Partial<Record<QuizAxis, number>>> = {
    cardinal: { control: 0.35, mess: 0.25 },
    fixed: { avoid: 0.35, please: 0.25 },
    mutable: { escape: 0.35, vision: 0.25 },
  };

  [elementBoost[traits.element], modeBoost[traits.mode]].forEach((weights) => {
    Object.entries(weights).forEach(([axis, value]) => {
      boost[axis as QuizAxis] += value ?? 0;
    });
  });
  return boost;
}

function dominantAxis(answers: QuizAxis[]) {
  const totals = tallyAnswers(answers);
  return AXES.map((axis) => [axis, totals[axis]] as const).sort((a, b) => b[1] - a[1])[0][0];
}

function astrologyOffset(sign: ZodiacSign | null) {
  if (!sign) return 0;
  const traits = SIGN_TRAITS[sign];
  const elementOffset = { fire: 0, earth: 1, air: 2, water: 2 }[traits.element];
  const modeOffset = { cardinal: 0, fixed: 1, mutable: 2 }[traits.mode];
  return (elementOffset + modeOffset) % 3;
}

function scoreResult(answers: QuizAxis[], profile: BirthProfile | null): ResultName {
  const axis = dominantAxis(answers);
  const sign = getSunSign(profile?.birthDate);
  const pool = AXIS_RESULT_POOL[axis];
  const index = astrologyOffset(sign);
  return pool[index] ?? pool[0];
}

function astrologyLine(profile: BirthProfile | null) {
  const sign = getSunSign(profile?.birthDate);
  if (!profile || !sign) {
    return "Astrology not added yet, so this result is mostly based on your quiz pattern.";
  }
  const traits = SIGN_TRAITS[sign];
  const timeNote = profile.birthTime ? "with birth time saved" : "without birth time";
  return `Astrology layer: ${sign} sun, ${traits.element} element, ${traits.mode} mode, ${timeNote}.`;
}

function astrologyExplanation(profile: BirthProfile | null) {
  const sign = getSunSign(profile?.birthDate);
  if (!profile || !sign) {
    return "Add birth details in Astrology to make this result more personal.";
  }

  const traits = SIGN_TRAITS[sign];
  return `With a ${sign} sun, this personality carries ${traits.element} and ${traits.mode} energy.`;
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width <= maxWidth) {
      line = next;
      return;
    }
    if (line) lines.push(line);
    line = word;
  });
  if (line) lines.push(line);
  return lines;
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const lines = wrapCanvasText(context, text, maxWidth);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function drawCenteredWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const lines = wrapCanvasText(context, text, maxWidth);
  lines.forEach((line, index) => {
    const textWidth = context.measureText(line).width;
    context.fillText(line, centerX - textWidth / 2, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.quadraticCurveTo(x + width, y, x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - corner);
  context.lineTo(x, y + corner);
  context.quadraticCurveTo(x, y, x + corner, y);
  context.closePath();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.crossOrigin = "anonymous";
    image.src = src;
  });
}

async function createQrCanvas(text: string, size: number) {
  const qrCanvas = document.createElement("canvas");
  try {
    const qrModule = await import("qrcode");
    const toCanvas = qrModule.toCanvas ?? (qrModule as unknown as { default?: typeof qrModule }).default?.toCanvas;
    if (!toCanvas) throw new Error("QR canvas renderer unavailable.");
    await toCanvas(qrCanvas, text, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: size,
      color: {
        dark: "#221c2f",
        light: "#ffffff",
      },
    });
  } catch {
    qrCanvas.width = size;
    qrCanvas.height = size;
    const context = qrCanvas.getContext("2d");
    if (!context) return qrCanvas;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.fillStyle = "#221c2f";
    const cell = Math.floor(size / 25);
    const margin = cell * 2;
    const drawFinder = (x: number, y: number) => {
      context.fillRect(x, y, cell * 7, cell * 7);
      context.fillStyle = "#ffffff";
      context.fillRect(x + cell, y + cell, cell * 5, cell * 5);
      context.fillStyle = "#221c2f";
      context.fillRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3);
    };
    drawFinder(margin, margin);
    drawFinder(size - margin - cell * 7, margin);
    drawFinder(margin, size - margin - cell * 7);
    for (let y = margin; y < size - margin; y += cell * 2) {
      for (let x = margin; x < size - margin; x += cell * 2) {
        const index = Math.floor((x + y + text.charCodeAt((x + y) % text.length)) / cell);
        if (index % 3 === 0 && x > margin + cell * 8 && y > margin + cell * 8) {
          context.fillRect(x, y, cell, cell);
        }
      }
    }
  }
  return qrCanvas;
}

async function drawPersonalityIcon(
  context: CanvasRenderingContext2D,
  resultName: ResultName,
  x: number,
  y: number,
  size: number,
) {
  const image = await loadImage("/personalities/personality-icons-simple.png");
  const index = PERSONALITY_ICON_INDEX[resultName];
  const col = index % 6;
  const row = Math.floor(index / 6);
  const cellWidth = Math.floor(image.naturalWidth / 6);
  const cellHeight = Math.floor(image.naturalHeight / 3);
  const sourceX = col * cellWidth;
  const sourceY = row * cellHeight;
  const sourceWidth = col === 5 ? image.naturalWidth - sourceX : cellWidth;
  const sourceHeight = row === 2 ? image.naturalHeight - sourceY : cellHeight;

  context.save();
  context.fillStyle = "rgba(255,255,255,0.52)";
  context.strokeStyle = "rgba(122,98,144,0.2)";
  context.lineWidth = 2;
  drawRoundedRect(context, x, y, size, size, 34);
  context.fill();
  context.stroke();
  context.clip();
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x - 14, y, size, size);
  context.restore();
}

async function createShareCardBlob(resultName: ResultName, result: ResultCopy, profile: BirthProfile | null) {
  const canvas = document.createElement("canvas");
  const scale = 2;
  const width = 900;
  const height = 980;
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.scale(scale, scale);
  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#f8e8f0");
  background.addColorStop(0.48, "#f7f3f6");
  background.addColorStop(1, "#dff2f1");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(255,255,255,0.62)";
  context.strokeStyle = "rgba(122, 98, 144, 0.22)";
  context.lineWidth = 2;
  drawRoundedRect(context, 70, 80, width - 140, height - 160, 46);
  context.fill();
  context.stroke();

  context.fillStyle = "#8d72d7";
  context.font = "700 28px Arial";
  const cardCenter = width / 2;
  const eyebrow = "HINT PERSONALITY";
  context.fillText(eyebrow, cardCenter - context.measureText(eyebrow).width / 2, 165);

  await drawPersonalityIcon(context, resultName, 320, 205, 260);

  context.fillStyle = "#221c2f";
  context.font = "62px Georgia";
  const titleBottom = drawCenteredWrappedText(context, resultName, cardCenter, 545, 650, 66);

  context.fillStyle = "#6f6478";
  context.font = "italic 32px Georgia";
  drawCenteredWrappedText(context, result.subtitle, cardCenter, titleBottom + 30, 660, 42);

  const appUrl = `${window.location.origin}/app`;
  const qrSize = 170;
  const qrCanvas = await createQrCanvas(appUrl, qrSize);
  const footerY = height - 260;

  context.fillStyle = "rgba(255,255,255,0.72)";
  context.strokeStyle = "rgba(94,174,179,0.28)";
  context.lineWidth = 2;
  drawRoundedRect(context, 120, footerY, width - 240, 205, 32);
  context.fill();
  context.stroke();

  context.fillStyle = "#5eaeb3";
  context.font = "700 24px Arial";
  context.fillText("SCAN TO TRY HINT", 155, footerY + 72);

  context.fillStyle = "rgba(79,70,90,0.78)";
  context.font = "25px Arial";
  context.fillText("Find your personality result", 155, footerY + 112);
  context.font = "20px Arial";
  context.fillText(appUrl.replace(/^https?:\/\//, ""), 155, footerY + 148);

  context.fillStyle = "#ffffff";
  drawRoundedRect(context, width - 320, footerY + 18, qrSize + 28, qrSize + 28, 22);
  context.fill();
  context.drawImage(qrCanvas, width - 306, footerY + 32, qrSize, qrSize);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
}

export function PersonalitiesView() {
  const [profile] = useState<BirthProfile | null>(() => readBirthProfile());
  const [answers, setAnswers] = useState<QuizAxis[]>(() => readStoredAnswers());
  const [savedResult, setSavedResult] = useState<ResultName | null>(() => readStoredResult());
  const [shareStatus, setShareStatus] = useState("");
  const usableAnswers = answers.slice(0, QUESTIONS.length);
  const currentQuestion = QUESTIONS[usableAnswers.length];
  const resultName = usableAnswers.length === QUESTIONS.length ? scoreResult(usableAnswers, profile) : savedResult;
  const result = resultName ? RESULT_COPY[resultName] : null;
  const progress = result ? 100 : Math.round((usableAnswers.length / QUESTIONS.length) * 100);

  const answerCounts = useMemo(() => tallyAnswers(usableAnswers), [usableAnswers]);
  const astrologyBoost = useMemo(() => astrologyPatternBoost(profile), [profile]);
  const patternEntries = useMemo(
    () => {
      const ranked = AXES.map((axis) => ({
        axis,
        score: answerCounts[axis] + astrologyBoost[axis],
      }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      const weightedRanked = ranked.map((entry) => ({
        ...entry,
        score: Math.pow(entry.score, 1.85),
      }));
      const total = weightedRanked.reduce((sum, entry) => sum + entry.score, 0);
      let runningPercent = 0;
      return weightedRanked.map((entry) => ({
        axis: entry.axis,
        percent: Math.round((entry.score / total) * 100),
      })).map((entry, index, entries) => {
        if (index === entries.length - 1) {
          return { ...entry, percent: Math.max(0, 100 - runningPercent) };
        }
        runningPercent += entry.percent;
        return entry;
      });
    },
    [answerCounts, astrologyBoost],
  );
  const sign = getSunSign(profile?.birthDate);

  function chooseAnswer(axis: QuizAxis) {
    if (result) return;
    const nextAnswers = [...usableAnswers, axis];
    setAnswers(nextAnswers);
    window.localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(nextAnswers));
    if (nextAnswers.length === QUESTIONS.length) {
      const nextResult = scoreResult(nextAnswers, profile);
      setSavedResult(nextResult);
      window.localStorage.setItem(STORAGE_KEY, nextResult);
    }
  }

  function restart() {
    setAnswers([]);
    setSavedResult(null);
    setShareStatus("");
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(ANSWERS_STORAGE_KEY);
  }

  async function shareResult() {
    if (!resultName || !result) return;
    setShareStatus("Preparing share card...");
    try {
      const blob = await createShareCardBlob(resultName, result, profile);
      if (!blob) throw new Error("Could not create share image.");

      const fileName = `hint-${resultName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.png`;
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setShareStatus("Saved as image");
      } catch {
        window.open(url, "_blank", "noopener,noreferrer");
        setShareStatus("Share card opened");
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      }
    } catch (error) {
      console.error("Could not create share card", error);
      setShareStatus("Could not create share card");
    }
  }

  return (
    <AppScreen>
      <ScreenHeader
        eyebrow="Personalities"
        title="Find Your Type"
        subtitle="Take the quiz, then Hint blends your answers with your saved astrology profile to assign your personality."
        sigil={InnerTypeSigil}
        backHref="/app"
        backLabel="Home"
      />

      <GlassPanel hero className="mb-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: ACCENT.lavender }}>
            {result ? "Astrology result ready" : `Question ${usableAnswers.length + 1} of ${QUESTIONS.length}`}
          </p>
          <span className="font-sans text-[11px] font-bold" style={{ color: GLASS.muted }}>
            {progress}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--hint-control-bg)" }}>
          <div
            className="h-full origin-left rounded-full transition-transform duration-500 ease-out will-change-transform"
            style={{
              transform: `scaleX(${progress / 100})`,
              background: "var(--hint-special-action-bg)",
            }}
          />
        </div>
        {resultName ? (
          <div className="hint-subtle-card mt-4 rounded-[18px] px-3 py-2">
            <p className="font-sans text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: ACCENT.lavender }}>
              Result
            </p>
              <p className="mt-1 font-sans text-[18px] font-black leading-tight" style={{ color: "var(--hint-text)" }}>
              {resultName}
            </p>
          </div>
        ) : null}
        <p className="mt-3 font-sans text-[12px] leading-relaxed" style={{ color: GLASS.muted }}>
          {profile ? astrologyLine(profile) : "Add your birth details in Astrology for a more personalized result."}
        </p>
      </GlassPanel>

      <AnimatePresence mode="wait">
        {result && resultName ? (
        <motion.div key="result" {...PANEL_MOTION} className="transform-gpu">
          <GlassPanel hero className="mb-5">
          <div className="relative rounded-[22px] p-1">
            <div
              aria-label={`${resultName} character`}
              className="absolute right-0 top-0 h-24 w-24 rounded-[22px] border sm:h-28 sm:w-28"
              style={{
                backgroundImage: "url('/personalities/personality-icons-simple.png')",
                backgroundPosition: personalityIconPosition(resultName),
                backgroundSize: "600% 300%",
                backgroundRepeat: "no-repeat",
                backgroundColor: "var(--hint-control-bg-strong)",
                borderColor: "var(--hint-control-border)",
                boxShadow: "var(--hint-field-shadow)",
              }}
            />
            <div className="mb-4 min-h-28 pr-28 sm:min-h-32 sm:pr-36">
              <p className="mb-2 font-sans text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ACCENT.gold }}>
                Your assigned personality
              </p>
              <h2 className="font-sans text-[25px] font-black leading-none sm:text-[28px]" style={{ color: "var(--hint-text)" }}>
                {resultName}
              </h2>
              <p className="mt-2 font-sans text-[13px] font-bold leading-snug" style={{ color: GLASS.text }}>
                {result.subtitle}
              </p>
            </div>
          <p className="mt-4 font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
            {result.body}
          </p>
          <p className="mt-3 font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
            {astrologyExplanation(profile)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {result.traits.map((trait) => (
              <span
                key={trait}
                className="hint-segment rounded-full px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.14em]"
              >
                {trait}
              </span>
            ))}
          </div>
          </div>
          <button
            type="button"
            onClick={() => void shareResult()}
            className="hint-soft-button hint-pressable mt-5 h-11 w-full rounded-full font-sans text-[11px] font-black uppercase tracking-[0.18em]"
          >
            Share result
          </button>
          {shareStatus ? (
            <p className="mt-2 text-center font-sans text-[11px] font-bold" style={{ color: GLASS.muted }}>
              {shareStatus}
            </p>
          ) : null}
          <button
            type="button"
            onClick={restart}
            className="hint-ghost-button hint-pressable mt-5 h-11 w-full rounded-full font-sans text-[11px] font-black uppercase tracking-[0.18em]"
          >
            Retake quiz
          </button>
          </GlassPanel>
        </motion.div>
      ) : (
        <motion.div key={`question-${usableAnswers.length}`} {...PANEL_MOTION} className="transform-gpu">
          <GlassPanel hero className="mb-5">
          <SectionLabel>Choose what feels most like you</SectionLabel>
          <h2 className="mb-4 font-sans text-[24px] font-black leading-tight" style={{ color: "var(--hint-text)" }}>
            {currentQuestion.prompt}
          </h2>
          <div className="flex flex-col gap-2.5">
            {currentQuestion.options.map((option, index) => (
              <motion.button
                key={option.label}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.035, ease: MOTION_EASE }}
                whileTap={{ scale: 0.985 }}
                onClick={() => chooseAnswer(option.axis)}
                className="hint-subtle-card min-h-12 transform-gpu rounded-[16px] px-4 py-3 text-left font-sans text-[13px] font-bold leading-snug transition-[background,border-color,transform] duration-200 ease-out hover:-translate-y-0.5"
              >
                {option.label}
              </motion.button>
            ))}
          </div>
          </GlassPanel>
        </motion.div>
      )}
      </AnimatePresence>

      <GlassPanel className="mb-4">
        <p className="mb-3 font-sans text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: ACCENT.aqua }}>
          Quiz pattern
        </p>
        <div className="flex flex-col gap-2.5">
          {patternEntries.map(({ axis, percent }, index) => {
            return (
              <motion.div
                key={axis}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.24, delay: index * 0.025, ease: MOTION_EASE }}
                className="hint-subtle-card transform-gpu rounded-[18px] px-3 py-2.5"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: ACCENT.lavender }}>
                    {AXIS_LABELS[axis]}
                  </p>
                  <p className="font-sans text-[16px] font-black leading-none" style={{ color: "var(--hint-text)" }}>
                    {percent}%
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--hint-control-bg)" }}>
                  <div
                    className="h-full origin-left rounded-full transition-transform duration-500 ease-out will-change-transform"
                    style={{
                      transform: `scaleX(${percent / 100})`,
                      background: "linear-gradient(90deg, var(--hint-lavender), var(--hint-aqua))",
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
        <p className="mt-3 font-sans text-[11.5px] leading-relaxed" style={{ color: GLASS.muted }}>
          {sign ? `Sun sign used: ${sign}.` : "No birth date found yet; astrology weighting will unlock after Astrology is filled in."}
        </p>
      </GlassPanel>
    </AppScreen>
  );
}
