import { getLocalDateString } from "../../../lib/identity";
import type {
  DailyLuckyItem,
  DailyPull,
  DailyReport,
  DailyScore,
  DailyScoreKey,
  DailyTask,
} from "../types/home.types";
import { getDailyPull } from "./dailyPulls";
import type { HintLanguage } from "../../../lib/i18n";

const SCORE_BASE: Array<Omit<DailyScore, "score" | "label"> & { offset: number }> = [
  { key: "love", tone: "#ef84bd", offset: 13 },
  { key: "resources", tone: "#e6bd63", offset: 31 },
  { key: "work", tone: "#90a8ef", offset: 47 },
  { key: "focus", tone: "#60c8dc", offset: 59 },
  { key: "connection", tone: "#bf7de8", offset: 71 },
];

const SCORE_LABELS: Record<HintLanguage, Record<DailyScoreKey, string>> = {
  en: { love: "Love", resources: "Money", work: "Work", focus: "Focus", connection: "People" },
  zh: { love: "爱情", resources: "财富", work: "事业", focus: "专注", connection: "人际" },
  es: { love: "Amor", resources: "Dinero", work: "Trabajo", focus: "Enfoque", connection: "Vínculos" },
  ja: { love: "恋愛", resources: "お金", work: "仕事", focus: "集中", connection: "人間関係" },
  ko: { love: "사랑", resources: "재정", work: "일", focus: "집중", connection: "관계" },
};

type BirthDetails = {
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
};

const SUIT_SCORE_BIAS: Record<NonNullable<DailyPull["suit"]>, Partial<Record<DailyScoreKey, number>>> = {
  wands: { work: 8, focus: 6, connection: 3, love: 1, resources: -1 },
  cups: { love: 8, connection: 7, focus: 1, work: -1, resources: 0 },
  swords: { focus: 8, work: 4, connection: 2, resources: 1, love: -2 },
  pentacles: { resources: 8, work: 6, focus: 4, love: 1, connection: -1 },
};

const MAJOR_SCORE_BIAS: Record<string, Partial<Record<DailyScoreKey, number>>> = {
  "0-fool": { focus: 4, connection: 3, resources: -2 },
  "1-magician": { work: 7, focus: 6, resources: 2 },
  "2-high-priestess": { focus: 7, love: 3, connection: 2 },
  "3-empress": { love: 6, resources: 5, connection: 3 },
  "4-emperor": { work: 6, resources: 5, focus: 3 },
  "5-hierophant": { connection: 5, focus: 3, work: 2 },
  "6-lovers": { love: 8, connection: 5, focus: 1 },
  "7-chariot": { work: 7, focus: 6, love: -1 },
  "8-strength": { focus: 5, love: 4, work: 2 },
  "9-hermit": { focus: 7, connection: -2, resources: 2 },
  "10-wheel": { connection: 4, resources: 3, work: 2 },
  "11-justice": { focus: 6, resources: 3, love: -1 },
  "12-hanged-man": { focus: 5, work: -2, connection: 2 },
  "13-death": { work: 4, focus: 4, love: -2 },
  "14-temperance": { love: 4, focus: 4, resources: 3 },
  "15-devil": { resources: 3, love: -3, focus: -2 },
  "16-tower": { work: -3, love: -2, focus: 4 },
  "17-star": { love: 5, connection: 5, focus: 3 },
  "18-moon": { focus: 4, love: 2, work: -2 },
  "19-sun": { love: 6, connection: 5, work: 3 },
  "20-judgement": { work: 5, focus: 5, connection: 2 },
  "21-world": { work: 5, resources: 4, connection: 4 },
};

const RANK_SCORE_BIAS: Record<string, Partial<Record<DailyScoreKey, number>>> = {
  ace: { focus: 4, work: 3 },
  two: { love: 3, connection: 3 },
  three: { connection: 4, work: 2 },
  four: { resources: 3, focus: 2 },
  five: { focus: -2, connection: -1 },
  six: { connection: 3, love: 2 },
  seven: { focus: 4, resources: 1 },
  eight: { work: 4, focus: 3 },
  nine: { focus: 3, resources: 2 },
  ten: { work: 2, focus: -1 },
  page: { focus: 3, connection: 2 },
  knight: { work: 4, focus: 2 },
  queen: { love: 3, connection: 3 },
  king: { work: 4, resources: 3 },
};

