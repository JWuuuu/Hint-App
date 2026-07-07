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
    <div className="flex h-full min-h-0 w-full flex-col items-center">
      <div className="flex h-full min-h-0 w-full max-w-[42rem] flex-col">
        {/* Header */}
        <header className="flex shrink-0 transform-gpu items-center justify-between px-5 pb-3 pt-[calc(var(--hint-safe-top)+1rem)]">
          <Link
            href="/app"
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
          className="hint-app-scroll flex-1 space-y-8 px-5 py-6 scroll-smooth"
        >
          {empty ? (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.42, ease: [0.18, 0.78, 0.22, 1] }}
              className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 pt-10 text-center select-none"
            >
              <div 
                className="relative w-full transform-gpu overflow-hidden rounded-[22px] border p-5 sm:p-7"
                style={{
                  background:
                    "linear-gradient(145deg, color-mix(in srgb, var(--hint-card-surface) 92%, transparent), color-mix(in srgb, var(--hint-surface-soft) 86%, transparent))",
                  borderColor: "var(--hint-border)",
                  boxShadow: "var(--hint-elevated-shadow)",
                  contain: "layout paint style",
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-8 top-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.54), transparent)" }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-[-3rem] top-[-3rem] h-32 w-32 rounded-full opacity-55 blur-2xl"
                  style={{ background: "radial-gradient(circle, rgba(206,178,110,0.20), transparent 68%)" }}
                />
                <div
                  className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[18px]"
                  style={{
                    color: GOLD.ink,
                    background: "linear-gradient(145deg, rgba(255,244,223,0.84), rgba(206,178,110,0.14))",
                    border: "1px solid rgba(206,178,110,0.28)",
                    boxShadow: "0 14px 30px rgba(93,70,117,0.12), inset 0 1px 0 rgba(255,255,255,0.72)",
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
                  {starters.map((starter, index) => (
                    <motion.button
                      key={starter}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: [0.2, 0.78, 0.2, 1], delay: 0.06 + index * 0.04 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        inputRef.current?.setValue(starter);
                        inputRef.current?.focus();
                      }}
                      className="flex min-h-12 transform-gpu items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-left font-sans text-[14px] font-medium leading-snug transition-[background,border-color,transform] duration-200 hover:-translate-y-0.5"
                      style={{
                        color: IVORY.body,
                        background: "color-mix(in srgb, var(--hint-card-surface-muted) 88%, transparent)",
                        borderColor: "var(--hint-border)",
                      }}
                    >
                      <span>{starter}</span>
                      <span className="grid size-7 shrink-0 place-items-center rounded-full" style={{ background: "rgba(206,178,110,0.10)", color: GOLD.ink }}>
                        <Sparkles size={13} />
                      </span>
                    </motion.button>
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
