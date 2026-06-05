/**
 * Tarot spread definitions.
 * Each spread defines the positions used in a reading.
 */

export interface SpreadPosition {
  name: string;
  description: string;
}

export interface Spread {
  id: string;
  name: string;
  cardCount: number;
  positions: SpreadPosition[];
}

export const spreads: Record<string, Spread> = {
  single: {
    id: "single",
    name: "Single Card",
    cardCount: 1,
    positions: [
      {
        name: "The Card",
        description: "A single reflection — the essence of what you are asking.",
      },
    ],
  },
  three: {
    id: "three",
    name: "Three Card",
    cardCount: 3,
    positions: [
      {
        name: "Past",
        description: "What has led you here — the roots of the situation.",
      },
      {
        name: "Present",
        description: "Where you stand right now — what is most alive.",
      },
      {
        name: "Future",
        description: "What is moving toward you — the current trajectory.",
      },
    ],
  },
  relationship: {
    id: "relationship",
    name: "Relationship Spread",
    cardCount: 3,
    positions: [
      {
        name: "You",
        description: "Your energy, needs, and position in this relationship.",
      },
      {
        name: "The Other",
        description: "Their energy, perspective, and what they carry.",
      },
      {
        name: "The Connection",
        description: "What lies between you — the thread, the tension, the truth.",
      },
    ],
  },
  futureLover: {
    id: "futureLover",
    name: "Future Lover",
    cardCount: 7,
    positions: [
      { name: "Arrival", description: "What kind of person or energy may be entering." },
      { name: "Signal", description: "How you may recognize the connection." },
      { name: "Draw", description: "What creates attraction or curiosity." },
      { name: "Approach", description: "How the connection may begin to move." },
      { name: "Challenge", description: "What could complicate the connection." },
      { name: "Gain", description: "What this connection may teach or offer." },
      { name: "Direction", description: "Where the current path points." },
    ],
  },
  peachBlossom: {
    id: "peachBlossom",
    name: "Peach Blossom",
    cardCount: 5,
    positions: [
      { name: "Appears", description: "Whether attraction is entering the field." },
      { name: "Image", description: "How you are being seen or perceived." },
      { name: "Block", description: "What slows the romantic energy down." },
      { name: "Trend", description: "How the connection or attention may develop." },
      { name: "Gain", description: "What can be learned or received from it." },
    ],
  },
  reconciliation: {
    id: "reconciliation",
    name: "Reconciliation",
    cardCount: 7,
    positions: [
      { name: "You now", description: "Your current position in the break or distance." },
      { name: "Them now", description: "Their current energy or stance." },
      { name: "Break", description: "What caused the rupture or silence." },
      { name: "Positive", description: "What still has warmth or possibility." },
      { name: "Barrier", description: "What still blocks repair." },
      { name: "Future", description: "What may happen if nothing changes." },
      { name: "Advice", description: "The wiser way to approach this." },
    ],
  },
  trueHeart: {
    id: "trueHeart",
    name: "True Heart",
    cardCount: 5,
    positions: [
      { name: "Outer", description: "What they show on the outside." },
      { name: "Feeling", description: "What may be moving underneath." },
      { name: "Block", description: "What keeps the feeling from moving freely." },
      { name: "True view", description: "How they may really see the situation." },
      { name: "Future", description: "Where this feeling may go." },
    ],
  },
  loveTree: {
    id: "loveTree",
    name: "Love Tree",
    cardCount: 7,
    positions: [
      { name: "Root", description: "The foundation or origin of the connection." },
      { name: "Trunk", description: "What currently holds the connection up." },
      { name: "Environment", description: "What surrounds or influences it." },
      { name: "Past", description: "What is still feeding the present." },
      { name: "Future", description: "What is starting to grow next." },
      { name: "Crown", description: "The higher lesson or visible outcome." },
      { name: "Fruit", description: "What this connection can produce." },
    ],
  },
  xRelationship: {
    id: "xRelationship",
    name: "X Relationship",
    cardCount: 9,
    positions: [
      { name: "Root", description: "The deepest reason this situation exists." },
      { name: "Cause", description: "What triggered or shaped the current state." },
      { name: "You", description: "Your position and energy." },
      { name: "Them", description: "Their position and energy." },
      { name: "Obstacle", description: "The central complication." },
      { name: "Help", description: "What can support movement or clarity." },
      { name: "Block", description: "What should not be ignored." },
      { name: "Action", description: "The next useful move." },
      { name: "Result", description: "The likely result of the current pattern." },
    ],
  },
};
