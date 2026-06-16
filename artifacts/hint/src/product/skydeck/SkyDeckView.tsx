import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { SkyDeckCard } from "../../components/skydeck/SkyDeckCard";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import {
  generateDailySkyDeck,
  type DailySkyDeck,
} from "../../lib/skydeck/generateDailySkyDeck";
import { getAnonId } from "../../lib/identity";
import { readBirthProfile } from "../../lib/astro/userBirthProfile";

const EMBER = "#f1a66b";

export function SkyDeckView() {
  const [deck, setDeck] = useState<DailySkyDeck | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    generateDailySkyDeck({
      userId: getAnonId(),
      birthProfile: (() => {
        const profile = readBirthProfile();
        if (!profile?.birthDate) return null;
        return {
          userId: profile.id,
          name: profile.name,
          birthday: profile.birthDate,
          birthTime: profile.birthTime,
          birthCity: profile.birthPlace,
          latitude: profile.latitude,
          longitude: profile.longitude,
          timezone: profile.timezoneOffset ?? profile.timezone,
        };
      })(),
    })
      .then((next) => {
        if (mounted) setDeck(next);
      })
      .catch(() => {
        if (mounted) setError(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppScreen>
      <header className="mb-7">
        <p className="font-sans text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ACCENT.gold }}>
          Sky Deck
        </p>
        <h1 className="mt-2 font-serif text-[30px] leading-none" style={{ color: GLASS.text }}>
          Today’s sky card
        </h1>
        <p className="mt-3 max-w-xl font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
          Daily scores and card selection are generated from the sky-deck logic. Full evidence and reports stay inside the app.
        </p>
      </header>

      <GlassPanel hero>
        {deck ? (
          <div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr] md:items-start">
            <SkyDeckCard deck={deck} revealed />
            <div>
              <SectionLabel>Reading</SectionLabel>
              <h2 className="mt-3 font-serif text-[34px] leading-none" style={{ color: GLASS.text }}>
                {deck.dailyCard.cardName}
              </h2>
              <p className="mt-4 font-sans text-[15px] leading-relaxed" style={{ color: GLASS.muted }}>
                {deck.reading.shortAnswer}
              </p>
              <div className="mt-5 grid gap-3">
                {deck.reading.whyThisCard.slice(0, 3).map((line) => (
                  <p key={line} className="rounded-[8px] border px-4 py-3 font-sans text-[12px] leading-relaxed" style={{ borderColor: GLASS.border, color: GLASS.muted, background: "rgba(255,255,255,0.04)" }}>
                    {line}
                  </p>
                ))}
              </div>
              <Link href="/app/astrology" className="mt-6 inline-flex h-11 items-center rounded-full px-5 font-sans text-[13px] font-black" style={{ color: "#fffaf2", background: EMBER }}>
                Open astrology
              </Link>
            </div>
          </div>
        ) : (
          <div className="min-h-[260px] rounded-[12px] border p-6" style={{ borderColor: GLASS.border }}>
            <SectionLabel>{error ? "Unavailable" : "Loading"}</SectionLabel>
            <p className="mt-3 font-serif text-[28px]" style={{ color: GLASS.text }}>
              {error ? "Sky Deck could not load right now." : "Drawing today’s sky deck..."}
            </p>
          </div>
        )}
      </GlassPanel>
    </AppScreen>
  );
}
