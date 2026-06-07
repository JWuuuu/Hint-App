/**
 * Deterministic-by-date Daily Card. MVP rules:
 * - full 78-card tarot deck
 * - upright only
 * - one stable card per local calendar day
 */

import type { HintLanguage } from "../../../lib/i18n";
import type { DailyPull } from "../types/home.types";

interface MajorEntry {
  id: string;
  name: string;
  whisper: string;
}

type DailyDeckEntry = MajorEntry &
  Required<
    Pick<
      DailyPull,
      | "arcana"
      | "orientation"
      | "keyword"
      | "do"
      | "avoid"
      | "love"
      | "work"
      | "self"
      | "themeNote"
    >
  > &
  Pick<DailyPull, "suit">;

type MajorDetail = Omit<
  DailyDeckEntry,
  "id" | "name" | "whisper" | "arcana" | "orientation" | "suit"
>;

const MAJORS: MajorEntry[] = [
  { id: "0-fool",          name: "The Fool",          whisper: "Tonight, something in you is at an edge. Don't talk yourself out of it yet." },
  { id: "1-magician",      name: "The Magician",      whisper: "You already have more in your hands than you've admitted." },
  { id: "2-high-priestess",name: "The High Priestess",whisper: "Stop asking. You already know what tonight is asking of you." },
  { id: "3-empress",       name: "The Empress",       whisper: "Something quiet in you is still growing. Don't trample it for being slow." },
  { id: "4-emperor",       name: "The Emperor",       whisper: "Tonight is asking you to choose your own structure, not borrow someone else's." },
  { id: "5-hierophant",    name: "The Hierophant",    whisper: "An old rule of yours is up for review. Sit with it before you obey it again." },
  { id: "6-lovers",        name: "The Lovers",        whisper: "A choice between two things you love. Neither is wrong. One is yours." },
  { id: "7-chariot",       name: "The Chariot",       whisper: "Drive your own day. You'll feel different by morning if you do." },
  { id: "8-strength",      name: "Strength",          whisper: "Be gentler with the part of you that's been working the hardest." },
  { id: "9-hermit",        name: "The Hermit",        whisper: "Tonight is for the small lamp, not the loud room. Stay in." },
  { id: "10-wheel",        name: "Wheel of Fortune",  whisper: "Something is turning. You don't have to push it; you have to notice it." },
  { id: "11-justice",      name: "Justice",           whisper: "Tell yourself the truth before you ask anyone else for theirs." },
  { id: "12-hanged-man",   name: "The Hanged Man",    whisper: "You're stuck because you're seeing it from one side. Hang upside down for a minute." },
  { id: "13-death",        name: "Death",             whisper: "A small ending is asking for honesty, not panic. Let it close." },
  { id: "14-temperance",   name: "Temperance",        whisper: "Neither extreme is yours tonight. Walk the middle without apology." },
  { id: "15-devil",        name: "The Devil",         whisper: "What you call habit is asking to be looked at, not punished." },
  { id: "16-tower",        name: "The Tower",         whisper: "Something is falling that needed to. You don't have to catch it." },
  { id: "17-star",         name: "The Star",          whisper: "Hope is allowed back. Even small. Even just for tonight." },
  { id: "18-moon",         name: "The Moon",          whisper: "Not all of it is clear yet. You don't owe yourself a conclusion tonight." },
  { id: "19-sun",          name: "The Sun",           whisper: "A small clean thing today. Don't make it more complicated than it is." },
  { id: "20-judgement",    name: "Judgement",         whisper: "Something is calling you back to yourself. Listen before you answer." },
  { id: "21-world",        name: "The World",         whisper: "A chapter has quietly finished. Mark it before you move on." },
];

