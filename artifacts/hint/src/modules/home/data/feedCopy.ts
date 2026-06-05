/**
 * Deterministic, day-seeded copy for the home feed cards. Each array is
 * indexed by the user's local calendar day so the home feels stable for the
 * whole day but quietly new tomorrow. No backend writes.
 */

import type { HintLanguage } from "../../../lib/i18n";

function localDaySeed(date: Date = new Date()): number {
  return (
    date.getFullYear() * 10_000 +
    (date.getMonth() + 1) * 100 +
    date.getDate()
  );
}

/** Salted pick — different "channels" don't all rotate together. */
function pick<T>(arr: readonly T[], salt: number): T {
  return arr[(localDaySeed() + salt) % arr.length]!;
}

const LINGERING = [
  "Something you said earlier this week is still standing in the room.",
  "You keep half-finishing the same sentence in your head.",
  "A thought you didn't quite let land is still circling.",
  "You're carrying a question you haven't asked out loud yet.",
  "There's a name in your chest you haven't said all day.",
  "You answered too quickly. Part of you is still answering.",
  "An old version of you is asking how you're doing.",
];

const COMPATIBILITY = [
  "Two charts are sitting closer than either of you admitted today.",
  "One of you is the weather; one of you is the room.",
  "There's a quiet test in this one. Don't grade it.",
  "You're translating for them. They notice.",
  "Same direction, different speed. That's not a problem yet.",
  "The thing you're not saying is the thing they're not saying.",
];

const DREAMS = [
  "A doorway opens twice. You don't go through either time.",
  "Someone hands you a key. The lock isn't yours.",
  "Water at the edge of a room that wasn't there yesterday.",
  "A house with one more room than you remember.",
  "You're driving, but it's a hallway.",
  "Light from under a door you haven't opened.",
];

const CIRCLING = [
  "You keep coming back to whether you're doing enough.",
  "It's the same question dressed in different clothes.",
  "You're orbiting a decision you've already half-made.",
  "Notice what you reach for first when you're tired.",
  "The same regret keeps tapping you on the shoulder.",
  "You're rehearsing a conversation that hasn't happened.",
];

const PROMPTS = [
  "What did today take from me that I didn't notice?",
  "Where did I make myself smaller today, and why?",
  "What am I waiting for permission to do?",
  "Who am I performing for right now?",
  "What would I do tomorrow if I trusted myself?",
  "What part of today do I want to carry into tomorrow?",
];

const GROWTH = [
  "You're softer this month than you were last month.",
  "A standard you used to defend has quietly relaxed.",
  "You're saying no with less guilt than you used to.",
  "Something you used to chase doesn't pull as hard.",
  "You're choosing rest faster than you used to.",
  "A version of you you'd outgrown is finally being put down.",
];

const LATE_NIGHT_EYEBROWS = [
  "A late-night prompt",
  "Tonight's question",
  "Sit with this",
  "One quiet question",
];

const STEPS = [
  "Put down one thing you've been holding all day.",
  "Drink a glass of water before you sleep.",
  "Write one sentence, then close the notebook.",
  "Unclench your jaw. Let your shoulders drop.",
  "Forgive yourself for one small thing today.",
  "Let tomorrow stay tomorrow for now.",
];

