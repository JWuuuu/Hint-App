import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import {
  ArrowLeft,
  Bird,
  Bone,
  Cat,
  Dog,
  Heart,
  MessageCircle,
  PawPrint,
  Rabbit,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import { RITUAL_TAROT_DECK, type RitualCard, type RitualDeckCard } from "../../modules/tarot/logic/createHiddenDeck";
import { TarotCardVisual } from "../../modules/tarot/components/TarotCardVisual";
import { SafeImage } from "../../shared/ui/SafeImage";
import "./animal-tarot.css";

const ANIMAL_TAROT_CARD_BACK_IMAGE = "/brand/tarot/card-backs/animal-tarot-card-back.png?v=1";
const ANIMAL_TAROT_FACE_VERSION = "20260702";

type PetType = "Cat" | "Dog" | "Rabbit" | "Bird" | "Hamster" | "Other";
type PetPersonality =
  | "Clingy"
  | "Shy"
  | "Playful"
  | "Dramatic"
  | "Quiet"
  | "Bossy"
  | "Curious"
  | "Lazy"
  | "Nervous"
  | "Foodie"
  | "Protective"
  | "Independent"
  | "Cuddly"
  | "Jealous"
  | "Energetic";
type QuestionCategory = "Love" | "Mood" | "Care" | "Silly";
type ReadingDepth = "quick" | "deep";
type Step = "profile" | "question" | "owner" | "cards" | "answer";
type StopSource = "pet" | "owner" | "deck";
type PetTarotCard = RitualDeckCard & { image: string | null };

const PET_TYPES: PetType[] = ["Cat", "Dog", "Rabbit", "Bird", "Hamster", "Other"];
const PET_PERSONALITIES: PetPersonality[] = [
  "Clingy",
  "Shy",
  "Playful",
  "Dramatic",
  "Quiet",
  "Bossy",
  "Curious",
  "Lazy",
  "Nervous",
  "Foodie",
  "Protective",
  "Independent",
  "Cuddly",
  "Jealous",
  "Energetic",
];

const PERSONALITY_PREVIEW_COUNT = 9;

const CATEGORY_OPTIONS: Array<{
  id: QuestionCategory;
  label: string;
  prompt: string;
  icon: typeof Heart;
}> = [
  { id: "Love", label: "Love", prompt: "connection, trust, affection", icon: Heart },
  { id: "Mood", label: "Mood", prompt: "today's energy and feelings", icon: MessageCircle },
  { id: "Care", label: "Care", prompt: "comfort, routine, little needs", icon: Bone },
  { id: "Silly", label: "Silly", prompt: "funny signs and tiny chaos", icon: Sparkles },
];

const PERSONALITY_TONE: Record<PetPersonality, string> = {
  Clingy: "soft, attached, and looking for reassurance",
  Shy: "gentle, cautious, and asking for a safer pace",
  Playful: "bright, curious, and wanting more fun",
  Dramatic: "expressive, sensitive, and asking to be noticed",
  Quiet: "calm, private, and happiest with simple routines",
  Bossy: "clear about preferences and not afraid to demand better service",
  Curious: "alert, observant, and secretly investigating everything",
  Lazy: "slow, cozy, and asking for comfort before effort",
  Nervous: "sensitive, easily startled, and needing reassurance",
  Foodie: "motivated by snacks, routine, and tiny edible diplomacy",
  Protective: "loyal, watchful, and trying to keep their world safe",
  Independent: "self-directed, private, and affectionate on their own terms",
  Cuddly: "warm, touch-seeking, and comforted by closeness",
  Jealous: "attention-aware, possessive, and checking where they stand",
  Energetic: "restless, excited, and needing movement before calm",
};

const PERSONALITY_ANSWER: Record<
  PetPersonality,
  {
    read: string;
    saying: string;
    support: string;
  }
> = {
  Clingy: {
    read: "this card is about reassurance, closeness, and wanting to feel chosen",
    saying: "stay near me, notice me softly, and make the world feel secure again",
    support: "give a calm check-in, a familiar touch, or a few quiet minutes together",
  },
  Shy: {
    read: "this card is asking for patience, lower pressure, and a safer emotional pace",
    saying: "do not rush me; let me decide when I am ready to come closer",
    support: "lower the noise, move slowly, and reward even a tiny brave step",
  },
  Playful: {
    read: "this card turns the message into curiosity, movement, and a little game",
    saying: "make this fun for me and I will show you what I need through play",
    support: "try a treat hunt, toy invitation, or silly check-in before asking for calm",
  },
  Dramatic: {
    read: "this card is amplifying feelings that want to be noticed before they can settle",
    saying: "my reaction is big because I want you to understand the feeling underneath",
    support: "acknowledge the mood first, then bring back one familiar comfort",
  },
  Quiet: {
    read: "this card points to subtle signals, private comfort, and a need for simplicity",
    saying: "watch the small signs; I may not announce what I need loudly",
    support: "keep the routine simple and let calm be the answer",
  },
  Bossy: {
    read: "this card is about clear preferences, boundaries, and wanting the room arranged correctly",
    saying: "I know what I want, and I am asking you to respect the signal",
    support: "honor the preference where you can, while keeping the boundary kind",
  },
  Curious: {
    read: "this card wants investigation, novelty, and something safe to inspect",
    saying: "give me something interesting and I will tell you how I feel by exploring it",
    support: "offer a safe object, scent, perch, window view, or tiny discovery moment",
  },
  Lazy: {
    read: "this card is about comfort first, effort second, and not forcing energy",
    saying: "make it easy for me; I am more open when my body feels cozy",
    support: "bring comfort closer instead of asking them to move toward it",
  },
  Nervous: {
    read: "this card is asking for steadiness, predictability, and fewer surprises",
    saying: "help me feel safe before you ask me to understand anything else",
    support: "use a soft voice, predictable movement, and a quiet reset",
  },
  Foodie: {
    read: "this card connects comfort, trust, and routine through food or reward",
    saying: "make the message feel safe through something familiar and delicious",
    support: "use a small treat, mealtime ritual, or food puzzle as the bridge",
  },
  Protective: {
    read: "this card is about watchfulness, loyalty, and making sure their home base is safe",
    saying: "I am checking the room because I care about what belongs to us",
    support: "reassure them that the space is handled and they can stand down",
  },
  Independent: {
    read: "this card respects choice, space, and affection on their own terms",
    saying: "let me choose the timing and I will come back with real trust",
    support: "offer options, then step back enough for them to choose",
  },
  Cuddly: {
    read: "this card comes through touch, warmth, and the comfort of being close",
    saying: "connection helps me understand the moment; stay soft and near",
    support: "offer warmth, closeness, or a familiar cuddle if they ask for it",
  },
  Jealous: {
    read: "this card is about attention, fairness, and needing to know where they stand",
    saying: "show me I still matter, but do not make me fight for it",
    support: "give clear attention, then return everyone to a steady routine",
  },
  Energetic: {
    read: "this card has extra motion in it, so the message may arrive through activity",
    saying: "help me move the energy out, then I can listen with my whole body",
    support: "start with movement, play, or a short active reset before settling",
  },
};

const CATEGORY_TONE: Record<QuestionCategory, string> = {
  Love: "This answer is about how your pet feels bonded to you.",
  Mood: "This answer reads your pet's current emotional weather.",
  Care: "This answer focuses on what may help your pet feel comfortable.",
  Silly: "This answer keeps the message light, funny, and low-stakes.",
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function cardWithImage(card: RitualDeckCard): PetTarotCard {
  return {
    ...card,
    image: getAnimalTarotCardImage(card.cardId),
  };
}

function toRitualCard(card: PetTarotCard, index = 0): RitualCard {
  return {
    visualId: `${card.cardId}-${index}`,
    cardId: card.cardId,
    name: card.name,
    orientation: "upright",
    x: 50,
    y: 50,
    rotation: 0,
    rotate: 0,
    zIndex: index,
    selected: false,
    revealed: false,
  };
}

function drawCards(seed: string, count: number): PetTarotCard[] {
  const deck = [...RITUAL_TAROT_DECK];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = hashString(`${seed}:${index}:${deck[index]?.cardId}`) % (index + 1);
    [deck[index], deck[swapIndex]] = [deck[swapIndex]!, deck[index]!];
  }
  return deck.slice(0, count).map(cardWithImage);
}

function animalIcon(type: PetType) {
  if (type === "Cat") return Cat;
  if (type === "Dog") return Dog;
  if (type === "Rabbit") return Rabbit;
  if (type === "Bird") return Bird;
  return PawPrint;
}

function getAnimalTarotCardImage(cardId: string) {
  return `/brand/tarot/decks/animal-hint/cards/${cardId}.png?v=${ANIMAL_TAROT_FACE_VERSION}`;
}

function possessiveName(name: string) {
  const trimmed = name.trim() || "your pet";
  return trimmed.endsWith("s") ? `${trimmed}'` : `${trimmed}'s`;
}

function personalityPhrase(personalities: PetPersonality[]) {
  const selected = personalities.length ? personalities : ["Playful" as const];
  if (selected.length === 1) return selected[0].toLowerCase();
  if (selected.length === 2) return `${selected[0].toLowerCase()} and ${selected[1].toLowerCase()}`;
  return `${selected.slice(0, -1).map((item) => item.toLowerCase()).join(", ")}, and ${selected[selected.length - 1]?.toLowerCase()}`;
}

function primaryPersonality(personalities: PetPersonality[]) {
  return personalities[0] ?? "Playful";
}

function tonePhrase(personalities: PetPersonality[]) {
  const selected = personalities.length ? personalities : ["Playful" as const];
  return selected.slice(0, 4).map((item) => PERSONALITY_TONE[item]).join("; ");
}

function personalityAnswer(personalities: PetPersonality[]) {
  return PERSONALITY_ANSWER[primaryPersonality(personalities)];
}

function personalityBehavior(personalities: PetPersonality[], name: string) {
  const primary = primaryPersonality(personalities);
  return {
    Clingy: `${name} may show it by staying close, asking for contact, or checking that you are still there.`,
    Shy: `${name} may show it quietly: a small approach, a long look, or relaxing only when the pressure drops.`,
    Playful: `${name} may show it through movement, games, sudden curiosity, or asking you to respond.`,
    Dramatic: `${name} may show it with a bigger reaction than expected because the feeling wants to be noticed first.`,
    Quiet: `${name} may show it through tiny signals, soft body language, or choosing a calm spot nearby.`,
    Bossy: `${name} may show it by making a preference very clear and expecting the room to adjust.`,
    Curious: `${name} may show it by inspecting, sniffing, watching, or testing the situation before committing.`,
    Lazy: `${name} may show it by wanting the answer brought closer: comfort first, effort later.`,
    Nervous: `${name} may show it through hesitation, alertness, or needing the room to feel predictable again.`,
    Foodie: `${name} may show it through food rhythm, treat interest, or comfort around familiar routines.`,
    Protective: `${name} may show it by monitoring the room and checking whether their safe space is handled.`,
    Independent: `${name} may show it by needing choice, space, and the freedom to come closer on their own terms.`,
    Cuddly: `${name} may show it through warmth, touch, leaning in, or wanting closeness to make the message clear.`,
    Jealous: `${name} may show it by tracking attention and needing a simple reminder that they still matter.`,
    Energetic: `${name} may show it through restless movement, quick reactions, or needing activity before calm.`,
  }[primary];
}

function actionCopy(personalities: PetPersonality[], category: QuestionCategory) {
  const primary = primaryPersonality(personalities);
  const base = {
    Clingy: "offer a few calm minutes of attention without making it a big performance",
    Shy: "lower the noise, move slowly, and let them come closer first",
    Playful: "turn the answer into a tiny game, treat hunt, or silly check-in",
    Dramatic: "acknowledge the big feelings, then reset the room with something familiar",
    Quiet: "keep the routine simple and let comfort be boring in the best way",
    Bossy: "respect the preference, but keep the boundary kind and consistent",
    Curious: "give them something safe to inspect, sniff, or explore",
    Lazy: "make comfort easy: soft spot, water nearby, and no unnecessary pressure",
    Nervous: "use a calm voice, predictable movement, and a quiet reset",
    Foodie: "use a small treat or mealtime ritual to make the message feel safe",
    Protective: "reassure them that the home base is handled and they can relax",
    Independent: "give them choice and space, then let affection happen naturally",
    Cuddly: "offer closeness, warmth, and a familiar touch if they ask for it",
    Jealous: "give clear attention without rewarding pushy behavior too much",
    Energetic: "help them move the energy out before asking them to settle",
  }[primary];

  if (category === "Care") return `${base}. Watch what changes in their body language after that.`;
  if (category === "Love") return `${base}. A small repeated ritual will mean more than one grand gesture.`;
  if (category === "Silly") return `${base}. Do not overthink the comedy; your pet is probably already the director.`;
  return `${base}. Their mood should soften when they feel understood.`;
}

function questionFocus(question: string, category: QuestionCategory) {
  const normalizedQuestion = question.trim().toLowerCase();

  if (normalizedQuestion.includes("feel") || normalizedQuestion.includes("mood")) {
    return {
      noun: "feelings",
      bridge: "For this feelings question",
      card: "describes the emotional pattern behind it",
      tone: "answer with emotional patience",
    };
  }

  if (normalizedQuestion.includes("need") || normalizedQuestion.includes("care")) {
    return {
      noun: "needs",
      bridge: "For this care question",
      card: "points to what would help most right now",
      tone: "answer with practical comfort",
    };
  }

  if (normalizedQuestion.includes("love") || normalizedQuestion.includes("bond") || normalizedQuestion.includes("trust")) {
    return {
      noun: "bond",
      bridge: "For this connection question",
      card: "shows what the bond is asking for",
      tone: "answer with reassurance and steadiness",
    };
  }

  if (normalizedQuestion.startsWith("why")) {
    return {
      noun: "reason",
      bridge: "For this why question",
      card: "shows the reason underneath the behavior",
      tone: "answer by looking beneath the surface",
    };
  }

  if (normalizedQuestion.startsWith("how") || normalizedQuestion.includes("what should") || normalizedQuestion.includes("what can i do")) {
    return {
      noun: "next step",
      bridge: "For this action question",
      card: "shows the best next step",
      tone: "answer with one small action",
    };
  }

  if (normalizedQuestion.startsWith("when")) {
    return {
      noun: "timing",
      bridge: "For this timing question",
      card: "shows the pace to follow",
      tone: "answer without rushing the signal",
    };
  }

  if (category === "Care") {
    return {
      noun: "comfort",
      bridge: "For this care question",
      card: "points to comfort first",
      tone: "answer with practical comfort",
    };
  }

  if (category === "Love") {
    return {
      noun: "connection",
      bridge: "For this love question",
      card: "shows what the connection needs",
      tone: "answer with reassurance and steadiness",
    };
  }

  if (category === "Silly") {
    return {
      noun: "signal",
      bridge: "For this lighthearted question",
      card: "keeps the message playful",
      tone: "answer lightly",
    };
  }

  return {
    noun: "message",
    bridge: "For this question",
    card: "shows the message underneath",
    tone: "answer in your pet's natural rhythm",
  };
}

type CardQuestionSignal = {
  answer: string;
  reason: string;
  action: string;
};

function cardQuestionSignal(card: PetTarotCard, name: string): CardQuestionSignal {
  const [rankOrMajor, suit] = card.cardId.split("-");

  const suitDetails: Record<
    string,
    {
      area: string;
      reason: string;
      action: string;
      signal: string;
    }
  > = {
    wands: {
      area: "play, movement, and attention",
      reason: "energy, instinct, and the urge to do something",
      action: "offer a toy invitation, a chase moment, or a new thing to inspect",
      signal: "more brightness in their body",
    },
    cups: {
      area: "affection, trust, and emotional reassurance",
      reason: "feelings, bonding, and the need to feel safe with you",
      action: "make your voice softer, offer closeness, and let the mood settle",
      signal: "a softer face, slower body, or choosing to stay near you",
    },
    swords: {
      area: "quiet space, clearer signals, and less pressure",
      reason: "noise, tension, boundaries, and mental overstimulation",
      action: "lower the stimulation, simplify the room, and give one clear cue",
      signal: "less alertness and more relaxed body language",
    },
    pentacles: {
      area: "body comfort, routine, and practical care",
      reason: "food, rest, touch, territory, and everyday needs",
      action: "check food, water, litter, bedding, temperature, and familiar routine",
      signal: "more physical ease or a return to normal habits",
    },
  };

  const suitDetail = suit ? suitDetails[suit] : undefined;
  const minorRankSignals: Record<string, (detail: NonNullable<typeof suitDetail>) => CardQuestionSignal> = {
    ace: (detail) => ({
      answer: `${name} wants a fresh start around ${detail.area}`,
      reason: `${card.name} is an Ace, so the message is a first spark, not a finished answer`,
      action: `begin with one small opening: ${detail.action}`,
    }),
    two: (detail) => ({
      answer: `${name} is choosing between two needs around ${detail.area}`,
      reason: `${card.name} is a Two, so the message is about choice, balance, and what draws them closer`,
      action: `offer two gentle options and watch which one gets ${detail.signal}`,
    }),
    three: (detail) => ({
      answer: `${name} wants you to join the pattern, not just observe it`,
      reason: `${card.name} is a Three, so the message is about shared rhythm and cooperation through ${detail.reason}`,
      action: `participate lightly, then look for ${detail.signal}`,
    }),
    four: (detail) => ({
      answer: `${name} needs a pause and a stable base`,
      reason: `${card.name} is a Four, so the message is about safety, structure, and holding the moment still`,
      action: `make the environment steady first, then ${detail.action}`,
    }),
    five: (detail) => ({
      answer: `${name} is reacting to a small conflict or discomfort`,
      reason: `${card.name} is a Five, so the message points to friction in ${detail.reason}`,
      action: `remove one possible stressor and see whether there is ${detail.signal}`,
    }),
    six: (detail) => ({
      answer: `${name} wants something familiar to feel good again`,
      reason: `${card.name} is a Six, so the answer comes through repair, memory, and returning to comfort`,
      action: `bring back a trusted ritual, then ${detail.action}`,
    }),
    seven: (detail) => ({
      answer: `${name} is interested, but not fully convinced yet`,
      reason: `${card.name} is a Seven, so the message is about testing, waiting, and deciding from a distance`,
      action: `give space and let ${name} approach before you ask for more`,
    }),
    eight: (detail) => ({
      answer: `${name} needs repetition before the message becomes clear`,
      reason: `${card.name} is an Eight, so the answer is built through routine, practice, and repeated signals`,
      action: `repeat the same gentle cue and watch whether it creates ${detail.signal}`,
    }),
    nine: (detail) => ({
      answer: `${name} is close to feeling settled, but wants one last comfort`,
      reason: `${card.name} is a Nine, so the message is nearly complete but still protective of its own space`,
      action: `give the final bit of support without crowding them`,
    }),
    ten: (detail) => ({
      answer: `${name} has reached the limit of this energy`,
      reason: `${card.name} is a Ten, so the message is full, heavy, or ready to be completed`,
      action: `stop adding more stimulation and help the moment wind down`,
    }),
    page: (detail) => ({
      answer: `${name} is sending a small curious signal`,
      reason: `${card.name} is a Page, so the answer arrives as a beginner message through ${detail.reason}`,
      action: `treat the tiny sign as meaningful and respond with ${detail.action}`,
    }),
    knight: (detail) => ({
      answer: `${name} wants movement now, not later`,
      reason: `${card.name} is a Knight, so the message comes fast, restless, and direct`,
      action: `respond quickly but keep it controlled: ${detail.action}`,
    }),
    queen: (detail) => ({
      answer: `${name} wants to feel emotionally understood`,
      reason: `${card.name} is a Queen, so the answer is about care, sensitivity, and reading the room well`,
      action: `lead with softness, then look for ${detail.signal}`,
    }),
    king: (detail) => ({
      answer: `${name} wants a clear boundary and a confident response`,
      reason: `${card.name} is a King, so the message asks for calm leadership around ${detail.reason}`,
      action: `choose the rule or ritual, keep it steady, and do not keep changing the signal`,
    }),
  };

  const minorSignal = suitDetail ? minorRankSignals[rankOrMajor]?.(suitDetail) : undefined;
  if (minorSignal) return minorSignal;

  const majorSignals: Record<string, CardQuestionSignal> = {
    "0": {
      answer: `${name} is ready for a small fresh start`,
      reason: "The Fool points to curiosity, trust, and a low-pressure beginning",
      action: "offer something simple and safe to explore",
    },
    "1": {
      answer: `${name} wants one clear cue from you`,
      reason: "The Magician points to focus and intentional action",
      action: "choose one small signal instead of trying everything at once",
    },
    "2": {
      answer: `${possessiveName(name)} answer is subtle, so watch the quiet signs`,
      reason: "The High Priestess points to instinct, silence, and hidden signals",
      action: "notice where they look, pause, sniff, or settle",
    },
    "3": {
      answer: `${name} wants more softness and care`,
      reason: "The Empress points to comfort, nurturing, and feeling held",
      action: "make the environment warmer, gentler, and easier to relax in",
    },
    "4": {
      answer: `${name} wants structure that feels reliable`,
      reason: "The Emperor points to order, boundaries, and a steady room",
      action: "return to the familiar routine and keep the rules calm",
    },
    "5": {
      answer: `${name} wants the familiar ritual, not a brand-new solution`,
      reason: "The Hierophant points to trust built through repeated habits",
      action: "use the routine they already understand",
    },
    "6": {
      answer: `${name} is asking for connection and a clear choice`,
      reason: "The Lovers points to bonding, alignment, and choosing each other",
      action: "offer two gentle options and let their body choose",
    },
    "7": {
      answer: `${name} has energy that needs direction`,
      reason: "The Chariot points to drive, movement, and momentum",
      action: "guide the energy into play, movement, or a focused reset",
    },
    "8": {
      answer: `${name} needs patience more than pressure`,
      reason: "Strength points to gentleness, courage, and soft control",
      action: "stay calm and let trust do the work",
    },
    "9": {
      answer: `${name} needs quiet space before the answer gets clear`,
      reason: "The Hermit points to solitude, truth, and stepping back",
      action: "give them room, then watch whether they return by choice",
    },
    "10": {
      answer: `${possessiveName(name)} mood is shifting, so the answer changes with the moment`,
      reason: "Wheel of Fortune points to timing, cycles, and a turn in the room",
      action: "follow the first clear change in their behavior today",
    },
    "11": {
      answer: `${name} wants balance restored`,
      reason: "Justice points to fairness, truth, and noticing what is out of proportion",
      action: "check what changed in the routine, attention, or environment",
    },
    "12": {
      answer: `${name} needs you to pause and see this differently`,
      reason: "The Hanged Man points to slowing down and changing perspective",
      action: "stop pushing for a signal and let the meaning arrive indirectly",
    },
    "13": {
      answer: `${name} is ready to let one mood pass`,
      reason: "Death points to release, endings, and a reset after change",
      action: "help the old energy clear instead of trying to keep it going",
    },
    "14": {
      answer: `${name} needs a gentler rhythm`,
      reason: "Temperance points to balance, healing, and blending energies slowly",
      action: "make the next step moderate, soft, and easy to accept",
    },
    "15": {
      answer: `${name} is stuck in a pattern that needs a reset`,
      reason: "The Devil points to attachment, habit, and repeating loops",
      action: "interrupt the loop kindly with a new texture, sound, toy, or routine cue",
    },
    "16": {
      answer: `${name} is reacting to something that suddenly feels too much`,
      reason: "The Tower points to disruption, surprise, and a shaken room",
      action: "change the environment first and let them settle before asking again",
    },
    "17": {
      answer: `${name} is looking for reassurance and hope`,
      reason: "The Star points to renewal, trust, and a soft emotional reset",
      action: "keep the moment gentle and let your calm become the message",
    },
    "18": {
      answer: `${name} is moving by instinct, not logic`,
      reason: "The Moon points to uncertainty, mystery, and subtle fears",
      action: "watch the tiny signals and do not force a clear answer too soon",
    },
    "19": {
      answer: `${name} wants warmth, clarity, and simple joy`,
      reason: "The Sun points to openness, happiness, and easy reassurance",
      action: "make the next moment bright, simple, and affectionate",
    },
    "20": {
      answer: `${name} is giving you a wake-up signal`,
      reason: "Judgement points to noticing the message you cannot ignore",
      action: "treat the behavior as meaningful and respond directly",
    },
    "21": {
      answer: `${name} wants to feel fully at home in this moment`,
      reason: "The World points to belonging, completion, and everything clicking into place",
      action: "bring them back to the place, person, or ritual that feels complete",
    },
  };

  return (
    majorSignals[rankOrMajor] ?? {
      answer: `${name} is answering through instinct`,
      reason: `${card.name} points to ${card.keywords.slice(0, 2).join(" and ") || "the first clear signal"}`,
      action: "trust the first steady sign you notice",
    }
  );
}

type CardVoice = {
  twist: string;
  petCue: string;
  playfulName: string;
};

function cardVoice(card: PetTarotCard, name: string): CardVoice {
  const [rankOrMajor, suit] = card.cardId.split("-");
  const suitVoices: Record<
    string,
    {
      place: string;
      twist: string;
      cue: string;
    }
  > = {
    wands: {
      place: "tiny fireworks department",
      twist: "it wants motion, a spark, and a response you can see",
      cue: "zoomy eyes, sudden curiosity, a playful swat, or a dramatic little exit and return",
    },
    cups: {
      place: "soft feelings department",
      twist: "it wants reassurance, sweetness, and a moment that feels emotionally safe",
      cue: "leaning closer, slow blinking, softer body language, or choosing to stay near you",
    },
    swords: {
      place: "tiny boundary committee",
      twist: "it wants the room simpler, quieter, and easier to understand",
      cue: "staring, pausing, ears shifting, moving away, or watching before joining",
    },
    pentacles: {
      place: "snack, blanket, and body comfort office",
      twist: "it wants the practical stuff checked before the big feelings get discussed",
      cue: "sniffing, settling, stretching, eating, returning to routine, or claiming the best spot",
    },
  };

  const rankVoices: Record<
    string,
    {
      playfulName: string;
      twist: string;
      cue: string;
    }
  > = {
    ace: {
      playfulName: "the tiny green light",
      twist: "start with one small experiment, not a whole life redesign",
      cue: "the first little yes from their body",
    },
    two: {
      playfulName: "the two-option test",
      twist: "put two gentle choices in front of them and let the body vote",
      cue: "which option gets the longer look",
    },
    three: {
      playfulName: "the team project",
      twist: "they want you in the scene, not watching from the doorway",
      cue: "whether they invite you into the rhythm",
    },
    four: {
      playfulName: "the cozy base camp",
      twist: "make the room feel steady before asking for a bigger answer",
      cue: "where they settle when nothing is being demanded",
    },
    five: {
      playfulName: "the tiny drama alarm",
      twist: "something is mildly wrong, annoying, unfair, or too loud in pet language",
      cue: "the small protest before it becomes a whole performance",
    },
    six: {
      playfulName: "the comfort rerun",
      twist: "bring back the familiar thing that already worked once",
      cue: "whether an old ritual makes them soften",
    },
    seven: {
      playfulName: "the suspicious little scientist",
      twist: "they are interested, but they want to inspect the evidence first",
      cue: "the careful look that says, I might be convinced",
    },
    eight: {
      playfulName: "the practice loop",
      twist: "repeat the same gentle cue until it becomes readable",
      cue: "what changes after the second or third try",
    },
    nine: {
      playfulName: "the almost-satisfied monarch",
      twist: "they are close to okay, but one final comfort matters",
      cue: "the last thing they keep returning to",
    },
    ten: {
      playfulName: "the full-bucket signal",
      twist: "the answer is stop adding more and help the moment land",
      cue: "signs that the energy has reached its limit",
    },
    page: {
      playfulName: "the tiny messenger",
      twist: "take the small sign seriously, even if it looks silly",
      cue: "the baby signal: one paw, one sniff, one almost-choice",
    },
    knight: {
      playfulName: "the little delivery driver",
      twist: "respond quickly, because this message has wheels on it",
      cue: "fast movement, sudden decision, or an impatient look",
    },
    queen: {
      playfulName: "the emotional translator",
      twist: "read the room with softness before you try to fix it",
      cue: "the moment they relax because you understood the feeling",
    },
    king: {
      playfulName: "the calm boss",
      twist: "choose the rule, keep it kind, and stop changing the signal",
      cue: "whether they trust the boundary once it stays consistent",
    },
  };

  const suitVoice = suit ? suitVoices[suit] : undefined;
  const rankVoice = rankVoices[rankOrMajor];
  if (suitVoice && rankVoice) {
    return {
      playfulName: `${rankVoice.playfulName} from the ${suitVoice.place}`,
      twist: `${rankVoice.twist}; ${suitVoice.twist}`,
      petCue: `Look for ${rankVoice.cue}: ${suitVoice.cue}.`,
    };
  }

  const majorVoices: Record<string, CardVoice> = {
    "0": {
      playfulName: "the tiny leap",
      twist: "try the easy, low-pressure version first and let curiosity lead",
      petCue: `Look for the moment ${name} acts like the world just opened a tiny door.`,
    },
    "1": {
      playfulName: "the magic button",
      twist: "one clear cue will work better than five mixed signals",
      petCue: `Look for what ${name} copies, follows, or focuses on right away.`,
    },
    "2": {
      playfulName: "the secret whisper",
      twist: "the answer is quiet, private, and probably already happening in the small signs",
      petCue: `Look where ${name} stares, pauses, sniffs, or refuses to explain themselves.`,
    },
    "3": {
      playfulName: "the soft nest",
      twist: "comfort is the answer before logic is the answer",
      petCue: `Look for the spot, person, blanket, or touch ${name} treats like home base.`,
    },
    "4": {
      playfulName: "the household manager",
      twist: "the room needs order, predictable rules, and fewer surprise changes",
      petCue: `Look for what ${name} tries to control, patrol, or arrange.`,
    },
    "5": {
      playfulName: "the ritual keeper",
      twist: "do the familiar thing; this is not the day for a brand-new system",
      petCue: `Look for the routine ${name} trusts without needing to think.`,
    },
    "6": {
      playfulName: "the choose-me card",
      twist: "the answer is about connection, preference, and being emotionally picked",
      petCue: `Look for who or what ${name} chooses when both options are available.`,
    },
    "7": {
      playfulName: "the tiny race car",
      twist: "give the energy a direction before asking it to be calm",
      petCue: `Look for where ${name} wants to go, chase, climb, or charge next.`,
    },
    "8": {
      playfulName: "the velvet strength card",
      twist: "soft control beats loud control",
      petCue: `Look for the gentlest thing that helps ${name} feel brave.`,
    },
    "9": {
      playfulName: "the little cave",
      twist: "space is not rejection; it is how the answer gets clear",
      petCue: `Look for whether ${name} returns after being allowed to step away.`,
    },
    "10": {
      playfulName: "the mood wheel",
      twist: "the answer changes when the room changes, so follow the first shift",
      petCue: `Look for the exact moment ${name} turns from no to maybe.`,
    },
    "11": {
      playfulName: "the fairness judge",
      twist: "something wants to be balanced, shared, or corrected",
      petCue: `Look for what ${name} keeps checking as if the math is wrong.`,
    },
    "12": {
      playfulName: "the upside-down pause",
      twist: "stop pushing and the answer may walk in sideways",
      petCue: `Look for the signal that appears only after you stop asking for it.`,
    },
    "13": {
      playfulName: "the reset door",
      twist: "let the old mood end instead of trying to decorate it",
      petCue: `Look for what ${name} is done with today.`,
    },
    "14": {
      playfulName: "the smoothie card",
      twist: "blend two needs slowly: comfort plus curiosity, space plus closeness",
      petCue: `Look for the middle path ${name} accepts without resistance.`,
    },
    "15": {
      playfulName: "the habit loop",
      twist: "a repeated pattern wants a kind interruption",
      petCue: `Look for what ${name} keeps doing even when it does not help.`,
    },
    "16": {
      playfulName: "the sudden thunderclap",
      twist: "reduce the shock first; the answer comes after the room stops shaking",
      petCue: `Look for what startled, overloaded, or dramatically offended ${name}.`,
    },
    "17": {
      playfulName: "the night-light",
      twist: "make the message hopeful, gentle, and easy to trust",
      petCue: `Look for what helps ${name} exhale.`,
    },
    "18": {
      playfulName: "the spooky hallway",
      twist: "instinct is louder than logic right now, so do not argue with the vibe",
      petCue: `Look for the shadow, sound, scent, or mystery ${name} keeps tracking.`,
    },
    "19": {
      playfulName: "the sunbeam answer",
      twist: "make it warm, obvious, and uncomplicated",
      petCue: `Look for where ${name} becomes brighter, looser, or more openly themselves.`,
    },
    "20": {
      playfulName: "the wake-up call",
      twist: "this behavior is not random; treat it like a message asking to be answered",
      petCue: `Look for the thing ${name} repeats until someone finally notices.`,
    },
    "21": {
      playfulName: "the everything-clicks card",
      twist: "bring the pieces together: place, person, routine, and timing",
      petCue: `Look for where ${name} looks complete, settled, and fully included.`,
    },
  };

  return (
    majorVoices[rankOrMajor] ?? {
      playfulName: "the instinct card",
      twist: "trust the first clear signal and keep the response simple",
      petCue: `Look for the sign ${name} repeats without overthinking it.`,
    }
  );
}

function yesNoAnswer(card: PetTarotCard) {
  const [rankOrMajor, suit] = card.cardId.split("-");
  const softYes = new Set(["ace", "three", "six", "nine", "page", "queen", "19", "17", "21", "6"]);
  const notYet = new Set(["five", "seven", "ten", "15", "16", "18", "12", "13"]);
  const needsChoice = new Set(["two", "11", "10", "14"]);

  if (softYes.has(rankOrMajor)) return "Mostly yes, but keep it soft and low-pressure";
  if (notYet.has(rankOrMajor)) return "Not yet; the current vibe needs a reset first";
  if (needsChoice.has(rankOrMajor)) return "Maybe; let the next tiny choice decide";
  if (suit === "wands") return "Yes, if you give the energy somewhere fun to go";
  if (suit === "cups") return "Yes, if it feels emotionally safe";
  if (suit === "swords") return "Only after the pressure drops";
  if (suit === "pentacles") return "Yes, if the comfort basics are handled first";
  return "Yes, if the first small signal matches what you are seeing";
}

type QuickReadingBlock = {
  label: string;
  copy: string;
};

const PET_GIFTS: Record<PetPersonality, string> = {
  Clingy: "You are my favorite place to feel safe.",
  Shy: "Thank you for loving the parts of me that arrive slowly.",
  Playful: "Your laugh is one of my favorite toys.",
  Dramatic: "Even my biggest feelings feel safer when you notice them.",
  Quiet: "You hear me, even when I say almost nothing.",
  Bossy: "Thank you for learning the language of my very specific opinions.",
  Curious: "The world feels more interesting when I explore it with you.",
  Lazy: "Home is wherever I can fully relax beside you.",
  Nervous: "Your calm helps me believe that I am safe.",
  Foodie: "Every little treat tastes better when it comes with your attention.",
  Protective: "I watch over our world because it matters to me.",
  Independent: "My love is real, even when I choose a little distance.",
  Cuddly: "Your warmth is one of the places I call home.",
  Jealous: "I only ask because being important to you means everything to me.",
  Energetic: "Thank you for loving all the motion inside me.",
};

const PET_DREAMS: Record<PetPersonality, string> = {
  Clingy: "If I dream tonight, I hope I dream that you never have to leave the room.",
  Shy: "If I dream tonight, I hope I find a quiet path that leads me gently back to you.",
  Playful: "If I dream tonight, I hope we chase light across the floor and laugh together.",
  Dramatic: "If I dream tonight, I hope I am the star and you never miss my best scene.",
  Quiet: "If I dream tonight, I hope we sit together somewhere the whole world has gone soft.",
  Bossy: "If I dream tonight, I hope everything is exactly where I like it, including you.",
  Curious: "If I dream tonight, I hope every closed door opens into a new little universe.",
  Lazy: "If I dream tonight, I hope the sunbeam is warm and nobody asks me to move.",
  Nervous: "If I dream tonight, I hope every sound is gentle and your voice is close.",
  Foodie: "If I dream tonight, I hope the treat jar has no bottom and we share the adventure.",
  Protective: "If I dream tonight, I hope everyone I love is home, safe, and together.",
  Independent: "If I dream tonight, I hope I can wander anywhere and still find my way to you.",
  Cuddly: "If I dream tonight, I hope the whole night feels like falling asleep beside you.",
  Jealous: "If I dream tonight, I hope I get your favorite spot and all of your attention.",
  Energetic: "If I dream tonight, I hope the road never ends and you keep running beside me.",
};

function capitalizeFirst(copy: string) {
  return copy ? `${copy.charAt(0).toUpperCase()}${copy.slice(1)}` : copy;
}

function petFirstPersonSignal(copy: string, name: string) {
  return copy
    .replace(`${possessiveName(name)} `, "my ")
    .replace(`${name} is`, "I am")
    .replace(`${name} has`, "I have")
    .replace(`${name} wants`, "I want")
    .replace(`${name} needs`, "I need")
    .replace(`${name} may`, "I may")
    .replace(`${name} `, "I ");
}

function voiceOfPet({
  question,
  name,
  card,
  personality,
}: {
  question: string;
  name: string;
  card: PetTarotCard;
  personality: ReturnType<typeof personalityAnswer>;
}) {
  const normalizedQuestion = question.trim().toLowerCase();
  const signal = cardQuestionSignal(card, name);
  const firstPerson = capitalizeFirst(petFirstPersonSignal(signal.answer, name));
  const personalityLine = capitalizeFirst(personality.saying);
  const startsLikeYesNo = /^(is|are|am|do|does|did|can|could|should|will|would|has|have)\b/.test(
    normalizedQuestion,
  );

  if (normalizedQuestion.startsWith("how") || normalizedQuestion.includes("what should") || normalizedQuestion.includes("what can i do")) {
    return `"The best way to help me today is simple: ${signal.action}. ${personalityLine}."`;
  }

  if (normalizedQuestion.startsWith("why")) {
    return `"Here is what is underneath it: ${firstPerson}. ${personalityLine}."`;
  }

  if (startsLikeYesNo) {
    return `"${yesNoAnswer(card)}. ${firstPerson}."`;
  }

  return `"${firstPerson}. ${personalityLine}."`;
}

function quickAnswer({
  petName,
  animalType,
  personalities,
  personalityNote,
  category,
  question,
  card,
}: {
  petName: string;
  animalType: PetType;
  personalities: PetPersonality[];
  personalityNote: string;
  category: QuestionCategory;
  question: string;
  card: PetTarotCard;
}): QuickReadingBlock[] {
  const name = petName.trim() || "Your pet";
  const petKind = animalType === "Other" ? "pet" : animalType.toLowerCase();
  const signal = cardQuestionSignal(card, name);
  const primary = primaryPersonality(personalities);
  const personality = personalityAnswer(personalities);
  const voice = cardVoice(card, name);
  const [, suit] = card.cardId.split("-");
  const energyBySuit: Record<string, { label: string; state: string }> = {
    wands: { label: "Play drive", state: "bright, active, and ready for a response" },
    cups: { label: "Emotional sensitivity", state: "high, soft, and seeking reassurance" },
    swords: { label: "Alertness", state: "high, watchful, and easily overstimulated" },
    pentacles: { label: "Comfort needs", state: "steady, physical, and rooted in routine" },
  };
  const energy = energyBySuit[suit ?? ""] ?? {
    label: "Emotional energy",
    state: "shifting gently and asking to be noticed",
  };
  const note = personalityNote.trim();
  const compactNote = note.length > 80 ? `${note.slice(0, 77)}...` : note;
  const noteCopy = compactNote ? ` Your profile note adds one clue: ${compactNote}.` : "";
  const ritualsBySuit: Record<string, string> = {
    wands: `Invite ${name} into one minute of play, then let them decide when to stop.`,
    cups: `Say ${possessiveName(name)} name softly and offer three slow, gentle strokes.`,
    swords: "Lower one sound in the room and share five quiet breaths nearby.",
    pentacles: `Refresh ${possessiveName(name)} water, blanket, or favorite resting spot.`,
  };
  const majorRituals = [
    `Say ${possessiveName(name)} name once and hold a soft gaze for five seconds.`,
    `Sit beside ${name} for one quiet minute without asking for anything.`,
    `Offer ${name} one favorite treat with no extra cue or expectation.`,
    `Give ${name} three slow head strokes, then let them choose what comes next.`,
  ];
  const majorIndex = Number.parseInt(card.cardId, 10);
  const ritual = ritualsBySuit[suit ?? ""] ?? majorRituals[Number.isNaN(majorIndex) ? 0 : majorIndex % majorRituals.length];

  return [
    {
      label: "Voice of Your Pet",
      copy: voiceOfPet({ question, name, card, personality }),
    },
    {
      label: "Current Energy",
      copy: `${energy.label}: ${energy.state}. As a ${primary.toLowerCase()} ${petKind}, ${name} is ${PERSONALITY_TONE[primary]}.${noteCopy}`,
    },
    {
      label: "Why This Card Appeared",
      copy: `${card.name} appeared because ${signal.answer}. It mirrors today's bond: ${voice.twist}.`,
    },
    {
      label: "Today's Bond",
      copy: `Today, ${signal.action}. Keep it easy and let ${name} decide when the moment feels complete.`,
    },
    {
      label: "Gift From Your Pet",
      copy: `"${PET_GIFTS[primary]}"`,
    },
    {
      label: "Tiny Ritual",
      copy: ritual,
    },
    {
      label: "If Your Pet Could Dream",
      copy: `"${PET_DREAMS[primary]}"`,
    },
  ];
}

function deepAnswer({
  petName,
  personalities,
  personalityNote,
  category,
  cards,
}: {
  petName: string;
  personalities: PetPersonality[];
  personalityNote: string;
  category: QuestionCategory;
  cards: PetTarotCard[];
}) {
  const name = petName.trim() || "Your pet";
  const [feeling, message, action] = cards;
  const primary = primaryPersonality(personalities);
  const personality = personalityAnswer(personalities);
  const customNote = personalityNote.trim()
    ? ` Your description of them matters here: ${personalityNote.trim()}.`
    : "";
  return [
    {
      label: "Feeling",
      card: feeling,
      copy: `${possessiveName(name)} ${primary.toLowerCase()} side may be feeling ${
        feeling?.keywords[0] ?? "a lot"
      } underneath the surface. For this personality, ${personality.read}.${customNote} ${CATEGORY_TONE[category]}`,
    },
    {
      label: "Message",
      card: message,
      copy: `${message?.name ?? "This card"} says: ${personality.saying}. Read the small signs through their ${personalityPhrase(
        personalities,
      )} nature, not just the loud ones.`,
    },
    {
      label: "Action",
      card: action,
      copy: `The next move for a ${primary.toLowerCase()} pet is simple: ${personality.support}. ${actionCopy(
        personalities,
        category,
      )}`,
    },
  ];
}

function PetCard({
  card,
  selected,
  onSelect,
  disabled,
  reveal = true,
  index,
  style,
}: {
  card: PetTarotCard;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  reveal?: boolean;
  index?: number;
  style?: CSSProperties;
}) {
  if (!reveal) {
    return (
      <div
        className={`pet-card-choice pet-card-choice-visual ${selected ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}`}
        style={style}
      >
        <TarotCardVisual
          card={toRitualCard(card, index)}
          compact
          faceDown
          subtleBack
          selected={selected}
          active={selected}
          backStyle="rose"
          className="pet-tarot-visual"
          ariaLabel={`Choose hidden card ${typeof index === "number" ? index + 1 : ""}`}
          onClick={disabled ? undefined : onSelect}
        />
        <span>{typeof index === "number" ? `Card ${index + 1}` : "Hidden card"}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`pet-card-choice hint-tap-sparkle ${selected ? "is-selected" : ""}`}
    >
      <div className="pet-card-image">
        <SafeImage
          src={card.image}
          alt={card.name}
          className="h-full w-full object-cover"
          fallbackClassName="h-full w-full rounded-[14px]"
          fallbackLabel="Card"
        />
      </div>
      <span>{card.name}</span>
    </button>
  );
}

function ownerFanStyle(index: number, total: number, selected: boolean): CSSProperties {
  const center = (total - 1) / 2;
  const distance = index - center;
  const rotation = Math.max(-7, Math.min(7, distance * 0.22));

  return {
    transform: `rotate(${rotation}deg) ${selected ? "translateY(-18px) scale(1.08)" : ""}`,
    zIndex: selected ? 200 + index : index,
  };
}

function ReadingBlock({
  label,
  card,
  children,
}: {
  label: string;
  card?: PetTarotCard;
  children: string;
}) {
  const paragraphs = children.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="pet-reading-block">
      <p>{label}</p>
      {card && <strong>{card.name}</strong>}
      <div className="pet-reading-copy">
        {paragraphs.map((paragraph) => (
          <span key={paragraph}>{paragraph}</span>
        ))}
      </div>
    </div>
  );
}