const MAJOR_DETAILS: Record<string, MajorDetail> = {
  "0-fool": {
    keyword: "Beginning · trust · lightness",
    do: "Take one low-risk first step.",
    avoid: "Demanding a perfect plan before you begin.",
    love: "Stay open without rushing the label.",
    work: "Test the idea in a small, visible way.",
    self: "Let curiosity lead before fear edits it.",
    themeNote: "Major Arcana: today's card carries a bigger message, but it still lands through one simple choice.",
  },
  "1-magician": {
    keyword: "Will · skill · focus",
    do: "Use what is already in your hands.",
    avoid: "Waiting for someone else to validate your ability.",
    love: "Say the thing clearly instead of hinting around it.",
    work: "Turn scattered tools into one finished action.",
    self: "Notice where you are more capable than you admit.",
    themeNote: "Major Arcana: today has a bigger message about agency and intention.",
  },
  "2-high-priestess": {
    keyword: "Intuition · silence · inner knowing",
    do: "Give yourself a quiet pause before answering.",
    avoid: "Overexplaining a feeling that is still forming.",
    love: "Listen for what is not being said.",
    work: "Read the room before moving the plan.",
    self: "Trust the signal your body keeps repeating.",
    themeNote: "Major Arcana: today's bigger message is subtle, private, and worth protecting.",
  },
  "3-empress": {
    keyword: "Growth · care · abundance",
    do: "Feed the thing you want to grow.",
    avoid: "Calling something failed because it is slow.",
    love: "Lead with warmth, not performance.",
    work: "Make the workspace easier to return to.",
    self: "Choose one comfort that actually restores you.",
    themeNote: "Major Arcana: today asks you to take growth seriously without forcing it.",
  },
  "4-emperor": {
    keyword: "Structure · boundaries · order",
    do: "Set one clear rule for your day.",
    avoid: "Borrowing pressure from someone else's timeline.",
    love: "Name the boundary kindly and directly.",
    work: "Make the next step concrete and scheduled.",
    self: "Stability can be caring, not cold.",
    themeNote: "Major Arcana: today's bigger message is about building a frame that supports you.",
  },
  "5-hierophant": {
    keyword: "Guidance · tradition · belief",
    do: "Question one rule before you follow it.",
    avoid: "Confusing old approval with current truth.",
    love: "Notice which expectations belong to you.",
    work: "Ask for guidance, then adapt it to reality.",
    self: "Keep the wisdom; release the automatic obedience.",
    themeNote: "Major Arcana: today may highlight a pattern, belief, or teacher.",
  },
  "6-lovers": {
    keyword: "Choice · alignment · bond",
    do: "Choose the option you can stand behind.",
    avoid: "Trying to keep every door open out of fear.",
    love: "Let alignment matter more than intensity.",
    work: "Pick the priority that matches the bigger goal.",
    self: "Check whether your choice respects your values.",
    themeNote: "Major Arcana: today's bigger message is about alignment, not just attraction.",
  },
  "7-chariot": {
    keyword: "Direction · drive · control",
    do: "Move one thing forward with intention.",
    avoid: "Letting friction decide the whole day.",
    love: "Keep the conversation pointed toward repair.",
    work: "Choose the route and commit to the first mile.",
    self: "Your energy needs direction, not more pressure.",
    themeNote: "Major Arcana: today asks you to steer instead of drift.",
  },
  "8-strength": {
    keyword: "Courage · patience · heart",
    do: "Use gentleness where you usually use force.",
    avoid: "Mistaking harshness for discipline.",
    love: "Soften the tone without hiding the truth.",
    work: "Handle the difficult task in smaller breaths.",
    self: "Be patient with the part of you that is tired.",
    themeNote: "Major Arcana: today's bigger message is quiet strength, not domination.",
  },
  "9-hermit": {
    keyword: "Solitude · truth · reflection",
    do: "Make space to hear your own answer.",
    avoid: "Filling silence just because it feels awkward.",
    love: "Take space without disappearing.",
    work: "Protect one block for deep focus.",
    self: "Let quiet become information.",
    themeNote: "Major Arcana: today carries a bigger message through privacy and reflection.",
  },
  "10-wheel": {
    keyword: "Cycle · timing · change",
    do: "Notice what is turning before you push.",
    avoid: "Treating a mood shift like a final verdict.",
    love: "Let the dynamic breathe before naming it forever.",
    work: "Adapt to the timing instead of fighting it.",
    self: "Change is information, not proof you failed.",
    themeNote: "Major Arcana: today's bigger message is about timing and cycles.",
  },
  "11-justice": {
    keyword: "Truth · balance · accountability",
    do: "Make the fair choice, even if it is small.",
    avoid: "Skipping the honest part to keep things easy.",
    love: "Speak plainly and listen just as plainly.",
    work: "Check the details before you decide.",
    self: "Accountability can feel clean, not punishing.",
    themeNote: "Major Arcana: today may bring a bigger message about truth and consequences.",
  },
  "12-hanged-man": {
    keyword: "Pause · perspective · surrender",
    do: "Try one different angle before acting.",
    avoid: "Forcing movement just to escape discomfort.",
    love: "Let a pause reveal what the push cannot.",
    work: "Reframe the blocker instead of attacking it.",
    self: "Stillness can be active when it changes your view.",
    themeNote: "Major Arcana: today's bigger message may arrive through waiting.",
  },
  "13-death": {
    keyword: "Ending · release · change",
    do: "Close one thing honestly.",
    avoid: "Dragging out what has already ended.",
    love: "Release the version of the story that no longer fits.",
    work: "Retire an approach that is costing too much.",
    self: "Let an old self-image fall away gently.",
    themeNote: "Major Arcana: today has a bigger message about release and renewal.",
  },
  "14-temperance": {
    keyword: "Balance · healing · patience",
    do: "Blend two needs instead of choosing an extreme.",
    avoid: "Overcorrecting because you feel behind.",
    love: "Choose moderation over a dramatic test.",
    work: "Pace the task so it can actually finish.",
    self: "Healing may look like steadiness today.",
    themeNote: "Major Arcana: today's bigger message is balance that lasts.",
  },
  "15-devil": {
    keyword: "Pattern · attachment · honesty",
    do: "Name the habit without shaming yourself.",
    avoid: "Calling a loop your personality.",
    love: "Watch the pull between desire and control.",
    work: "Set a limit around the distraction.",
    self: "Awareness is the first way out.",
    themeNote: "Major Arcana: today may show a bigger pattern so you can loosen it.",
  },
  "16-tower": {
    keyword: "Truth · disruption · clearing",
    do: "Let the unstable part tell you what it needs.",
    avoid: "Trying to save a structure that keeps cracking.",
    love: "Be honest about what no longer feels safe or true.",
    work: "Fix the root issue, not only the visible mess.",
    self: "A clear break can create room to rebuild.",
    themeNote: "Major Arcana: today's bigger message may feel sudden, but it clears space.",
  },
  "17-star": {
    keyword: "Hope · renewal · inspiration",
    do: "Let one hopeful action be enough.",
    avoid: "Rejecting comfort because it feels too small.",
    love: "Reach for the softer, more generous read.",
    work: "Begin again with a cleaner expectation.",
    self: "Trust the process before it proves itself.",
    themeNote: "Major Arcana: today carries a bigger message of renewal and faith.",
  },
  "18-moon": {
    keyword: "Uncertainty · dream · intuition",
    do: "Move slowly where the facts are unclear.",
    avoid: "Turning anxiety into a prediction.",
    love: "Ask for clarity without accusing.",
    work: "Separate what you know from what you fear.",
    self: "Let feelings be signals, not verdicts.",
    themeNote: "Major Arcana: today's bigger message is about navigating uncertainty.",
  },
  "19-sun": {
    keyword: "Clarity · warmth · joy",
    do: "Choose the simple bright thing.",
    avoid: "Complicating what is already clear.",
    love: "Let appreciation be obvious.",
    work: "Put the easy win where everyone can see it.",
    self: "Receive the good without shrinking it.",
    themeNote: "Major Arcana: today brings a bigger message through clarity and warmth.",
  },
  "20-judgement": {
    keyword: "Calling · awakening · review",
    do: "Answer the part of you asking for change.",
    avoid: "Ignoring the pattern because it is familiar.",
    love: "Let a real conversation replace the old script.",
    work: "Review what the last cycle taught you.",
    self: "You are allowed to outgrow a role.",
    themeNote: "Major Arcana: today's bigger message may feel like a wake-up call.",
  },
  "21-world": {
    keyword: "Completion · integration · arrival",
    do: "Mark what is finished before moving on.",
    avoid: "Rushing past the meaning of a completed chapter.",
    love: "Acknowledge how far the bond has come.",
    work: "Close the loop cleanly.",
    self: "Let yourself feel complete for a moment.",
    themeNote: "Major Arcana: today carries a bigger message about completion and wholeness.",
  },
};

