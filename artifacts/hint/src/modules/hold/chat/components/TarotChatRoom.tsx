import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LockKeyhole, Sparkles } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { FollowUpInput, type FollowUpInputHandle } from "./FollowUpInput";
import { ReadingActions, type ReadingAction } from "./ReadingActions";
import { RedrawPrompt } from "./RedrawPrompt";
import { SpeechButton } from "./SpeechButton";
import { useTarotChat } from "../useTarotChat";
import type { ReadingSession, ChatMessage as ChatMessageType } from "../types";
import { IVORY, TEXT_HALO } from "../../atmosphere";
import { useLanguage } from "../../../../lib/i18n";

interface Props {
  session: ReadingSession;
  onSessionUpdate: (next: ReadingSession) => void;
  onRedraw: () => void;
  onReset: () => void;
}

const TYPE_SPEED = 22;
const CONVERSION_PROMPTS = [
  "What should I do next?",
  "What is the first small action?",
  "What is the hidden block?",
  "What resource am I not using yet?",
  "What should I stop worrying about?",
  "What boundary do I need?",
  "What am I repeating?",
  "What should I let go?",
  "What is the timing?",
  "Where is the opening?",
  "What should I say to them?",
  "What are they not showing?",
  "What would reopening require?",
  "What happens if I choose path A?",
  "What happens if I wait?",
  "What should I change at work?",
  "What money lesson is here?",
];

function ReadingUnlockPanel({
  onDismiss,
  onPrompt,
}: {
  onDismiss: () => void;
  onPrompt: (prompt: string) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="rounded-[22px] border p-4"
      style={{
        borderColor: "color-mix(in srgb, var(--hint-gold, #cba866) 34%, var(--hint-chat-input-border))",
        background:
          "linear-gradient(145deg, color-mix(in srgb, var(--hint-card-inner) 78%, transparent), color-mix(in srgb, var(--hint-rose, #f0b6cf) 10%, transparent))",
        boxShadow: "0 18px 42px rgba(0,0,0,0.18)",
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
          style={{
            color: "var(--hint-gold-bright, #f2d48d)",
            borderColor: "rgba(228,198,138,0.28)",
            background: "rgba(228,198,138,0.10)",
          }}
        >
          <LockKeyhole size={15} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: IVORY.mute }}>
            Deeper thread ready
          </p>
          <h2 className="mt-1 font-serif text-[22px] leading-tight" style={{ color: IVORY.primary, textShadow: TEXT_HALO.soft }}>
            Keep this reading open.
          </h2>
          <p className="mt-2 font-sans text-[12px] leading-relaxed" style={{ color: IVORY.mute }}>
            Ask for card-by-card detail, action steps, timing, or what to watch next. The best follow-up is usually already hiding inside the first spread.
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["5 follow-ups", "$2"],
          ["Monthly pass", "$8"],
          ["Year pass", "$29"],
        ].map(([label, price]) => (
          <button
            key={label}
            type="button"
            onClick={onDismiss}
            className="min-h-[62px] rounded-[16px] border px-2 py-2 text-left transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              color: IVORY.body,
              borderColor: "rgba(228,198,138,0.22)",
              background: "color-mix(in srgb, var(--hint-chat-input-bg) 82%, transparent)",
            }}
          >
            <span className="block font-sans text-[10px] font-semibold leading-tight">{label}</span>
            <span className="mt-1 block font-serif text-[18px] leading-none" style={{ color: IVORY.primary }}>
              {price}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {CONVERSION_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPrompt(prompt)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 font-sans text-[12px] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              color: IVORY.body,
              borderColor: "rgba(228,198,138,0.20)",
              background: "rgba(255,255,255,0.045)",
            }}
          >
            <Sparkles size={12} strokeWidth={1.8} />
            {prompt}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="mt-3 w-full rounded-[16px] px-4 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        style={{
          color: "var(--hint-special-action-text)",
          background: "var(--hint-special-action-bg)",
          boxShadow: "0 16px 34px rgba(0,0,0,0.18)",
        }}
      >
        Continue in this reading
      </button>
    </motion.section>
  );
}