function StepNav({
  previousLabel = "Previous",
  nextLabel = "Next",
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
}: {
  previousLabel?: string;
  nextLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="pet-step-nav">
      <button
        type="button"
        onClick={onPrevious}
        className="pet-nav-button is-previous hint-tap-sparkle"
        disabled={previousDisabled || !onPrevious}
      >
        {previousLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        className="pet-nav-button is-next hint-tap-sparkle"
        disabled={nextDisabled || !onNext}
      >
        {nextLabel}
      </button>
    </div>
  );
}

type WheelStageSize = {
  width: number;
  height: number;
};

type PetWheelGeometry = {
  centerX: number;
  centerY: number;
  radius: number;
  startAngle: number;
};

type PetWheelLayout = {
  x: number;
  y: number;
  rotate: number;
  zIndex: number;
  angle: number;
};

const PET_WHEEL_CARD_W = 58;
const PET_WHEEL_CARD_H = 92;
const PET_WHEEL_STEP_SCALE = 0.74;
const PET_WHEEL_DRAG_SENSITIVITY = 0.0048;

function positiveModulo(value: number, total: number) {
  return ((value % total) + total) % total;
}

function petWheelStep(total: number) {
  return ((Math.PI * 2) / Math.max(total, 1)) * PET_WHEEL_STEP_SCALE;
}

function petWheelDisplayNumber(index: number, total: number) {
  return positiveModulo(index, total) + 1;
}

function getPetWheelGeometry(size: WheelStageSize): PetWheelGeometry {
  const shorter = Math.min(size.width, size.height);
  const radius = shorter * 0.95;
  return {
    centerX: size.width,
    centerY: size.height + radius * 0.43,
    radius,
    startAngle: -Math.PI * 0.86,
  };
}

function getPetWheelLayout(
  index: number,
  rotation: number,
  total: number,
  geometry: PetWheelGeometry,
): PetWheelLayout {
  const angle = geometry.startAngle + rotation + index * petWheelStep(total);
  const x = geometry.centerX + Math.cos(angle) * geometry.radius;
  const y = geometry.centerY + Math.sin(angle) * geometry.radius;
  return {
    x,
    y,
    rotate: angle + Math.PI / 2,
    zIndex: Math.round(y),
    angle,
  };
}

function getPetWheelCardHit(
  layout: PetWheelLayout,
  width: number,
  height: number,
  radialOffset: number,
  localX: number,
  localY: number,
  padding = 6,
) {
  const originX = layout.x + Math.cos(layout.angle) * radialOffset;
  const originY = layout.y + Math.sin(layout.angle) * radialOffset;
  const dx = localX - originX;
  const dy = localY - originY;
  const cos = Math.cos(layout.rotate);
  const sin = Math.sin(layout.rotate);
  const cardX = dx * cos + dy * sin;
  const cardY = -dx * sin + dy * cos;

  const insideCore =
    cardX >= -width / 2 &&
    cardX <= width / 2 &&
    cardY >= -height &&
    cardY <= 0;
  const insidePadded =
    cardX >= -width / 2 - padding &&
    cardX <= width / 2 + padding &&
    cardY >= -height - padding &&
    cardY <= padding;

  if (!insidePadded) return null;

  return {
    centerDistance: Math.hypot(cardX, cardY + height / 2),
    insideCore,
  };
}

function PetWheelPicker({
  title,
  subtitle,
  cards,
  selectedIds,
  selectionGoal,
  onToggle,
  onClose,
  onDone,
  doneLabel = "Next",
}: {
  title: string;
  subtitle: string;
  cards: PetTarotCard[];
  selectedIds: string[];
  selectionGoal: number;
  onToggle: (cardId: string) => void;
  onClose: () => void;
  onDone: () => void;
  doneLabel?: string;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageToggleRef = useRef<string | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startRotation: number;
    moved: boolean;
  } | null>(null);
  const [stageSize, setStageSize] = useState<WheelStageSize>({ width: 430, height: 760 });
  const [fanRotation, setFanRotation] = useState(0);
  const selectedSet = new Set(selectedIds);
  const total = Math.max(cards.length, 1);
  const done = selectedIds.length >= selectionGoal;
  const geometry = getPetWheelGeometry(stageSize);
  const wheelStep = petWheelStep(total);
  const pickTarget = {
    x: stageSize.width * 0.58,
    y: stageSize.height * 0.52,
  };
  const targetAngle = Math.atan2(pickTarget.y - geometry.centerY, pickTarget.x - geometry.centerX);
  const virtualCenterIndex = Math.round((targetAngle - geometry.startAngle - fanRotation) / wheelStep);
  const cardBackImageUrl = ANIMAL_TAROT_CARD_BACK_IMAGE;

  const wheelCards = cards.map((card, index) => {
    const virtualIndex = index + Math.round((virtualCenterIndex - index) / total) * total;
    return {
      card,
      index,
      virtualIndex,
      displayNumber: petWheelDisplayNumber(virtualIndex, total),
      layout: getPetWheelLayout(virtualIndex, fanRotation, total, geometry),
    };
  });

  let activeWheelCard: (typeof wheelCards)[number] | null = null;
  let activeDistance = Number.POSITIVE_INFINITY;
  for (const item of wheelCards) {
    const distance = Math.hypot(item.layout.x - pickTarget.x, item.layout.y - pickTarget.y);
    if (distance < activeDistance) {
      activeDistance = distance;
      activeWheelCard = item;
    }
  }

  const visibleWheelCards = wheelCards.filter(({ layout }) => (
    layout.x > -240 &&
    layout.x < stageSize.width + 260 &&
    layout.y > stageSize.height * 0.08 &&
    layout.y < stageSize.height + 260
  ));
  const activeSelected = activeWheelCard ? selectedSet.has(activeWheelCard.card.cardId) : false;
  const activeLift = activeSelected ? 34 : 0;
  const activeBadge = activeWheelCard
    ? {
        x: activeWheelCard.layout.x + Math.cos(activeWheelCard.layout.angle) * activeLift,
        y: activeWheelCard.layout.y + Math.sin(activeWheelCard.layout.angle) * activeLift,
        rotate: activeWheelCard.layout.rotate,
        number: activeWheelCard.displayNumber,
      }
    : null;

  useEffect(() => {
    const updateSize = () => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      setStageSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    const observer =
      typeof ResizeObserver !== "undefined" && stageRef.current
        ? new ResizeObserver(updateSize)
        : null;
    if (observer && stageRef.current) observer.observe(stageRef.current);

    return () => {
      window.removeEventListener("resize", updateSize);
      observer?.disconnect();
    };
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRotation: fanRotation,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.hypot(deltaX, deltaY) > 8) drag.moved = true;
    if (!drag.moved) return;
    setFanRotation(drag.startRotation + (deltaX - deltaY * 0.7) * PET_WHEEL_DRAG_SENSITIVITY);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (drag && drag.pointerId === event.pointerId && !drag.moved) {
      const rect = event.currentTarget.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      let targetCard: { cardId: string; score: number; zIndex: number } | null = null;

      for (const item of visibleWheelCards) {
        const isSelected = selectedSet.has(item.card.cardId);
        if (!isSelected && done) continue;
        const lift = isSelected ? 34 : 0;
        const hit = getPetWheelCardHit(
          item.layout,
          PET_WHEEL_CARD_W,
          PET_WHEEL_CARD_H,
          lift,
          localX,
          localY,
          isSelected ? 30 : 4,
        );
        if (!hit) continue;
        const effectiveZIndex = item.layout.zIndex + (isSelected ? 120 : 0);
        const score = hit.centerDistance + (hit.insideCore ? 0 : 80) + (isSelected ? -8 : 0);
        if (
          !targetCard ||
          score < targetCard.score - 2 ||
          (Math.abs(score - targetCard.score) <= 2 && effectiveZIndex > targetCard.zIndex)
        ) {
          targetCard = { cardId: item.card.cardId, score, zIndex: effectiveZIndex };
        }
      }

      if (targetCard) {
        stageToggleRef.current = targetCard.cardId;
        onToggle(targetCard.cardId);
        window.setTimeout(() => {
          stageToggleRef.current = null;
        }, 0);
      }
    }

    window.setTimeout(() => {
      dragRef.current = null;
    }, 0);
  }

  return (
    <div className="pet-wheel-fullscreen">
      <button type="button" className="pet-wheel-back" onClick={onClose} aria-label="Back">
        <ArrowLeft size={26} strokeWidth={1.8} />
      </button>
      <div className="pet-wheel-room-pill">
        <Sparkles size={17} strokeWidth={1.7} />
        <span>Animal Q&amp;A</span>
      </div>

      <div className="pet-wheel-copy">
        <p>{title}</p>
        <span>{subtitle}</span>
      </div>

      <div
        ref={stageRef}
        className="pet-wheel-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={(event) => setFanRotation((current) => current - event.deltaY * 0.0014)}
        aria-label="Animal tarot rotating card picker"
      >
        <div
          className="pet-wheel-orbit"
          style={{
            left: geometry.centerX - geometry.radius,
            top: geometry.centerY - geometry.radius,
            width: geometry.radius * 2,
            height: geometry.radius * 2,
          }}
        />
        {visibleWheelCards.map(({ card, virtualIndex, displayNumber, layout }) => {
          const isSelected = selectedSet.has(card.cardId);
          const isActive = activeWheelCard?.card.cardId === card.cardId;
          const isDisabled = !isSelected && done;
          const lift = isSelected ? 34 : 0;
          return (
            <button
              key={`${card.cardId}-${virtualIndex}`}
              type="button"
              className={`pet-wheel-card ${isSelected ? "is-selected" : ""}`}
              data-card-id={card.cardId}
              data-display-number={displayNumber}
              disabled={isDisabled}
              onClick={(event) => {
                event.preventDefault();
                if (stageToggleRef.current === card.cardId) return;
                if (isSelected) {
                  event.stopPropagation();
                  onToggle(card.cardId);
                }
              }}
              aria-label={`${isSelected ? "Unselect" : "Select"} card ${displayNumber}`}
              style={{
                left: layout.x + Math.cos(layout.angle) * lift,
                top: layout.y + Math.sin(layout.angle) * lift,
                width: PET_WHEEL_CARD_W,
                height: PET_WHEEL_CARD_H,
                zIndex: layout.zIndex + (isSelected ? 120 : 0),
                backgroundImage: `url("${cardBackImageUrl}")`,
                transform: `translate(-50%, -100%) rotate(${layout.rotate}rad)`,
              }}
            >
              <span className="pet-wheel-card-gloss" />
            </button>
          );
        })}

        {activeBadge && (
          <div
            className="pet-wheel-number-badge"
            style={{
              left: activeBadge.x,
              top: activeBadge.y,
              transform: `translate(-50%, -100%) rotate(${activeBadge.rotate}rad)`,
            }}
          >
            <span style={{ transform: `translateX(-50%) rotate(${-activeBadge.rotate}rad)` }}>
              {activeBadge.number}
            </span>
          </div>
        )}
      </div>

      <button type="button" className="pet-wheel-close" onClick={onClose}>
        Close
      </button>
      <div className="pet-wheel-count">
        {selectedIds.length} / {selectionGoal}
      </div>
      {done && (
        <button type="button" className="pet-wheel-next" onClick={onDone}>
          {doneLabel}
        </button>
      )}
    </div>
  );
}

function PetDeckFlowPicker({
  petName,
  question,
  cards,
  onStop,
  onClose,
}: {
  petName: string;
  question: string;
  cards: PetTarotCard[];
  onStop: (source: StopSource, card: PetTarotCard) => void;
  onClose: () => void;
}) {
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const activeIndexRef = useRef(0);
  const stoppedRef = useRef(false);
  const cardsRef = useRef(cards);
  const petDisplayName = petName.trim() || "your pet";
  const flowCards = cards.length ? Array.from({ length: 9 }, (_, slot) => slot) : [];

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  function stopDeck(source: StopSource) {
    const availableCards = cardsRef.current;
    if (stoppedRef.current || !availableCards.length) return;
    stoppedRef.current = true;
    const card = availableCards[positiveModulo(activeIndexRef.current, availableCards.length)] ?? availableCards[0]!;
    onStop(source, card);
  }

  useEffect(() => {
    if (!cards.length) return undefined;
    activeIndexRef.current = 0;
    stoppedRef.current = false;
    setFallbackVisible(false);

    const flowTimer = window.setInterval(() => {
      activeIndexRef.current = positiveModulo(activeIndexRef.current + 1, cards.length);
    }, 1800);
    const fallbackTimer = window.setTimeout(() => {
      if (!stoppedRef.current) setFallbackVisible(true);
    }, 16000);
    const autoStopTimer = window.setTimeout(() => {
      stopDeck("deck");
    }, 19500);

    return () => {
      window.clearInterval(flowTimer);
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(autoStopTimer);
    };
    // Timers intentionally restart only when a new flowing deck is created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  return (
    <div className={`pet-wheel-fullscreen pet-flow-fullscreen ${fallbackVisible ? "has-fallback" : ""}`}>
      <button type="button" className="pet-wheel-back" onClick={onClose} aria-label="Back">
        <ArrowLeft size={26} strokeWidth={1.8} />
      </button>
      <div className="pet-wheel-room-pill">
        <PawPrint size={17} strokeWidth={1.7} />
        <span>Animal Q&amp;A</span>
      </div>

      <div className="pet-wheel-copy pet-flow-copy">
        <p>Animal tarot ritual</p>
        <span>{question}</span>
      </div>

      <button
        type="button"
        className="pet-flow-stage"
        onPointerUp={() => stopDeck("pet")}
        aria-label={`Let ${petDisplayName} touch the screen to stop the deck`}
      >
        <div className="pet-flow-aura" aria-hidden />
        <div className="pet-flow-track" aria-hidden>
          {flowCards.map((slot) => (
            <span
              key={`flow-slot-${slot}`}
              className="pet-flow-card"
              style={{
                "--flow-delay": `${slot * -1.8}s`,
                backgroundImage: `url("${ANIMAL_TAROT_CARD_BACK_IMAGE}")`,
              } as CSSProperties}
            />
          ))}
        </div>
        <div className="pet-flow-center-window" aria-hidden />
        <span className="pet-flow-stop-hint">
          {cards.length ? "Touch anywhere on the flowing deck" : "Preparing the deck"}
        </span>
      </button>

      <div className="pet-flow-owner-panel">
        {fallbackVisible ? (
          <>
            <p>{petDisplayName} is staying mysterious. Let the deck choose the message.</p>
            <button type="button" onClick={() => stopDeck("deck")}>
              Let the deck choose
            </button>
          </>
        ) : (
          <p>
            Place your phone near {petDisplayName}. Watch for a sniff, touch, stare, sound, or move closer. Their first
            reaction guides the card.
          </p>
        )}
      </div>

      <button type="button" className="pet-wheel-close" onClick={onClose}>
        Close
      </button>
      <div className="pet-wheel-count">78 cards flowing</div>
    </div>
  );
}

export function AnimalTarotView() {
  const [petName, setPetName] = useState("Mochi");
  const [animalType, setAnimalType] = useState<PetType>("Cat");
  const [personalities, setPersonalities] = useState<PetPersonality[]>(["Playful"]);
  const [personalityNote, setPersonalityNote] = useState("");
  const [showPersonalityNote, setShowPersonalityNote] = useState(false);
  const [showAllPersonalities, setShowAllPersonalities] = useState(false);
  const [category, setCategory] = useState<QuestionCategory>("Mood");
  const [question, setQuestion] = useState("");
  const [depth, setDepth] = useState<ReadingDepth>("quick");
  const [drawnCards, setDrawnCards] = useState<PetTarotCard[]>([]);
  const [ownerSelectedIds, setOwnerSelectedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stopSource, setStopSource] = useState<StopSource | null>(null);
  const [step, setStep] = useState<Step>("profile");

  const Icon = animalIcon(animalType);
  const ownerSelectionGoal = depth === "quick" ? 5 : 10;
  const selectionGoal = depth === "quick" ? 1 : 3;
  const ownerCards = drawnCards.filter((card) => ownerSelectedIds.includes(card.cardId));
  const chosenCards = drawnCards.filter((card) => selectedIds.includes(card.cardId));
  const petDisplayName = petName.trim() || "your pet";
  const selectedQuestion = question.trim() || `What does ${petName.trim() || "my pet"} want me to know today?`;
  const visiblePersonalities = showAllPersonalities
    ? PET_PERSONALITIES
    : PET_PERSONALITIES.slice(0, PERSONALITY_PREVIEW_COUNT);
  const stopSourceCopy =
    stopSource === "pet"
      ? `${petDisplayName} stopped the deck.`
      : stopSource === "owner"
        ? `You confirmed the card ${petDisplayName} was drawn to.`
        : stopSource === "deck"
          ? `${petDisplayName} stayed mysterious. The deck chose the message.`
          : "";

  const quickAnswerBlocks = useMemo(() => {
    if (!chosenCards[0]) return [];
    return quickAnswer({
      petName,
      animalType,
      personalities,
      personalityNote,
      category,
      question: selectedQuestion,
      card: chosenCards[0],
    });
  }, [animalType, category, chosenCards, personalities, personalityNote, petName, selectedQuestion]);

  const deepBlocks = useMemo(() => {
    if (chosenCards.length < 3) return [];
    return deepAnswer({ petName, personalities, personalityNote, category, cards: chosenCards });
  }, [category, chosenCards, personalities, personalityNote, petName]);

  function startDraw() {
    const seed = `${petName}:${animalType}:${personalities.join("-")}:${personalityNote}:${category}:${selectedQuestion}:${Date.now()}`;
    setDepth("quick");
    setDrawnCards(drawCards(seed, RITUAL_TAROT_DECK.length));
    setOwnerSelectedIds([]);
    setSelectedIds([]);
    setStopSource(null);
    setStep("cards");
  }

  function stopFlow(source: StopSource, card: PetTarotCard) {
    setStopSource(source);
    setSelectedIds([card.cardId]);
    setStep("answer");
  }

  function toggleOwnerCard(cardId: string) {
    setOwnerSelectedIds((current) => {
      if (current.includes(cardId)) return current.filter((id) => id !== cardId);
      if (current.length >= ownerSelectionGoal) return current;
      return [...current, cardId];
    });
  }

  function toggleCard(cardId: string) {
    setSelectedIds((current) => {
      if (current.includes(cardId)) return current.filter((id) => id !== cardId);
      if (current.length >= selectionGoal) return current;
      return [...current, cardId];
    });
  }

  function togglePersonality(item: PetPersonality) {
    setPersonalities((current) => {
      if (current.includes(item)) {
        const next = current.filter((personality) => personality !== item);
        return next.length ? next : current;
      }
      return [...current, item];
    });
  }

  function resetQuiz() {
    setDrawnCards([]);
    setOwnerSelectedIds([]);
    setSelectedIds([]);
    setStopSource(null);
    setStep("profile");
  }

  useEffect(() => {
    resetQuiz();
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
    }
    // Start fresh at the Animal Q&A room whenever the module is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const referenceWidth = { "--hint-app-width": "400px" } as CSSProperties;

  if (step === "owner" || step === "cards") {
    return (
      <div className="h-full w-full" style={referenceWidth}>
        <PetDeckFlowPicker
          petName={petName}
          question={selectedQuestion}
          cards={drawnCards}
          onStop={stopFlow}
          onClose={() => setStep("question")}
        />
      </div>
    );
  }

  const renderStep = step as Step;

  return (
    <div className="h-full w-full" style={referenceWidth}>
      <AppScreen>
      <header className="animal-tarot-hero mb-6">
        <div className="animal-hero-orbit" aria-hidden />
        <div className="relative z-10">
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ACCENT.gold }}>
            Animal Q&amp;A Room
          </p>
          <h1 className="mt-2 font-serif text-[34px] leading-none sm:text-[42px]" style={{ color: GLASS.text }}>
            Animal Q&A
          </h1>
          <p className="mt-3 max-w-2xl font-sans text-[13px] leading-relaxed sm:text-[14px]" style={{ color: GLASS.muted }}>
            Want to know what your pet is thinking? Draw a tarot card and let their energy reveal the message.
          </p>
        </div>
      </header>

      <GlassPanel hero className="animal-tarot-stage pet-qa-stage" padded={false}>
        <div className="animal-stage-sky" aria-hidden />
        <div className="relative z-10 grid gap-5 p-5 sm:p-6">
          <div className="pet-qa-status">
            <span className={renderStep === "profile" ? "is-active" : ""}>Profile</span>
            <span className={renderStep === "question" ? "is-active" : ""}>Question</span>
            <span className={renderStep === "owner" || renderStep === "cards" ? "is-active" : ""}>Pick</span>
            <span className={renderStep === "answer" ? "is-active" : ""}>Answer</span>
          </div>

          {renderStep === "profile" && (
            <section className="pet-qa-panel">
              <SectionLabel>Pet profile</SectionLabel>
              <div className="pet-profile-top">
                <div className="pet-avatar">
                  <Icon size={34} strokeWidth={1.5} />
                </div>
                <label className="pet-input-label">
                  Pet name
                  <input value={petName} onChange={(event) => setPetName(event.target.value)} placeholder="Mochi" />
                </label>
              </div>

              <div className="pet-field-group">
                <p>Animal type</p>
                <div className="pet-pill-grid">
                  {PET_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAnimalType(type)}
                      className={animalType === type ? "is-selected" : ""}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pet-field-group">
                <p>Personality <span>pick one or more</span></p>
                <div className="pet-pill-grid">
                  {visiblePersonalities.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => togglePersonality(item)}
                      className={personalities.includes(item) ? "is-selected" : ""}
                    >
                      {item}
                    </button>
                  ))}
                  {showAllPersonalities && (
                    <button
                      type="button"
                      onClick={() => setShowPersonalityNote((current) => !current)}
                      className="pet-description-pill hint-tap-sparkle"
                    >
                      <MessageCircle size={15} />
                      {showPersonalityNote ? "Hide description" : "Add your description"}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllPersonalities((current) => !current)}
                  className="pet-more-button hint-tap-sparkle"
                >
                  {showAllPersonalities ? "Show less" : "More personalities"}
                </button>
              </div>

              {showPersonalityNote && (
                <label className="pet-input-label">
                  Describe your pet
                  <textarea
                    value={personalityNote}
                    onChange={(event) => setPersonalityNote(event.target.value)}
                    placeholder="Example: needy in the morning, ignores me at night, loves snacks, scared of strangers..."
                  />
                </label>
              )}

              <StepNav previousDisabled onNext={() => setStep("question")} nextLabel="Next" />
            </section>
          )}

          {renderStep === "question" && (
            <section className="pet-qa-panel">
              <SectionLabel>Choose a topic</SectionLabel>
              <div className="pet-category-grid">
                {CATEGORY_OPTIONS.map((item) => {
                  const CategoryIcon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={category === item.id ? "is-selected" : ""}
                    >
                      <CategoryIcon size={18} />
                      <strong>{item.label}</strong>
                      <span>{item.prompt}</span>
                    </button>
                  );
                })}
              </div>

              <label className="pet-input-label mt-4">
                Your question
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={`What does ${petName.trim() || "my pet"} want me to know?`}
                />
              </label>

              <div className="pet-flow-intro-card">
                <Sparkles size={18} />
                <div>
                  <strong>To begin the ritual...</strong>
                  <span>
                    Place your phone near {petDisplayName}. Watch for a sniff, touch, stare, sound, or move closer.
                    Their first reaction guides the card. If they stay mysterious, you can choose for them or let the
                    deck follow their energy.
                  </span>
                </div>
              </div>
              <StepNav onPrevious={() => setStep("profile")} onNext={startDraw} nextLabel="Begin ritual" />
            </section>
          )}

          {renderStep === "owner" && (
            <section className="pet-qa-panel">
              <div className="pet-owner-fan-stage">
                <div className="pet-fan-progress" aria-hidden>
                  {Array.from({ length: ownerSelectionGoal }).map((_, index) => (
                    <span key={index} className={index < ownerSelectedIds.length ? "is-filled" : ""} />
                  ))}
                </div>
                <div className="pet-fan-heading">
                  <SectionLabel>{depth === "quick" ? "Owner picks 5" : "Owner picks 10"}</SectionLabel>
                  <h2>Choose your cards</h2>
                  <p>Only the backs are visible. Pick by instinct first.</p>
                </div>
                <div className="pet-card-grid is-owner-deck" aria-label="Horizontal face-down tarot deck">
                  {drawnCards.map((card, index) => (
                    <PetCard
                      key={card.cardId}
                      card={card}
                      index={index}
                      reveal={false}
                      style={ownerFanStyle(index, drawnCards.length, ownerSelectedIds.includes(card.cardId))}
                      selected={ownerSelectedIds.includes(card.cardId)}
                      disabled={!ownerSelectedIds.includes(card.cardId) && ownerSelectedIds.length >= ownerSelectionGoal}
                      onSelect={() => toggleOwnerCard(card.cardId)}
                    />
                  ))}
                </div>
                <div className="pet-fan-bottom">
                  <p>
                    Swipe sideways to browse the deck. Pick {ownerSelectionGoal} cards, then place them near {petName.trim() || "your pet"}.
                  </p>
                  <strong>
                    {ownerSelectedIds.length} / {ownerSelectionGoal} selected
                  </strong>
                </div>
              </div>
              <div className="pet-draw-actions">
                <button type="button" onClick={startDraw} className="animal-secondary-button hint-tap-sparkle">
                  <RefreshCcw size={15} />
                  Shuffle again
                </button>
              </div>
              <StepNav
                onPrevious={() => setStep("question")}
                onNext={() => {
                  setSelectedIds([]);
                  setStep("cards");
                }}
                nextLabel="Next"
                nextDisabled={ownerSelectedIds.length !== ownerSelectionGoal}
              />
            </section>
          )}

          {renderStep === "cards" && (
            <section className="pet-qa-panel">
              <SectionLabel>{depth === "quick" ? "Let your pet pick 1" : "Let your pet pick 3"}</SectionLabel>
              <h2 className="pet-qa-heading">Place your phone near {petName.trim() || "your pet"} and watch their first reaction.</h2>
              <p className="pet-qa-copy">
                A paw touch, nose touch, sniff, stare, moving closer, sound, or your gut feeling can count.
              </p>
              <div className={`pet-card-grid ${depth === "deep" ? "is-deep" : ""}`}>
                {ownerCards.map((card, index) => (
                  <PetCard
                    key={card.cardId}
                    card={card}
                    index={index}
                    reveal={false}
                    selected={selectedIds.includes(card.cardId)}
                    disabled={!selectedIds.includes(card.cardId) && selectedIds.length >= selectionGoal}
                    onSelect={() => toggleCard(card.cardId)}
                  />
                ))}
              </div>
              <div className="pet-draw-actions">
                <button type="button" onClick={startDraw} className="animal-secondary-button hint-tap-sparkle">
                  <RefreshCcw size={15} />
                  Start over
                </button>
              </div>
              <StepNav
                onPrevious={() => setStep("owner")}
                onNext={() => setStep("answer")}
                nextLabel="Next"
                nextDisabled={selectedIds.length !== selectionGoal}
              />
            </section>
          )}

          {renderStep === "answer" && (
            <section className="pet-qa-panel">
              <SectionLabel>{depth === "quick" ? "Pet answer" : "Deep pet answer"}</SectionLabel>
              <h2 className="pet-qa-heading">{petName.trim() || "Your pet"} answered through the cards.</h2>
              <p className="pet-qa-question">Question: {selectedQuestion}</p>
              {stopSourceCopy && <p className="pet-answer-source">{stopSourceCopy}</p>}
              {chosenCards.length > 0 && (
                <div className={`pet-answer-card-strip ${chosenCards.length > 1 ? "is-many" : ""}`} aria-label="Chosen card faces">
                  {chosenCards.map((card, index) => (
                    <figure key={card.cardId} className="pet-answer-card-face">
                      <div className="pet-answer-card-image">
                        <SafeImage
                          src={card.image}
                          alt={card.name}
                          className="h-full w-full object-cover"
                          fallbackClassName="h-full w-full rounded-[14px]"
                          fallbackLabel="Card"
                        />
                      </div>
                      <figcaption>{chosenCards.length > 1 ? `${index + 1}. ${card.name}` : card.name}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {depth === "quick" ? (
                <div className="grid gap-3">
                  {quickAnswerBlocks.map((block) => (
                    <ReadingBlock key={block.label} label={block.label}>
                      {block.copy}
                    </ReadingBlock>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3">
                  {deepBlocks.map((block) => (
                    <ReadingBlock key={block.label} label={block.label} card={block.card}>
                      {block.copy}
                    </ReadingBlock>
                  ))}
                </div>
              )}
              <StepNav
                previousLabel="Previous"
                nextLabel="New pet profile"
                onPrevious={() => setStep("cards")}
                onNext={resetQuiz}
              />
            </section>
          )}
        </div>
      </GlassPanel>
      </AppScreen>
    </div>
  );
}
