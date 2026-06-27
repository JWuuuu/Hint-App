import { motion } from "framer-motion";
import { IVORY } from "../../atmosphere";
import { useLanguage } from "../../../../lib/i18n";

export type ReadingActionKind =
  | "deeper"
  | "simpler"
  | "explain-cards"
  | "follow-up"
  | "redraw";

export interface ReadingAction {
  kind: ReadingActionKind;
  label: string;
  prefill?: string;
}

const ACTION_DEFS: Array<{
  kind: ReadingActionKind;
  labelKey: string;
  prefillKey?: string;
}> = [
  { kind: "deeper", labelKey: "reading.action.deeper", prefillKey: "reading.prefill.deeper" },
  { kind: "simpler", labelKey: "reading.action.simpler", prefillKey: "reading.prefill.simpler" },
  {
    kind: "explain-cards",
    labelKey: "reading.action.explainCards",
    prefillKey: "reading.prefill.explainCards",
  },
  { kind: "follow-up", labelKey: "reading.action.followUp" },
  { kind: "redraw", labelKey: "reading.action.redraw" },
];

interface Props {
  onAction: (action: ReadingAction) => void;
  disabled?: boolean;
}

export function ReadingActions({ onAction, disabled }: Props) {
  const { t } = useLanguage();
  const actions = ACTION_DEFS.map((action) => ({
    kind: action.kind,
    label: t(action.labelKey),
    prefill: action.prefillKey ? t(action.prefillKey) : undefined,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-none"
      style={{ scrollbarWidth: "none" }}
    >
      {actions.map((a, i) => (
        <motion.button
          key={a.kind}
          onClick={() => onAction(a)}
          disabled={disabled}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.9, ease: "easeOut" }}
          whileHover={
            disabled
              ? undefined
              : {
                  opacity: 0.82,
                }
          }
          whileTap={disabled ? undefined : { scale: 0.97 }}
          className="shrink-0 font-serif italic text-[13px] disabled:cursor-default whitespace-nowrap px-3.5 py-1.5 rounded-full border backdrop-blur-[2px] transition-opacity duration-500"
          style={{
            color: disabled ? IVORY.dim : IVORY.body,
            background: "var(--hint-chat-input-bg)",
            borderColor: "var(--hint-chat-input-border)",
            boxShadow: "var(--hint-chat-input-shadow)",
          }}
        >
          {a.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
