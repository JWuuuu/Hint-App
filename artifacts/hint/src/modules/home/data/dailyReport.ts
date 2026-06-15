import { getLocalDateString } from "../../../lib/identity";
import type {
  DailyLuckyItem,
  DailyReport,
  DailyScore,
  DailyScoreKey,
  DailyTask,
} from "../types/home.types";
import { getDailyPullById } from "./dailyPulls";
import type { HintLanguage } from "../../../lib/i18n";
import { selectSkyGuidedTarot } from "../../../lib/tarot/skyGuidedTarot";

const SCORE_BASE: Array<Omit<DailyScore, "score" | "label"> & { offset: number }> = [
  { key: "love", tone: "#ef84bd", offset: 13 },
  { key: "wealth", tone: "#e6bd63", offset: 29 },
  { key: "career", tone: "#90a8ef", offset: 43 },
  { key: "study", tone: "#60c8dc", offset: 61 },
  { key: "people", tone: "#bf7de8", offset: 79 },
];

const SCORE_LABELS: Record<HintLanguage, Record<DailyScoreKey, string>> = {
  en: { love: "Love", wealth: "Wealth", career: "Career", study: "Study", people: "People" },
  zh: { love: "爱情", wealth: "财富", career: "事业", study: "学习", people: "人际" },
  es: { love: "Amor", wealth: "Dinero", career: "Carrera", study: "Estudio", people: "Vínculos" },
  ja: { love: "恋愛", wealth: "金運", career: "仕事", study: "学び", people: "人間関係" },
  ko: { love: "사랑", wealth: "재정", career: "커리어", study: "학습", people: "관계" },
};