const TITLES = [
  "A clear enough day to move gently.",
  "Good luck favors one honest question.",
  "The day opens when you stop forcing it.",
  "Something small wants your attention first.",
  "Your energy gets better when it has a shape.",
  "A softer plan works better than a harder push.",
] as const;

const SUMMARIES = [
  "Today is better for noticing patterns than chasing answers. Keep the important things simple, and let the card point at what needs less noise.",
  "Your energy is usable, but it wants rhythm. Choose one thing to complete before you ask the day for more clarity.",
  "The room around you may feel busy, so protect your attention. A quiet decision will carry further than a dramatic one.",
  "There is support in the day, but it arrives through details: timing, tone, and the small promise you actually keep.",
] as const;

const SUGGESTIONS = [
  "Ask the question in one sentence before you pull more cards.",
  "Wear or keep one warm color near you as a visual anchor.",
  "Write the thing you keep circling, then make it shorter.",
  "Choose the softer reply and see what it changes.",
  "Make one ordinary task beautiful on purpose.",
] as const;

const AVOIDS = [
  "Reading every silence as an answer.",
  "Letting one mood write the whole story.",
  "Starting three things to avoid finishing one.",
  "Asking the cards the same question until they agree.",
  "Borrowing urgency from someone else's timeline.",
] as const;

type TextPair = readonly [string, string];

const COLORS: readonly TextPair[] = [
  ["Pearl blue", "Good for calm replies"],
  ["Soft gold", "Good for confidence"],
  ["Rose smoke", "Good for tenderness"],
  ["Moss green", "Good for grounding"],
  ["Moon white", "Good for clean starts"],
] as const;

const HOURS: readonly TextPair[] = [
  ["9-11 PM", "Best window for reflection"],
  ["4-6 PM", "Best window for decisions"],
  ["11 AM-1 PM", "Best window for messages"],
  ["7-9 PM", "Best window for quiet work"],
] as const;

const DIRECTIONS: readonly TextPair[] = [
  ["North", "Hold the line"],
  ["East", "Begin again"],
  ["South", "Move with warmth"],
  ["West", "Close the loop"],
] as const;

const TASKS: DailyTask[] = [
  {
    text: "Name the real question before opening the Tarot Room.",
    reason: "It keeps the reading from scattering.",
  },
  {
    text: "Clear one small surface near you.",
    reason: "The outside room changes the inside room.",
  },
  {
    text: "Send the message only after rereading it once.",
    reason: "Timing is part of the spell.",
  },
  {
    text: "Write one sentence you do not need to send.",
    reason: "Not every truth needs an audience.",
  },
  {
    text: "Choose the plan that protects tomorrow morning.",
    reason: "Future-you is part of today's reading.",
  },
];

const DAILY_ZH = {
  titles: [
    "今天适合轻轻往前走。",
    "好运会偏向一个诚实的问题。",
    "当你不再用力，今天反而会打开。",
    "一件小事最先需要你的注意。",
    "给能量一个形状，它就会更好用。",
    "温柔一点的计划，比硬推更有效。",
  ] as const,
  summaries: [
    "今天更适合观察模式，而不是追着答案跑。把重要的事简单处理，让牌提醒你哪里需要少一点杂音。",
    "你的能量是可用的，但它需要节奏。先完成一件事，再向今天要更多清晰。",
    "周围可能有点忙，所以要保护注意力。一个安静的决定，会比戏剧化的反应走得更远。",
    "今天的支持藏在细节里：时间、语气，还有你真正守住的一个小承诺。",
  ] as const,
  suggestions: [
    "进塔罗房间前，先把问题写成一句话。",
    "在身边放一个暖色物件，作为视觉锚点。",
    "写下你一直绕着想的事，然后把它缩短。",
    "选择更柔软的回复，看看它会改变什么。",
    "故意把一件普通小事做得漂亮一点。",
  ] as const,
  avoids: [
    "把每一次沉默都读成答案。",
    "让一个情绪写完整个故事。",
    "同时开始三件事，只是为了逃避完成一件事。",
    "反复问同一个问题，直到牌同意你。",
    "借用别人时间线里的紧迫感。",
  ] as const,
  colors: [
    ["珍珠蓝", "适合平静沟通"],
    ["柔金色", "适合找回自信"],
    ["玫瑰雾粉", "适合温柔相处"],
    ["苔藓绿", "适合稳定下来"],
    ["月光白", "适合干净开始"],
  ] as readonly TextPair[],
  hours: [
    ["晚上 9-11 点", "最适合回看"],
    ["下午 4-6 点", "最适合做决定"],
    ["上午 11 点-下午 1 点", "最适合发消息"],
    ["晚上 7-9 点", "最适合安静处理事"],
  ] as readonly TextPair[],
  directions: [
    ["北方", "守住边界"],
    ["东方", "重新开始"],
    ["南方", "带着温度行动"],
    ["西方", "把事情收尾"],
  ] as readonly TextPair[],
  tasks: [
    { text: "打开塔罗房间前，先命名真正的问题。", reason: "这样解读不会散掉。" },
    { text: "整理身边一个小平面。", reason: "外在空间会影响内在空间。" },
    { text: "消息发出前，再读一遍。", reason: "时机也是提示的一部分。" },
    { text: "写一句不需要发出去的话。", reason: "不是每个真相都需要观众。" },
    { text: "选择那个能保护明早自己的计划。", reason: "未来的你也在今天的解读里。" },
  ] satisfies DailyTask[],
};