const MAJORS_ZH: MajorEntry[] = [
  { id: "0-fool", name: "愚者", whisper: "今晚，你心里有一部分站在边缘。先不要急着说服自己退回去。" },
  { id: "1-magician", name: "魔术师", whisper: "你手里已经有的东西，比你承认的更多。" },
  { id: "2-high-priestess", name: "女祭司", whisper: "先别继续追问。你其实已经知道今晚在提醒你什么。" },
  { id: "3-empress", name: "皇后", whisper: "你心里有个安静的东西还在生长。别因为它慢，就踩碎它。" },
  { id: "4-emperor", name: "皇帝", whisper: "今晚适合建立自己的秩序，而不是借用别人的规则。" },
  { id: "5-hierophant", name: "教皇", whisper: "一个旧规则正在等待你重新审视。先坐下来看看，再决定要不要继续服从它。" },
  { id: "6-lovers", name: "恋人", whisper: "这是两个你都在意的方向。没有哪个一定错，但其中一个更属于你。" },
  { id: "7-chariot", name: "战车", whisper: "把今天握回自己手里。你真的行动了，明早会感觉不一样。" },
  { id: "8-strength", name: "力量", whisper: "对那个一直很努力的自己温柔一点。" },
  { id: "9-hermit", name: "隐士", whisper: "今晚适合一盏小灯，不适合太吵的房间。留在自己这里。" },
  { id: "10-wheel", name: "命运之轮", whisper: "有些东西正在转动。你不需要推它，只需要看见它。" },
  { id: "11-justice", name: "正义", whisper: "在向别人要答案之前，先对自己说实话。" },
  { id: "12-hanged-man", name: "倒吊人", whisper: "你卡住，是因为只从一个角度看它。换个角度待一会儿。" },
  { id: "13-death", name: "死神", whisper: "一个小小的结束需要诚实，不需要恐慌。让它合上。" },
  { id: "14-temperance", name: "节制", whisper: "今晚两个极端都不属于你。走中间那条路，不必道歉。" },
  { id: "15-devil", name: "恶魔", whisper: "你称为习惯的东西，需要被看见，而不是被惩罚。" },
  { id: "16-tower", name: "高塔", whisper: "有些东西正在倒下，是因为它本来就该松动。你不必接住全部。" },
  { id: "17-star", name: "星星", whisper: "希望可以回来。哪怕很小，哪怕只属于今晚。" },
  { id: "18-moon", name: "月亮", whisper: "现在还不是全部清楚的时候。今晚你不欠自己一个结论。" },
  { id: "19-sun", name: "太阳", whisper: "今天有一个干净的小答案。不要把它变得比实际更复杂。" },
  { id: "20-judgement", name: "审判", whisper: "有什么在把你叫回自己身边。先听见，再回应。" },
  { id: "21-world", name: "世界", whisper: "一个章节安静地完成了。继续往前，先为它做个标记。" },
];