const ZH = {
  lingering: [
    "这周你说过的一句话，还站在房间里。",
    "你在脑子里反复说着同一句没说完的话。",
    "一个没有真正落地的念头还在绕圈。",
    "你带着一个还没有问出口的问题。",
    "今天有个名字一直放在你心口。",
    "你回答得太快了，有一部分你还在继续回答。",
    "过去的某个自己，正在问你最近好吗。",
  ],
  compatibility: [
    "两张星盘今天靠得比你们承认的更近。",
    "一个人像天气，一个人像房间。",
    "这里有个安静的考验。先别急着打分。",
    "你正在替对方翻译，他们其实有感觉到。",
    "同一个方向，不同的速度。现在还不是问题。",
    "你没说出口的，可能也是对方没说出口的。",
  ],
  dreams: [
    "一扇门打开了两次，你两次都没有进去。",
    "有人递给你一把钥匙，但那把锁不是你的。",
    "房间边缘出现了昨天没有的水。",
    "一栋房子多出一个你不记得的房间。",
    "你在开车，但路变成了走廊。",
    "一扇没打开的门下面透出光。",
  ],
  circling: [
    "你一直回到同一个问题：我做得够不够？",
    "这是同一个问题，只是换了一件衣服。",
    "你围着一个其实已经半决定的选择转圈。",
    "注意你累的时候最先伸手抓什么。",
    "同一个后悔感一直在轻轻敲你。",
    "你在排练一段还没有发生的对话。",
  ],
  prompts: [
    "今天拿走了我什么，而我没有注意到？",
    "今天我在哪里把自己缩小了，为什么？",
    "我正在等谁允许我去做什么？",
    "我现在是在表演给谁看？",
    "如果我相信自己，明天会做什么？",
    "今天的哪一部分，我想带到明天？",
  ],
  growth: [
    "这个月的你，比上个月更柔软一点。",
    "你曾经很坚持的标准，正在悄悄松开。",
    "你说“不”的时候，内疚感比以前少了。",
    "曾经很想追的东西，现在没有那么拉扯你了。",
    "你比以前更快选择休息。",
    "一个你已经长大的旧版本，终于可以放下了。",
  ],
  promptEyebrows: ["深夜提示", "今晚的问题", "和这个待一会儿", "一个安静的问题"],
  steps: [
    "放下一件你今天一直拿着的事。",
    "睡前喝一杯水。",
    "写一句话，然后合上笔记本。",
    "松开下巴，让肩膀放下来。",
    "为今天的一件小事原谅自己。",
    "让明天先留在明天。",
  ],
};

const ES = {
  lingering: [
    "Algo que dijiste esta semana sigue de pie en la habitación.",
    "Sigues terminando a medias la misma frase en tu cabeza.",
    "Un pensamiento que no dejaste caer del todo sigue dando vueltas.",
    "Llevas una pregunta que todavía no has dicho en voz alta.",
    "Hay un nombre en tu pecho que no has dicho hoy.",
    "Respondiste demasiado rápido. Una parte de ti sigue respondiendo.",
    "Una versión antigua de ti pregunta cómo estás.",
  ],
  compatibility: [
    "Dos cartas natales están más cerca de lo que ambos admitieron hoy.",
    "Uno de ustedes es el clima; el otro es la habitación.",
    "Hay una prueba silenciosa aquí. No la califiques todavía.",
    "Estás traduciendo por esa persona. Sí lo nota.",
    "Misma dirección, distinta velocidad. Todavía no es un problema.",
    "Lo que no estás diciendo quizá también es lo que esa persona calla.",
  ],
  dreams: [
    "Una puerta se abre dos veces. No cruzas ninguna.",
    "Alguien te entrega una llave. La cerradura no es tuya.",
    "Agua al borde de una habitación que ayer no estaba ahí.",
    "Una casa con una habitación más de la que recordabas.",
    "Vas conduciendo, pero el camino es un pasillo.",
    "Luz debajo de una puerta que no has abierto.",
  ],
  circling: [
    "Vuelves a preguntarte si estás haciendo suficiente.",
    "Es la misma pregunta con ropa distinta.",
    "Orbitas una decisión que ya tomaste a medias.",
    "Nota qué buscas primero cuando estás cansado.",
    "El mismo arrepentimiento sigue tocándote el hombro.",
    "Ensayas una conversación que aún no ocurre.",
  ],
  prompts: [
    "¿Qué me quitó hoy sin que me diera cuenta?",
    "¿Dónde me hice más pequeño hoy, y por qué?",
    "¿Qué estoy esperando permiso para hacer?",
    "¿Para quién estoy actuando ahora mismo?",
    "¿Qué haría mañana si confiara en mí?",
    "¿Qué parte de hoy quiero llevar a mañana?",
  ],
  growth: [
    "Este mes estás más suave que el mes pasado.",
    "Una regla que defendías se está aflojando en silencio.",
    "Dices que no con menos culpa que antes.",
    "Algo que antes perseguías ya no tira igual.",
    "Eliges descanso más rápido que antes.",
    "Una versión de ti que ya superaste por fin puede bajar la carga.",
  ],
  promptEyebrows: ["Pregunta nocturna", "La pregunta de hoy", "Quédate con esto", "Una pregunta quieta"],
  steps: [
    "Suelta una cosa que cargaste todo el día.",
    "Bebe un vaso de agua antes de dormir.",
    "Escribe una frase y cierra el cuaderno.",
    "Relaja la mandíbula. Deja caer los hombros.",
    "Perdónate por una cosa pequeña de hoy.",
    "Deja que mañana se quede en mañana por ahora.",
  ],
};

