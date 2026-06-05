import { motion } from "framer-motion";
import type { ChatMessage as ChatMessageType } from "../types";
import { IVORY, TEXT_HALO } from "../../atmosphere";
import { SpeechButton } from "./SpeechButton";
import { useLanguage } from "../../../../lib/i18n";

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  const { t } = useLanguage();
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 1.4, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
    >
      <div
        className={
          isUser
            ? "max-w-[86%] rounded-[12px] border px-4 py-3 relative"
            : "max-w-[92%] rounded-[12px] border px-4 py-3 relative"
        }
        style={{
          borderColor: isUser ? "rgba(255,240,210,0.22)" : "rgba(255,255,255,0.10)",
          background: isUser ? "rgba(255,240,210,0.06)" : "rgba(255,255,255,0.035)",
        }}
      >
        {!isUser && (
          <div className="mb-3">
            <SpeechButton text={message.content} />
          </div>
        )}
        {isUser && (
          <>
            <motion.div
              aria-hidden
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="absolute -left-px top-0 bottom-0 w-px blur-[1px]"
              style={{ background: "rgba(255,240,210,0.7)" }}
            />
            <p
              className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] mb-2"
              style={{ color: IVORY.mute }}
            >
              {t("chat.you")}
            </p>
          </>
        )}
        <p
          className={
            isUser
              ? "font-sans text-[15px] leading-relaxed whitespace-pre-wrap"
              : "font-sans text-[15px] leading-[1.75] whitespace-pre-wrap"
          }
          style={{
            color: isUser ? IVORY.body : IVORY.strong,
            textShadow: TEXT_HALO.soft,
          }}
        >
          {message.content}
        </p>
      </div>
    </motion.div>
  );
}
