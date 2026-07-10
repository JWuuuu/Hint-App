import type { SkyGuidedTarotResult, SkyGuidedTone } from "../tarot/skyGuidedTarot";
import { THEME_LABELS, type TarotTheme } from "../tarot/tarotThemeMap";

export type SkyCardReading = {
  shortAnswer: string;
  cardMeaning: string;
  whatThisMeans: string;
  followUpChips: string[];
  whyThisCard: string[];
};

export type SkyCardReadingWriterInput = {
  cardId: string;
  cardName: string;
  cardWhisper?: string;
  sky: SkyGuidedTarotResult;
  question?: string;
  tone: SkyGuidedTone;
};

export type SkyCardReadingWriter = (
  input: SkyCardReadingWriterInput,
) => Promise<SkyCardReading>;

export type GenerateSkyCardReadingInput = SkyCardReadingWriterInput & {
  writer?: SkyCardReadingWriter;
};

type ReadingVoice = {
  opener: string;
  action: string;
  chips: string[];
};

type CardLens = {
  opener: string;
  focus: string;
  action: string;
  caution: string;
  question: string;
};

const THEME_READING_VOICES: Record<TarotTheme, ReadingVoice> = {
  relationshipTension: {
    opener: "Look at the choice underneath the feeling.",
    action: "Respond from alignment, not reaction.",
    chips: ["What choice is underneath this?", "What would alignment do?", "Where am I reacting?"],
  },
  emotionalFear: {
    opener: "Let the fog be information, not a verdict.",
    action: "Ground the feeling before you decide what it means.",
    chips: ["What feeling is loudest?", "What facts do I have?", "How do I ground this?"],
  },
  distance: {
    opener: "Give the signal some space.",
    action: "Step back long enough to hear what is actually yours.",
    chips: ["Where do I need space?", "What is actually mine?", "What should wait?"],
  },
  attachment: {
    opener: "Name the loop without shaming yourself.",
    action: "Loosen one grip instead of trying to fix the whole pattern at once.",
    chips: ["What loop is repeating?", "What can I loosen?", "What am I gripping?"],
  },
  selfWorth: {
    opener: "Let your value be the starting point.",
    action: "Choose the option that does not ask you to shrink.",
    chips: ["Where am I shrinking?", "What supports my value?", "What should I receive?"],
  },
  confusion: {
    opener: "Do not force clarity before the facts arrive.",
    action: "Separate what you know from what your fear is filling in.",
    chips: ["What do I actually know?", "What is projection?", "What can wait?"],
  },
  healing: {
    opener: "Let the day repair what has been tense.",
    action: "Choose the softer step that still moves you forward.",
    chips: ["What needs repair?", "What would feel softer?", "What restores me?"],
  },
  action: {
    opener: "Move one clean step forward.",
    action: "Use the energy while it is available, but keep the move simple.",
    chips: ["What is the next move?", "Where is momentum?", "What can I start?"],
  },
  waiting: {
    opener: "Let the pause do some work.",
    action: "Do not mistake stillness for failure; watch what becomes clearer.",
    chips: ["What needs more time?", "What is still forming?", "Where should I pause?"],
  },
  truth: {
    opener: "Tell the truth in a smaller, cleaner way.",
    action: "Make the honest thing practical enough to act on.",
    chips: ["What is the clean truth?", "What am I avoiding?", "What is practical now?"],
  },
  growth: {
    opener: "Let growth be steady, not performative.",
    action: "Protect the small progress before you ask for a bigger sign.",
    chips: ["What is growing?", "What needs protection?", "What is enough today?"],
  },
  opportunity: {
    opener: "Keep the door open where energy is moving.",
    action: "Notice the invitation, then take one grounded step toward it.",
    chips: ["Where is the opening?", "What invitation is here?", "What step is grounded?"],
  },
  boundary: {
    opener: "Draw the line gently and mean it.",
    action: "A clear limit will protect more energy than another explanation.",
    chips: ["What boundary helps?", "What needs less access?", "How do I say it simply?"],
  },
  communication: {
    opener: "Say the simple thing clearly.",
    action: "Let your words be direct enough to be kind.",
    chips: ["What needs to be said?", "How can I simplify it?", "What tone helps?"],
  },
  transformation: {
    opener: "Let the old shape loosen.",
    action: "Release one part of the pattern so the next version has room.",
    chips: ["What is changing?", "What can I release?", "What wants room?"],
  },
};

