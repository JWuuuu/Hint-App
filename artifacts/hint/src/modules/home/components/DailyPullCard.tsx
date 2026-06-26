import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import {
  useGetOrCreateDailyPull,
  useUpdateDailyPull,
} from "@workspace/api-client-react";
import { IVORY, GOLD, TEXT_HALO } from "../../hold/atmosphere";
import { CardSigil } from "../../hold/components/CardSigil";
import { FollowUpInput, type FollowUpInputHandle } from "../../hold/chat/components/FollowUpInput";
import { ChatMessage } from "../../hold/chat/components/ChatMessage";
import { useAskHintChat } from "../../ask/useAskHintChat";
import { getDefaultTarotCardBackForStyle, getTarotCardBackImage } from "../../tarot/logic/cardBacks";
import { getDailyPull, getDailyPullById } from "../data/dailyPulls";
import { CornerOrnaments, EtchedBorder, StarlitDivider } from "./CardChrome";
import { useLanguage } from "../../../lib/i18n";
import { getAnonId, getLocalDateString } from "../../../lib/identity";
import {
  getOrCreateDailyReceipt,
  openDailyReceipt,
  parseServerDailyKey,
  type DailyReceipt,
} from "../../../lib/dailyReceipts";
import { trackEvent } from "../../../lib/analytics";
import { saveLocalDailyReading } from "../../readings/localDailyReadings";

const SKY_DECK_CARD_BACK_IMAGE = getTarotCardBackImage(getDefaultTarotCardBackForStyle("nocturne"));

/**
 * Tonight's Pull — a single major arcana card sitting beside the Emotional
 * Weather card on wide screens, full-width below it on narrow. Tap to flip.
 * Deterministic by calendar date so it's the same card all day. Uses
 * CardSigil at a smaller scale so the home page stays in the same hand
 * as the Tarot Room.
 */
interface Props {
  /** Outer reveal delay (seconds), used to stage with sibling sections. */
  delay?: number;
  /** Incrementing key from a parent CTA that should reveal the card immediately. */
  autoRevealKey?: number;
}

