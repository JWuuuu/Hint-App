import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { SendHorizontal } from "lucide-react";
import type { SpreadChoice } from "../../hold/useHoldFlow";
import { getCardKeywords, type RitualCard } from "../logic/createHiddenDeck";
import type { TarotCardBackStyle } from "./TarotCardVisual";
import { TarotCardVisual } from "./TarotCardVisual";

type LocalChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type TarotHintReadingChatProps = {
  selectedCards: RitualCard[];
  spread: SpreadChoice;
  backStyle?: TarotCardBackStyle;
};

const FOLLOW_UPS = [
  "What should I do next?",
  "What should I stop holding?",
  "What is the quiet truth here?",
];

function newMessageId() {
  return `hint-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function orientationLine(card: RitualCard) {
  return card.orientation === "reversed"
    ? "Because it came through reversed, the message is quieter: notice where this energy is blocked, delayed, or turned inward."
    : "Because it came through upright, the message is direct: this energy is already active in the situation.";
}

function buildShortAnswer(cards: RitualCard[], spread: SpreadChoice) {
  const first = cards[0];
  const firstKeywords = first ? getCardKeywords(first.cardId) : ["clarity"];
  if (spread.id === "relationship") {
    return `The answer is in the space between the two people, not only in either person's side of the story. ${first ? `${first.name} points to ${firstKeywords[0]} first.` : "Start with the clearest emotional signal first."}`;
  }
  if (spread.id === "three") {
    return `The answer has a beginning, a middle, and a next step. Start with ${firstKeywords[0]}, then let the next Hint show what needs attention now.`;
  }
  if (spread.cardCount > 3) {
    return `This answer has layers. Do not force one clean conclusion yet; read the pattern across the Hints and let the repeated signal lead.`;
  }
  return `The answer is simple: do not solve the whole story at once. Start with the clearest signal, then take one honest next step.`;
}

function buildCardMeaning(card: RitualCard, index: number) {
  const keywords = getCardKeywords(card.cardId);
  const key = keywords[0] ?? "signal";
  const secondary = keywords[1] ?? "movement";
  return `Hint ${index + 1}: ${card.name} ${card.orientation === "reversed" ? "reversed" : "upright"} asks you to look at ${key}. It suggests ${secondary} is shaping the answer more than the noise around it. ${orientationLine(card)}`;
}

function buildFollowUpReply(question: string, cards: RitualCard[]) {
  const anchor = cards[0];
  const anchorKeywords = anchor ? getCardKeywords(anchor.cardId) : ["clarity", "truth"];
  const cleanQuestion = question.replace(/\s+/g, " ").trim();
  return `For "${cleanQuestion}", I would return to ${anchor?.name ?? "the first Hint"}. The useful signal is ${anchorKeywords[0]}: ask what this situation is making clearer, then choose the smallest action that respects that truth.`;
}

export function TarotHintReadingChat({
  selectedCards,
  spread,
  backStyle = "nocturne",
}: TarotHintReadingChatProps) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const shortAnswer = useMemo(() => buildShortAnswer(selectedCards, spread), [selectedCards, spread]);
  const cardMeanings = useMemo(
    () => selectedCards.map((card, index) => buildCardMeaning(card, index)),
    [selectedCards],
  );

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMessage: LocalChatMessage = {
      id: newMessageId(),
      role: "user",
      content: trimmed,
    };
    const assistantMessage: LocalChatMessage = {
      id: newMessageId(),
      role: "assistant",
      content: buildFollowUpReply(trimmed, selectedCards),
    };
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(draft);
    }
  }

  return (
    <section className="relative flex h-full w-full flex-col overflow-hidden bg-[#010207] text-[#f7ead0]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(228,193,116,0.12),transparent_24%),linear-gradient(180deg,#050816,#010207_58%,#03040c)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.8)_0_1px,transparent_1px),radial-gradient(circle_at_78%_16%,rgba(239,205,139,0.78)_0_1px,transparent_1px)] [background-size:132px_148px]" />

      <header className="relative z-10 border-b border-[#e4c174]/10 px-5 py-5 sm:px-7">
        <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#e4c174]/70">Tarot room</p>
        <h1 className="mt-1 font-serif text-[32px] leading-tight text-[#f7ead0] sm:text-4xl">
          Read the Hints
        </h1>
        <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[#d8c7a6]/74">
          Here is the brief answer first, then what each Hint is pointing toward.
        </p>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="rounded-[14px] border border-[#e4c174]/16 bg-white/[0.035] px-5 py-5 shadow-[0_18px_42px_rgba(0,0,0,0.24)]"
          >
            <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-[#e4c174]/76">
              Brief answer
            </p>
            <p className="mt-3 font-serif text-[21px] leading-relaxed text-[#f7ead0]">
              {shortAnswer}
            </p>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedCards.map((card, index) => (
              <motion.article
                key={card.visualId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.08, duration: 0.7, ease: "easeOut" }}
                className="flex gap-4 rounded-[14px] border border-[#e4c174]/12 bg-black/24 p-4"
              >
                <TarotCardVisual
                  card={card}
                  faceDown={false}
                  revealed
                  compact
                  backStyle={backStyle}
                  ariaLabel={`${card.name}, ${card.orientation}`}
                  className="!h-[118px] !w-[76px]"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#e4c174]/72">
                    Hint {index + 1}
                  </p>
                  <p className="mt-1 font-serif text-lg leading-tight text-[#f7ead0]">{card.name}</p>
                  <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.16em] text-[#d8c7a6]/64">
                    {card.orientation}
                  </p>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-[#d8c7a6]/78">
                    {cardMeanings[index]}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.7, ease: "easeOut" }}
            className="rounded-[14px] border border-[#e4c174]/14 bg-[#e4c174]/[0.045] px-5 py-5"
          >
            <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-[#e4c174]/76">
              What this says
            </p>
            <p className="mt-3 font-sans text-[15px] leading-8 text-[#f7ead0]/90">
              The cards are not asking you to rush to certainty. They are pointing toward the first honest
              signal, then asking what question you want to bring closer.
            </p>
          </motion.div>

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-[14px] border px-4 py-3 ${
                  message.role === "user"
                    ? "border-[#e4c174]/22 bg-[#e4c174]/10"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <p className="font-sans text-[15px] leading-7 text-[#f7ead0]/90">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative z-20 border-t border-[#e4c174]/10 bg-[#010207]/88 px-5 pb-5 pt-3 backdrop-blur-md sm:px-7">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {FOLLOW_UPS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => {
                  setDraft(question);
                  inputRef.current?.focus();
                }}
                className="shrink-0 rounded-full border border-[#e4c174]/18 bg-white/[0.035] px-3.5 py-2 font-serif text-[13px] italic text-[#d8c7a6]/82 transition hover:border-[#e4c174]/36 hover:text-[#ffe8aa]"
              >
                {question}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-3 rounded-[14px] border border-[#e4c174]/16 bg-black/38 px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask what you want to understand next..."
              className="max-h-32 flex-1 resize-none bg-transparent font-sans text-[15px] leading-relaxed text-[#f7ead0] outline-none placeholder:text-[#d8c7a6]/42"
            />
            <button
              type="button"
              onClick={() => send(draft)}
              disabled={!draft.trim()}
              aria-label="Send follow-up"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e4c174]/90 text-[#08070b] transition hover:bg-[#ffe2a2] disabled:cursor-default disabled:bg-white/10 disabled:text-[#d8c7a6]/35"
            >
              <SendHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
