import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Lock, Sparkles } from "lucide-react";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import type { CollectionCard } from "../../shared/tarot/cardCollection";
import { SafeImage } from "../../shared/ui/SafeImage";
import "./rare-card-unlock.css";

const FALLBACK_IMAGE = "/brand/tarot/cards/19-TheSun.jpg";
const ANIMATION_DURATION_MS = 4300;

function RareCardBack({ large = false }: { large?: boolean }) {
  return (
    <div className={large ? "rare-card-back rare-card-back-large" : "rare-card-back"}>
      <div className="rare-card-back-pattern" aria-hidden="true" />
      <Lock size={large ? 28 : 22} />
    </div>
  );
}

function RareCardFront({
  card,
  image,
  large = false,
}: {
  card: CollectionCard;
  image: string;
  large?: boolean;
}) {
  return (
    <div className={large ? "rare-card-front rare-card-front-large" : "rare-card-front"}>
      <SafeImage
        src={image}
        alt={card.name}
        loading="eager"
        className="h-full w-full object-cover"
        fallbackClassName="h-full w-full rounded-[14px]"
        fallbackLabel="Card"
      />
      <span className="rare-badge">
        <Sparkles size={large ? 14 : 11} />
        Rare
      </span>
    </div>
  );
}

function PopoutAnimation({
  card,
  image,
  animationKey,
}: {
  card: CollectionCard;
  image: string;
  animationKey: number;
}) {
  return (
    <div
      key={animationKey}
      className="rare-popout-layer"
      role="status"
      aria-live="polite"
      aria-label={`${card.name} rare card unlocked`}
      data-testid="rare-card-popout"
    >
      <div className="rare-popout-stage" aria-hidden="true">
        <div className="rare-popout-orb" />
        <div className="rare-popout-ring rare-popout-ring-gold" />
        <div className="rare-popout-ring rare-popout-ring-aqua" />
        <div className="rare-popout-ring rare-popout-ring-thin" />
        <div className="rare-popout-rays" />
        <div className="rare-popout-shards">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="rare-popout-card-shell">
          <RareCardBack large />
          <RareCardFront card={card} image={image} large />
        </div>
      </div>
    </div>
  );
}

export function RareCardUnlock({
  card,
  autoUnlockKey = 0,
  onUnlock,
  rewardOpened = card.unlocked,
  lockedMessage,
}: {
  card: CollectionCard;
  autoUnlockKey?: number;
  onUnlock: (cardId: string) => void;
  rewardOpened?: boolean;
  lockedMessage?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [savedUnlocked, setSavedUnlocked] = useState(card.unlocked || rewardOpened);
  const timerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastAutoUnlockKeyRef = useRef(0);

  const cardImage = card.image ?? FALLBACK_IMAGE;
  const frontVisible = isAnimating || savedUnlocked;
  const unlockStateClass = isAnimating ? "is-unlocking" : savedUnlocked ? "is-saved" : "";

  useEffect(() => {
    setSavedUnlocked(card.unlocked || rewardOpened);
  }, [card.cardId, card.unlocked, rewardOpened]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    if (autoUnlockKey > 0 && autoUnlockKey !== lastAutoUnlockKeyRef.current) {
      lastAutoUnlockKeyRef.current = autoUnlockKey;
      playRareMoment();
    }
    // playRareMoment intentionally reads current card/reward state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoUnlockKey]);

  function playRareMoment() {
    const shouldPersistUnlock = !rewardOpened;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);

    setIsAnimating(false);
    setSavedUnlocked(true);

    frameRef.current = window.requestAnimationFrame(() => {
      setAnimationKey((value) => value + 1);
      setIsAnimating(true);

      if (shouldPersistUnlock) {
        onUnlock(card.cardId);
      }

      timerRef.current = window.setTimeout(() => {
        setIsAnimating(false);
      }, ANIMATION_DURATION_MS);
    });
  }

  return (
    <section className="rare-unlock-panel">
      <div className="rare-unlock-copy">
        <p className="font-sans text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT.gold }}>
          Rare card unlock
        </p>
        <h3 className="mt-4 font-serif text-[30px] font-light leading-tight sm:text-[40px]" style={{ color: GLASS.text }}>
          Some nights, the deck gives back.
        </h3>
        <p className="mt-4 max-w-md font-sans text-[15px] leading-relaxed" style={{ color: GLASS.muted }}>
          {lockedMessage ?? "Keep a streak and rarer arcana surface. Turn tonight's reward and see what came up for you."}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={playRareMoment}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 font-sans text-[13px] font-black"
            style={{ color: "#231d2a", background: "linear-gradient(135deg, #f6df9f, #cba866)", boxShadow: "0 16px 30px rgba(219,142,85,0.22)" }}
          >
            <Sparkles size={15} />
            {isAnimating ? `${card.name} is opening` : savedUnlocked ? "Replay rare unlock" : "Open tonight's reward"}
          </button>
        </div>
      </div>

      <div className={`rare-unlock-stage ${unlockStateClass}`}>
        <div className={frontVisible ? "rare-aura is-visible" : "rare-aura"} />
        <div className={`rare-stage-ring rare-stage-ring-gold ${isAnimating ? "is-unlocking" : ""}`} aria-hidden="true" />
        <div className={`rare-stage-ring rare-stage-ring-aqua ${isAnimating ? "is-unlocking" : ""}`} aria-hidden="true" />
        <div className={`rare-card-wrap ${unlockStateClass}`}>
          <RareCardBack />
          <RareCardFront card={card} image={cardImage} />
        </div>
      </div>

      {isAnimating && typeof document !== "undefined"
        ? createPortal(
            <PopoutAnimation card={card} image={cardImage} animationKey={animationKey} />,
            document.body,
          )
        : null}
    </section>
  );
}