const MAJOR_CARD_LENSES: Record<string, CardLens> = {
  "0-fool": {
    opener: "A new road is asking for a lighter first step.",
    focus: "trust before certainty",
    action: "Begin small enough that fear cannot turn it into a whole trial.",
    caution: "waiting for a perfect map",
    question: "Where can I begin without proving everything first?",
  },
  "1-magician": {
    opener: "The tools are closer than they look.",
    focus: "using what is already available",
    action: "Turn one skill, message, or resource into a visible move.",
    caution: "waiting to feel fully ready",
    question: "What do I already have enough of?",
  },
  "2-high-priestess": {
    opener: "The quiet information matters today.",
    focus: "intuition before explanation",
    action: "Let the private signal settle before you answer out loud.",
    caution: "overexplaining what is still forming",
    question: "What do I know before I can explain it?",
  },
  "3-empress": {
    opener: "Something grows better when it is cared for, not forced.",
    focus: "receiving, nourishment, and enoughness",
    action: "Feed the part of life that is already trying to become fuller.",
    caution: "treating slowness as failure",
    question: "What needs care instead of pressure?",
  },
  "4-emperor": {
    opener: "A clear frame will make the day feel safer.",
    focus: "structure that supports you",
    action: "Set one rule, boundary, or schedule that protects your energy.",
    caution: "control that leaves no room to breathe",
    question: "What structure would make this easier?",
  },
  "5-hierophant": {
    opener: "An old rule is asking to be reviewed.",
    focus: "belief, guidance, and inherited patterns",
    action: "Keep the wisdom, but update the part that no longer fits.",
    caution: "mistaking approval for truth",
    question: "Which rule am I following automatically?",
  },
  "6-lovers": {
    opener: "The real message is choice, not just attraction.",
    focus: "alignment between desire and values",
    action: "Choose the option you can stand behind after the feeling settles.",
    caution: "keeping every door open from fear",
    question: "What choice respects my values?",
  },
  "7-chariot": {
    opener: "Momentum needs a hand on the wheel.",
    focus: "direction, courage, and emotional steering",
    action: "Pick the destination before you spend more energy moving.",
    caution: "moving fast just to avoid feeling uncertain",
    question: "Where am I actually steering this?",
  },
  "8-strength": {
    opener: "Gentleness is the stronger move today.",
    focus: "soft power and nervous-system courage",
    action: "Use patience where you would normally use force.",
    caution: "confusing pressure with bravery",
    question: "Where can I be kind without becoming weak?",
  },
  "9-hermit": {
    opener: "The answer gets clearer when the room gets quieter.",
    focus: "privacy, distance, and inner truth",
    action: "Take enough space to hear your own signal again.",
    caution: "isolating so much that nothing can reach you",
    question: "What can only be heard in quiet?",
  },
  "10-wheel": {
    opener: "The day is turning around timing.",
    focus: "cycles, luck, and a changing opening",
    action: "Notice what is moving now and meet it with one practical step.",
    caution: "trying to freeze a cycle that is already shifting",
    question: "What is changing without needing my control?",
  },
  "11-justice": {
    opener: "The clean truth wants clean handling.",
    focus: "fairness, accountability, and consequences",
    action: "Make the choice that still feels fair when emotion cools down.",
    caution: "using logic to hide from the human part",
    question: "What is the fair version of this?",
  },
  "12-hanged-man": {
    opener: "The pause is part of the answer.",
    focus: "surrender, timing, and a new angle",
    action: "Stop pushing for a moment and let the situation show another side.",
    caution: "calling delay a personal failure",
    question: "What changes if I stop forcing it?",
  },
  "13-death": {
    opener: "One shape is ending so another can breathe.",
    focus: "release, transition, and real renewal",
    action: "Let go of the part that has already finished doing its job.",
    caution: "keeping an old version alive out of loyalty",
    question: "What is ready to be released?",
  },
  "14-temperance": {
    opener: "Balance comes from blending, not choosing extremes.",
    focus: "integration, moderation, and repair",
    action: "Mix patience with one small adjustment and let the system calm down.",
    caution: "swinging between all-or-nothing choices",
    question: "What needs a middle path?",
  },
  "15-devil": {
    opener: "The pattern is visible enough to loosen.",
    focus: "attachment, desire, and the loop underneath",
    action: "Name the pull honestly, then remove one small hook from it.",
    caution: "shaming yourself instead of understanding the pattern",
    question: "What has more power over me than it deserves?",
  },
  "16-tower": {
    opener: "The unstable part cannot hold the same shape forever.",
    focus: "disruption that clears false support",
    action: "Let the truth remove what was only pretending to be stable.",
    caution: "rebuilding the same fragile structure too quickly",
    question: "What truth is clearing space?",
  },
  "17-star": {
    opener: "A quieter hope is coming back online.",
    focus: "renewal, trust, and emotional replenishment",
    action: "Give energy to the thing that helps you believe in tomorrow again.",
    caution: "looking for proof before allowing relief",
    question: "Where can I let hope return gently?",
  },
  "18-moon": {
    opener: "Not every feeling is a fact, but every feeling is a signal.",
    focus: "uncertainty, dreams, and emotional projection",
    action: "Separate the fear story from the information underneath it.",
    caution: "letting imagination become evidence",
    question: "What is real, and what is fog?",
  },
  "19-sun": {
    opener: "Clarity wants to be simple today.",
    focus: "warmth, visibility, and honest joy",
    action: "Let something be easier without mistrusting it immediately.",
    caution: "dimming what is working because it feels too bright",
    question: "What becomes clear when I stop hiding it?",
  },
  "20-judgement": {
    opener: "A deeper part of you is calling the next version forward.",
    focus: "awakening, review, and a clean return to self",
    action: "Answer the call with one changed behavior, not just a realization.",
    caution: "hearing the message and staying in the old role",
    question: "What am I being asked to outgrow?",
  },
  "21-world": {
    opener: "A cycle is completing and wants to be honored.",
    focus: "integration, closure, and wholeness",
    action: "Mark what has finished before you rush into the next chapter.",
    caution: "skipping closure because momentum feels safer",
    question: "What chapter can I acknowledge as complete?",
  },
};

