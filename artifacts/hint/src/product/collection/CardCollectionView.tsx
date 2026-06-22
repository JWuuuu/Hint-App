import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Lock, Sparkles } from "lucide-react";
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import {
  getOrCreateDailyReceipt,
  openDailyReceipt,
  type DailyReceipt,
} from "../../lib/dailyReceipts";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import { useCardCollection } from "../../shared/hooks/useCardCollection";
import { SafeImage } from "../../shared/ui/SafeImage";
import {
  getDailyCollectionReward,
  saveLocalCollectionUnlock,
} from "../../shared/tarot/cardCollection";
import { RareCardUnlock } from "./RareCardUnlock";

function formatDate(iso?: string) {
  if (!iso) return "Locked";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function CollectionCardTile({
  card,
  compact = false,
  rewardPending = false,
}: {
  card: { image: string | null; name: string; unlocked: boolean; rare: boolean };
  compact?: boolean;
  rewardPending?: boolean;
}) {
  const showArtwork = Boolean(card.image);

  return (
    <div
      className="hint-card-lift relative h-full w-full overflow-hidden rounded-[14px] border"
      style={{
        borderColor: card.unlocked
          ? "color-mix(in srgb, var(--hint-gold, #cba866) 36%, var(--hint-border))"
          : card.rare
            ? "color-mix(in srgb, var(--hint-gold, #cba866) 24%, var(--hint-border))"
            : GLASS.border,
        background: card.unlocked
          ? "color-mix(in srgb, var(--hint-surface-soft) 72%, transparent)"
          : "var(--hint-deck-card-bg)",
        boxShadow: card.unlocked || rewardPending
          ? "0 14px 34px rgba(75,52,92,0.14), inset 0 1px 0 rgba(255,255,255,0.14)"
          : "inset 0 0 28px color-mix(in srgb, var(--hint-gold, #cba866) 7%, transparent)",
      }}
    >
      {showArtwork ? (
        <SafeImage
          src={card.image}
          alt={card.name}
          loading={compact ? "lazy" : "eager"}
          className={[
            "h-full w-full object-cover transition duration-500",
            card.unlocked ? "opacity-100" : "scale-[1.04] opacity-[0.38] blur-[1.4px] saturate-[0.65]",
          ].join(" ")}
          fallbackClassName="h-full w-full rounded-[8px]"
          fallbackLabel="Card"
        />
      ) : (
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(circle at 50% 26%, color-mix(in srgb, var(--hint-gold, #cba866) 18%, transparent), transparent 34%), var(--hint-deck-card-bg)",
          }}
        />
      )}

      {!card.unlocked ? (
        <div
          className="absolute inset-0 grid place-items-center"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--hint-surface) 8%, transparent), color-mix(in srgb, var(--hint-deck-card-bg) 58%, transparent)), radial-gradient(circle at 50% 36%, color-mix(in srgb, var(--hint-gold, #cba866) 12%, transparent), transparent 58%)",
          }}
        >
          <span
            className="grid size-8 place-items-center rounded-full border backdrop-blur-md"
            style={{
              borderColor: card.rare ? "color-mix(in srgb, var(--hint-gold, #cba866) 46%, var(--hint-border))" : "var(--hint-border)",
              color: card.rare ? ACCENT.gold : GLASS.faint,
              background: "color-mix(in srgb, var(--hint-surface) 58%, transparent)",
              boxShadow: card.rare ? "0 0 24px color-mix(in srgb, var(--hint-gold, #cba866) 16%, transparent)" : "none",
            }}
          >
            <Lock size={compact ? 13 : 15} />
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function CardCollectionView() {
  const collection = useCardCollection();
  const [fallbackReward] = useState(() => getDailyCollectionReward());
  const [dailyReward, setDailyReward] = useState<DailyReceipt | null>(null);
  const rewardCardId = dailyReward?.assignedCardId ?? fallbackReward.cardId;
  const defaultRareCard = collection.cards.find((card) => card.cardId === rewardCardId)
    ?? collection.cards.find((card) => card.rare && !card.unlocked)
    ?? collection.cards.find((card) => card.rare)
    ?? collection.cards[0]!;
  const [selectedRareCardId, setSelectedRareCardId] = useState(defaultRareCard.cardId);
  const [rareCardClickKey, setRareCardClickKey] = useState(0);
  const selectedRareCard = collection.cards.find((card) => card.cardId === selectedRareCardId) ?? defaultRareCard;
  const progress = Math.round((collection.unlocked / collection.total) * 100);
  const rewardCard = collection.cards.find((card) => card.cardId === rewardCardId) ?? defaultRareCard;
  const rewardOpened = Boolean(dailyReward?.openedAt);

  useEffect(() => {
    let mounted = true;
    getOrCreateDailyReceipt("collection-rare-reward", {
      fallbackAssignedCardId: fallbackReward.cardId,
    }).then((receipt) => {
      if (!mounted) return;
      setDailyReward(receipt);
      if (receipt.assignedCardId) setSelectedRareCardId(receipt.assignedCardId);
      if (receipt.openedAt && receipt.assignedCardId) {
        saveLocalCollectionUnlock(receipt.assignedCardId, "reward");
      }
    });
    return () => {
      mounted = false;
    };
  }, [fallbackReward.cardId]);

  async function unlockRareCard(cardId: string) {
    if (!dailyReward || cardId !== rewardCardId) return;
    const openedReward = await openDailyReceipt("collection-rare-reward", {
      fallbackAssignedCardId: cardId,
    });
    setDailyReward(openedReward);
    saveLocalCollectionUnlock(cardId, "reward");
  }

  function selectRareCard(cardId: string) {
    setSelectedRareCardId(cardId);
    setRareCardClickKey((value) => value + 1);
  }

  return (
    <AppScreen>
      <header className="mb-7 flex flex-col gap-4">
        <div className="min-w-0">
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ACCENT.gold }}>
            Collection
          </p>
          <h1 className="mt-2 font-serif text-[30px] leading-none" style={{ color: GLASS.text }}>
            Your deck memory
          </h1>
          <p className="mt-3 max-w-xl font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
            Cards enter the collection when they appear in Daily or the Tarot Room. Tonight's rare reward is assigned once and stays open after you unlock it.
          </p>
        </div>
        <Link
          href="/app/tarot"
          className="hint-tap-sparkle inline-flex min-h-11 w-full items-center justify-center rounded-full border px-5 py-2.5 text-center font-sans text-[13px] font-black"
          style={{
            color: "var(--hint-text)",
            background: "color-mix(in srgb, var(--hint-surface-soft) 86%, transparent)",
            borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 34%, var(--hint-border))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px color-mix(in srgb, var(--hint-gold, #cba866) 10%, transparent)",
          }}
        >
          Draw in Tarot Room
        </Link>
      </header>

      <RareCardUnlock
        key={`${selectedRareCard.cardId}-${rareCardClickKey}`}
        card={selectedRareCardId === rewardCardId ? rewardCard : selectedRareCard}
        autoUnlockKey={rareCardClickKey}
        onUnlock={unlockRareCard}
        rewardOpened={selectedRareCardId === rewardCardId ? rewardOpened : selectedRareCard.unlocked}
        lockedMessage={
          selectedRareCardId === rewardCardId
            ? `Today's reward stays in your deck once opened. Next reset: ${formatDate(dailyReward?.expiresAt ?? fallbackReward.expiresAt)}.${dailyReward?.source === "local-fallback" ? " Backend lock is unavailable, so this is using local fallback state." : ""}`
            : "Unlocked cards can replay the moment. Locked rare cards wait for their own daily reward."
        }
      />

      <GlassPanel className="mb-7 mt-8 hint-shimmer-border">
        <div className="grid gap-5">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <SectionLabel>Progress</SectionLabel>
                <p className="mt-2 font-serif text-[42px] leading-none" style={{ color: GLASS.text }}>
                  {collection.unlocked}
                  <span className="text-[22px]" style={{ color: GLASS.faint }}> / {collection.total}</span>
                </p>
              </div>
              <span className="hint-status-pill rounded-full border px-3 py-1.5 font-sans text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: ACCENT.aqua }}>
                {collection.rareUnlocked} rare
              </span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--hint-border) 64%, transparent)" }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${ACCENT.gold}, var(--hint-rose, #cba6c4), ${ACCENT.aqua})` }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(collection.recent.length ? collection.recent : collection.cards.slice(0, 6)).map((card) => (
              <div key={card.cardId} className="relative aspect-[46/71]">
                <CollectionCardTile card={card} compact rewardPending={card.cardId === rewardCardId && !rewardOpened} />
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      <section className="mt-8">
        <SectionLabel>All cards</SectionLabel>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {collection.cards.map((card) => (
            <article key={card.cardId} className="min-w-0">
              <button
                type="button"
                disabled={!card.rare || (!card.unlocked && card.cardId !== rewardCardId)}
                onClick={() => selectRareCard(card.cardId)}
                className="hint-tap-sparkle block w-full rounded-[14px] text-left disabled:cursor-default disabled:opacity-70"
                aria-label={
                  card.rare
                    ? card.cardId === rewardCardId
                      ? `Open today's rare reward for ${card.name}`
                      : card.unlocked
                        ? `Replay rare unlock for ${card.name}`
                        : `${card.name} locked`
                    : card.name
                }
              >
                <div className="relative aspect-[46/71] transition-transform enabled:hover:-translate-y-0.5">
                <CollectionCardTile card={card} rewardPending={card.cardId === rewardCardId && !rewardOpened} />
                {card.rare && card.unlocked ? (
                  <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full" style={{ background: "var(--hint-special-action-bg)", color: "var(--hint-special-action-text)" }}>
                    <Sparkles size={12} />
                  </span>
                ) : null}
                {card.rare && !card.unlocked ? (
                  <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full border" style={{ borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 45%, var(--hint-border))", color: ACCENT.gold, background: "color-mix(in srgb, var(--hint-surface) 62%, transparent)" }}>
                    <Sparkles size={12} />
                  </span>
                ) : null}
                {card.cardId === rewardCardId && !rewardOpened ? (
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate rounded-full px-1.5 py-1 text-center font-sans text-[8px] font-black uppercase tracking-[0.08em]" style={{ background: "var(--hint-special-action-bg)", color: "var(--hint-special-action-text)" }}>
                    Today
                  </span>
                ) : null}
                </div>
              </button>
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