const JA = {
  lingering: [
    "今週あなたが言った一言が、まだ部屋の中に立っています。",
    "頭の中で同じ文を半分だけ終わらせています。",
    "きちんと着地させなかった思いが、まだ回っています。",
    "まだ声にしていない問いを抱えています。",
    "今日は一日、胸の中にある名前がありました。",
    "答えが早すぎました。あなたの一部はまだ答えています。",
    "昔のあなたが、最近どうしているか尋ねています。",
  ],
  compatibility: [
    "二つのチャートは、今日あなたたちが認めたより近くにあります。",
    "ひとりは天気で、ひとりは部屋です。",
    "ここには静かなテストがあります。まだ採点しないで。",
    "あなたは相手のために翻訳しています。相手は気づいています。",
    "同じ方向、違う速さ。今はまだ問題ではありません。",
    "あなたが言っていないことは、相手も言っていないことかもしれません。",
  ],
  dreams: [
    "扉が二度開きます。あなたはどちらも通りません。",
    "誰かが鍵を渡します。でもその鍵穴はあなたのものではありません。",
    "昨日はなかった水が、部屋の端にあります。",
    "覚えているより一部屋多い家。",
    "運転しているのに、道は廊下です。",
    "まだ開けていない扉の下から光が漏れています。",
  ],
  circling: [
    "十分にやれているのか、何度も戻ってきます。",
    "同じ問いが違う服を着ています。",
    "半分決めている選択の周りを回っています。",
    "疲れたとき、最初に何へ手を伸ばすか見てください。",
    "同じ後悔が肩をたたいています。",
    "まだ起きていない会話を練習しています。",
  ],
  prompts: [
    "今日、気づかないうちに何を失いましたか？",
    "今日、どこで自分を小さくしましたか。なぜですか？",
    "何をする許可を待っていますか？",
    "今、誰のために演じていますか？",
    "自分を信じるなら、明日何をしますか？",
    "今日のどの部分を明日へ持っていきたいですか？",
  ],
  growth: [
    "今月のあなたは、先月より少しやわらかいです。",
    "守っていた基準が、静かにほどけています。",
    "以前より少ない罪悪感で、ノーと言えています。",
    "追いかけていたものの力が、少し弱くなっています。",
    "前より早く休みを選べています。",
    "もう卒業した昔のあなたを、やっと下ろせます。",
  ],
  promptEyebrows: ["夜の問い", "今夜の質問", "これと座る", "静かな問い"],
  steps: [
    "一日中抱えていたものをひとつ置く。",
    "眠る前に水を一杯飲む。",
    "一文だけ書いて、ノートを閉じる。",
    "顎の力を抜いて、肩を落とす。",
    "今日の小さなことをひとつ許す。",
    "明日のことは、今は明日に置いておく。",
  ],
};