const DAILY_ES = {
  titles: [
    "Un día claro para avanzar con suavidad.",
    "La suerte favorece una pregunta honesta.",
    "El día se abre cuando dejas de forzarlo.",
    "Algo pequeño necesita tu atención primero.",
    "Tu energía mejora cuando tiene una forma.",
    "Un plan más suave funciona mejor que empujar.",
  ] as const,
  summaries: [
    "Hoy sirve más para notar patrones que para perseguir respuestas. Mantén lo importante simple y deja que la carta señale dónde necesitas menos ruido.",
    "Tu energía está disponible, pero necesita ritmo. Termina una cosa antes de pedirle más claridad al día.",
    "El entorno puede sentirse ocupado, así que cuida tu atención. Una decisión tranquila llegará más lejos que una reacción dramática.",
    "El apoyo de hoy está en los detalles: el momento, el tono y la pequeña promesa que sí puedes cumplir.",
  ] as const,
  suggestions: [
    "Escribe tu pregunta en una sola frase antes de entrar a la sala de tarot.",
    "Mantén cerca un color cálido como ancla visual.",
    "Anota lo que sigues rodeando y luego hazlo más breve.",
    "Elige la respuesta más suave y observa qué cambia.",
    "Haz una tarea común un poco más bonita a propósito.",
  ] as const,
  avoids: [
    "Leer cada silencio como una respuesta.",
    "Dejar que un solo ánimo escriba toda la historia.",
    "Empezar tres cosas para evitar terminar una.",
    "Preguntar lo mismo a las cartas hasta que estén de acuerdo.",
    "Tomar urgencia prestada del calendario de otra persona.",
  ] as const,
  colors: [
    ["Azul perla", "Bueno para responder con calma"],
    ["Dorado suave", "Bueno para recuperar confianza"],
    ["Rosa bruma", "Bueno para la ternura"],
    ["Verde musgo", "Bueno para enraizarte"],
    ["Blanco luna", "Bueno para empezar limpio"],
  ] as readonly TextPair[],
  hours: [
    ["9-11 p. m.", "Mejor ventana para reflexionar"],
    ["4-6 p. m.", "Mejor ventana para decidir"],
    ["11 a. m.-1 p. m.", "Mejor ventana para mensajes"],
    ["7-9 p. m.", "Mejor ventana para trabajo tranquilo"],
  ] as readonly TextPair[],
  directions: [
    ["Norte", "Sostén el límite"],
    ["Este", "Empieza otra vez"],
    ["Sur", "Muévete con calidez"],
    ["Oeste", "Cierra el ciclo"],
  ] as readonly TextPair[],
  tasks: [
    { text: "Nombra la pregunta real antes de abrir la sala de tarot.", reason: "Evita que la lectura se disperse." },
    { text: "Ordena una superficie pequeña cerca de ti.", reason: "El espacio exterior mueve el espacio interior." },
    { text: "Relee el mensaje una vez antes de enviarlo.", reason: "El momento también forma parte de la señal." },
    { text: "Escribe una frase que no necesitas enviar.", reason: "No toda verdad necesita público." },
    { text: "Elige el plan que protege tu mañana.", reason: "Tu yo futuro también está en la lectura de hoy." },
  ] satisfies DailyTask[],
};