export function DailyPullCard({ delay = 0, autoRevealKey = 0 }: Props = {}) {
  const { language, t } = useLanguage();
  const fallbackPull = useMemo(() => getDailyPull(new Date(), language), [language]);
  const [dailyReceipt, setDailyReceipt] = useState<DailyReceipt | null>(null);
  const pull = useMemo(
    () => dailyReceipt?.assignedCardId ? getDailyPullById(dailyReceipt.assignedCardId, language) : fallbackPull,
    [dailyReceipt?.assignedCardId, fallbackPull, language],
  );
  const [flipped, setFlipped] = useState(false);
  const [saved, setSaved] = useState(false);
  const drawMutation = useGetOrCreateDailyPull();
  const updateMutation = useUpdateDailyPull();
  const chat = useAskHintChat();
  const inputRef = useRef<FollowUpInputHandle | null>(null);
  const localDate = useMemo(() => getLocalDateString(), []);

  useEffect(() => {
    let mounted = true;
    getOrCreateDailyReceipt("daily-card", {
      fallbackAssignedCardId: fallbackPull.cardId,
    }).then((receipt) => {
      if (!mounted) return;
      setDailyReceipt(receipt);
      const opened = Boolean(receipt.openedAt);
      setFlipped(opened);
      setSaved(opened);
    });
    return () => {
      mounted = false;
    };
  }, [fallbackPull.cardId]);

  async function revealCard() {
    if (flipped) return;
    setFlipped(true);
    const openedReceipt = await openDailyReceipt("daily-card", {
      fallbackAssignedCardId: pull.cardId,
    });
    setDailyReceipt(openedReceipt);
    saveLocalDailyReading(
      pull,
      openedReceipt.dailyKey ? parseServerDailyKey(openedReceipt.dailyKey) : new Date(),
    );
    setSaved(true);
    trackEvent("daily_card_pulled", {
      cardId: pull.cardId,
      cardName: pull.cardName,
      date: localDate,
      source: "home",
    });
    trackEvent("reading_saved", {
      readingId: `daily-${localDate}`,
      spreadType: "daily-pull",
      source: "daily-pull",
    });

    drawMutation.mutate(
      { data: { anonId: getAnonId(), date: localDate } },
      {
        onSuccess: () => {
          updateMutation.mutate({
            data: { anonId: getAnonId(), date: localDate, isFlipped: true },
          });
        },
      },
    );
  }

  useEffect(() => {
    if (autoRevealKey > 0) {
      revealCard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRevealKey]);

  function askAboutCard(text: string) {
    const prompt = `${pull.cardName}: ${pull.whisper}\n\n${text}`;
    trackEvent("follow_up_sent", {
      source: "daily-pull",
      textLength: text.length,
    });
    void chat.sendMessage(prompt);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.4, ease: "easeOut", delay }}
      className="relative h-full rounded-[10px] overflow-hidden flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, rgba(22,19,17,0.72) 0%, rgba(10,8,8,0.72) 100%)",
        border: `0.5px solid ${GOLD.edge}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.55), inset 0 0 36px ${GOLD.bloom}`,
      }}
    >
      <EtchedBorder radius={10} />
      <CornerOrnaments />

      {/* Soft bloom from the top */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% -10%, rgba(255,235,200,0.07), transparent 60%)",
        }}
      />

      {/* Header row — mirrors the Weather card so the two read as a pair */}
      <header className="relative flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: GOLD.stroke,
              boxShadow: `0 0 8px ${GOLD.bloom}`,
            }}
          />
          <p
            className="font-serif text-[10px] uppercase tracking-[0.4em]"
            style={{ color: IVORY.mute }}
          >
            {t("feed.tonightPull")}
          </p>
        </div>
        <span
          className="font-serif italic text-[11px] tracking-wide opacity-80"
          style={{ color: IVORY.dim }}
        >
          {t("dailyPull.tapToTurn")}
        </span>
      </header>

      <StarlitDivider className="mx-6" />

      {/* Body — card on the left, name + whisper on the right */}
      <div className="relative flex-1 flex items-center gap-5 px-6 pt-5 pb-6">
        {/* Card */}
        <button
          type="button"
          onClick={revealCard}
          className="relative w-[88px] h-[138px] shrink-0 [perspective:1200px] cursor-pointer"
          style={{ filter: `drop-shadow(0 0 18px ${GOLD.bloom})` }}
          aria-label={
            flipped
              ? `${t("dailyPull.revealedAriaPrefix")} ${pull.cardName}`
              : t("dailyPull.revealAria")
          }
        >
          <motion.div
            className="w-full h-full [transform-style:preserve-3d]"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 1.2, ease: [0.6, 0.05, 0.2, 1] }}
          >
            {/* Back */}
            <div className="absolute inset-0 [backface-visibility:hidden] rounded-[6px] overflow-hidden">
              <img
                src={SKY_DECK_CARD_BACK_IMAGE}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              <div
                className="absolute inset-0"
                style={{
                  boxShadow: `inset 0 0 0 1px ${GOLD.edge}`,
                }}
              />
            </div>

            {/* Front */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[6px] overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(160deg, #161310 0%, #0b0908 55%, #100c0a 100%)",
                }}
              />
              <div className="absolute inset-0 rounded-[6px] border border-white/15" />
              <CardSigil cardId={pull.cardId} />
            </div>
          </motion.div>
        </button>

        {/* Card name + whisper */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {!flipped ? (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4 }}
              className="flex flex-col gap-2"
            >
              <p
                className="font-serif text-[10px] uppercase tracking-[0.32em]"
                style={{ color: IVORY.mute }}
              >
                {t("dailyPull.alreadyDrawn")}
              </p>
              <div
                aria-hidden
                className="h-px w-10 opacity-70"
                style={{
                  background: `linear-gradient(to right, ${GOLD.edge}, transparent)`,
                }}
              />
              <p
                className="font-serif italic text-[13.5px] leading-[1.55] mt-1"
                style={{ color: IVORY.body, textShadow: TEXT_HALO.soft }}
              >
                {t("dailyPull.alreadyDrawnBody")}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
              className="flex flex-col gap-2"
            >
              <p
                className="font-serif text-[10px] uppercase tracking-[0.32em]"
                style={{ color: IVORY.mute }}
              >
                {t("daily.card")}
              </p>
              <p
                className="font-serif text-[17px] leading-tight"
                style={{ color: IVORY.primary, textShadow: TEXT_HALO.strong }}
              >
                {pull.cardName}
              </p>
              <div
                aria-hidden
                className="h-px w-10 opacity-70"
                style={{
                  background: `linear-gradient(to right, ${GOLD.edge}, transparent)`,
                }}
              />
              <p
                className="font-serif italic text-[13px] leading-[1.55] mt-1"
                style={{ color: IVORY.strong, textShadow: TEXT_HALO.soft }}
              >
                {pull.whisper}
              </p>
              {saved && (
                <p className="font-sans text-[11px]" style={{ color: IVORY.dim }}>
                  Saved to Readings
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="relative border-t px-1 pb-3"
          style={{ borderColor: GOLD.edge }}
        >
          <div className="px-5 pt-4">
            <div className="mb-2 flex items-center gap-2">
              <MessageCircle size={14} style={{ color: GOLD.stroke }} />
              <p
                className="font-sans text-[11px] font-medium uppercase tracking-[0.14em]"
                style={{ color: IVORY.mute }}
              >
                Ask Hint
              </p>
            </div>
            {chat.messages.length > 0 && (
              <div className="mb-3 max-h-60 space-y-4 overflow-y-auto pr-1">
                {chat.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </div>
            )}
            {chat.error && (
              <p className="mb-2 font-sans text-[12px]" style={{ color: IVORY.mute }}>
                {chat.error}
              </p>
            )}
          </div>
          <FollowUpInput
            ref={inputRef}
            onSend={askAboutCard}
            isThinking={chat.isThinking}
          />
        </motion.div>
      )}
    </motion.section>
  );
}
