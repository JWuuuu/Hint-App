import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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

export function TarotChatRoom({ session, onSessionUpdate, onRedraw, onReset }: Props) {
  const { t } = useLanguage();
  const [redrawOpen, setRedrawOpen] = useState(false);
  const inputRef = useRef<FollowUpInputHandle | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [typed, setTyped] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const text = session.active.initialReading;
    setTyped("");
    setTypingDone(false);
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