const DAILY_JA = {
  titles: [
    "やさしく進むには十分な一日。",
    "幸運は、正直な問いに寄り添います。",
    "無理に押さないとき、今日が開きます。",
    "まず小さなことがあなたの注意を求めています。",
    "形を与えると、エネルギーは扱いやすくなります。",
    "強く押すより、やわらかな計画が効きます。",
  ] as const,
  summaries: [
    "今日は答えを追うより、パターンに気づく日に向いています。大切なことをシンプルにして、カードが静かに示す場所を見てください。",
    "あなたのエネルギーは使えます。ただ、リズムが必要です。もっと明確さを求める前に、ひとつだけ終わらせましょう。",
    "周りが忙しく感じられるかもしれません。だから注意を守ってください。静かな決断は、大きな反応より遠くまで届きます。",
    "今日の助けは細部にあります。タイミング、言葉の温度、そして本当に守れる小さな約束です。",
  ] as const,
  suggestions: [
    "タロットルームに入る前に、問いを一文で書く。",
    "温かい色のものを近くに置いて、視線の支えにする。",
    "何度も考えていることを書き出し、短くする。",
    "少しやわらかな返事を選び、変化を見る。",
    "いつもの作業を、意識して少し美しくする。",
  ] as const,
  avoids: [
    "すべての沈黙を答えとして読んでしまうこと。",
    "ひとつの気分に物語全体を書かせること。",
    "ひとつを終える代わりに、三つを始めること。",
    "カードが同意するまで同じ質問を繰り返すこと。",
    "他人の時間軸から焦りを借りること。",
  ] as const,
  colors: [
    ["パールブルー", "落ち着いた返事に"],
    ["やわらかな金色", "自信を戻すために"],
    ["ローズミスト", "やさしさのために"],
    ["モスグリーン", "地に足をつけるために"],
    ["ムーンホワイト", "清らかな始まりに"],
  ] as readonly TextPair[],
  hours: [
    ["21-23時", "振り返りに向く時間"],
    ["16-18時", "決断に向く時間"],
    ["11-13時", "連絡に向く時間"],
    ["19-21時", "静かな作業に向く時間"],
  ] as readonly TextPair[],
  directions: [
    ["北", "境界線を守る"],
    ["東", "もう一度始める"],
    ["南", "温かく動く"],
    ["西", "区切りをつける"],
  ] as readonly TextPair[],
  tasks: [
    { text: "タロットルームを開く前に、本当の問いに名前をつける。", reason: "読みが散らばりにくくなります。" },
    { text: "近くの小さな面をひとつ片づける。", reason: "外の空間は内側の空間を変えます。" },
    { text: "送る前に、メッセージを一度読み返す。", reason: "タイミングもサインの一部です。" },
    { text: "送らなくていい一文を書く。", reason: "すべての真実に観客は必要ありません。" },
    { text: "明日の朝の自分を守る計画を選ぶ。", reason: "未来のあなたも今日のリーディングにいます。" },
  ] satisfies DailyTask[],
};

