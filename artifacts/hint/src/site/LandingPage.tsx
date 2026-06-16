import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, Lock, Moon, Sparkles, Star } from "lucide-react";
import { HintLogo } from "../components/app/HintLogo";
import { ACCENT, GLASS } from "../modules/hold/atmosphere";
import { RITUAL_TAROT_DECK } from "../modules/tarot/logic/createHiddenDeck";
import { getTarotCardImage } from "../modules/tarot/logic/cardImageMap";
import { getDailyPull } from "../modules/home/data/dailyPulls";
import { useCardCollection } from "../shared/hooks/useCardCollection";

const SITE_NAV = [
  { href: "#preview", label: "Preview" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

const EMBER = "#f1a66b";

const ANIMAL_PREVIEWS = [
  {
    name: "Moon Moth",
    message: "A quiet signal is still real. Let the small light tell you where to move next.",
  },
  {
    name: "White Stag",
    message: "Choose the path that gives you dignity after the feeling passes.",
  },
  {
    name: "Black Cat",
    message: "The pause before the doorway is part of the answer.",
  },
];

function appCta(label: string, href = "/app") {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 font-sans text-[13px] font-black"
      style={{ color: "#fffaf2", background: EMBER, boxShadow: "0 16px 34px rgba(241,166,107,0.20)" }}
    >
      {label}
      <ArrowRight size={15} />
    </Link>
  );
}

function ghostCta(label: string, href = "/app") {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-full border px-5 font-sans text-[13px] font-black"
      style={{ color: GLASS.text, borderColor: GLASS.border, background: "rgba(255,255,255,0.045)" }}
    >
      {label}
    </Link>
  );
}

