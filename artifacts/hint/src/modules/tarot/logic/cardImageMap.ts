export type TarotCardArtId = "original" | "hint-classic";

const CARD_IMAGE_BASE_PATHS: Record<TarotCardArtId, string> = {
  original: "/brand/tarot/cards",
  "hint-classic": "/brand/tarot/decks/hint-classic/cards",
};

export function isTarotCardArtId(value: unknown): value is TarotCardArtId {
  return value === "original" || value === "hint-classic";
}

const MAJOR_CARD_IMAGES: Record<string, string> = {
  "0-fool": "00-TheFool.jpg",
  "1-magician": "01-TheMagician.jpg",
  "2-high-priestess": "02-TheHighPriestess.jpg",
  "3-empress": "03-TheEmpress.jpg",
  "4-emperor": "04-TheEmperor.jpg",
  "5-hierophant": "05-TheHierophant.jpg",
  "6-lovers": "06-TheLovers.jpg",
  "7-chariot": "07-TheChariot.jpg",
  "8-strength": "08-Strength.jpg",
  "9-hermit": "09-TheHermit.jpg",
  "10-wheel": "10-WheelOfFortune.jpg",
  "11-justice": "11-Justice.jpg",
  "12-hanged-man": "12-TheHangedMan.jpg",
  "13-death": "13-Death.jpg",
  "14-temperance": "14-Temperance.jpg",
  "15-devil": "15-TheDevil.jpg",
  "16-tower": "16-TheTower.jpg",
  "17-star": "17-TheStar.jpg",
  "18-moon": "18-TheMoon.jpg",
  "19-sun": "19-TheSun.jpg",
  "20-judgement": "20-Judgement.jpg",
  "21-world": "21-TheWorld.jpg",
};

const MINOR_RANK_NUMBERS: Record<string, string> = {
  ace: "01",
  two: "02",
  three: "03",
  four: "04",
  five: "05",
  six: "06",
  seven: "07",
  eight: "08",
  nine: "09",
  ten: "10",
  page: "11",
  knight: "12",
  queen: "13",
  king: "14",
};

const MINOR_SUIT_PREFIXES: Record<string, string> = {
  cups: "Cups",
  pentacles: "Pentacles",
  swords: "Swords",
  wands: "Wands",
};

function withBasePath(fileName: string, cardArtId: TarotCardArtId) {
  return `${CARD_IMAGE_BASE_PATHS[cardArtId]}/${fileName}`;
}

export function getTarotCardImage(cardId: string, cardArtId: TarotCardArtId = "original"): string | null {
  const majorImage = MAJOR_CARD_IMAGES[cardId];
  if (majorImage) return withBasePath(majorImage, cardArtId);

  const [rank, suit] = cardId.split("-");
  const rankNumber = rank ? MINOR_RANK_NUMBERS[rank] : undefined;
  const suitPrefix = suit ? MINOR_SUIT_PREFIXES[suit] : undefined;

  if (!rankNumber || !suitPrefix) return null;
  return withBasePath(`${suitPrefix}${rankNumber}.jpg`, cardArtId);
}
