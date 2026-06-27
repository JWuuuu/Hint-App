import type { BirthProfile, RelationshipAstrology } from "../../types/astrology";

export function buildMockRelationshipAstrology(user: BirthProfile, friend?: BirthProfile): RelationshipAstrology {
  return {
    id: `relationship-${user.id}-${friend?.id ?? "pending"}`,
    provider: "mock",
    source: "preview",
    calculatedAt: new Date().toISOString(),
    people: { user, friend },
    spaceBetween: friend
      ? "The space between you is most readable when both people move slowly enough to tell the truth."
      : "The Space Between You opens after another person consents to add their birth profile.",
    consentCopy: "Add another person only with consent. Birth details should be shared intentionally, not guessed or imported silently.",
    highlights: [
      "Use signs as conversation prompts, not fixed judgments.",
      "Look for pacing, communication style, and emotional rhythm before making a story.",
      "No exact compatibility percentage is shown because relationships are not a scorecard.",
    ],
    invitations: [
      "Ask what feels easy between you.",
      "Ask what gets avoided when the connection feels intense.",
      "Notice whether silence creates safety or confusion.",
    ],
  };
}