const MAJORS_ES: MajorEntry[] = [
  { id: "0-fool", name: "El Loco", whisper: "Esta noche, algo en ti está en el borde. No te convenzas de volver todavía." },
  { id: "1-magician", name: "El Mago", whisper: "Ya tienes más en tus manos de lo que has querido admitir." },
  { id: "2-high-priestess", name: "La Sacerdotisa", whisper: "Deja de preguntar por un momento. Ya sabes lo que esta noche te está pidiendo." },
  { id: "3-empress", name: "La Emperatriz", whisper: "Algo silencioso en ti sigue creciendo. No lo aplastes por ir despacio." },
  { id: "4-emperor", name: "El Emperador", whisper: "Esta noche te pide elegir tu propia estructura, no tomar prestada la de alguien más." },
  { id: "5-hierophant", name: "El Hierofante", whisper: "Una regla vieja tuya está lista para revisión. Siéntate con ella antes de obedecerla otra vez." },
  { id: "6-lovers", name: "Los Enamorados", whisper: "Una elección entre dos cosas que amas. Ninguna está mal. Una es más tuya." },
  { id: "7-chariot", name: "El Carro", whisper: "Conduce tu propio día. Si lo haces, mañana te sentirás distinto." },
  { id: "8-strength", name: "La Fuerza", whisper: "Sé más amable con la parte de ti que más ha estado trabajando." },
  { id: "9-hermit", name: "El Ermitaño", whisper: "Esta noche es para una lámpara pequeña, no para una sala ruidosa. Quédate contigo." },
  { id: "10-wheel", name: "La Rueda de la Fortuna", whisper: "Algo está girando. No tienes que empujarlo; tienes que notarlo." },
  { id: "11-justice", name: "La Justicia", whisper: "Dite la verdad antes de pedirle la suya a alguien más." },
  { id: "12-hanged-man", name: "El Colgado", whisper: "Estás atascado porque lo miras desde un solo lado. Cambia de ángulo un minuto." },
  { id: "13-death", name: "La Muerte", whisper: "Un final pequeño pide honestidad, no pánico. Deja que se cierre." },
  { id: "14-temperance", name: "La Templanza", whisper: "Ningún extremo es tuyo esta noche. Camina por el medio sin disculparte." },
  { id: "15-devil", name: "El Diablo", whisper: "Eso que llamas hábito quiere ser mirado, no castigado." },
  { id: "16-tower", name: "La Torre", whisper: "Algo cae porque necesitaba caer. No tienes que atraparlo todo." },
  { id: "17-star", name: "La Estrella", whisper: "La esperanza puede volver. Aunque sea pequeña. Aunque sea solo esta noche." },
  { id: "18-moon", name: "La Luna", whisper: "No todo está claro todavía. Esta noche no te debes una conclusión." },
  { id: "19-sun", name: "El Sol", whisper: "Hoy hay algo pequeño y limpio. No lo compliques más de lo necesario." },
  { id: "20-judgement", name: "El Juicio", whisper: "Algo te llama de vuelta a ti. Escucha antes de responder." },
  { id: "21-world", name: "El Mundo", whisper: "Un capítulo terminó en silencio. Márcalo antes de seguir." },
];

