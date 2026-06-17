import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { Link } from "wouter";
import { useHoldFlow } from "./useHoldFlow";
import type { HoldStep } from "./useHoldFlow";
import { RoomSetup } from "./components/RoomSetup";
import { StepTerritories } from "./components/StepTerritories";
import { TarotRitual } from "./components/TarotRitual";
import { TarotChatRoom } from "./chat/components/TarotChatRoom";
import { TarotRitualChamber } from "../tarot/components/TarotRitualChamber";
import { IVORY, TEXT_HALO } from "./atmosphere";
import { useLanguage } from "../../lib/i18n";
import { trackEvent } from "../../lib/analytics";

/* ─── shared helpers ─────────────────────────────────────────── */

function useAutoAdvance(ms: number, onAdvance: () => void) {
  useEffect(() => {
    const t = setTimeout(onAdvance, ms);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function Breath({
  children,
  duration = 2,
  onClick,
  className = "",
}: {
  children?: React.ReactNode;
  duration?: number;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      {...fade}
      transition={{ duration, ease: "easeInOut" }}
      onClick={onClick}
      className={`absolute inset-0 flex items-center justify-center ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ─── step: acknowledgment ───────────────────────────────────── */

function StepAcknowledgment({
  territoryLabel,
  question,
  onDone,
}: {
  territoryLabel: string;
  question: string;
  onDone: () => void;
}) {
  const { t } = useLanguage();
  useAutoAdvance(3600, onDone);
  return (
    <Breath duration={2}>
      <div className="flex flex-col items-center gap-6 text-center px-10 select-none">
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 2, ease: "easeOut" }}
          className="font-serif text-[12px] uppercase tracking-[0.35em]"
          style={{ color: IVORY.mute }}
        >
          {t("tarot.ack")}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 2, ease: "easeOut" }}
          className="font-serif text-xl md:text-2xl font-light italic leading-relaxed max-w-md"
          style={{ color: IVORY.primary, textShadow: TEXT_HALO.strong }}
        >
          {question || territoryLabel}
        </motion.p>
      </div>
    </Breath>
  );
}

/* ─── step: error ────────────────────────────────────────────── */

function StepError({
  message,
  onReset,
}: {
  message: string | null;
  onReset: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Breath duration={2}>
      <div className="flex flex-col items-center gap-10 text-center px-10 max-w-xs">
        <p
          className="font-serif text-lg font-light"
          style={{ color: IVORY.strong, textShadow: TEXT_HALO.soft }}
        >
          {t("tarot.error.title")}
        </p>
        {message && (
          <p
            className="font-sans text-xs leading-relaxed"
            style={{ color: IVORY.mute }}
          >
            {message}
          </p>
        )}
        <button
          onClick={onReset}
          className="font-serif text-[12px] uppercase tracking-[0.35em] transition-opacity duration-700 py-2 hover:opacity-80"
          style={{ color: IVORY.mute }}
        >
          {t("tarot.error.retry")}
        </button>
      </div>
    </Breath>
  );
}

/* ─── orchestrator ───────────────────────────────────────────── */

export function HoldExperience() {
  const flow = useHoldFlow();
  const { t } = useLanguage();

  const stepKey = (s: HoldStep) => s;

  const renderStep = () => {
    const {
      step,
      territory,
      session,
      pendingReading,
      errorMessage,
      advance,
      reset,
      submitRoomIntake,
      startRoom,
      updateSession,
      redraw,
      roomSetup,
    } = flow;

    switch (step) {
      case "setup":
        return (
          <Breath key={stepKey("setup")} duration={1.2}>
            <RoomSetup initialSetup={roomSetup} onStart={startRoom} />
          </Breath>
        );
      case "ritual":
        return (
          <TarotRitualChamber
            key={stepKey("ritual")}
            setup={roomSetup}
            onComplete={() => advance("territories")}
          />
        );
      case "territories":
        return (
          <Breath key={stepKey("territories")} duration={2}>
            <StepTerritories roomSetup={roomSetup} onSubmit={submitRoomIntake} />
          </Breath>
        );
      case "acknowledgment":
        return (
          <StepAcknowledgment
            key={stepKey("acknowledgment")}
            territoryLabel={territory?.label ?? ""}
            question={session?.originalQuestion ?? flow.intake?.question ?? ""}
            onDone={() => advance("hold")}
          />
        );
      case "hold":
        return (
          <TarotRitual
            key={`${stepKey("hold")}-${session?.redrawCount ?? 0}`}
            reading={pendingReading}
            roomSetup={roomSetup}
            onComplete={() => {
              if (session) {
                trackEvent("reading_completed", {
                  readingId: session.active.readingId,
                  redrawCount: session.redrawCount,
                  spreadType: session.spreadType,
                  territory: session.territory,
                });
              }
              advance("chat");
            }}
          />
        );
      case "chat":
        return session ? (
          <TarotChatRoom
            key={stepKey("chat")}
            session={session}
            onSessionUpdate={updateSession}
            onRedraw={redraw}
            onReset={reset}
          />
        ) : null;
      case "error":
        return (
          <StepError
            key={stepKey("error")}
            message={errorMessage}
            onReset={reset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0">
      {/* Persistent home exit, only on the entry steps where it makes sense.
          Once the user is in a reading, the existing "End" affordance in the
          chat room handles the way out. */}
      {(flow.step === "setup" ||
        flow.step === "territories") && (
        <Link
          href="/app"
          aria-label={t("tarot.homeLink")}
          className="absolute left-5 top-5 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#8f8170]/35 bg-white/42 text-[#4a4450] shadow-[0_10px_24px_rgba(58,48,38,0.12)] transition duration-300 hover:border-[#c79d51]/55 hover:bg-white/62 hover:text-[#27232d] active:scale-95 select-none"
        >
          <Home size={17} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      )}

      {renderStep()}
    </div>
  );
}
