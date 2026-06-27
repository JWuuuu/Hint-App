import type { SkyGuidedTarotResult, SkyGuidedTone } from "../tarot/skyGuidedTarot";

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

const TONE_OPENERS: Record<SkyGuidedTone, string> = {
  soft: "Move gently here.",
  honest: "Be direct with yourself.",
  mirror: "Notice the pattern without dressing it up.",
};

const TONE_ACTIONS: Record<SkyGuidedTone, string> = {
  soft: "Choose the kindest next step that still tells the truth.",
  honest: "Name what is true, then make one practical move.",
  mirror: "Ask what this keeps reflecting back, then stop feeding the loop.",
};

function compactList(values: string[], fallback: string): string {
  const unique = Array.from(new Set(values.filter(Boolean)));
  if (unique.length === 0) return fallback;
  if (unique.length === 1) return unique[0]!;
  return `${unique.slice(0, -1).join(", ")} and ${unique[unique.length - 1]}`;
}

export function generateSkyCardReading({
  cardName,
  cardWhisper,
  sky,
  question,
  tone,
}: SkyCardReadingWriterInput): SkyCardReading {
  const primaryThemes = sky.themeLabels.slice(0, 2);
  const themeText = compactList(primaryThemes, "today's strongest signal");
  const evidenceText = compactList(
    sky.evidence.slice(0, 2).map((signal) => signal.label),
    "the strongest sky signal",
  );
  const leadingReason = sky.candidatePool.find((candidate) => candidate.cardId === sky.selectedCardId)
    ?.reasons[0];
  const questionLine = question ? `For "${question}", ` : "";

  return {
    shortAnswer: `${TONE_OPENERS[tone]} ${cardName} points to ${themeText}; ${TONE_ACTIONS[tone]}`,
    cardMeaning:
      cardWhisper ??
      `${cardName} asks you to read the signal clearly before turning it into a bigger story.`,
    whatThisMeans: `${questionLine}the card is not asking for a dramatic answer. It is asking for the next true action.`,
    followUpChips: [
      "What should I do next?",
      "What am I avoiding?",
      "What is the cleanest step?",
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