const MAJORS_JA: MajorEntry[] = [
  { id: "0-fool", name: "愚者", whisper: "今夜、あなたの中の何かが境目に立っています。まだ自分を引き戻さないで。" },
  { id: "1-magician", name: "魔術師", whisper: "あなたの手の中には、認めていた以上のものがあります。" },
  { id: "2-high-priestess", name: "女教皇", whisper: "問い続けるのを少し止めて。今夜が求めていることを、あなたはもう知っています。" },
  { id: "3-empress", name: "女帝", whisper: "あなたの中の静かなものがまだ育っています。遅いからといって踏まないで。" },
  { id: "4-emperor", name: "皇帝", whisper: "今夜は誰かの構造を借りるより、自分の秩序を選ぶときです。" },
  { id: "5-hierophant", name: "教皇", whisper: "古いルールが見直しを待っています。従う前に、まず座って眺めて。" },
  { id: "6-lovers", name: "恋人", whisper: "愛している二つのものの間の選択。どちらも間違いではなく、片方がよりあなたのものです。" },
  { id: "7-chariot", name: "戦車", whisper: "自分の一日を自分で動かして。そうすれば明日の朝、感覚が変わります。" },
  { id: "8-strength", name: "力", whisper: "いちばん頑張ってきた自分の部分に、もっとやさしくして。" },
  { id: "9-hermit", name: "隠者", whisper: "今夜は大きな部屋ではなく、小さな灯りのための時間です。自分のそばにいて。" },
  { id: "10-wheel", name: "運命の輪", whisper: "何かが回り始めています。押す必要はありません。ただ気づいて。" },
  { id: "11-justice", name: "正義", whisper: "誰かに真実を求める前に、まず自分に本当のことを言って。" },
  { id: "12-hanged-man", name: "吊るされた男", whisper: "行き詰まりは、一つの角度だけで見ているから。少し逆さまになってみて。" },
  { id: "13-death", name: "死神", whisper: "小さな終わりが求めているのは正直さで、恐れではありません。閉じさせて。" },
  { id: "14-temperance", name: "節制", whisper: "今夜のあなたに極端さは必要ありません。謝らずに真ん中を歩いて。" },
  { id: "15-devil", name: "悪魔", whisper: "習慣と呼んでいるものは、罰ではなく視線を求めています。" },
  { id: "16-tower", name: "塔", whisper: "落ちているものは、落ちる必要があったものです。全部受け止めなくていい。" },
  { id: "17-star", name: "星", whisper: "希望は戻ってきてもいい。小さくても、今夜だけでも。" },
  { id: "18-moon", name: "月", whisper: "まだすべては明らかではありません。今夜、結論を急がなくていい。" },
  { id: "19-sun", name: "太陽", whisper: "今日は小さく澄んだものがあります。必要以上に複雑にしないで。" },
  { id: "20-judgement", name: "審判", whisper: "何かがあなたを自分自身へ呼び戻しています。答える前に聞いて。" },
  { id: "21-world", name: "世界", whisper: "ひとつの章が静かに終わりました。進む前に印をつけて。" },
];

