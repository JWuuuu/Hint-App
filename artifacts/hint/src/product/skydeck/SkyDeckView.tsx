import { useEffect, useState } from "react";
import { Check, Moon, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { SkyDeckCard } from "../../components/skydeck/SkyDeckCard";
import { SafeImage } from "../../shared/ui/SafeImage";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import { getTarotCardImage } from "../../modules/tarot/logic/cardImageMap";
import {
  generateDailySkyDeck,
  type DailySkyDeck,
} from "../../lib/skydeck/generateDailySkyDeck";
import { getAnonId } from "../../lib/identity";
import { getOrCreateDailyReceipt, parseServerDailyKey } from "../../lib/dailyReceipts";
import { readBirthProfile } from "../../lib/astro/userBirthProfile";

const SCORE_COLORS: Record<string, string> = {
  love: "#d98aaa",
  wealth: "#cda866",
  career: "#9b98c9",
  study: "#8ab9b2",
  people: "#b48abf",
};

function ScoreTile({ label, score, color, large = false }: { label: string; score: number; color: string; large?: boolean }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[18px] border",
        large ? "px-4 py-4" : "px-3 py-3",
      ].join(" ")}
      style={{
        background:
          "linear-gradient(145deg, color-mix(in srgb, var(--hint-surface-soft) 88%, transparent), color-mix(in srgb, var(--hint-input-bg) 70%, transparent))",
        borderColor: `color-mix(in srgb, ${color} 22%, var(--hint-border))`,
        boxShadow: large
          ? `0 18px 44px color-mix(in srgb, ${color} 10%, transparent), inset 0 1px 0 rgba(255,255,255,0.14)`
          : "inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 rounded-r-full"
        style={{ background: color }}
      />
      <div className={large ? "flex items-end justify-between gap-3" : "flex items-center justify-between gap-2"}>
        <div className="min-w-0">
          <p className="truncate font-sans text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: GLASS.muted }}>
            {label}
          </p>
          {large ? (
            <p className="mt-1 font-sans text-[12px] leading-snug" style={{ color: GLASS.faint }}>
              The day’s full sky signal
            </p>
          ) : null}
        </div>
        <span
          className={large ? "font-serif text-[48px] leading-none tabular-nums" : "font-serif text-[28px] leading-none tabular-nums"}
          style={{ color: "var(--hint-text)", textShadow: `0 0 14px color-mix(in srgb, ${color} 14%, transparent)` }}
        >
          {score}
        </span>
      </div>
      <div className={large ? "mt-4 h-2" : "mt-3 h-1.5"} style={{ background: "color-mix(in srgb, var(--hint-border) 58%, transparent)", borderRadius: 999 }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 48%, var(--hint-gold)))`,
            boxShadow: `0 0 14px color-mix(in srgb, ${color} 20%, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

function EnergyTask({ deck }: { deck: DailySkyDeck }) {
  const task = deck.scores.overall >= 78
    ? "Send one clear message before the night gets louder"
    : deck.scores.people < 68
      ? "Step outside for three slow breaths before replying"
      : "Drink a glass of water slowly and name one thing you can finish";

  return (
    <GlassPanel className="hint-shimmer-border">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <SectionLabel>Energy task</SectionLabel>
          <h3 className="font-serif text-[26px] leading-tight" style={{ color: GLASS.text }}>
            Tonight's ritual
          </h3>
        </div>
        <span className="grid size-10 place-items-center rounded-full border" style={{ color: ACCENT.gold, borderColor: "rgba(206,178,110,0.28)", background: "rgba(206,178,110,0.10)" }}>
          <Moon size={18} />
        </span>
      </div>
      <div className="grid gap-3">
        <div className="hint-selected-glow flex items-center gap-3 rounded-[16px] border px-3 py-3" style={{ borderColor: "color-mix(in srgb, var(--hint-aqua, #9dded9) 30%, var(--hint-border))", background: "color-mix(in srgb, var(--hint-aqua, #9dded9) 10%, var(--hint-surface-soft))" }}>
          <span className="grid size-5 shrink-0 place-items-center rounded-full" style={{ color: "#08221f", background: ACCENT.aqua }}>
            <Check size={13} />
          </span>
          <span className="font-sans text-[13px]" style={{ color: GLASS.text }}>{task}</span>
        </div>
        <div className="hint-status-pill flex items-center gap-3 rounded-[16px] border px-3 py-3">
          <span className="size-5 shrink-0 rounded-full border" style={{ borderColor: GLASS.border }} />
          <span className="font-sans text-[13px]" style={{ color: GLASS.muted }}>Write one sentence about what the card changed</span>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3 border-t pt-4" style={{ borderColor: GLASS.border }}>
        <span className="grid size-10 place-items-center overflow-hidden rounded-[12px]" style={{ background: "color-mix(in srgb, var(--hint-gold, #dcc383) 16%, var(--hint-surface-soft))" }}>
          <SafeImage src="/lucky/flower/lavender.png" alt="" className="size-8 object-contain" fallbackClassName="size-8 rounded-[10px]" />
        </span>
        <p className="font-sans text-[12px]" style={{ color: GLASS.muted }}>
          Finish to earn <span className="font-serif text-[15px]" style={{ color: ACCENT.gold }}>+20 XP · ritual progress</span>
        </p>
      </div>
    </GlassPanel>
  );
}

export function SkyDeckView() {
  const [deck, setDeck] = useState<DailySkyDeck | null>(null);
  const [error, setError] = useState(false);
  const [lockNotice, setLockNotice] = useState("");

  useEffect(() => {
    let mounted = true;
    const userId = getAnonId();
    const birthProfile = (() => {
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
      })();
    getOrCreateDailyReceipt("sky-deck")
      .then((receipt) =>
        generateDailySkyDeck({
          userId,
          date: parseServerDailyKey(receipt.dailyKey),
          birthProfile,
          cardIdOverride: receipt.assignedCardId,
        }).then((next) => ({ next, receipt })),
      )
      .then((next) => {
        if (!mounted) return;
        setDeck(next.next);
        setLockNotice(
          next.receipt.source === "local-fallback"
            ? "Backend daily lock is unavailable. Sky Deck is using local fallback state until the API returns."
            : "",
        );
      })
      .catch(() => {
        generateDailySkyDeck({ userId, birthProfile: null })
          .then((next) => {
            if (mounted) setDeck(next);
          })
          .catch(() => {
            if (mounted) setError(true);
          });
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
        <h1 className="mt-2 font-serif text-[30px] leading-none hint-app-title" style={{ color: GLASS.text }}>
          Today’s sky card
        </h1>
        <p className="mt-3 max-w-xl font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
          Daily scores and card selection are generated from the sky-deck logic. Full evidence and reports stay inside the app.
        </p>
        {lockNotice && (
          <p className="mt-2 max-w-xl font-sans text-[12px] leading-relaxed" style={{ color: GLASS.faint }}>
            {lockNotice}
          </p>
        )}
      </header>

      <GlassPanel hero className="hint-shimmer-border">
        {deck ? (
          <div className="grid gap-5">
            <div className="grid gap-5">
              <div className="hint-app-card relative overflow-hidden rounded-[24px] border p-4" style={{ borderColor: "color-mix(in srgb, var(--hint-gold, #dcc383) 26%, var(--hint-border))" }}>
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "radial-gradient(360px 260px at 18% 8%, color-mix(in srgb, var(--hint-rose) 12%, transparent), transparent 64%), radial-gradient(320px 240px at 92% 10%, color-mix(in srgb, var(--hint-aqua) 9%, transparent), transparent 62%)" }}
                />
                <div className="relative grid gap-4">
                  <SectionLabel>Overall tonight</SectionLabel>
                  <ScoreTile label="Sky score" score={deck.scores.overall} color={ACCENT.gold} large />
                  <div className="grid w-full grid-cols-2 gap-2.5">
                    {deck.scoreBars.map((score) => (
                      <ScoreTile key={score.key} label={score.label} score={score.score} color={SCORE_COLORS[score.key] ?? ACCENT.gold} />
                    ))}
                  </div>
                </div>
              </div>
              <SkyDeckCard deck={deck} revealed />
            </div>
            <div className="hint-app-card rounded-[24px] p-4">
              <SectionLabel>Reading</SectionLabel>
              <h2 className="mt-3 font-serif text-[34px] leading-none" style={{ color: GLASS.text }}>
                {deck.dailyCard.cardName}
              </h2>
              {getTarotCardImage(deck.dailyCard.cardId, "hint-card-2") ? (
                <div className="mt-5 w-[min(170px,46vw)] overflow-hidden rounded-[12px] border" style={{ borderColor: "color-mix(in srgb, var(--hint-gold, #dcc383) 36%, var(--hint-border))", boxShadow: "0 20px 56px color-mix(in srgb, var(--hint-plum, #271d38) 24%, transparent)" }}>
                  <SafeImage
                    src={getTarotCardImage(deck.dailyCard.cardId, "hint-card-2")}
                    alt={deck.dailyCard.cardName}
                    className="h-full w-full object-cover"
                    fallbackClassName="aspect-[46/71] rounded-[12px]"
                    fallbackLabel="Card loading"
                  />
                </div>
              ) : null}
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
              <Link href="/app/astrology" className="hint-soft-button hint-tap-sparkle mt-6 inline-flex h-11 items-center gap-2 rounded-full px-5 font-sans text-[13px] font-black">
                <Sparkles size={15} />
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

      {deck ? (
        <div className="mt-6">
          <EnergyTask deck={deck} />
        </div>
      ) : null}
    </AppScreen>
  );
}
