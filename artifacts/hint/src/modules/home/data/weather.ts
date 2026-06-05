import type {
  DimensionKey,
  DimensionScore,
  EmotionalWeather,
} from "../types/home.types";
import type { HintLanguage } from "../../../lib/i18n";

/** Five life-area dimensions, in the order they appear under the hero. */
const DIMENSIONS: { key: DimensionKey; salt: number }[] = [
  { key: "love", salt: 17 },
  { key: "wealth", salt: 31 },
  { key: "work", salt: 53 },
  { key: "mind", salt: 71 },
  { key: "people", salt: 97 },
];

const DIMENSION_LABELS: Record<HintLanguage, Record<DimensionKey, string>> = {
  en: { love: "Love", wealth: "Wealth", work: "Work", mind: "Mind", people: "People" },
  zh: { love: "爱情", wealth: "财富", work: "事业", mind: "思绪", people: "人际" },
  es: { love: "Amor", wealth: "Recursos", work: "Trabajo", mind: "Mente", people: "Vínculos" },
  ja: { love: "恋愛", wealth: "お金", work: "仕事", mind: "思考", people: "人間関係" },
  ko: { love: "사랑", wealth: "재정", work: "일", mind: "마음", people: "관계" },
};

interface Band {
  label: string;
  /** A pool of one-liners; the day-of-year picks one deterministically. */
  lines: string[];
  /** Quieter follow-up sentences that ground the top line. */
  sublines: string[];
  /** Min/max clarity score for this band (the day seed picks a value). */
  clarityRange: [number, number];
}

/** Time-of-day bands. Each carries its own palette of one-liners. */
const BANDS: { from: number; to: number; band: Band }[] = [
  {
    from: 0,
    to: 5,
    band: {
      label: "Liminal hours",
      lines: [
        "The kind of late that opens things you keep closed in the daylight.",
        "Most of the city is asleep. The thought you've been avoiding is not.",
        "The hour where what you feel sounds louder than what you've said.",
        "The room is quiet enough now to hear what was already there.",
        "Nothing is asking anything of you for a little while.",
        "The night isn't empty. It's listening.",
      ],
      sublines: [
        "Stay a while. The signal is clearer down here.",
        "Whatever surfaces now is worth writing down.",
        "Move slowly. There's no morning yet to perform for.",
      ],
      clarityRange: [72, 94],
    },
  },
  {
    from: 5,
    to: 10,
    band: {
      label: "Quiet opening",
      lines: [
        "The day hasn't claimed you yet. There is still a little soft.",
        "Something is starting, even if you can't name it.",
        "Slow morning. Stay with yourself a moment longer.",
        "The world has not asked anything of you yet today.",
        "First light tends to be honest. Let it find you.",
      ],
      sublines: [
        "A small inside question goes further than coffee today.",
        "Pick one thing the morning is allowed to hold.",
        "Don't rush the first hour. It sets the rest.",
      ],
      clarityRange: [60, 80],
    },
  },
  {
    from: 10,
    to: 15,
    band: {
      label: "Open sky",
      lines: [
        "Mid-day. Loud outside. You're allowed an inside room.",
        "The bright hours can also be lonely. That isn't a flaw in you.",
        "What are you carrying that you haven't put down yet today?",
        "The day is open. So are you, if you let it be true.",
      ],
      sublines: [
        "Step out of the noise for a minute. It will still be there.",
        "Your inside weather doesn't have to match the sky.",
        "One honest pause changes the afternoon.",
      ],
      clarityRange: [54, 74],
    },
  },
  {
    from: 15,
    to: 20,
    band: {
      label: "Golden hour",
      lines: [
        "The light goes soft and so does most of what you've been pushing.",
        "Something is about to turn — the day, the mood, the weather of you.",
        "The hour where the day stops asking and starts settling.",
        "Late afternoon honesty. Quieter than morning, kinder than night.",
      ],
      sublines: [
        "Notice what eases first. That's what you needed.",
        "Let the day exhale before you do.",
        "A good question would land well right now.",
      ],
      clarityRange: [66, 86],
    },
  },
  {
    from: 20,
    to: 24,
    band: {
      label: "Soft dark",
      lines: [
        "Evening. The shape of the day is starting to show itself.",
        "Whatever you didn't finish today is allowed to wait.",
        "The hour you usually pretend you aren't tired. You are.",
        "The night is starting. You're allowed to slow down for it.",
      ],
      sublines: [
        "Close one tab. Close one thought. Close one loop.",
        "Tonight is for tending, not finishing.",
        "Let the room get a little smaller around you.",
      ],
      clarityRange: [68, 88],
    },
  },
];