const MAJORS_KO: MajorEntry[] = [
  { id: "0-fool", name: "바보", whisper: "오늘 밤, 당신 안의 무언가가 가장자리에 서 있어요. 아직 물러서라고 설득하지 마세요." },
  { id: "1-magician", name: "마법사", whisper: "당신 손에는 인정한 것보다 더 많은 것이 이미 있습니다." },
  { id: "2-high-priestess", name: "여사제", whisper: "잠시 질문을 멈춰보세요. 오늘 밤이 무엇을 요구하는지 이미 알고 있어요." },
  { id: "3-empress", name: "여황제", whisper: "당신 안의 조용한 무언가가 아직 자라고 있습니다. 느리다고 밟지 마세요." },
  { id: "4-emperor", name: "황제", whisper: "오늘 밤은 남의 구조를 빌리기보다 당신만의 질서를 고르는 시간입니다." },
  { id: "5-hierophant", name: "교황", whisper: "오래된 규칙 하나가 다시 살펴봐 달라고 합니다. 따르기 전에 먼저 함께 앉아보세요." },
  { id: "6-lovers", name: "연인", whisper: "사랑하는 두 방향 사이의 선택입니다. 둘 다 틀리지 않았고, 하나가 더 당신의 것입니다." },
  { id: "7-chariot", name: "전차", whisper: "당신의 하루를 직접 몰아보세요. 그렇게 하면 내일 아침 느낌이 달라질 거예요." },
  { id: "8-strength", name: "힘", whisper: "가장 열심히 버텨온 당신의 부분에게 더 다정해져 주세요." },
  { id: "9-hermit", name: "은둔자", whisper: "오늘 밤은 시끄러운 방보다 작은 등불의 시간입니다. 자신 곁에 머무르세요." },
  { id: "10-wheel", name: "운명의 수레바퀴", whisper: "무언가가 돌아가고 있습니다. 밀 필요는 없고, 알아차리면 됩니다." },
  { id: "11-justice", name: "정의", whisper: "다른 사람에게 진실을 묻기 전에, 먼저 스스로에게 솔직해지세요." },
  { id: "12-hanged-man", name: "매달린 사람", whisper: "한쪽에서만 보고 있어서 막힌 것일 수 있어요. 잠깐 다른 각도로 보세요." },
  { id: "13-death", name: "죽음", whisper: "작은 끝맺음은 공포가 아니라 솔직함을 원합니다. 닫히게 두세요." },
  { id: "14-temperance", name: "절제", whisper: "오늘 밤 어떤 극단도 당신의 것이 아닙니다. 사과하지 말고 중간을 걸으세요." },
  { id: "15-devil", name: "악마", whisper: "습관이라고 부르는 것은 벌이 아니라 바라봐 주기를 원합니다." },
  { id: "16-tower", name: "탑", whisper: "무너지는 것은 무너질 필요가 있었던 것입니다. 전부 붙잡지 않아도 됩니다." },
  { id: "17-star", name: "별", whisper: "희망은 다시 돌아와도 됩니다. 작아도, 오늘 밤뿐이어도 괜찮아요." },
  { id: "18-moon", name: "달", whisper: "아직 모든 것이 선명하지 않습니다. 오늘 밤 결론을 내야 할 의무는 없어요." },
  { id: "19-sun", name: "태양", whisper: "오늘은 작고 깨끗한 무언가가 있습니다. 필요 이상으로 복잡하게 만들지 마세요." },
  { id: "20-judgement", name: "심판", whisper: "무언가가 당신을 다시 당신 자신에게 부르고 있습니다. 대답하기 전에 들어보세요." },
  { id: "21-world", name: "세계", whisper: "한 장이 조용히 끝났습니다. 앞으로 가기 전에 표시를 남기세요." },
];

const LOCALIZED_MAJOR_DECKS: Record<HintLanguage, MajorEntry[]> = {
  en: MAJORS,
  zh: MAJORS_ZH,
  es: MAJORS_ES,
  ja: MAJORS_JA,
  ko: MAJORS_KO,
};

const DAILY_MAJOR_ARCANA: DailyDeckEntry[] = MAJORS.map((major) => ({
  ...major,
  arcana: "major",
  orientation: "upright",
  ...MAJOR_DETAILS[major.id],
}));

const SUITS = ["wands", "cups", "swords", "pentacles"] as const;
const RANKS = [
  "ace",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "page",
  "knight",
  "queen",
  "king",
] as const;

type MinorSuit = (typeof SUITS)[number];
type MinorRank = (typeof RANKS)[number];

const SUIT_DETAILS: Record<
  MinorSuit,
  {
    label: string;
    domain: string;
    keyword: string;
    whisper: string;
    do: string;
    avoid: string;
    love: string;
    work: string;
    self: string;
  }
