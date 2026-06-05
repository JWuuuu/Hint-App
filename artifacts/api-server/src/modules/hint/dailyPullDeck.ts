/**
 * Server-side daily-pull deck — the 22 Major Arcana paired with a single
 * emotional "whisper" for tonight. The daily pull is drawn from here once per
 * user per day and then persisted, so revisiting the same day is stable.
 * The id format matches the canonical tarot deck so the client renders the
 * right sigil.
 */

export interface DailyPullCard {
  id: string;
  name: string;
  whisper: string;
}

export const dailyPullDeck: DailyPullCard[] = [
  { id: "0-fool", name: "The Fool", whisper: "Tonight, something in you is at an edge. Don't talk yourself out of it yet." },
  { id: "1-magician", name: "The Magician", whisper: "You already have more in your hands than you've admitted." },
  { id: "2-high-priestess", name: "The High Priestess", whisper: "Stop asking. You already know what tonight is asking of you." },
  { id: "3-empress", name: "The Empress", whisper: "Something quiet in you is still growing. Don't trample it for being slow." },
  { id: "4-emperor", name: "The Emperor", whisper: "Tonight is asking you to choose your own structure, not borrow someone else's." },
  { id: "5-hierophant", name: "The Hierophant", whisper: "An old rule of yours is up for review. Sit with it before you obey it again." },
  { id: "6-lovers", name: "The Lovers", whisper: "A choice between two things you love. Neither is wrong. One is yours." },
  { id: "7-chariot", name: "The Chariot", whisper: "Drive your own day. You'll feel different by morning if you do." },
  { id: "8-strength", name: "Strength", whisper: "Be gentler with the part of you that's been working the hardest." },
  { id: "9-hermit", name: "The Hermit", whisper: "Tonight is for the small lamp, not the loud room. Stay in." },
  { id: "10-wheel", name: "Wheel of Fortune", whisper: "Something is turning. You don't have to push it; you have to notice it." },
  { id: "11-justice", name: "Justice", whisper: "Tell yourself the truth before you ask anyone else for theirs." },
  { id: "12-hanged-man", name: "The Hanged Man", whisper: "You're stuck because you're seeing it from one side. Hang upside down for a minute." },
  { id: "13-death", name: "Death", whisper: "A small ending is asking for honesty, not panic. Let it close." },
  { id: "14-temperance", name: "Temperance", whisper: "Neither extreme is yours tonight. Walk the middle without apology." },
  { id: "15-devil", name: "The Devil", whisper: "What you call habit is asking to be looked at, not punished." },
  { id: "16-tower", name: "The Tower", whisper: "Something is falling that needed to. You don't have to catch it." },
  { id: "17-star", name: "The Star", whisper: "Hope is allowed back. Even small. Even just for tonight." },
  { id: "18-moon", name: "The Moon", whisper: "Not all of it is clear yet. You don't owe yourself a conclusion tonight." },
  { id: "19-sun", name: "The Sun", whisper: "A small clean thing today. Don't make it more complicated than it is." },
  { id: "20-judgement", name: "Judgement", whisper: "Something is calling you back to yourself. Listen before you answer." },
  { id: "21-world", name: "The World", whisper: "A chapter has quietly finished. Mark it before you move on." },
];

export function drawDailyPull(): DailyPullCard {
  return dailyPullDeck[Math.floor(Math.random() * dailyPullDeck.length)]!;
}