const LOCALIZED_BANDS: Partial<Record<HintLanguage, Record<string, Pick<Band, "label" | "lines" | "sublines">>>> = {
  zh: {
    "Liminal hours": {
      label: "临界时刻",
      lines: [
        "很晚的时间，会把白天关起来的东西慢慢打开。",
        "大多数城市已经睡了，你一直避开的念头还醒着。",
        "这个时刻，感受比你说出口的话更响。",
        "房间终于够安静，可以听见本来就在的东西。",
        "暂时没有什么在要求你。",
        "夜晚不是空的，它在听。",
      ],
      sublines: [
        "多停一会儿，信号在这里会清楚一点。",
        "现在浮上来的东西，值得写下来。",
        "慢一点。早晨还没有来催你表现。",
      ],
    },
    "Quiet opening": {
      label: "安静开场",
      lines: [
        "今天还没有完全接管你，柔软的余地还在。",
        "某件事正在开始，即使你还叫不出名字。",
        "慢一点的早晨，先和自己待久一点。",
        "世界还没有正式向你提出要求。",
        "第一道光通常很诚实，让它找到你。",
      ],
      sublines: [
        "一个小小的内在问题，今天比咖啡更有用。",
        "给早晨一个可以承接的主题就够了。",
        "别急着进入第一小时，它会影响后面的节奏。",
      ],
    },
    "Open sky": {
      label: "开阔白昼",
      lines: [
        "中午很亮，外面很吵。你仍然可以给自己一间里面的房间。",
        "明亮的时段也可能让人孤单，这不是你的缺陷。",
        "今天你还拿着什么，一直没有放下？",
        "白天是打开的。如果你愿意，你也可以是。",
      ],
      sublines: [
        "从噪音里退出来一分钟，它还会在那里。",
        "你的内在天气不必和天空一致。",
        "一个诚实的停顿，会改变下午的走向。",
      ],
    },
    "Golden hour": {
      label: "金色时段",
      lines: [
        "光变柔了，你一直用力推着的东西也开始松动。",
        "有些东西正要转向：白天、心情，或你自己的天气。",
        "这是白天停止要求你、开始沉淀的时刻。",
        "傍晚的诚实，比早晨安静，比夜晚温柔。",
      ],
      sublines: [
        "先留意哪里变轻了，那就是你真正需要的地方。",
        "让白天先呼一口气，你再跟上。",
        "现在很适合让一个好问题落下来。",
      ],
    },
    "Soft dark": {
      label: "柔和夜色",
      lines: [
        "夜晚到了，今天的形状开始显出来。",
        "今天没完成的事，可以先等一等。",
        "这是你常常假装自己不累的时刻。其实你累了。",
        "夜晚开始了，你可以跟着慢下来。",
      ],
      sublines: [
        "关掉一个页面，也关掉一个念头和一个循环。",
        "今晚适合照顾，不适合硬撑完成。",
        "让房间小一点，让你自己回来一点。",
      ],
    },
  },
  es: {
    "Liminal hours": {
      label: "Horas liminales",
      lines: [
        "Esta hora abre lo que mantienes cerrado durante el día.",
        "Casi toda la ciudad duerme. El pensamiento que evitas no.",
        "Aquí lo que sientes suena más fuerte que lo que dijiste.",
        "La habitación está lo bastante quieta para oír lo que ya estaba ahí.",
        "Nada te está pidiendo nada por un rato.",
        "La noche no está vacía. Está escuchando.",
      ],
      sublines: [
        "Quédate un poco. La señal es más clara aquí abajo.",
        "Lo que aparece ahora merece ser escrito.",
        "Muévete despacio. La mañana aún no viene a pedirte rendimiento.",
      ],
    },
    "Quiet opening": {
      label: "Apertura tranquila",
      lines: [
        "El día todavía no te ha tomado del todo. Queda algo suave.",
        "Algo está empezando, aunque aún no puedas nombrarlo.",
        "Mañana lenta. Quédate contigo un momento más.",
        "El mundo todavía no te ha pedido nada hoy.",
        "La primera luz suele ser honesta. Deja que te encuentre.",
      ],
      sublines: [
        "Una pequeña pregunta interior llega más lejos que el café hoy.",
        "Elige una cosa que la mañana pueda sostener.",
        "No apresures la primera hora. Marca el resto.",
      ],
    },
    "Open sky": {
      label: "Cielo abierto",
      lines: [
        "Mediodía. Ruido afuera. Aun así puedes tener una habitación interior.",
        "Las horas brillantes también pueden sentirse solas. Eso no es un defecto tuyo.",
        "¿Qué cargas hoy que todavía no has dejado en el suelo?",
        "El día está abierto. Tú también, si lo dejas ser verdad.",
      ],
      sublines: [
        "Sal del ruido un minuto. Seguirá ahí.",
        "Tu clima interior no tiene que parecerse al cielo.",
        "Una pausa honesta cambia la tarde.",
      ],
    },
    "Golden hour": {
      label: "Hora dorada",
      lines: [
        "La luz se suaviza, y también mucho de lo que estabas empujando.",
        "Algo está por girar: el día, el ánimo, tu propio clima.",
        "La hora en que el día deja de pedir y empieza a asentarse.",
        "Honestidad de tarde. Más quieta que la mañana, más amable que la noche.",
      ],
      sublines: [
        "Observa qué se afloja primero. Eso era lo que necesitabas.",
        "Deja que el día exhale antes que tú.",
        "Una buena pregunta caería bien ahora.",
      ],
    },
    "Soft dark": {
      label: "Oscuridad suave",
      lines: [
        "Noche. La forma del día empieza a mostrarse.",
        "Lo que no terminaste hoy puede esperar.",
        "La hora en que finges que no estás cansado. Sí lo estás.",
        "La noche empieza. Puedes bajar el ritmo con ella.",
      ],
      sublines: [
        "Cierra una pestaña. Cierra un pensamiento. Cierra un ciclo.",
        "Esta noche es para cuidar, no para terminar.",
        "Deja que la habitación se haga un poco más pequeña alrededor de ti.",
      ],
    },
  },
  ja: {
    "Liminal hours": {
      label: "境目の時間",
      lines: [
        "昼間は閉じていたものが、この遅い時間に少し開きます。",
        "街のほとんどは眠っています。でも避けていた思いは眠っていません。",
        "この時間は、言ったことより感じていることのほうが大きく聞こえます。",
        "部屋が静かになり、もともとそこにあったものが聞こえます。",
        "しばらくは、何もあなたに求めていません。",
        "夜は空っぽではありません。聞いています。",
      ],
      sublines: [
        "少し留まって。ここでは合図が澄んでいます。",
        "今浮かぶものは、書き留める価値があります。",
        "ゆっくりで大丈夫。朝はまだ来ていません。",
      ],
    },
    "Quiet opening": {
      label: "静かなはじまり",
      lines: [
        "一日はまだあなたを完全にはつかんでいません。柔らかさが残っています。",
        "名前をつけられなくても、何かが始まっています。",
        "ゆっくりした朝。もう少し自分のそばにいてください。",
        "世界はまだ今日、あなたに何も求めていません。",
        "最初の光は正直です。見つけてもらいましょう。",
      ],
      sublines: [
        "今日は、小さな内側の問いのほうがコーヒーより遠くまで届きます。",
        "朝に持たせるものを一つだけ選んでください。",
        "最初の一時間を急がないで。そこが一日の調子を作ります。",
      ],
    },
    "Open sky": {
      label: "開いた空",
      lines: [
        "昼。外は明るく騒がしい。それでも内側の部屋は持てます。",
        "明るい時間にも孤独はあります。それはあなたの欠点ではありません。",
        "今日、まだ置けていない荷物は何ですか。",
        "一日は開いています。あなたも、そうしていいのなら。",
      ],
      sublines: [
        "一分だけ音から離れてください。音はまだそこにあります。",
        "内側の天気は、空と同じでなくて大丈夫です。",
        "正直なひと休みが、午後を変えます。",
      ],
    },
    "Golden hour": {
      label: "金色の時間",
      lines: [
        "光が柔らかくなり、押していたものも少しほどけます。",
        "何かが向きを変えようとしています。一日、気分、あなたの天気。",
        "一日が求めるのをやめ、落ち着き始める時間です。",
        "夕方の正直さ。朝より静かで、夜よりやさしい。",
      ],
      sublines: [
        "最初に軽くなる場所を見てください。そこが必要だった場所です。",
        "あなたより先に、一日に息を吐かせましょう。",
        "今なら、よい問いが静かに届きます。",
      ],
    },
    "Soft dark": {
      label: "やわらかな夜",
      lines: [
        "夜。一日の形が見え始めています。",
        "今日終わらなかったことは、待っていてもらえます。",
        "疲れていないふりをしがちな時間です。本当は疲れています。",
        "夜が始まりました。あなたも少しゆっくりしていいです。",
      ],
      sublines: [
        "タブを一つ閉じて。思考を一つ閉じて。輪を一つ閉じて。",
        "今夜は終わらせるより、整えるための時間です。",
        "部屋を少し小さくして、自分に戻ってください。",
      ],
    },
  },
  ko: {
    "Liminal hours": {
      label: "경계의 시간",
      lines: [
        "낮 동안 닫아두었던 것이 이 늦은 시간에 조금 열립니다.",
        "도시는 대부분 잠들었지만, 피하던 생각은 깨어 있어요.",
        "이 시간에는 말한 것보다 느낀 것이 더 크게 들립니다.",
        "방이 충분히 조용해져서, 원래 있던 것을 들을 수 있어요.",
        "잠시 동안은 아무것도 당신에게 요구하지 않습니다.",
        "밤은 비어 있지 않아요. 듣고 있습니다.",
      ],
      sublines: [
        "조금 머물러 보세요. 신호가 여기서 더 또렷합니다.",
        "지금 떠오르는 것은 적어둘 만합니다.",
        "천천히 움직여도 돼요. 아침은 아직 오지 않았습니다.",
      ],
    },
    "Quiet opening": {
      label: "조용한 시작",
      lines: [
        "하루가 아직 당신을 완전히 가져가지 않았어요. 부드러움이 남아 있습니다.",
        "이름 붙이지 못해도 무언가 시작되고 있어요.",
        "느린 아침입니다. 자신 곁에 조금 더 머물러 보세요.",
        "세상은 아직 오늘 당신에게 아무것도 요구하지 않았습니다.",
        "첫빛은 보통 정직합니다. 그 빛이 당신을 찾게 두세요.",
      ],
      sublines: [
        "오늘은 작은 내면의 질문이 커피보다 멀리 갑니다.",
        "아침이 안고 갈 수 있는 것 하나만 고르세요.",
        "첫 시간을 서두르지 마세요. 나머지 리듬을 만듭니다.",
      ],
    },
    "Open sky": {
      label: "열린 하늘",
      lines: [
        "한낮입니다. 바깥은 시끄럽지만, 안쪽 방은 여전히 만들 수 있어요.",
        "밝은 시간에도 외로움은 올 수 있습니다. 당신의 결함이 아니에요.",
        "오늘 아직 내려놓지 못한 것은 무엇인가요?",
        "하루는 열려 있습니다. 당신도, 그렇게 허락한다면요.",
      ],
      sublines: [
        "소음에서 잠깐 물러나세요. 소음은 그대로 있을 거예요.",
        "내면의 날씨가 하늘과 같을 필요는 없습니다.",
        "정직한 한 번의 멈춤이 오후를 바꿉니다.",
      ],
    },
    "Golden hour": {
      label: "금빛 시간",
      lines: [
        "빛이 부드러워지고, 밀어붙이던 것들도 조금 느슨해집니다.",
        "무언가 방향을 바꾸려 합니다. 하루, 기분, 당신의 날씨.",
        "하루가 요구하기를 멈추고 가라앉기 시작하는 시간입니다.",
        "늦은 오후의 정직함. 아침보다 조용하고 밤보다 다정합니다.",
      ],
      sublines: [
        "먼저 가벼워지는 곳을 보세요. 그곳이 필요했던 자리입니다.",
        "당신보다 먼저 하루가 숨을 내쉬게 두세요.",
        "지금은 좋은 질문이 잘 내려앉는 시간입니다.",
      ],
    },
    "Soft dark": {
      label: "부드러운 밤",
      lines: [
        "저녁입니다. 하루의 모양이 드러나기 시작합니다.",
        "오늘 끝내지 못한 것은 기다려도 됩니다.",
        "피곤하지 않은 척하기 쉬운 시간입니다. 사실은 피곤해요.",
        "밤이 시작되었습니다. 그 속도에 맞춰 천천히 내려와도 됩니다.",
      ],
      sublines: [
        "탭 하나를 닫고, 생각 하나를 닫고, 고리 하나를 닫으세요.",
        "오늘 밤은 끝내는 시간보다 돌보는 시간입니다.",
        "방을 조금 더 작게 만들고, 자신에게 돌아오세요.",
      ],
    },
  },
};