> = {
  wands: {
    label: "Wands",
    domain: "energy, creativity, and action",
    keyword: "Spark",
    whisper: "Let your energy move, but give it a clean direction.",
    do: "Act on the idea while it still has heat.",
    avoid: "Burning energy on drama or proving yourself.",
    love: "Bring warmth and honesty instead of pressure.",
    work: "Move one creative or high-energy task forward.",
    self: "Notice what makes you feel awake.",
  },
  cups: {
    label: "Cups",
    domain: "feelings, relationships, and intuition",
    keyword: "Feeling",
    whisper: "Let the emotional truth be simple before you explain it.",
    do: "Check in with your heart before reacting.",
    avoid: "Letting a mood become the whole story.",
    love: "Choose tenderness and honest listening.",
    work: "Consider the human tone behind the task.",
    self: "Give your feelings somewhere calm to land.",
  },
  swords: {
    label: "Swords",
    domain: "thoughts, words, and decisions",
    keyword: "Clarity",
    whisper: "A cleaner thought can cut through the noise today.",
    do: "Say the true thing in the simplest way.",
    avoid: "Overthinking until every option feels sharp.",
    love: "Use clear words without turning them into weapons.",
    work: "Make the decision or define the next question.",
    self: "Separate facts from fear.",
  },
  pentacles: {
    label: "Pentacles",
    domain: "body, work, money, and routines",
    keyword: "Ground",
    whisper: "Today gets easier when you make it practical.",
    do: "Take care of one real-world detail.",
    avoid: "Ignoring your body or the basic numbers.",
    love: "Show care through something reliable.",
    work: "Make progress visible and measurable.",
    self: "Return to food, rest, money, space, or schedule.",
  },
};

const RANK_DETAILS: Record<
  MinorRank,
  {
    label: string;
    keyword: string;
    whisper: string;
    do: string;
    avoid: string;
    love: string;
    work: string;
    self: string;
  }
> = {
  ace: {
    label: "Ace",
    keyword: "New seed",
    whisper: "A fresh opening is small, but it is real.",
    do: "Start with one clean beginning.",
    avoid: "Waiting until the beginning feels guaranteed.",
    love: "Open the door without forcing the room.",
    work: "Capture the idea and make the first move.",
    self: "Let newness feel possible.",
  },
  two: {
    label: "Two",
    keyword: "Choice",
    whisper: "Two paths are asking you to choose with care.",
    do: "Compare options honestly.",
    avoid: "Stalling because both paths have a cost.",
    love: "Look for mutual balance.",
    work: "Pick the next priority instead of splitting attention.",
    self: "Ask what your nervous system can actually hold.",
  },
  three: {
    label: "Three",
    keyword: "Collaboration",
    whisper: "Something grows better when it is shared.",
    do: "Let support or feedback in.",
    avoid: "Trying to prove you can do everything alone.",
    love: "Make room for shared effort.",
    work: "Build with people, notes, or a clearer plan.",
    self: "Notice where connection helps you expand.",
  },
  four: {
    label: "Four",
    keyword: "Stability",
    whisper: "A steadier base matters more than a bigger move.",
    do: "Create one stable container.",
    avoid: "Confusing stillness with failure.",
    love: "Protect the calm part of the connection.",
    work: "Set the structure before adding more.",
    self: "Let rest count as part of the work.",
  },
  five: {
    label: "Five",
    keyword: "Friction",
    whisper: "The tension is useful if you do not make it your identity.",
    do: "Address the small conflict directly.",
    avoid: "Escalating because discomfort feels urgent.",
    love: "Repair the tone before debating the facts.",
    work: "Name the blocker and reduce its size.",
    self: "You can be uncomfortable and still be steady.",
  },
  six: {
    label: "Six",
    keyword: "Support",
    whisper: "Help, memory, or kindness can move the day forward.",
    do: "Accept support or offer it cleanly.",
    avoid: "Keeping score when generosity is enough.",
    love: "Return to simple care.",
    work: "Use what has worked before.",
    self: "Let ease be allowed.",
  },
  seven: {
    label: "Seven",
    keyword: "Assessment",
    whisper: "Pause and choose your strategy instead of reacting.",
    do: "Review the situation before adding effort.",
    avoid: "Treating delay as proof nothing is happening.",
    love: "Notice the pattern before choosing your response.",
    work: "Decide what deserves more investment.",
    self: "Trust slow evaluation.",
  },
  eight: {
    label: "Eight",
    keyword: "Practice",
    whisper: "Repetition is shaping the result more than one big gesture.",
    do: "Practice the next useful step.",
    avoid: "Changing the plan every time it feels boring.",
    love: "Show up consistently.",
    work: "Do the focused reps.",
    self: "Let progress be built, not discovered.",
  },
  nine: {
    label: "Nine",
    keyword: "Resilience",
    whisper: "You are closer than it feels, but pacing still matters.",
    do: "Protect your energy while staying present.",
    avoid: "Preparing for every possible problem.",
    love: "Keep the boundary that keeps you kind.",
    work: "Finish carefully without draining yourself.",
    self: "Honor what you have already carried.",
  },
  ten: {
    label: "Ten",
    keyword: "Completion",
    whisper: "A cycle is full; now simplify what you carry next.",
    do: "Close the loop or lighten the load.",
    avoid: "Adding more because you are used to carrying more.",
    love: "Let the relationship evolve past the old pattern.",
    work: "Finish, archive, delegate, or release.",
    self: "You do not have to carry the entire pile.",
  },
  page: {
    label: "Page",
    keyword: "Curiosity",
    whisper: "Beginner energy can bring the message you need.",
    do: "Ask, learn, or try the small experiment.",
    avoid: "Pretending you already know everything.",
    love: "Be curious about the other person's world.",
    work: "Turn uncertainty into a question.",
    self: "Let yourself be a student today.",
  },
  knight: {
    label: "Knight",
    keyword: "Momentum",
    whisper: "Movement helps, but direction matters.",
    do: "Move with purpose.",
    avoid: "Charging ahead just to avoid waiting.",
    love: "Bring energy without rushing the bond.",
    work: "Advance the plan with a clear next move.",
    self: "Notice where urgency is useful and where it is noise.",
  },
  queen: {
    label: "Queen",
    keyword: "Maturity",
    whisper: "Your power is steadier when it is cared for.",
    do: "Lead from grounded self-respect.",
    avoid: "Overgiving until you disappear.",
    love: "Offer care without abandoning yourself.",
    work: "Set the tone calmly.",
    self: "Protect the part of you that nurtures everything else.",
  },
  king: {
    label: "King",
    keyword: "Leadership",
    whisper: "Today asks for calm command, not control.",
    do: "Make the responsible choice.",
    avoid: "Using certainty to shut down nuance.",
    love: "Be steady enough to be honest.",
    work: "Own the decision and the structure around it.",
    self: "Let maturity be quiet and useful.",
  },
};