const RANK_LENSES: Record<string, Omit<CardLens, "focus"> & { focusPrefix: string }> = {
  ace: {
    opener: "A clean beginning is available in one small place.",
    focusPrefix: "a first spark of",
    action: "Start with the smallest real version of the opportunity.",
    caution: "turning a seed into a full burden too soon",
    question: "What wants to begin simply?",
  },
  two: {
    opener: "The day is asking for balance between two signals.",
    focusPrefix: "a choice point around",
    action: "Hold both sides long enough to choose with less panic.",
    caution: "splitting yourself to keep everything possible",
    question: "What two truths need to be balanced?",
  },
  three: {
    opener: "Something becomes clearer through connection or early growth.",
    focusPrefix: "collaboration and expansion in",
    action: "Let support, feedback, or a first result shape the next step.",
    caution: "trying to grow alone when the signal is relational",
    question: "Where would support help this grow?",
  },
  four: {
    opener: "Stability matters more than a dramatic move.",
    focusPrefix: "a steadier container for",
    action: "Create one structure that lets the energy settle.",
    caution: "confusing stillness with being stuck",
    question: "What would make this feel steadier?",
  },
  five: {
    opener: "The friction is useful if it stays specific.",
    focusPrefix: "tension and adjustment in",
    action: "Name the conflict clearly and reduce it by one size.",
    caution: "letting discomfort become the whole identity of the day",
    question: "What is the actual conflict?",
  },
  six: {
    opener: "Support changes the shape of the day.",
    focusPrefix: "repair, generosity, or movement through",
    action: "Accept the help, memory, or kindness that makes the next step easier.",
    caution: "keeping score instead of receiving the signal",
    question: "What support is already here?",
  },
  seven: {
    opener: "Strategy matters more than speed.",
    focusPrefix: "assessment and discernment around",
    action: "Pause long enough to decide what deserves more investment.",
    caution: "mistaking delay for failure",
    question: "What needs to be evaluated?",
  },
  eight: {
    opener: "Repetition is shaping the result.",
    focusPrefix: "practice and refinement in",
    action: "Do the focused repetition instead of changing the plan again.",
    caution: "abandoning the process because it feels ordinary",
    question: "What is practice teaching me?",
  },
  nine: {
    opener: "You are closer than it feels, so pace yourself.",
    focusPrefix: "resilience and protection around",
    action: "Protect your energy while staying present enough to finish well.",
    caution: "preparing for every possible problem",
    question: "What needs protection, not panic?",
  },
  ten: {
    opener: "A cycle is full and wants simplification.",
    focusPrefix: "completion and release in",
    action: "Close, archive, delegate, or lighten what has become too heavy.",
    caution: "carrying more because you are used to carrying more",
    question: "What cycle can be completed?",
  },
  page: {
    opener: "Beginner energy brings the message today.",
    focusPrefix: "curiosity and learning around",
    action: "Turn uncertainty into a clean question or small experiment.",
    caution: "pretending you already know enough",
    question: "What am I ready to learn?",
  },
  knight: {
    opener: "Movement helps, but direction matters.",
    focusPrefix: "momentum and pursuit through",
    action: "Move with purpose instead of rushing to escape the pause.",
    caution: "charging ahead just to avoid waiting",
    question: "Where does this movement want to go?",
  },
  queen: {
    opener: "Your power works best when it is cared for.",
    focusPrefix: "mature care and self-possession in",
    action: "Set the tone calmly and do not overgive to prove anything.",
    caution: "nurturing everything except yourself",
    question: "Where do I need steadier self-respect?",
  },
  king: {
    opener: "Calm command is the useful form of power today.",
    focusPrefix: "leadership and responsibility in",
    action: "Own the decision without turning nuance into noise.",
    caution: "using certainty to shut down feeling",
    question: "What does mature leadership look like here?",
  },
};

