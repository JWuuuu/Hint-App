import { useEffect, useRef, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import type { CollectionCard } from "../../shared/tarot/cardCollection";

const SUN_IMAGE = "/brand/tarot/cards/19-TheSun.jpg";

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
  const [rareUnlocked, setRareUnlocked] = useState(false);
  const [savedUnlocked, setSavedUnlocked] = useState(card.unlocked || rewardOpened);
  const timerRef = useRef<number | null>(null);
  const lastAutoUnlockKeyRef = useRef(0);

  useEffect(() => {
    setSavedUnlocked(card.unlocked || rewardOpened);
  }, [card.cardId, card.unlocked, rewardOpened]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoUnlockKey > 0 && autoUnlockKey !== lastAutoUnlockKeyRef.current) {
      lastAutoUnlockKeyRef.current = autoUnlockKey;
      unlockRare();
    }
  }, [autoUnlockKey]);

  const rareBackO = rareUnlocked || savedUnlocked ? 0 : 1;
  const rareFrontO = rareUnlocked || savedUnlocked ? 1 : 0;
  const rareFrontT = rareUnlocked ? "scale(1) rotate(0deg)" : savedUnlocked ? "scale(1) rotate(0deg)" : "scale(0.9) rotate(-4deg)";
  const cardImage = card.image ?? SUN_IMAGE;
  const unlockStateClass = rareUnlocked ? "is-unlocking" : savedUnlocked ? "is-saved" : "";

  function unlockRare() {
    setRareUnlocked(true);
    setSavedUnlocked(true);
    onUnlock(card.cardId);

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setRareUnlocked(false);
    }, 4200);
  }

  return (
    <section className="rare-unlock-panel">
      <style>{`
        @keyframes hintBurst {
          0% { transform: scale(0.4); opacity: 0; }
          35% { opacity: 1; }
          100% { transform: scale(2.6); opacity: 0; }
        }

        @keyframes rarePortalOpen {
          0% { transform: scale(0.35) rotate(-18deg); opacity: 0; filter: blur(8px); }
          24% { opacity: 1; filter: blur(0); }
          72% { transform: scale(1.24) rotate(11deg); opacity: 0.9; }
          100% { transform: scale(1.46) rotate(22deg); opacity: 0; filter: blur(10px); }
        }

        @keyframes rareCorePulse {
          0% { transform: scale(0.2); opacity: 0; }
          28% { transform: scale(1); opacity: 0.95; }
          62% { transform: scale(1.16); opacity: 0.52; }
          100% { transform: scale(1.48); opacity: 0; }
        }

        @keyframes rareCardPop {
          0% { transform: translateY(34px) scale(0.58) rotate(-14deg); opacity: 0; filter: brightness(1.8) blur(2px); }
          38% { transform: translateY(-22px) scale(1.16) rotate(5deg); opacity: 1; filter: brightness(1.35) blur(0); }
          62% { transform: translateY(6px) scale(0.96) rotate(-2deg); opacity: 1; }
          82% { transform: translateY(-4px) scale(1.03) rotate(1deg); opacity: 1; }
          100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; filter: brightness(1); }
        }

        @keyframes rareCardBackDrop {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          35% { transform: scale(1.1) rotate(8deg); opacity: 0.72; }
          100% { transform: scale(0.76) rotate(18deg); opacity: 0; }
        }

        @keyframes rareStageKick {
          0%, 100% { transform: translateY(0) scale(1); }
          24% { transform: translateY(-8px) scale(1.02); }
          52% { transform: translateY(4px) scale(0.992); }
        }

        @keyframes rareHaloSpin {
          0% { transform: rotate(0deg) scale(0.72); opacity: 0; }
          24% { opacity: 0.88; }
          100% { transform: rotate(220deg) scale(1.18); opacity: 0; }
        }

        @keyframes rareShardFly {
          0% { transform: translate(0, 0) scale(0.2) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(var(--x), var(--y)) scale(1) rotate(var(--r)); opacity: 0; }
        }

        @keyframes rareShimmer {
          0% { transform: translateX(-160%) rotate(18deg); opacity: 0; }
          20% { opacity: 0.72; }
          100% { transform: translateX(170%) rotate(18deg); opacity: 0; }
        }

        @keyframes rareFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(0.6deg); }
        }

        .rare-unlock-panel {
          position: relative;
          overflow: hidden;
          margin-top: 18px;
          border-radius: 28px;
          border: 1px solid rgba(230, 203, 142, 0.45);
          background: rgba(18, 18, 28, 0.78);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: clamp(28px, 4vw, 48px);
          align-items: center;
          padding: clamp(30px, 4vw, 52px);
        }

        .rare-unlock-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(440px 320px at 82% 18%, rgba(230, 203, 142, 0.14), transparent 64%);
        }

        .rare-unlock-copy,
        .rare-unlock-stage {
          position: relative;
          z-index: 1;
        }

        .rare-unlock-stage {
          display: grid;
          place-items: center;
          min-height: 340px;
        }

        .rare-unlock-stage.is-unlocking {
          animation: rareStageKick 900ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .rare-aura {
          position: absolute;
          width: 230px;
          height: 230px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(230, 203, 142, 0.26), transparent 62%);
          filter: blur(14px);
          opacity: 0;
          transition: opacity 0.6s ease;
        }

        .rare-aura.is-visible {
          opacity: 1;
        }

        .rare-portal {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 999px;
          pointer-events: none;
          opacity: 0;
        }

        .rare-portal::before,
        .rare-portal::after {
          content: "";
          position: absolute;
          inset: 34px;
          border-radius: inherit;
          border: 1px solid rgba(230, 203, 142, 0.44);
          background:
            conic-gradient(from 10deg, transparent 0 12%, rgba(230, 203, 142, 0.72) 14%, transparent 18% 34%, rgba(134, 214, 199, 0.58) 38%, transparent 42% 68%, rgba(246, 223, 159, 0.68) 72%, transparent 78% 100%);
          -webkit-mask: radial-gradient(circle, transparent 0 57%, #000 58% 66%, transparent 67%);
          mask: radial-gradient(circle, transparent 0 57%, #000 58% 66%, transparent 67%);
        }

        .rare-portal::after {
          inset: 64px;
          transform: rotate(38deg);
          opacity: 0.72;
        }

        .rare-portal-core {
          position: absolute;
          inset: 82px;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(255, 249, 222, 0.94), rgba(230, 203, 142, 0.38) 34%, rgba(134, 214, 199, 0.2) 52%, transparent 72%);
          box-shadow: 0 0 50px rgba(230, 203, 142, 0.34), 0 0 90px rgba(134, 214, 199, 0.16);
        }

        .rare-portal.is-unlocking {
          opacity: 1;
          animation: rarePortalOpen 1.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .rare-portal.is-unlocking .rare-portal-core {
          animation: rareCorePulse 1.05s ease-out forwards;
        }

        .rare-halo {
          position: absolute;
          width: 282px;
          height: 282px;
          border-radius: 999px;
          pointer-events: none;
          opacity: 0;
          background:
            repeating-conic-gradient(from 0deg, rgba(230, 203, 142, 0) 0 10deg, rgba(230, 203, 142, 0.62) 11deg 13deg, rgba(230, 203, 142, 0) 14deg 27deg);
          -webkit-mask: radial-gradient(circle, transparent 0 61%, #000 62% 64%, transparent 65%);
          mask: radial-gradient(circle, transparent 0 61%, #000 62% 64%, transparent 65%);
          filter: drop-shadow(0 0 12px rgba(230, 203, 142, 0.44));
        }

        .rare-halo.is-unlocking {
          animation: rareHaloSpin 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .rare-burst {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
        }

        .rare-burst-gold {
          width: 260px;
          height: 260px;
          border: 2px solid rgba(230, 203, 142, 0.9);
          animation: hintBurst 1.1s ease-out forwards;
        }

        .rare-burst-aqua {
          width: 200px;
          height: 200px;
          border: 1px solid rgba(134, 214, 199, 0.9);
          animation: hintBurst 1.3s ease-out 0.12s forwards;
        }

        .rare-card-wrap {
          position: relative;
          width: min(200px, 62vw);
          aspect-ratio: 46 / 71;
        }

        .rare-card-wrap.is-saved:not(.is-unlocking) {
          animation: rareFloat 4s ease-in-out infinite;
        }

        .rare-card-wrap.is-unlocking {
          z-index: 3;
        }

        .rare-card-back,
        .rare-card-front {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          overflow: hidden;
        }

        .rare-card-back {
          border: 1px solid rgba(230, 203, 142, 0.45);
          background: linear-gradient(145deg, #17111f, #2a1e33, #0b0d16);
          display: grid;
          place-items: center;
          color: rgba(230, 203, 142, 0.85);
          opacity: 1;
          transition: opacity 0.5s ease;
        }

        .rare-card-wrap.is-unlocking .rare-card-back {
          animation: rareCardBackDrop 660ms ease-out forwards;
        }

        .rare-card-front {
          border: 2px solid rgba(230, 203, 142, 1);
          box-shadow: 0 0 28px rgba(230, 203, 142, 0.4), 0 30px 70px rgba(0,0,0,0.34);
          opacity: 0;
          transform: scale(0.9) rotate(-4deg);
          transition: opacity 0.6s ease-out, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .rare-card-wrap.is-unlocking .rare-card-front {
          animation: rareCardPop 980ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .rare-card-front::after {
          content: "";
          position: absolute;
          top: -28%;
          bottom: -28%;
          width: 42%;
          left: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
          transform: translateX(-160%) rotate(18deg);
          opacity: 0;
          pointer-events: none;
        }

        .rare-card-wrap.is-unlocking .rare-card-front::after {
          animation: rareShimmer 1.05s ease-out 0.16s forwards;
        }

        .rare-card-front img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rare-card-front span {
          position: absolute;
          top: 10px;
          left: 10px;
          height: 22px;
          padding: 0 9px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #231d2a;
          background: linear-gradient(135deg, #f6df9f, #cba866);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .rare-shards {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
          z-index: 2;
        }

        .rare-shards span {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          background: linear-gradient(135deg, #fff6c8, #d8ad55);
          box-shadow: 0 0 18px rgba(230, 203, 142, 0.54);
          opacity: 0;
          animation: rareShardFly 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .rare-shards span:nth-child(1) { --x: -124px; --y: -98px; --r: -120deg; animation-delay: 0.08s; }
        .rare-shards span:nth-child(2) { --x: 112px; --y: -116px; --r: 110deg; animation-delay: 0.12s; background: linear-gradient(135deg, #d2fff7, #86d6c7); }
        .rare-shards span:nth-child(3) { --x: 142px; --y: 34px; --r: 180deg; animation-delay: 0.18s; }
        .rare-shards span:nth-child(4) { --x: -134px; --y: 56px; --r: -170deg; animation-delay: 0.22s; background: linear-gradient(135deg, #d2fff7, #86d6c7); }
        .rare-shards span:nth-child(5) { --x: -64px; --y: 124px; --r: 94deg; animation-delay: 0.28s; }
        .rare-shards span:nth-child(6) { --x: 74px; --y: 116px; --r: -84deg; animation-delay: 0.32s; }

        @media (prefers-reduced-motion: reduce) {
          .rare-burst-gold,
          .rare-burst-aqua,
          .rare-portal.is-unlocking,
          .rare-portal.is-unlocking .rare-portal-core,
          .rare-halo.is-unlocking,
          .rare-card-wrap.is-unlocking,
          .rare-card-wrap.is-saved:not(.is-unlocking),
          .rare-card-wrap.is-unlocking .rare-card-back,
          .rare-card-wrap.is-unlocking .rare-card-front,
          .rare-card-wrap.is-unlocking .rare-card-front::after,
          .rare-shards span {
            animation: none;
          }

          .rare-card-back,
          .rare-card-front,
          .rare-aura {
            transition: none;
          }
        }
      `}</style>
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
            onClick={unlockRare}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 font-sans text-[13px] font-black"
            style={{ color: "#231d2a", background: "linear-gradient(135deg, #f6df9f, #cba866)", boxShadow: "0 16px 30px rgba(219,142,85,0.22)" }}
          >
            <Sparkles size={15} />
            {rareUnlocked ? `${card.name} · added to your deck` : savedUnlocked ? "Replay rare unlock" : "Open tonight's reward"}
          </button>
        </div>
      </div>

      <div className={`rare-unlock-stage ${unlockStateClass}`}>
        <div className={rareUnlocked || savedUnlocked ? "rare-aura is-visible" : "rare-aura"} />
        <div className={`rare-portal ${rareUnlocked ? "is-unlocking" : ""}`} aria-hidden="true">
          <div className="rare-portal-core" />
        </div>
        <div className={`rare-halo ${rareUnlocked ? "is-unlocking" : ""}`} aria-hidden="true" />

        {rareUnlocked ? (
          <>
            <div className="rare-burst rare-burst-gold" />
            <div className="rare-burst rare-burst-aqua" />
            <div className="rare-shards" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </>
        ) : null}

        <div className={`rare-card-wrap ${unlockStateClass}`}>
          <div className="rare-card-back" style={{ opacity: rareBackO }}>
            <Lock size={22} />
          </div>
          <div className="rare-card-front" style={{ opacity: rareFrontO, transform: rareFrontT }}>
            <img src={cardImage} alt={card.name} draggable={false} />
            <span>Rare</span>
          </div>
        </div>
      </div>
    </section>
  );
}
