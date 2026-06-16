import { Link } from "wouter";
import { Lock, Sparkles } from "lucide-react";
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import { useCardCollection } from "../../shared/hooks/useCardCollection";

const EMBER = "#f1a66b";

function formatDate(iso?: string) {
  if (!iso) return "Locked";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function CardCollectionView() {
  const collection = useCardCollection();
  const progress = Math.round((collection.unlocked / collection.total) * 100);

  return (
    <AppScreen>
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ACCENT.gold }}>
            Collection
          </p>
          <h1 className="mt-2 font-serif text-[30px] leading-none" style={{ color: GLASS.text }}>
            Your deck memory
          </h1>
          <p className="mt-3 max-w-xl font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
            Cards enter the collection when they appear in Daily or the Tarot Room. Saving, sync, and rare unlock rules can move behind account membership later.
          </p>
        </div>
        <Link
          href="/app/tarot"
          className="inline-flex h-11 w-fit items-center justify-center rounded-full px-5 font-sans text-[13px] font-black"
          style={{ color: "#fffaf2", background: EMBER }}
        >
          Draw in Tarot Room
        </Link>
      </header>

      <GlassPanel className="mb-7">
        <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <SectionLabel>Progress</SectionLabel>
                <p className="mt-2 font-serif text-[42px] leading-none" style={{ color: GLASS.text }}>
                  {collection.unlocked}
                  <span className="text-[22px]" style={{ color: GLASS.faint }}> / {collection.total}</span>
                </p>
              </div>
              <span className="rounded-full border px-3 py-1.5 font-sans text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: ACCENT.aqua, borderColor: "rgba(134,214,199,0.34)", background: "rgba(134,214,199,0.09)" }}>
                {collection.rareUnlocked} rare
              </span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${ACCENT.gold}, ${EMBER})` }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 md:grid-cols-3">
            {(collection.recent.length ? collection.recent : collection.cards.slice(0, 6)).map((card) => (
              <div key={card.cardId} className="relative aspect-[46/71] overflow-hidden rounded-[8px] border" style={{ borderColor: card.unlocked ? "rgba(206,178,110,0.32)" : GLASS.border, background: "rgba(255,255,255,0.04)" }}>
                {card.unlocked && card.image ? (
                  <img src={card.image} alt={card.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center">
                    <Lock size={16} color={GLASS.faint} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      <section>
        <SectionLabel>All cards</SectionLabel>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {collection.cards.map((card) => (
            <article key={card.cardId} className="min-w-0">
              <div className="relative aspect-[46/71] overflow-hidden rounded-[8px] border" style={{ borderColor: card.unlocked ? "rgba(206,178,110,0.32)" : GLASS.border, background: card.unlocked ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.035)" }}>
                {card.unlocked && card.image ? (
                  <img src={card.image} alt={card.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center">
                    <Lock size={15} color={GLASS.faint} />
                  </div>
                )}
                {card.rare && card.unlocked ? (
                  <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full" style={{ background: "rgba(230,203,142,0.92)", color: "#17110e" }}>
                    <Sparkles size={12} />
                  </span>
                ) : null}
              </div>
              <p className="mt-2 truncate font-serif text-[12px]" style={{ color: card.unlocked ? GLASS.text : GLASS.faint }}>
                {card.unlocked ? card.name : "Locked"}
              </p>
              <p className="mt-0.5 truncate font-sans text-[10px] uppercase tracking-[0.12em]" style={{ color: GLASS.faint }}>
                {formatDate(card.lastSeenAt)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </AppScreen>
  );
}