function bandFor(hour: number): Band {
  for (const b of BANDS) {
    if (hour >= b.from && hour < b.to) return b.band;
  }
  return BANDS[0]!.band;
}

function localizeBand(band: Band, language: HintLanguage): Band {
  const localized = LOCALIZED_BANDS[language]?.[band.label];
  return localized ? { ...band, ...localized } : band;
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Stable integer seed from the user's *local* calendar day. */
function localDaySeed(date: Date): number {
  return (
    date.getFullYear() * 10_000 +
    (date.getMonth() + 1) * 100 +
    date.getDate()
  );
}

/**
 * Deterministic per-day dimension score in 55–96. Seeded by the local
 * calendar day so all five bars are stable for the whole day, but each
 * dimension has its own salt so they don't all move together.
 */
function dimensionScore(daySeed: number, salt: number): number {
  const n = (daySeed * 131 + salt * 1009) >>> 0;
  return 55 + (n % 42); // 55..96
}

/** Deterministic weather for "now" — same local hour + local date = same result. */
export function getEmotionalWeather(now: Date = new Date(), language: HintLanguage = "en"): EmotionalWeather {
  const hour = now.getHours();
  const band = localizeBand(bandFor(hour), language);
  const day = localDaySeed(now);
  const seed = day + hour * 7;
  const line = band.lines[seed % band.lines.length]!;
  const subline = band.sublines[(seed * 3) % band.sublines.length]!;
  const [lo, hi] = band.clarityRange;
  const clarityScore = lo + ((seed * 11) % (hi - lo + 1));
  const dimensions: DimensionScore[] = DIMENSIONS.map((d) => ({
    key: d.key,
    label: DIMENSION_LABELS[language][d.key],
    score: dimensionScore(day, d.salt),
  }));
  return {
    label: band.label,
    line,
    subline,
    clarityScore,
    dimensions,
    hour,
    date: isoDate(now),
  };
}