const DAILY_KO = {
  titles: [
    "부드럽게 나아가기 좋은 하루.",
    "행운은 솔직한 질문 쪽에 머뭅니다.",
    "억지로 밀지 않을 때 하루가 열립니다.",
    "작은 일이 먼저 당신의 주의를 원합니다.",
    "에너지는 모양이 생기면 더 잘 움직입니다.",
    "세게 밀기보다 부드러운 계획이 더 잘 맞습니다.",
  ] as const,
  summaries: [
    "오늘은 답을 쫓기보다 패턴을 알아차리기에 좋습니다. 중요한 일은 단순하게 두고, 카드가 소음을 줄일 곳을 가리키게 하세요.",
    "당신의 에너지는 쓸 수 있지만 리듬이 필요합니다. 더 많은 명확함을 바라기 전에 한 가지를 먼저 끝내세요.",
    "주변이 분주하게 느껴질 수 있으니 주의를 지켜주세요. 조용한 결정이 극적인 반응보다 더 멀리 갑니다.",
    "오늘의 도움은 디테일 안에 있습니다. 타이밍, 말투, 그리고 실제로 지킬 수 있는 작은 약속입니다.",
  ] as const,
  suggestions: [
    "타로 룸에 들어가기 전 질문을 한 문장으로 적기.",
    "따뜻한 색의 물건을 가까이에 두기.",
    "계속 맴도는 생각을 적고 더 짧게 만들기.",
    "조금 더 부드러운 답장을 고르고 변화를 보기.",
    "평범한 일을 일부러 조금 아름답게 하기.",
  ] as const,
  avoids: [
    "모든 침묵을 답으로 읽는 것.",
    "하나의 기분이 전체 이야기를 쓰게 두는 것.",
    "하나를 끝내지 않으려고 세 가지를 시작하는 것.",
    "카드가 동의할 때까지 같은 질문을 반복하는 것.",
    "다른 사람의 시간표에서 조급함을 빌려오는 것.",
  ] as const,
  colors: [
    ["펄 블루", "차분한 답장에 좋아요"],
    ["소프트 골드", "자신감을 되찾기에 좋아요"],
    ["로즈 미스트", "다정함에 좋아요"],
    ["모스 그린", "마음을 안정시키기에 좋아요"],
    ["문 화이트", "깨끗한 시작에 좋아요"],
  ] as readonly TextPair[],
  hours: [
    ["오후 9-11시", "돌아보기에 좋은 시간"],
    ["오후 4-6시", "결정하기 좋은 시간"],
    ["오전 11시-오후 1시", "메시지에 좋은 시간"],
    ["오후 7-9시", "조용한 일에 좋은 시간"],
  ] as readonly TextPair[],
  directions: [
    ["북쪽", "경계를 지키기"],
    ["동쪽", "다시 시작하기"],
    ["남쪽", "따뜻하게 움직이기"],
    ["서쪽", "마무리하기"],
  ] as readonly TextPair[],
  tasks: [
    { text: "타로 룸을 열기 전에 진짜 질문에 이름 붙이기.", reason: "리딩이 흩어지지 않게 해요." },
    { text: "가까운 작은 공간 하나를 정리하기.", reason: "바깥 공간은 안쪽 공간을 바꿉니다." },
    { text: "메시지를 보내기 전에 한 번 다시 읽기.", reason: "타이밍도 신호의 일부입니다." },
    { text: "보내지 않아도 되는 한 문장을 쓰기.", reason: "모든 진실에 관객이 필요한 건 아니에요." },
    { text: "내일 아침의 나를 보호하는 계획을 고르기.", reason: "미래의 나도 오늘의 리딩 안에 있습니다." },
  ] satisfies DailyTask[],
};

const DAILY_BY_LANGUAGE = {
  en: {
    titles: TITLES,
    summaries: SUMMARIES,
    suggestions: SUGGESTIONS,
    avoids: AVOIDS,
    colors: COLORS,
    hours: HOURS,
    directions: DIRECTIONS,
    tasks: TASKS,
  },
  zh: DAILY_ZH,
  es: DAILY_ES,
  ja: DAILY_JA,
  ko: DAILY_KO,
} satisfies Record<HintLanguage, {
  titles: readonly string[];
  summaries: readonly string[];
  suggestions: readonly string[];
  avoids: readonly string[];
  colors: readonly TextPair[];
  hours: readonly TextPair[];
  directions: readonly TextPair[];
  tasks: readonly DailyTask[];
}>;

const LUCKY_LABELS: Record<HintLanguage, { color: string; hour: string; direction: string; number: string; numberHint: string }> = {
  en: { color: "Lucky color", hour: "Best hour", direction: "Direction", number: "Number", numberHint: "Use it as a small rhythm" },
  zh: { color: "幸运色", hour: "幸运时段", direction: "幸运方位", number: "幸运数字", numberHint: "把它当作一个小节奏" },
  es: { color: "Color de suerte", hour: "Mejor hora", direction: "Dirección", number: "Número", numberHint: "Úsalo como un pequeño ritmo" },
  ja: { color: "ラッキーカラー", hour: "よい時間", direction: "方角", number: "数字", numberHint: "小さなリズムとして使う" },
  ko: { color: "행운의 색", hour: "좋은 시간", direction: "방향", number: "숫자", numberHint: "작은 리듬처럼 사용하세요" },
};

