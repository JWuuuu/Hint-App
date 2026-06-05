import { motion, AnimatePresence } from "framer-motion";
import { getRedrawPromptCopy } from "../redrawRules";
import { IVORY, TEXT_HALO } from "../../atmosphere";
import { useLanguage } from "../../../../lib/i18n";

interface Props {
  open: boolean;
  priorRedraws: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RedrawPrompt({ open, priorRedraws, onConfirm, onCancel }: Props) {
  const { t } = useLanguage();
  const copy = getRedrawPromptCopy(priorRedraws, t);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center px-8"
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 4, opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm w-full text-center flex flex-col items-center gap-10 py-10"
          >
            <p
              className={`font-serif italic leading-loose ${
                copy.isDiscouraging ? "text-base" : "text-lg"
              }`}
              style={{
                color: copy.isDiscouraging ? IVORY.body : IVORY.strong,
                textShadow: TEXT_HALO.strong,
              }}
            >
              {copy.gentle}
            </p>

            <div className="flex flex-col items-center gap-5">
              <button
                onClick={onConfirm}
                className="font-serif text-[12px] uppercase tracking-[0.35em] transition-colors duration-700 py-2 hover:!text-[rgba(255,245,225,0.95)]"
                style={{ color: IVORY.body }}
              >
                {copy.confirmLabel}
              </button>
              <button
                onClick={onCancel}
                className="font-serif text-[11px] uppercase tracking-[0.3em] transition-colors duration-700 py-2 hover:!text-[rgba(255,245,225,0.7)]"
                style={{ color: IVORY.mute }}
              >
                {copy.declineLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