function PreviewShell({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[18px] border p-5 sm:p-6" style={{ borderColor: GLASS.border, background: "rgba(10, 12, 20, 0.62)", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}>
      <p className="font-sans text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: ACCENT.gold }}>
        {eyebrow}
      </p>
      <h3 className="mt-3 font-serif text-[28px] leading-tight" style={{ color: GLASS.text }}>
        {title}
      </h3>
      <p className="mt-3 max-w-lg font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
        {body}
      </p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function LandingPage() {
  const [tarotDrawn, setTarotDrawn] = useState(false);
  const [animalIndex, setAnimalIndex] = useState(0);
  const [birthPreview, setBirthPreview] = useState("");
  const daily = useMemo(() => getDailyPull(new Date(), "en"), []);
  const collection = useCardCollection();
  const previewCard = RITUAL_TAROT_DECK[18]!;
  const previewImage = getTarotCardImage(previewCard.cardId, "hint-card-2") ?? getTarotCardImage(previewCard.cardId);
  const dailyImage = getTarotCardImage(daily.cardId, "hint-card-2") ?? getTarotCardImage(daily.cardId);
  const animal = ANIMAL_PREVIEWS[animalIndex % ANIMAL_PREVIEWS.length]!;
  const animalCard = RITUAL_TAROT_DECK[(animalIndex * 11 + 2) % RITUAL_TAROT_DECK.length]!;
  const animalImage = getTarotCardImage(animalCard.cardId, "hint-card-2") ?? getTarotCardImage(animalCard.cardId);
  const collectionPreview = collection.recent.length ? collection.recent : collection.cards.slice(0, 8);

  return (
    <div className="relative h-full overflow-y-auto text-[#fff8ec]">
      <header className="sticky top-0 z-50 px-4 py-3">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border px-3 py-2" style={{ borderColor: GLASS.border, background: "rgba(8,10,18,0.82)", backdropFilter: "blur(22px)" }}>
          <a href="#top" className="inline-flex items-center gap-3 rounded-full pr-3 font-serif text-[22px]" style={{ color: GLASS.text }}>
            <HintLogo className="size-9 rounded-[12px]" />
            Hint
          </a>
          <div className="hidden items-center gap-1 md:flex">
            {SITE_NAV.map((item) => (
              <a key={item.href} href={item.href} className="rounded-full px-4 py-2 font-sans text-[13px] font-bold" style={{ color: GLASS.muted }}>
                {item.label}
              </a>
            ))}
          </div>
          <Link href="/app" className="inline-flex h-10 items-center rounded-full px-4 font-sans text-[13px] font-black" style={{ color: "#fffaf2", background: EMBER }}>
            Open App
          </Link>
        </nav>
      </header>

      <main id="top" className="mx-auto max-w-6xl px-5 pb-20 pt-8">
        <section className="grid min-h-[calc(100vh-9rem)] gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: ACCENT.gold, borderColor: "rgba(206,178,110,0.32)", background: "rgba(206,178,110,0.08)" }}>
              <Sparkles size={13} />
              Preview portal
            </p>
            <h1 className="mt-6 max-w-[12ch] font-serif text-[52px] leading-[0.95] sm:text-[70px]" style={{ color: GLASS.text, textShadow: "0 0 34px rgba(230,203,142,0.14)" }}>
              A private room for the night.
            </h1>
            <p className="mt-6 max-w-xl font-sans text-[17px] leading-relaxed" style={{ color: GLASS.muted }}>
              Hint brings tarot, astrology, daily energy, saved patterns, and emotional follow-up into one calm app experience. Try the public previews, then open the full room when you want depth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {appCta("Open Hint App", "/app")}
              {ghostCta("Try a free reading", "#preview")}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[430px]">
            <div className="absolute inset-8 rounded-full bg-[rgba(134,214,199,0.16)] blur-3xl" />
            <div className="relative rounded-[22px] border p-4" style={{ borderColor: GLASS.border, background: "rgba(8,10,18,0.72)", boxShadow: "0 30px 100px rgba(0,0,0,0.34)" }}>
              <div className="grid grid-cols-[0.82fr_1fr] gap-4">
                <div className="aspect-[46/71] overflow-hidden rounded-[12px] border" style={{ borderColor: "rgba(206,178,110,0.38)" }}>
                  {previewImage ? <img src={previewImage} alt="The Moon" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="flex flex-col justify-between rounded-[14px] border p-4" style={{ borderColor: GLASS.border, background: "rgba(255,255,255,0.045)" }}>
                  <div>
                    <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: ACCENT.aqua }}>Tonight</p>
                    <h2 className="mt-2 font-serif text-[28px] leading-none" style={{ color: GLASS.text }}>The Moon</h2>
                    <p className="mt-3 font-sans text-[12px] leading-relaxed" style={{ color: GLASS.muted }}>
                      Not AI-random. Energy-selected.
                    </p>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-1.5">
                    {[82, 77, 90].map((score, index) => (
                      <span key={score} className="rounded-[8px] border px-2 py-2 text-center font-serif text-[18px]" style={{ borderColor: GLASS.border, color: index === 2 ? ACCENT.gold : GLASS.text }}>
                        {score}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="preview" className="scroll-mt-28 py-10">
          <div className="mb-7 max-w-2xl">
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ACCENT.gold }}>Limited previews</p>
            <h2 className="mt-3 font-serif text-[42px] leading-none" style={{ color: GLASS.text }}>Try the doorways.</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <PreviewShell eyebrow="Tarot Room preview" title="One simple draw." body="The full room keeps the shuffle, cut, spread, saving, and AI follow-up inside the app. This preview gives one short reading only.">
              <div className="grid gap-5 sm:grid-cols-[150px_1fr] sm:items-center">
                <div className="aspect-[46/71] overflow-hidden rounded-[10px] border" style={{ borderColor: "rgba(206,178,110,0.32)", background: "rgba(255,255,255,0.04)" }}>
                  {tarotDrawn && previewImage ? <img src={previewImage} alt={previewCard.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Moon color={ACCENT.gold} /></div>}
                </div>
                <div>
                  <p className="font-serif text-[24px]" style={{ color: GLASS.text }}>
                    {tarotDrawn ? previewCard.name : "Card waiting"}
                  </p>
                  <p className="mt-2 font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
                    {tarotDrawn ? "Something is unclear because it is still forming. Do not force a conclusion before the signal has a shape." : "The public preview does not save or open follow-up chat."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setTarotDrawn(true)} className="h-10 rounded-full px-4 font-sans text-[12px] font-black" style={{ color: "#fffaf2", background: EMBER }}>
                      Draw preview
                    </button>
                    {ghostCta("Unlock full reading", "/app/tarot")}
                    {ghostCta("Ask follow-up", "/app/tarot")}
                  </div>
                </div>
              </div>
            </PreviewShell>

            <PreviewShell eyebrow="Animal Tarot preview" title="One animal guide." body="Animal Terrace is the lighter demo doorway. Full animal spreads, saving, and collection unlocks belong inside the app.">
              <div className="grid gap-5 sm:grid-cols-[150px_1fr] sm:items-center">
                <div className="aspect-[46/71] overflow-hidden rounded-[10px] border" style={{ borderColor: "rgba(206,178,110,0.32)" }}>
                  {animalImage ? <img src={animalImage} alt={animalCard.name} className="h-full w-full object-cover" /> : null}
                </div>
                <div>
                  <p className="font-serif text-[24px]" style={{ color: GLASS.text }}>{animal.name}</p>
                  <p className="mt-2 font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>{animal.message}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setAnimalIndex((value) => value + 1)} className="h-10 rounded-full px-4 font-sans text-[12px] font-black" style={{ color: "#fffaf2", background: EMBER }}>
                      Draw animal
                    </button>
                    {ghostCta("Open Animal Tarot", "/app/animal-tarot")}
                  </div>
                </div>
              </div>
            </PreviewShell>

            <PreviewShell eyebrow="Sky Deck preview" title="Today’s sky, one card." body="The app version includes sky evidence, saved daily history, and deeper astrology context.">
              <div className="grid gap-5 sm:grid-cols-[150px_1fr] sm:items-center">
                <div className="aspect-[46/71] overflow-hidden rounded-[10px] border" style={{ borderColor: "rgba(206,178,110,0.32)" }}>
                  {dailyImage ? <img src={dailyImage} alt={daily.cardName} className="h-full w-full object-cover" /> : null}
                </div>
                <div>
                  <p className="font-serif text-[24px]" style={{ color: GLASS.text }}>{daily.cardName}</p>
                  <p className="mt-2 font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>{daily.whisper}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {appCta("Open Sky Deck", "/app/sky-deck")}
                    {ghostCta("Full Daily", "/app/daily")}
                  </div>
                </div>
              </div>
            </PreviewShell>

            <PreviewShell eyebrow="Astrology preview" title="A clean first signal." body="Birth chart reports, transits, relationship analysis, and deeper interpretation stay inside the app.">
              <div className="grid gap-4">
                <input
                  value={birthPreview}
                  onChange={(event) => setBirthPreview(event.target.value)}
                  placeholder="Birth date or sign"
                  className="h-11 rounded-[10px] border bg-transparent px-4 font-sans text-[13px] outline-none"
                  style={{ color: GLASS.text, borderColor: GLASS.border }}
                />
                <p className="rounded-[10px] border px-4 py-3 font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted, borderColor: GLASS.border, background: "rgba(255,255,255,0.04)" }}>
                  {birthPreview.trim() ? "The full app can use birth details for chart context. This public state stays intentionally short until you open the complete chart." : "Enter a small birth clue for a preview state, or open the app for the full natal chart."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {appCta("Open Astrology", "/app/astrology")}
                  {ghostCta("Save birth profile", "/app/astrology?tab=birth")}
                </div>
              </div>
            </PreviewShell>
          </div>
        </section>

        <section id="features" className="scroll-mt-28 py-10">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="font-sans text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ACCENT.gold }}>Collection preview</p>
              <h2 className="mt-3 font-serif text-[42px] leading-none" style={{ color: GLASS.text }}>The deck remembers.</h2>
              <p className="mt-4 max-w-lg font-sans text-[14px] leading-relaxed" style={{ color: GLASS.muted }}>
                Public users can see the collection concept. Real unlocking, saved history, account sync, and rare-card rules happen inside the app.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {appCta("Open Collection", "/app/collection")}
                {ghostCta("Start Daily", "/app/daily")}
              </div>
            </div>
            <div className="rounded-[18px] border p-5" style={{ borderColor: GLASS.border, background: "rgba(10,12,20,0.62)" }}>
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: GLASS.faint }}>Collection</p>
                  <p className="mt-1 font-serif text-[32px]" style={{ color: GLASS.text }}>
                    {collection.unlocked} <span className="text-[18px]" style={{ color: GLASS.faint }}>/ {collection.total}</span>
                  </p>
                </div>
                <span className="rounded-full border px-3 py-1 font-sans text-[11px] font-black" style={{ color: ACCENT.aqua, borderColor: "rgba(134,214,199,0.34)" }}>
                  {collection.rareUnlocked} rare
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                {collectionPreview.map((card, index) => (
                  <div key={`${card.cardId}-${index}`} className="aspect-[46/71] overflow-hidden rounded-[7px] border" style={{ borderColor: card.unlocked ? "rgba(206,178,110,0.32)" : GLASS.border, background: "rgba(255,255,255,0.04)" }}>
                    {card.unlocked && card.image ? <img src={card.image} alt={card.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Lock size={15} color={GLASS.faint} /></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-28 py-10">
          <div className="mb-7 max-w-2xl">
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ACCENT.gold }}>Membership + Tokens</p>
            <h2 className="mt-3 font-serif text-[42px] leading-none" style={{ color: GLASS.text }}>Ask once with Tokens. Come back daily with Membership.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[18px] border p-6" style={{ borderColor: GLASS.border, background: "rgba(10,12,20,0.62)" }}>
              <Star color={ACCENT.gold} />
              <h3 className="mt-4 font-serif text-[28px]" style={{ color: GLASS.text }}>Membership</h3>
              <p className="mt-3 font-sans text-[14px] leading-relaxed" style={{ color: GLASS.muted }}>Daily readings, Daily Hint, astrology insights, saved history, and a more complete ritual experience.</p>
              <div className="mt-6">{ghostCta("View in app", "/app/settings")}</div>
            </div>
            <div className="rounded-[18px] border p-6" style={{ borderColor: GLASS.border, background: "rgba(10,12,20,0.62)" }}>
              <Sparkles color={ACCENT.aqua} />
              <h3 className="mt-4 font-serif text-[28px]" style={{ color: GLASS.text }}>Tokens</h3>
              <p className="mt-3 font-sans text-[14px] leading-relaxed" style={{ color: GLASS.muted }}>One urgent question, extra tarot reading, AI follow-up, or deeper unlock. Payment logic should stay gated until implemented.</p>
              <div className="mt-6">{ghostCta("Open app", "/app")}</div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t px-5 py-8" style={{ borderColor: GLASS.border }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif text-[22px]" style={{ color: GLASS.text }}>Hint</p>
          <div className="flex flex-wrap gap-4 font-sans text-[12px]" style={{ color: GLASS.faint }}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