function hash(input: string): number {
  let value = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function clampScore(score: number): number {
  return Math.max(42, Math.min(96, Math.round(score)));
}

function cardRank(cardId: string): string {
  return cardId.split("-")[0] ?? "";
}

function cardBiasFor(card: DailyPull, key: DailyScoreKey): number {
  const suitBias = card.suit ? SUIT_SCORE_BIAS[card.suit][key] ?? 0 : 0;
  const majorBias = card.arcana === "major" ? MAJOR_SCORE_BIAS[card.cardId]?.[key] ?? 0 : 0;
  const rankBias = card.arcana === "minor" ? RANK_SCORE_BIAS[cardRank(card.cardId)]?.[key] ?? 0 : 0;
  const cardTexture = (hash(`${card.cardId}:${key}`) % 7) - 3;
  return suitBias + majorBias + rankBias + cardTexture;
}

function birthBiasFor(birthDetails: BirthDetails | undefined, key: DailyScoreKey): number {
  if (!birthDetails?.birthDate) return 0;

  const birthSeed = hash(
    [
      birthDetails.birthDate,
      birthDetails.birthTime ?? "unknown-time",
      birthDetails.birthPlace ?? "unknown-place",
      key,
    ].join(":"),
  );
  const hasFullerBirthData = Boolean(birthDetails.birthTime || birthDetails.birthPlace);
  const range = hasFullerBirthData ? 11 : 7;
  return (birthSeed % range) - Math.floor(range / 2);
}

function scoreFor(
  seed: number,
  key: DailyScoreKey,
  offset: number,
  card: DailyPull,
  birthDetails?: BirthDetails,
): number {
  const dailyNoise = hash(`${seed}:${key}:${offset}`) % 25;
  return clampScore(58 + dailyNoise + cardBiasFor(card, key) + birthBiasFor(birthDetails, key));
}

function pick<T>(items: readonly T[], seed: number, offset: number): T {
  return items[(seed + offset) % items.length]!;
}

export function getDailyReport({
  anonId = "guest",
  date = new Date(),
  language = "en",
  birthDetails,
}: {
  anonId?: string;
  date?: Date;
  language?: HintLanguage;
  birthDetails?: BirthDetails;
} = {}): DailyReport {
  const dateString = getLocalDateString(date);
  const seed = hash(`${anonId}:${dateString}`);
  const card = getDailyPull(date, language);
  const text = DAILY_BY_LANGUAGE[language];
  const labels = LUCKY_LABELS[language];

  const scores = SCORE_BASE.map(({ offset, ...score }) => ({
    ...score,
    label: SCORE_LABELS[language][score.key],
    score: scoreFor(seed, score.key, offset, card, birthDetails),
  }));

  const overallScore = Math.round(
    scores.reduce((total, score) => total + score.score, 0) / scores.length,
  );

  const [colorValue, colorHint] = pick(text.colors, seed, 3);
  const [hourValue, hourHint] = pick(text.hours, seed, 11);
  const [directionValue, directionHint] = pick(text.directions, seed, 23);
  const numberValue = `${(seed % 8) + 1}/${(Math.floor(seed / 8) % 8) + 1}`;

  const lucky: DailyLuckyItem[] = [
    { key: "color", label: labels.color, value: colorValue, hint: colorHint },
    { key: "hour", label: labels.hour, value: hourValue, hint: hourHint },
    { key: "direction", label: labels.direction, value: directionValue, hint: directionHint },
    {
      key: "number",
      label: labels.number,
      value: numberValue,
      hint: labels.numberHint,
    },
  ];

  const firstTask = seed % text.tasks.length;
  const tasks = Array.from({ length: 3 }, (_, i) => text.tasks[(firstTask + i) % text.tasks.length]!);

  return {
    date: dateString,
    overallScore,
    title: pick(text.titles, seed, 5),
    summary: pick(text.summaries, seed, 17),
    card,
    scores,
    lucky,
    suggestion: pick(text.suggestions, seed, 29),
    avoid: pick(text.avoids, seed, 41),
    tasks,
  };
}