const SUIT_LENSES: Record<string, { domain: string; material: string }> = {
  cups: { domain: "feelings, intimacy, and emotional truth", material: "the heart" },
  pentacles: { domain: "money, body, stability, and practical life", material: "the material world" },
  swords: { domain: "thoughts, words, decisions, and mental clarity", material: "the mind" },
  wands: { domain: "desire, courage, creativity, and momentum", material: "your fire" },
};

function compactList(values: string[], fallback: string): string {
  const unique = Array.from(new Set(values.filter(Boolean)));
  if (unique.length === 0) return fallback;
  if (unique.length === 1) return unique[0]!;
  return `${unique.slice(0, -1).join(", ")} and ${unique[unique.length - 1]}`;
}

function cardLensFor(cardId: string, cardName: string): CardLens {
  const majorLens = MAJOR_CARD_LENSES[cardId];
  if (majorLens) return majorLens;

  const [rank = "", suit = ""] = cardId.split("-");
  const rankLens = RANK_LENSES[rank];
  const suitLens = SUIT_LENSES[suit];
  if (rankLens && suitLens) {
    return {
      opener: rankLens.opener,
      focus: `${rankLens.focusPrefix} ${suitLens.domain}`,
      action: rankLens.action,
      caution: rankLens.caution,
      question: rankLens.question,
    };
  }

  return {
    opener: `${cardName} is the center of today's signal.`,
    focus: "the part of the day asking for attention",
    action: "Make one grounded choice from the clearest signal available.",
    caution: "turning a daily hint into a fixed prediction",
    question: "What is this card making visible today?",
  };
}

function strongestSignalLabel(sky: SkyGuidedTarotResult): string {
  return sky.evidence[0]?.label ?? "today's sky";
}

function personalSignalLabel(sky: SkyGuidedTarotResult): string {
  return sky.personalSignals[0]?.label ?? "your current pattern";
}

export function generateSkyCardReading({
  cardId,
  cardName,
  cardWhisper,
  sky,
  question,
  tone,
}: SkyCardReadingWriterInput): SkyCardReading {
  const selectedCandidate = sky.candidatePool.find((candidate) => candidate.cardId === sky.selectedCardId || candidate.cardId === cardId);
  const selectedThemes = selectedCandidate?.themes.length ? selectedCandidate.themes : sky.themes;
  const primaryThemes = selectedThemes.slice(0, 2).map((theme) => THEME_LABELS[theme]);
  const themeText = compactList(primaryThemes, "today's strongest signal");
  const evidenceText = compactList(
    sky.evidence.slice(0, 2).map((signal) => signal.label),
    "the strongest sky signal",
  );
  const leadingReason = selectedCandidate?.reasons[0];
  const questionLine = question ? `For "${question}", ` : "";
  const voice = selectedThemes[0] ? THEME_READING_VOICES[selectedThemes[0]] : null;
  const cardLens = cardLensFor(cardId, cardName);
  const skySignal = strongestSignalLabel(sky);
  const personalSignal = personalSignalLabel(sky);
  const matchText = leadingReason ?? themeText;

  return {
    shortAnswer: `${cardLens.opener} With ${skySignal.toLowerCase()} and ${personalSignal.toLowerCase()}, ${cardName} reads as ${cardLens.focus}; ${cardLens.action}`,
    cardMeaning:
      cardWhisper
        ? `${cardName}: ${cardWhisper}`
        : `${cardName} asks you to read ${cardLens.focus} before turning it into a bigger story.`,
    whatThisMeans: `${questionLine}today's sky emphasizes ${themeText}, while this card matched the pool through ${matchText}. This is less about ${cardLens.caution} and more about choosing the next useful response.`,
    followUpChips: voice?.chips ?? [
      cardLens.question,
      "What is today's sky pointing at?",
      "What is the next useful response?",
    ],
    whyThisCard: [
      sky.whyThisCard,
      `Sky evidence: ${evidenceText}.`,
      leadingReason ? `Tarot match: ${leadingReason}.` : "Tarot match: it rose from today's weighted pool.",
    ],
  };
}

export async function generateSkyCardReadingWithWriter({
  writer,
  ...input
}: GenerateSkyCardReadingInput): Promise<SkyCardReading> {
  if (!writer) return generateSkyCardReading(input);
  return writer(input);
}
