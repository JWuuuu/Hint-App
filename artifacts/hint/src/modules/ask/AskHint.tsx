import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { IVORY, GOLD, TEXT_HALO } from "../hold/atmosphere";
import { ChatMessage } from "../hold/chat/components/ChatMessage";
import { FollowUpInput, type FollowUpInputHandle } from "../hold/chat/components/FollowUpInput";
import { useAskHintChat } from "./useAskHintChat";
import { useLanguage } from "../../lib/i18n";

/**
 * Ask Hint — a standalone ambient chat. No cards on the table, no
 * reading scaffolding. Opens with a quiet invitation and lets the person
 * say whatever they came to say.
 */
export function AskHint() {
  const chat = useAskHintChat();
  const { t } = useLanguage();
  const inputRef = useRef<FollowUpInputHandle | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat.messages.length, chat.isThinking]);

  const empty = chat.messages.length === 0;
  const starters = [t("ask.starter.1"), t("ask.starter.2"), t("ask.starter.3")];

  return (
    <div className="h-full w-full flex flex-col items-center">
      <div className="w-full max-w-[42rem] flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-5 pb-3">
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-[8px] border px-3 font-sans text-[11px] uppercase tracking-[0.18em] transition-colors duration-700"
            style={{ color: IVORY.mute }}
          >
            <ArrowLeft size={14} />
            {t("common.home")}
          </Link>
          <span
            className="font-serif text-[12px] uppercase tracking-[0.32em]"
            style={{ color: IVORY.mute }}
          >
            {t("ask.room")}
          </span>
          <span className="w-[60px]" aria-hidden />
        </header>

        {/* Scrollable thread */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-6 space-y-8 scroll-smooth"
        >
          {empty ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 pt-10 text-center select-none"
            >
              <div 
                className="w-full rounded-[8px] border p-5 sm:p-7"
                style={{
                  background: "var(--hint-card-surface)",
                  borderColor: "var(--hint-border)",
                  boxShadow: "var(--hint-elevated-shadow)",
                }}
              >
                <div
                  className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[8px]"
                  style={{
                    color: GOLD.ink,
                    background: "rgba(206,178,110,0.10)",
                    border: "1px solid rgba(206,178,110,0.24)",
                  }}
                >
                  <MessageCircle size={22} strokeWidth={1.7} />
                </div>
                <p
                  className="font-sans text-[11px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: IVORY.mute }}
                >
                  {t("ask.brand")}
                </p>
                <h1
                  className="mt-4 font-serif text-[34px] leading-none sm:text-[44px]"
                  style={{ color: IVORY.strong, textShadow: TEXT_HALO.soft }}
                >
                  {t("ask.title")}
                </h1>
                <p
                  className="mx-auto mt-4 max-w-md font-sans text-[13.5px] leading-relaxed"
                  style={{ color: IVORY.body }}
                >
                  {t("ask.body")}
                </p>
                <div className="mt-6 flex flex-col gap-2 text-left">
                  {starters.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => {
                        inputRef.current?.setValue(starter);
                        inputRef.current?.focus();
                      }}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-[10px] border px-4 py-3 text-left font-sans text-[14px] font-medium leading-snug transition-colors"
                      style={{
                        color: IVORY.body,
                        background: "var(--hint-card-surface-muted)",
                        borderColor: "var(--hint-border)",
                      }}
                    >
                      <span>{starter}</span>
                      <Sparkles size={14} style={{ color: GOLD.ink }} />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            chat.messages.map((m) => <ChatMessage key={m.id} message={m} />)
          )}

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
                {t("ask.thinking")}
              </span>
            </motion.div>
          )}

          {chat.error && (
            <p
              role="status"
              className="font-sans text-xs"
              style={{ color: IVORY.mute }}
            >
              {chat.error}
            </p>
          )}
        </div>

        {/* Input */}
        <FollowUpInput
          ref={inputRef}
          onSend={(t) => void chat.sendMessage(t)}
          isThinking={chat.isThinking}
          disabled={chat.isLimited}
        />
      </div>
    </div>
  );
}