const KO = {
  lingering: [
    "이번 주에 했던 말 하나가 아직 방 안에 서 있습니다.",
    "머릿속에서 같은 문장을 계속 반쯤 끝내고 있어요.",
    "제대로 내려놓지 못한 생각이 아직 맴돕니다.",
    "아직 소리 내어 묻지 않은 질문을 들고 있습니다.",
    "오늘 하루 가슴 안에 말하지 않은 이름이 있었습니다.",
    "너무 빨리 대답했어요. 당신의 일부는 아직 대답 중입니다.",
    "예전의 당신이 요즘 어떻게 지내냐고 묻고 있습니다.",
  ],
  compatibility: [
    "두 차트가 오늘 인정한 것보다 더 가까이 앉아 있습니다.",
    "한 사람은 날씨이고, 한 사람은 방입니다.",
    "여기에는 조용한 시험이 있습니다. 아직 점수 매기지 마세요.",
    "당신은 그 사람을 위해 번역하고 있어요. 그 사람도 느낍니다.",
    "같은 방향, 다른 속도. 아직 문제는 아닙니다.",
    "당신이 말하지 않는 것이 그 사람도 말하지 않는 것일 수 있어요.",
  ],
  dreams: [
    "문이 두 번 열립니다. 당신은 두 번 다 지나가지 않습니다.",
    "누군가 열쇠를 건넵니다. 하지만 그 자물쇠는 당신 것이 아닙니다.",
    "어제는 없던 물이 방 가장자리에 있습니다.",
    "기억보다 방이 하나 더 많은 집.",
    "운전하고 있는데 길이 복도입니다.",
    "열지 않은 문 밑에서 빛이 새어 나옵니다.",
  ],
  circling: [
    "내가 충분히 하고 있는지 계속 돌아옵니다.",
    "같은 질문이 다른 옷을 입고 있습니다.",
    "이미 반쯤 정한 결정을 빙빙 돌고 있습니다.",
    "피곤할 때 가장 먼저 무엇을 찾는지 보세요.",
    "같은 후회가 계속 어깨를 두드립니다.",
    "아직 일어나지 않은 대화를 연습하고 있습니다.",
  ],
  prompts: [
    "오늘 내가 알아차리지 못한 채 잃은 것은 무엇인가요?",
    "오늘 어디에서 나를 작게 만들었고, 왜 그랬나요?",
    "나는 무엇을 하려고 허락을 기다리고 있나요?",
    "지금 나는 누구를 위해 연기하고 있나요?",
    "나를 믿는다면 내일 무엇을 할까요?",
    "오늘의 어떤 부분을 내일로 가져가고 싶나요?",
  ],
  growth: [
    "이번 달의 당신은 지난달보다 조금 더 부드럽습니다.",
    "예전에는 지키려 했던 기준이 조용히 느슨해지고 있습니다.",
    "예전보다 덜 죄책감 느끼며 아니라고 말하고 있어요.",
    "쫓아가던 것이 예전만큼 세게 당기지 않습니다.",
    "전보다 더 빨리 휴식을 선택하고 있습니다.",
    "이미 지나온 예전의 당신을 이제 내려놓을 수 있습니다.",
  ],
  promptEyebrows: ["늦은 밤 질문", "오늘 밤의 질문", "이것과 함께 있기", "조용한 질문"],
  steps: [
    "하루 종일 들고 있던 것 하나를 내려놓기.",
    "잠들기 전에 물 한 잔 마시기.",
    "한 문장을 쓰고 노트를 닫기.",
    "턱의 힘을 풀고 어깨를 내려놓기.",
    "오늘의 작은 일 하나를 용서하기.",
    "내일은 잠시 내일에 두기.",
  ],
};

const COPY_BY_LANGUAGE = {
  en: null,
  zh: ZH,
  es: ES,
  ja: JA,
  ko: KO,
} satisfies Record<HintLanguage, typeof ZH | null>;

export interface FeedCopy {
  lingering: string;
  compatibility: string;
  dream: string;
  circling: string;
  prompt: string;
  promptEyebrow: string;
  growth: string;
  step: string;
}

export function getFeedCopy(language: HintLanguage = "en"): FeedCopy {
  const source = COPY_BY_LANGUAGE[language];
  return {
    lingering: pick(source?.lingering ?? LINGERING, 11),
    compatibility: pick(source?.compatibility ?? COMPATIBILITY, 23),
    dream: pick(source?.dreams ?? DREAMS, 37),
    circling: pick(source?.circling ?? CIRCLING, 53),
    prompt: pick(source?.prompts ?? PROMPTS, 71),
    promptEyebrow: pick(source?.promptEyebrows ?? LATE_NIGHT_EYEBROWS, 89),
    growth: pick(source?.growth ?? GROWTH, 103),
    step: pick(source?.steps ?? STEPS, 117),
  };
}
