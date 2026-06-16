import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import { RITUAL_TAROT_DECK } from "../../modules/tarot/logic/createHiddenDeck";
import { getTarotCardImage } from "../../modules/tarot/logic/cardImageMap";

const ANIMALS = [
  {
    name: "Moon Moth",
    tone: "soft signal",
    message: "Move toward the quiet thing that keeps glowing after everything else gets loud.",
  },
  {
    name: "Black Cat",
    tone: "threshold",
    message: "Trust the pause before the doorway. Your body noticed the shift first.",
  },
  {
    name: "White Stag",
    tone: "direction",
    message: "Choose the path that asks for dignity, not performance.",
  },
  {
    name: "Night Swan",
    tone: "release",
    message: "Something graceful can still be final. Let the old shape leave cleanly.",
  },
];

const EMBER = "#f1a66b";

export function AnimalTarotView() {
  const [drawIndex, setDrawIndex] = useState(0);
  const draw = useMemo(() => {
    const animal = ANIMALS[drawIndex % ANIMALS.length]!;
    const card = RITUAL_TAROT_DECK[(drawIndex * 17 + 18) % RITUAL_TAROT_DECK.length]!;
    return {
      animal,
      card,
      image: getTarotCardImage(card.cardId, "hint-card-2") ?? getTarotCardImage(card.cardId),
    };
  }, [drawIndex]);

  return (
    <AppScreen>
      <header className="mb-7">
        <p className="font-sans text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ACCENT.gold }}>
          Animal Tarot
        </p>
        <h1 className="mt-2 font-serif text-[30px] leading-none" style={{ color: GLASS.text }}>
          Animal Terrace
        </h1>
        <p className="mt-3 max-w-xl font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
          A lighter doorway into the deck. Full animal spreads, saving, and collection unlocks should live here as the product grows.
        </p>
      </header>

      <GlassPanel hero>
        <div className="grid gap-7 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div className="mx-auto w-full max-w-[240px]">
            <div className="relative aspect-[46/71] overflow-hidden rounded-[12px] border" style={{ borderColor: "rgba(206,178,110,0.38)", boxShadow: "0 24px 70px rgba(0,0,0,0.34)" }}>
              {draw.image ? <img src={draw.image} alt={draw.card.name} className="h-full w-full object-cover" /> : null}
            </div>
          </div>
          <div>
            <SectionLabel>{draw.animal.tone}</SectionLabel>
            <h2 className="mt-3 font-serif text-[38px] leading-none" style={{ color: GLASS.text }}>
              {draw.animal.name}
            </h2>
            <p className="mt-4 font-sans text-[15px] leading-relaxed" style={{ color: GLASS.muted }}>
              {draw.animal.message}
            </p>
            <div className="mt-5 rounded-[10px] border px-4 py-3" style={{ borderColor: GLASS.border, background: "rgba(255,255,255,0.045)" }}>
              <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: GLASS.faint }}>
                Card companion
              </p>
              <p className="mt-1 font-serif text-[20px]" style={{ color: GLASS.text }}>
                {draw.card.name}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setDrawIndex((value) => value + 1)}
                className="h-11 rounded-full px-5 font-sans text-[13px] font-black"
                style={{ color: "#fffaf2", background: EMBER }}
              >
                Draw animal card
              </button>
              <Link href="/tarot" className="inline-flex h-11 items-center rounded-full border px-5 font-sans text-[13px] font-black" style={{ borderColor: GLASS.border, color: GLASS.text }}>
                Enter Tarot Room
              </Link>
            </div>
          </div>
        </div>
      </GlassPanel>
    </AppScreen>
  );
}