const DAILY_MINOR_ARCANA: DailyDeckEntry[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => {
    const suitDetail = SUIT_DETAILS[suit];
    const rankDetail = RANK_DETAILS[rank];
    return {
      id: `${rank}-${suit}`,
      name: `${rankDetail.label} of ${suitDetail.label}`,
      arcana: "minor",
      suit,
      orientation: "upright",
      keyword: `${rankDetail.keyword} · ${suitDetail.keyword}`,
      whisper: `${rankDetail.whisper} In ${suitDetail.domain}, ${suitDetail.whisper.charAt(0).toLowerCase()}${suitDetail.whisper.slice(1)}`,
      do: `${rankDetail.do} ${suitDetail.do}`,
      avoid: `${rankDetail.avoid} ${suitDetail.avoid}`,
      love: `${rankDetail.love} ${suitDetail.love}`,
      work: `${rankDetail.work} ${suitDetail.work}`,
      self: `${rankDetail.self} ${suitDetail.self}`,
      themeNote: `Minor Arcana: this is a daily-life card, so read it as practical guidance for ${suitDetail.domain}.`,
    };
  }),
);

export const DAILY_TAROT_DECK: DailyDeckEntry[] = [
  ...DAILY_MAJOR_ARCANA,
  ...DAILY_MINOR_ARCANA,
];

const DAILY_TAROT_BY_ID = new Map(DAILY_TAROT_DECK.map((card) => [card.id, card]));

function toDailyPull(entry: DailyDeckEntry): DailyPull {
  return {
    cardId: entry.id,
    cardName: entry.name,
    whisper: entry.whisper,
    arcana: entry.arcana,
    suit: entry.suit,
    orientation: "upright",
    keyword: entry.keyword,
    do: entry.do,
    avoid: entry.avoid,
    love: entry.love,
    work: entry.work,
    self: entry.self,
    themeNote: entry.themeNote,
  };
}

/** Stable integer seed from the user's *local* calendar day. */
function localDaySeed(date: Date): number {
  return (
    date.getFullYear() * 10_000 +
    (date.getMonth() + 1) * 100 +
    date.getDate()
  );
}

/** Deterministic daily pull. Same *local* calendar date = same card all day. */
export function getDailyPull(now: Date = new Date(), language: HintLanguage = "en"): DailyPull {
  const idx = localDaySeed(now) % DAILY_TAROT_DECK.length;
  return localizeDailyPull(toDailyPull(DAILY_TAROT_DECK[idx]!), language);
}

export function localizeDailyPull(pull: DailyPull, language: HintLanguage): DailyPull {
  const canonical = DAILY_TAROT_BY_ID.get(pull.cardId);
  const merged = canonical ? { ...toDailyPull(canonical), ...pull } : pull;
  const translated = LOCALIZED_MAJOR_DECKS[language].find((entry) => entry.id === pull.cardId);

  return translated
    ? {
        ...merged,
        cardId: translated.id,
        cardName: translated.name,
        whisper: translated.whisper,
      }
    : merged;
}