export function TarotChatRoom({ session, onSessionUpdate, onRedraw, onReset }: Props) {
  const { t } = useLanguage();
  const [redrawOpen, setRedrawOpen] = useState(false);
  const [unlockDismissed, setUnlockDismissed] = useState(false);
  const inputRef = useRef<FollowUpInputHandle | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [typed, setTyped] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const text = session.active.initialReading;
    setTyped("");
    setTypingDone(false);
    setUnlockDismissed(false);
    const id = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setTypingDone(true);
      }
    }, TYPE_SPEED);
    return () => clearInterval(id);
  }, [session.active.readingId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [typed, session.messages.length]);

  const chat = useTarotChat(session, (next: ChatMessageType[]) => {
    onSessionUpdate({ ...session, messages: next });
  });

  const handleAction = (action: ReadingAction) => {
    if (action.kind === "redraw") {
      setRedrawOpen(true);
      return;
    }
    if (action.kind === "follow-up") {
      inputRef.current?.focus();
      return;
    }
    if (action.prefill) {
      void chat.sendMessage(action.prefill);
    }
  };

  const confirmRedraw = () => {
    setRedrawOpen(false);
    onRedraw();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6, ease: "easeInOut" }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <span
          className="font-serif text-[12px] uppercase tracking-[0.4em]"
          style={{ color: IVORY.mute }}
        >
          Hint
        </span>
        <button
          onClick={onReset}
          className="font-serif text-[11px] uppercase tracking-[0.32em] transition-colors duration-700 py-1 hover:!text-[rgba(255,245,225,0.85)]"
          style={{ color: IVORY.mute }}
        >
          {t("reading.end")}
        </button>
      </header>

      {/* Scrollable thread */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-6 space-y-8 scroll-smooth"
      >
        {/* Cards on the table */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-3 border-b border-white/8">
          {session.active.cards.map((c, i) => (
            <span
              key={i}
              className="font-serif italic text-[12px]"
              style={{ color: IVORY.body }}
            >
              {c.card.name}
              {c.isReversed ? ` (${t("tarot.ritual.reversed")})` : ""}
              {i < session.active.cards.length - 1 ? " ·" : ""}
            </span>
          ))}
        </div>

        {/* The initial reading */}
        <div>
          {typingDone && (
            <div className="mb-3">
              <SpeechButton text={session.active.initialReading} />
            </div>
          )}
          <div
            className="font-serif text-[15.5px] leading-[1.95] whitespace-pre-wrap"
            style={{ color: IVORY.strong, textShadow: TEXT_HALO.soft }}
          >
            {typed}
            {!typingDone && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.7, repeat: Infinity }}
                className="inline-block ml-px"
                style={{ color: IVORY.primary }}
              >
                |
              </motion.span>
            )}
          </div>
        </div>

        {/* Emotional quote — pull-quote with halo */}
        {typingDone && session.active.emotionalQuote && (
          <motion.blockquote
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="font-serif italic text-[17px] leading-loose border-l pl-5 relative"
            style={{
              color: IVORY.primary,
              textShadow: TEXT_HALO.strong,
              borderColor: "rgba(255, 240, 210, 0.22)",
            }}
          >
            {/* local halo behind the quote */}
            <div
              aria-hidden
              className="absolute -inset-y-4 -inset-x-4 pointer-events-none rounded-2xl"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(255,240,210,0.06) 0%, transparent 65%)",
              }}
            />
            <span className="relative">"{session.active.emotionalQuote}"</span>
          </motion.blockquote>
        )}

        {typingDone && !unlockDismissed && (
          <ReadingUnlockPanel
            onDismiss={() => setUnlockDismissed(true)}
            onPrompt={(prompt) => {
              setUnlockDismissed(true);
              void chat.sendMessage(prompt);
            }}
          />
        )}

        {/* Chat thread */}
        {chat.messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}

        {chat.isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 py-1"
          >
            <motion.span
              animate={{ opacity: [0.3, 0.85, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: IVORY.primary,
                boxShadow: "0 0 10px rgba(255,240,210,0.5)",
              }}
            />
            <span
              className="font-serif italic text-[13px]"
              style={{ color: IVORY.body }}
            >
              {t("chat.thinking")}
            </span>
          </motion.div>
        )}

        {chat.error && (
          <p className="font-sans text-xs" style={{ color: IVORY.mute }}>
            {chat.error}
          </p>
        )}
      </div>

      {/* Soft action chips + input */}
      {typingDone && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <ReadingActions onAction={handleAction} disabled={chat.isThinking} />
          <FollowUpInput
            ref={inputRef}
            onSend={(t) => void chat.sendMessage(t)}
            isThinking={chat.isThinking}
          />
        </motion.div>
      )}

      <RedrawPrompt
        open={redrawOpen}
        priorRedraws={session.redrawCount}
        onConfirm={confirmRedraw}
        onCancel={() => setRedrawOpen(false)}
      />
    </motion.div>
  );
}