type BirthDetails = {
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
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
  ["Sky Blue", "Good for calm replies"],
  ["Sage Green", "Good for grounding"],
  ["Lavender", "Good for soft focus"],
  ["Sunset Pink", "Good for warmth"],
  ["Ocean Blue", "Good for clear thinking"],
  ["Cream White", "Good for clean starts"],
  ["Mocha Brown", "Good for steady energy"],
  ["Peach", "Good for warmth without pressure"],
  ["Mint Green", "Good for a fresh reset"],
  ["Lilac", "Good for dreamy focus"],
  ["Coral", "Good for honest momentum"],
  ["Butter Yellow", "Good for optimism"],
  ["Rose Pink", "Good for tender confidence"],
  ["Dusty Blue", "Good for gentle boundaries"],
  ["Emerald Green", "Good for growth energy"],
  ["Champagne", "Good for feeling polished"],
  ["Soft Gray", "Good for keeping things simple"],
  ["Ivory", "Good for quiet clarity"],
  ["Terracotta", "Good for grounded warmth"],
  ["Plum", "Good for deeper intuition"],
  ["Aqua", "Good for light communication"],
  ["Baby Blue", "Good for a softer start"],
  ["Blush Pink", "Good for receiving care"],
  ["Caramel", "Good for steady comfort"],
  ["Olive Green", "Good for practical choices"],
  ["Burgundy", "Good for self-possession"],
  ["Midnight Blue", "Good for calm focus"],
  ["Apricot", "Good for gentle courage"],
  ["Mauve", "Good for reflective moods"],
  ["Honey Beige", "Good for an easy rhythm"],
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

const JEWELRY: readonly TextPair[] = [
  ["Gold Ring", "Good for quiet confidence"],
  ["Silver Ring", "Good for clean boundaries"],
  ["Pearl Earrings", "Softens how the day lands"],
  ["Gold Necklace", "Good for warm visibility"],
  ["Silver Necklace", "Keeps replies measured"],
  ["Rose Quartz", "Good for a warmer tone"],
  ["Moonstone", "Good for quiet intuition"],
  ["Amethyst", "Good for intuitive focus"],
  ["Pearl Bracelet", "Good for graceful pacing"],
  ["Hoop Earrings", "Good for a bolder mood"],
  ["Star Necklace", "Good for feeling seen"],
  ["Heart Pendant", "Good for warmer words"],
  ["Crystal Earrings", "Good for lightness"],
  ["Sapphire Ring", "Good for clear decisions"],
  ["Emerald Pendant", "Good for growth energy"],
  ["Opal Ring", "Good for trusting nuance"],
  ["Silver Bangle", "Good for steady intention"],
  ["Charm Bracelet", "Good for tiny reminders"],
  ["Butterfly Necklace", "Good for small transformations"],
  ["Sun Pendant", "Good for bright confidence"],
  ["Moon Pendant", "Helps name quiet feelings"],
  ["Diamond Studs", "Good for polished clarity"],
  ["Rose Gold Ring", "Good for soft confidence"],
  ["Quartz Bracelet", "Good for an emotional reset"],
  ["Zodiac Necklace", "Good for trusting your timing"],
  ["Clover Charm", "Good for sweet timing"],
  ["Shell Necklace", "Good for a softer pace"],
  ["Birthstone Ring", "Good for personal luck"],
  ["Gem Earrings", "Good for a little sparkle"],
  ["Infinity Bracelet", "Good for staying connected"],
] as const;

const FOODS: readonly TextPair[] = [
  ["Bubble Tea", "Good for a tiny mood lift"],
  ["Avocado", "Good for steady energy"],
  ["Strawberry", "Good for a sweet reset"],
  ["Matcha", "Good for soft focus"],
  ["Croissant", "Good for romanticizing the morning"],
  ["Ramen", "Good for comfort and focus"],
  ["Fried Rice", "Good for making use of what you have"],
  ["Sushi", "Good for clean momentum"],
  ["Yogurt", "Good for a gentle start"],
  ["Chocolate", "Good for a small mood reset"],
  ["Blueberries", "Good for a clear head"],
  ["Salmon", "Good for grounded strength"],
  ["Iced Coffee", "Good for getting moving"],
  ["Macarons", "Good for a pretty pause"],
  ["Donut", "Good for playfulness"],
  ["Dumplings", "Good for feeling held"],
  ["Mango", "Good for bright energy"],
  ["Pancakes", "Good for a slow start"],
  ["Tacos", "Good for spontaneous plans"],
  ["Salad", "Good for a lighter rhythm"],
  ["Ice Cream", "Good for a soft reward"],
  ["Cheesecake", "Good for treating yourself gently"],
  ["Acai Bowl", "Good for fresh energy"],
  ["Apple", "Good for a crisp reset"],
  ["Grapes", "Good for easy sweetness"],
  ["Pasta", "Good for comfort without overthinking"],
  ["Waffles", "Good for a cozy morning"],
  ["Honey Toast", "Good for warmth"],
] as const;

const CARRY_ITEMS: readonly TextPair[] = [
  ["AirPods Case", "Good for protecting your mood"],
  ["Lip Balm", "Keep comfort close"],
  ["Hair Ties", "Good for getting things handled"],
  ["Phone", "Good for one honest message"],
  ["Sunglasses", "Good for keeping your boundary"],
  ["Water Bottle", "Good for steady energy"],
  ["Perfume", "Good for resetting the room around you"],
  ["Canvas Bag", "Good for carrying less chaos"],
  ["Notebook", "Good for catching the thought"],
  ["Keychain", "Good for one clean transition"],
  ["Lipstick", "Good for a confidence cue"],
  ["Hand Cream", "Good for small care"],
  ["Ring", "Good for remembering your intention"],
  ["Bracelet", "Good for staying anchored"],
  ["Necklace", "Good for keeping intention close"],
  ["Mirror", "Good for checking in with yourself"],
  ["Charger", "Good for restoring energy"],
  ["Wallet", "Good for practical luck"],
  ["Scrunchie", "Good for an easy reset"],
  ["Claw Clip", "Good for quick focus"],
  ["Camera", "Good for noticing beauty"],
  ["Earbuds Case", "Good for keeping calm nearby"],
  ["Makeup Bag", "Good for feeling prepared"],
  ["Crystal Charm", "Good for a tiny ritual"],
  ["Coin Purse", "Good for mindful spending"],
  ["Pen", "Good for naming the thought"],
  ["Mini Plush", "Good for comfort"],
  ["Travel Mug", "Good for carrying warmth"],
  ["Glasses", "Good for seeing clearly"],
  ["Headphones", "Good for protecting your focus"],
] as const;

const FLOWERS: readonly TextPair[] = [
  ["Sunflower", "Good for visible confidence"],
  ["Rose", "Good for softness with standards"],
  ["Tulip", "Good for a fresh start"],
  ["Daisy", "Good for lightness"],
  ["Lavender", "Calm the overactive mind"],
  ["Peony", "Receive softness without apologizing"],
  ["Lily", "Good for clean emotional space"],
  ["Cherry Blossom", "Good for a fleeting sweet moment"],
  ["Hydrangea", "Good for gentle abundance"],
  ["Orchid", "Good for elegant patience"],
  ["Jasmine", "Good for a quiet glow"],
  ["Camellia", "Good for steady affection"],
  ["Iris", "Good for trusting your eye"],
  ["Magnolia", "Good for grounded grace"],
  ["Dandelion", "Good for a hopeful reset"],
  ["Marigold", "Good for warm courage"],
  ["Baby's Breath", "Good for light support"],
  ["Gardenia", "Good for clear tenderness"],
  ["Lotus", "Good for rising cleanly"],
  ["Poppy Seed", "Good for creative boldness"],
  ["Pink Camellia", "Good for modest confidence"],
  ["Forget-Me-Not", "Good for meaningful contact"],
  ["Hibiscus", "Good for expressive warmth"],
  ["Ranunculus", "Good for layered feelings"],
  ["Anemone", "Good for honest softness"],
  ["Sweet Pea", "Good for tender beginnings"],
  ["Cosmos", "Good for balanced beauty"],
  ["Snapdragon", "Good for speaking clearly"],
  ["Morning Glory", "Good for beginning again"],
  ["Freesia", "Good for bright honesty"],
] as const;

const TASKS: DailyTask[] = [
  { text: "Drink a glass of water slowly.", reason: "Restore physical balance before you ask for more energy." },
  { text: "Stretch your shoulders and neck for three minutes.", reason: "Release tension your mind may be carrying for your body." },
  { text: "Take a short walk without checking your phone.", reason: "Let your attention land back in the present." },
  { text: "Open a window and take five steady breaths.", reason: "Fresh air helps the day feel less stuck." },
  { text: "Wash your face slowly.", reason: "A small reset can tell your nervous system the moment has changed." },
  { text: "Eat one nourishing snack before more caffeine.", reason: "Steadier energy starts with something ordinary." },
  { text: "Stand in sunlight for one minute.", reason: "Light can gently remind your body what time it is." },
  { text: "Put both feet on the floor and unclench your jaw.", reason: "Tiny physical cues can soften mental pressure." },
  { text: "Refill your water bottle.", reason: "Make care easier for the next version of you." },
  { text: "Go to bed fifteen minutes earlier tonight.", reason: "Recovery is also a form of progress." },
  { text: "Clear one small surface near you.", reason: "The outside room changes the inside room." },
  { text: "Delete five screenshots you do not need.", reason: "A little digital space can quiet background noise." },
  { text: "Make your bed or smooth your blanket.", reason: "One finished corner gives the day a cleaner edge." },
  { text: "Put one item back where it belongs.", reason: "Order returns through small, repeatable choices." },
  { text: "Wipe your desk or table for one minute.", reason: "A clearer surface helps your mind choose a next step." },
  { text: "Prepare tomorrow's first item tonight.", reason: "Future-you deserves a softer start." },
  { text: "Close three browser tabs.", reason: "Less visual noise makes focus feel more possible." },
  { text: "Sort one tiny pile.", reason: "Momentum works better when the task is small enough to begin." },
  { text: "Move one thing that keeps bothering you.", reason: "Your environment is allowed to support your mood." },
  { text: "Set out something you want to wear tomorrow.", reason: "A little preparation can become self-trust." },
  { text: "Send one thoughtful message.", reason: "Warm contact can steady the heart without becoming a big project." },
  { text: "Thank someone who helped you recently.", reason: "Gratitude becomes stronger when it is specific." },
  { text: "Ask one person how they are really doing.", reason: "Connection deepens when curiosity slows down." },
  { text: "Reply to one message you have been avoiding.", reason: "A gentle response can release more weight than silence." },
  { text: "Compliment someone sincerely.", reason: "Naming good things helps you notice more of them." },
  { text: "Share a small happy memory with someone.", reason: "Lightness becomes easier when it is shared." },
  { text: "Listen without planning your answer once today.", reason: "Understanding grows in the pause." },
  { text: "Send a simple check-in to an old friend.", reason: "Reconnection does not need a perfect opening line." },
  { text: "Encourage someone who is trying.", reason: "Support given outward often returns inward." },
  { text: "Let one conversation end while it still feels kind.", reason: "Good boundaries protect good connection." },
  { text: "Write down what you feel in one honest sentence.", reason: "Clarity starts when the feeling has a name." },
  { text: "Write one sentence you do not need to send.", reason: "Not every truth needs an audience." },
  { text: "Forgive yourself for one small mistake.", reason: "Self-kindness keeps growth from turning into punishment." },
  { text: "Name one thing you can control today.", reason: "Agency returns when the circle gets smaller." },
  { text: "Let go of one unrealistic expectation.", reason: "Pressure softens when the standard becomes human." },
  { text: "Write a supportive note to yourself.", reason: "Your inner voice can learn to be safer." },
  { text: "Accept one imperfect outcome without replaying it.", reason: "Flexibility protects your energy." },
  { text: "Pause before responding to a message.", reason: "Timing is part of the spell." },
  { text: "Write down one emotional trigger you noticed.", reason: "Awareness gives you a little more room next time." },
  { text: "Give yourself permission to rest for ten minutes.", reason: "Rest is maintenance, not a failure to perform." },
  { text: "Notice five things you can see.", reason: "Ground yourself in the room you are actually in." },
  { text: "Take three slow breaths before your next task.", reason: "A calmer body makes a clearer choice." },
  { text: "Enjoy one meal or drink without scrolling.", reason: "Pleasure gets louder when attention stays with it." },
  { text: "Watch the sky for one minute.", reason: "Perspective is easier when your eyes look farther away." },
  { text: "Sit in silence for two minutes.", reason: "Stillness lets your mind stop chasing every thread." },
  { text: "Notice one beautiful detail around you.", reason: "Beauty can become an anchor when the day feels loud." },
  { text: "Put your phone down for one full song.", reason: "Your attention deserves a clean pocket of time." },
  { text: "Breathe out longer than you breathe in five times.", reason: "Long exhales tell your body it can stand down." },
  { text: "Feel the temperature of your hands.", reason: "Simple sensation can interrupt spiraling thoughts." },
  { text: "Look at something green for thirty seconds.", reason: "A tiny nature cue can soften your focus." },
  { text: "Finish one small task before starting another.", reason: "Completion builds trust faster than intensity." },
  { text: "Write tomorrow's top three tasks.", reason: "Clarity tonight makes tomorrow less crowded." },
  { text: "Choose the plan that protects tomorrow morning.", reason: "Future-you is part of today's reading." },
  { text: "Clean up five emails or notifications.", reason: "Small closures reduce mental tabs." },
  { text: "Set one realistic goal for today.", reason: "A reachable target creates real momentum." },
  { text: "Do the two-minute version of something you avoid.", reason: "Starting gently still counts as starting." },
  { text: "Update one calendar item.", reason: "Structure can hold what memory should not carry alone." },
  { text: "Write the next step, not the whole plan.", reason: "The day only needs one usable doorway." },
  { text: "Put your hardest task into one sentence.", reason: "Naming it clearly makes it less shapeless." },
  { text: "Stop working at a cleaner stopping point.", reason: "Leaving well is part of returning well." },
  { text: "List three things you do well.", reason: "Confidence grows when evidence is allowed to count." },
  { text: "Wear one thing that feels like you.", reason: "Self-expression can be a quiet source of steadiness." },
  { text: "Say no to one unnecessary obligation.", reason: "A small boundary gives your energy a place to stay." },
  { text: "Walk with relaxed, open posture for one minute.", reason: "The body can rehearse confidence before the mind believes it." },
  { text: "Celebrate one recent tiny win.", reason: "Progress becomes motivating when you actually notice it." },
  { text: "Share one honest opinion kindly.", reason: "Authenticity gets easier through low-stakes practice." },
  { text: "Trust your first instinct on one small choice.", reason: "Self-trust grows through ordinary decisions." },
  { text: "Do one thing slightly outside your routine.", reason: "A little novelty reminds you that you can move." },
  { text: "Take one photo where you like the light.", reason: "Seeing yourself gently is a skill." },
  { text: "Speak to yourself as if you were helping a friend.", reason: "Tone changes how safe effort feels." },
  { text: "Doodle for five minutes.", reason: "Creativity gives emotion another way out." },
  { text: "Hum or sing one song you like.", reason: "Sound can move tension without needing an explanation." },
  { text: "Take a photo of something beautiful.", reason: "Beauty gets easier to find when you practice looking." },
  { text: "Sketch one object nearby.", reason: "Observation slows the mind in a useful way." },
  { text: "Make a small playlist for your current mood.", reason: "Sound can shape the room around you." },
  { text: "Write a six-word story.", reason: "A tiny creative constraint can unlock play." },
  { text: "Rearrange one small corner.", reason: "Changing the room can refresh your inner weather." },
  { text: "Draw your current mood as a shape.", reason: "Feelings become less overwhelming when they become visible." },
  { text: "Name today's mood like a playlist title.", reason: "Playfulness can make self-awareness less heavy." },
  { text: "Make one ordinary task a little prettier.", reason: "Care can be aesthetic, not only practical." },
  { text: "Do one happy dance to a song.", reason: "Movement can create joy before you feel ready." },
  { text: "Watch a funny clip.", reason: "A short laugh can loosen the day's grip." },
  { text: "Make a playful prediction about today.", reason: "Curiosity keeps the day from becoming too fixed." },
  { text: "Draw with your non-dominant hand.", reason: "Imperfection is easier to accept when it is invited." },
  { text: "Try one small spontaneous choice.", reason: "Adventure can be tiny and still count." },
  { text: "Add something cozy to your space.", reason: "Comfort helps the body believe it is allowed to settle." },
  { text: "Light a candle or turn on a softer lamp.", reason: "Atmosphere can help your nervous system shift gears." },
  { text: "Make your next drink feel intentional.", reason: "Ritual turns a normal pause into care." },
  { text: "Choose a color around you and follow it with your eyes.", reason: "A simple visual game can interrupt overthinking." },
  { text: "Do something slowly on purpose.", reason: "Speed is not the same as safety." },
  { text: "Write today's highlight.", reason: "Positive moments become stronger when they are saved." },
  { text: "Reflect on one thing you learned.", reason: "Growth is easier to trust when you can name it." },
  { text: "Think about a proud moment for thirty seconds.", reason: "Confidence needs memory, not just ambition." },
  { text: "Review one small sign of progress.", reason: "Progress often hides in details." },
  { text: "Write one thing you want to improve gently.", reason: "Growth works better without self-attack." },
  { text: "Recall a happy childhood memory.", reason: "Older joy can still support the present." },
  { text: "Reflect on one challenge you already survived.", reason: "Resilience is easier to feel when you remember the proof." },
  { text: "Notice what energized you today.", reason: "Your energy leaves clues worth following." },
  { text: "Name what truly matters today.", reason: "Priorities quiet the noise around them." },
  { text: "End the day with one line of gratitude.", reason: "Gratitude gives the mind somewhere soft to land." },
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

const LUCKY_LABELS: Record<HintLanguage, { color: string; jewelry: string; number: string; food: string; carry: string; flower: string; numberHint: string }> = {
  en: { color: "Lucky color", jewelry: "Lucky jewelry", number: "Lucky number", food: "Lucky food", carry: "Lucky carry", flower: "Lucky flower", numberHint: "Use it as a small rhythm" },
  zh: { color: "幸运色", jewelry: "幸运首饰", number: "幸运数字", food: "幸运食物", carry: "随身物", flower: "幸运花", numberHint: "把它当作今天的小节奏" },
  es: { color: "Color de suerte", jewelry: "Joya", number: "Número", food: "Comida", carry: "Objeto", flower: "Flor", numberHint: "Úsalo como un pequeño ritmo" },
  ja: { color: "ラッキーカラー", jewelry: "アクセサリー", number: "数字", food: "食べ物", carry: "持ち物", flower: "花", numberHint: "小さなリズムとして使う" },
  ko: { color: "행운의 색", jewelry: "주얼리", number: "숫자", food: "음식", carry: "소지품", flower: "꽃", numberHint: "작은 리듬처럼 사용하세요" },
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

function ritualBiasFor(streak: number | undefined, key: DailyScoreKey): number {
  if (!streak) return 0;
  const capped = Math.min(streak, 14);
  const base = Math.min(4, Math.floor(capped / 4) + 1);
  if (key === "career" || key === "study") return Math.max(0, base - 1);
  if (key === "people") return Math.max(0, base - 2);
  return base;
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

function normalizeDegree(degree: number): number {
  return ((degree % 360) + 360) % 360;
}

function sunDegreeFor(date: Date): number {
  const springEquinox = dayOfYear(new Date(date.getFullYear(), 2, 20));
  return normalizeDegree(((dayOfYear(date) - springEquinox) / 365.2425) * 360);
}

function moonDegreeFor(date: Date, sunDegree: number): number {
  const knownNewMoonUtc = Date.UTC(2000, 0, 6, 18, 14);
  const daysSince = (date.getTime() - knownNewMoonUtc) / 86_400_000;
  const phase = ((daysSince % 29.530588853) + 29.530588853) % 29.530588853;
  return normalizeDegree(sunDegree + (phase / 29.530588853) * 360);
}

function parseBirthDate(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function angularDistance(a: number, b: number): number {
  const distance = Math.abs(normalizeDegree(a - b));
  return Math.min(distance, 360 - distance);
}

function aspectBias(distance: number, key: DailyScoreKey): number {
  const aspect = [
    { angle: 0, orb: 10, score: { love: 3, wealth: 4, career: 5, study: 4, people: 2 } },
    { angle: 60, orb: 8, score: { love: 5, wealth: 3, career: 3, study: 4, people: 5 } },
    { angle: 90, orb: 8, score: { love: -2, wealth: -1, career: -3, study: -3, people: 1 } },
    { angle: 120, orb: 9, score: { love: 6, wealth: 4, career: 5, study: 5, people: 4 } },
    { angle: 180, orb: 9, score: { love: 2, wealth: -2, career: -1, study: -2, people: 4 } },
  ].find((item) => Math.abs(distance - item.angle) <= item.orb);

  return aspect?.score[key] ?? 0;
}

function elementForDegree(degree: number): "fire" | "earth" | "air" | "water" {
  const sign = Math.floor(normalizeDegree(degree) / 30) % 12;
  return (["fire", "earth", "air", "water"] as const)[sign % 4];
}

function elementBias(natalDegree: number, transitDegree: number, key: DailyScoreKey): number {
  const natal = elementForDegree(natalDegree);
  const transit = elementForDegree(transitDegree);
  if (natal === transit) {
    return key === "love" || key === "people" ? 3 : 4;
  }
  if (
    (natal === "fire" && transit === "air") ||
    (natal === "air" && transit === "fire") ||
    (natal === "earth" && transit === "water") ||
    (natal === "water" && transit === "earth")
  ) {
    return key === "love" || key === "people" ? 4 : 2;
  }
  if (
    (natal === "fire" && transit === "water") ||
    (natal === "water" && transit === "fire") ||
    (natal === "earth" && transit === "air") ||
    (natal === "air" && transit === "earth")
  ) {
    return key === "career" || key === "study" ? -3 : -2;
  }
  return 0;
}

function birthChartTexture(birthDetails: BirthDetails | undefined, key: DailyScoreKey): number {
  if (!birthDetails?.birthDate) return 0;
  const detailSeed = hash(
    [
      birthDetails.birthDate,
      birthDetails.birthTime ?? "unknown-time",
      birthDetails.birthPlace ?? "unknown-place",
      key,
    ].join(":"),
  );
  const range = birthDetails.birthTime || birthDetails.birthPlace ? 7 : 5;
  return (detailSeed % range) - Math.floor(range / 2);
}

function scoreFor(
  key: DailyScoreKey,
  offset: number,
  date: Date,
  birthDetails?: BirthDetails,
  ritualStreak?: number,
): number {
  const todaySun = sunDegreeFor(date);
  const todayMoon = moonDegreeFor(date, todaySun);
  const birthDate = parseBirthDate(birthDetails?.birthDate);
  const natalSun = birthDate ? sunDegreeFor(birthDate) : normalizeDegree(hash(`guest:${key}`) % 360);
  const sunDistance = angularDistance(natalSun, todaySun);
  const moonDistance = angularDistance(natalSun, todayMoon);
  const transitRhythm = (hash(`${getLocalDateString(date)}:${key}:${offset}`) % 7) - 3;
  return clampScore(
    66 +
      aspectBias(sunDistance, key) +
      Math.round(aspectBias(moonDistance, key) * 0.7) +
      elementBias(natalSun, todaySun, key) +
      birthChartTexture(birthDetails, key) +
      transitRhythm +
      ritualBiasFor(ritualStreak, key),
  );
}

function aspectLabel(distance: number): string {
  const aspects = [
    { angle: 0, label: "Sun conjunct natal Sun" },
    { angle: 60, label: "Sun sextile natal Sun" },
    { angle: 90, label: "Sun square natal Sun" },
    { angle: 120, label: "Sun trine natal Sun" },
    { angle: 180, label: "Sun opposite natal Sun" },
  ];
  const aspect = aspects
    .map((item) => ({ ...item, delta: Math.abs(distance - item.angle) }))
    .sort((a, b) => a.delta - b.delta)[0];
  return aspect && aspect.delta <= 12 ? aspect.label : "Sun in a quiet natal angle";
}

function astrologySummary(date: Date, birthDetails: BirthDetails | undefined, language: HintLanguage): string {
  const todaySun = sunDegreeFor(date);
  const birthDate = parseBirthDate(birthDetails?.birthDate);
  const natalSun = birthDate ? sunDegreeFor(birthDate) : normalizeDegree(hash("guest:natal") % 360);
  const distance = angularDistance(natalSun, todaySun);
  const label = aspectLabel(distance);

  if (language === "zh") {
    if (label.includes("square")) return "太阳与本命太阳形成紧张角度，今天容易把小压力放大。事业和学习上先收窄目标，别急着证明自己。";
    if (label.includes("trine")) return "太阳与本命太阳形成顺畅角度，今天比较适合推进重要事项，也适合让别人看见你的真实能力。";
    if (label.includes("opposite")) return "太阳走到本命太阳的对面，今天会更敏感地看见关系里的回应与距离。别把没有被察觉等同于不被在乎。";
    if (label.includes("sextile")) return "太阳与本命太阳形成支持角度，今天适合主动沟通、安排资源，也适合把想法落到一个小行动上。";
    return "今天太阳没有强烈触发本命太阳，能量更适合稳定整理。把注意力放回身体、节奏和一个可完成的小目标。";
  }

  if (label.includes("square")) return "The Sun is pressing your natal Sun by square, so small pressure may feel louder. Narrow the goal before you push.";
  if (label.includes("trine")) return "The Sun is supporting your natal Sun by trine, good for visible progress and cleaner confidence.";
  if (label.includes("opposite")) return "The Sun is opposite your natal Sun, making relationship mirrors feel sharper. Ask for contact instead of guessing from silence.";
  if (label.includes("sextile")) return "The Sun is supporting your natal Sun by sextile, good for a small message, a practical request, or one clean next step.";
  return "The Sun is moving through a quieter natal angle today. Keep the rhythm steady and finish one small thing.";
}

function selfHintFor(reportSeed: number, language: HintLanguage): string {
  const hints =
    language === "zh"
      ? [
          "今天的你可能有一点小脆弱。如果没有人察觉你的情绪，可以主动说一句：我今天需要被听见。",
          "今天别把所有事都自己消化。找一个安全的人讲清楚，比继续硬撑更有力量。",
          "你的情绪不是麻烦，它只是需要出口。先照顾感受，再处理事情。",
          "今天适合慢一点回应。你不需要立刻给所有人一个完美答案。",
        ]
      : [
          "You may feel a little tender today. If nobody notices, name it gently and ask to be heard.",
          "Do not digest everything alone today. One safe conversation will help more than pushing through.",
          "Your feelings are not a problem; they need a doorway. Care for the feeling before fixing the task.",
          "Respond a little slower today. You do not owe everyone a perfect answer immediately.",
        ];
  return hints[reportSeed % hints.length]!;
}

function psychologyFor(reportSeed: number, language: HintLanguage): string {
  const notes =
    language === "zh"
      ? [
          "心理上容易出现“没人懂我”的瞬间。先确认事实，再确认感受，别让一秒钟的失落替整天做结论。",
          "今天的压力更像内在警报，不一定代表外界真的失控。把任务拆小，会让安全感回来。",
          "你可能会同时想靠近和退后。允许自己先观察，再决定要不要表达。",
        ]
      : [
          "A brief 'nobody gets me' moment may arrive. Check the facts, then honor the feeling, before making a whole-day conclusion.",
          "Pressure may act like an inner alarm more than an external emergency. Smaller tasks bring steadiness back.",
          "You may want closeness and distance at the same time. Let yourself observe before you explain.",
        ];
  return notes[reportSeed % notes.length]!;
}

function tarotCardForScores(scores: DailyScore[], date: Date, birthDetails: BirthDetails | undefined): string {
  const top = [...scores].sort((a, b) => b.score - a.score)[0]?.key ?? "study";
  const todaySun = sunDegreeFor(date);
  const birthDate = parseBirthDate(birthDetails?.birthDate);
  const natalSun = birthDate ? sunDegreeFor(birthDate) : normalizeDegree(hash("guest:natal") % 360);
  const distance = angularDistance(natalSun, todaySun);
  const tense = Math.abs(distance - 90) <= 10 || Math.abs(distance - 180) <= 10;

  const pools: Record<DailyScoreKey, string[]> = {
    love: tense ? ["18-moon", "14-temperance", "8-strength", "6-lovers"] : ["6-lovers", "3-empress", "17-star", "two-cups"],
    wealth: tense ? ["four-pentacles", "11-justice", "seven-pentacles"] : ["nine-pentacles", "ten-pentacles", "1-magician", "10-wheel"],
    career: tense ? ["4-emperor", "11-justice", "12-hanged-man"] : ["1-magician", "7-chariot", "4-emperor", "20-judgement"],
    study: tense ? ["9-hermit", "four-swords", "12-hanged-man"] : ["2-high-priestess", "1-magician", "ace-swords", "9-hermit"],
    people: tense ? ["14-temperance", "8-strength", "11-justice"] : ["three-cups", "19-sun", "6-lovers", "17-star"],
  };

  const pool = pools[top];
  return pool[hash(`${getLocalDateString(date)}:${top}:${birthDetails?.birthDate ?? "guest"}`) % pool.length]!;
}

function pick<T>(items: readonly T[], seed: number, offset: number): T {
  return items[(seed + offset) % items.length]!;
}

const ENERGY_TASK_RANGES = {
  body: [0, 10],
  space: [10, 20],
  connection: [20, 30],
  emotion: [30, 40],
  mindfulness: [40, 50],
  productivity: [50, 60],
  confidence: [60, 70],
  creativity: [70, 80],
  comfort: [80, 90],
  reflection: [90, 100],
} as const;

type EnergyTaskRange = keyof typeof ENERGY_TASK_RANGES;

const SUPPORT_TASK_RANGE: Record<DailyScoreKey, EnergyTaskRange> = {
  love: "emotion",
  wealth: "body",
  career: "space",
  study: "mindfulness",
  people: "connection",
};

const MOMENTUM_TASK_RANGE: Record<DailyScoreKey, EnergyTaskRange> = {
  love: "connection",
  wealth: "productivity",
  career: "confidence",
  study: "creativity",
  people: "confidence",
};

const ROTATING_TASK_RANGES: EnergyTaskRange[] = [
  "body",
  "space",
  "mindfulness",
  "creativity",
  "comfort",
  "reflection",
  "connection",
  "productivity",
  "emotion",
  "confidence",
];

function dayNumber(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((current - start) / 86_400_000);
}

function pickEnergyTask(range: EnergyTaskRange, seed: number): DailyTask {
  const [start, end] = ENERGY_TASK_RANGES[range];
  return TASKS[start + (seed % (end - start))]!;
}

function buildEnergyTasks(scores: DailyScore[], copySeed: number, date: Date): DailyTask[] {
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const lowest = sorted[0]?.key ?? "study";
  const highest = sorted[sorted.length - 1]?.key ?? "career";
  const day = dayNumber(date);
  const rotatingRange = ROTATING_TASK_RANGES[(day + copySeed) % ROTATING_TASK_RANGES.length]!;
  const candidates: DailyTask[] = [
    pickEnergyTask(SUPPORT_TASK_RANGE[lowest], copySeed + day * 7),
    pickEnergyTask(MOMENTUM_TASK_RANGE[highest], copySeed + day * 11 + 3),
    pickEnergyTask(rotatingRange, copySeed + day * 17 + 6),
  ];

  for (let i = 0; candidates.length < 6 && i < ROTATING_TASK_RANGES.length; i += 1) {
    candidates.push(pickEnergyTask(ROTATING_TASK_RANGES[(day + i) % ROTATING_TASK_RANGES.length]!, copySeed + day * 19 + i));
  }

  return candidates.filter((task, index) => candidates.findIndex((candidate) => candidate.text === task.text) === index).slice(0, 3);
}

export function getDailyReport({
  anonId = "guest",
  date = new Date(),
  language = "en",
  birthDetails,
  ritualStreak,
}: {
  anonId?: string;
  date?: Date;
  language?: HintLanguage;
  birthDetails?: BirthDetails;
  ritualStreak?: number;
} = {}): DailyReport {
  const dateString = getLocalDateString(date);
  const copySeed = hash(`${anonId}:${dateString}`);
  const text = DAILY_BY_LANGUAGE[language];
  const labels = LUCKY_LABELS[language];

  const scores = SCORE_BASE.map(({ offset, ...score }) => ({
    ...score,
    label: SCORE_LABELS[language][score.key],
    score: scoreFor(score.key, offset, date, birthDetails, ritualStreak),
  }));
  const skyGuided = selectSkyGuidedTarot({
    anonId,
    date,
    birthDetails,
    tone: "honest",
  });
  const card = {
    ...getDailyPullById(skyGuided.selectedCardId, language),
    skyGuided,
  };

  const overallScore = Math.round(
    scores.reduce((total, score) => total + score.score, 0) / scores.length,
  );

  const [colorValue, colorHint] = pick(text.colors, copySeed, 3);
  const [jewelryValue, jewelryHint] = pick(JEWELRY, copySeed, 11);
  const [foodValue, foodHint] = pick(FOODS, copySeed, 17);
  const [carryValue, carryHint] = pick(CARRY_ITEMS, copySeed, 23);
  const [flowerValue, flowerHint] = pick(FLOWERS, copySeed, 31);
  const firstNumber = copySeed % 10;
  const secondNumber = (Math.floor(copySeed / 10) + 3) % 10;
  const numberValue = `${firstNumber} and ${secondNumber === firstNumber ? (secondNumber + 1) % 10 : secondNumber}`;

  const lucky: DailyLuckyItem[] = [
    { key: "color", label: labels.color, value: colorValue, hint: colorHint },
    { key: "jewelry", label: labels.jewelry, value: jewelryValue, hint: jewelryHint },
    {
      key: "number",
      label: labels.number,
      value: numberValue,
      hint: labels.numberHint,
    },
    { key: "food", label: labels.food, value: foodValue, hint: foodHint },
    { key: "carry", label: labels.carry, value: carryValue, hint: carryHint },
    { key: "flower", label: labels.flower, value: flowerValue, hint: flowerHint },
  ];

  const firstTask = copySeed % text.tasks.length;
  const tasks =
    language === "en"
      ? buildEnergyTasks(scores, copySeed, date)
      : Array.from({ length: 3 }, (_, i) => text.tasks[(firstTask + i) % text.tasks.length]!);

  return {
    date: dateString,
    overallScore,
    title: pick(text.titles, copySeed, 5),
    summary: pick(text.summaries, copySeed, 17),
    card,
    scores,
    lucky,
    suggestion: pick(text.suggestions, copySeed, 29),
    avoid: pick(text.avoids, copySeed, 41),
    selfHint: selfHintFor(copySeed, language),
    psychology: psychologyFor(copySeed, language),
    astrologyNote: astrologySummary(date, birthDetails, language),
    tasks,
  };
}
