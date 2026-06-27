import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { getEmotionalWeather } from "../data/weather";
import { useLanguage } from "../../../lib/i18n";

interface Props {
  delay?: number;
}

function moodLabel(value: number, t: (key: string) => string): string {
  if (value <= 30) return t("weather.mood.heavy");
  if (value <= 60) return t("weather.mood.drifting");
  if (value <= 90) return t("weather.mood.clear");
  return t("weather.mood.luminous");
}

function formatScoreLabel(template: string, score: number): string {
  return template.replace("{score}", String(score));
}

export function EmotionalWeatherCard({ delay = 0 }: Props) {
  const { language, t } = useLanguage();
  const weather = useMemo(() => getEmotionalWeather(new Date(), language), [language]);
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState(weather.clarityScore);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 1.0, ease: "easeOut" }}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="relative w-full rounded-3xl overflow-hidden flex flex-col p-6 cursor-pointer transition-transform duration-300 active:scale-[0.99]"
        style={{
          background: GLASS.hero,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${GLASS.border}`,
          boxShadow:
            "0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)",
        }}
      >
        {/* soft aqua bloom in the corner for depth */}
        <div
          className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(100,156,158,0.25) 0%, transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative flex justify-between items-start mb-6">
          <div>
            <span
              className="inline-block px-3 py-1 rounded-full font-serif text-[10px] uppercase tracking-[0.22em] font-medium mb-3"
              style={{
                background: "rgba(100, 156, 158, 0.16)",
                border: "1px solid rgba(100, 156, 158, 0.28)",
                color: "rgba(150, 206, 208, 0.95)",
              }}
            >
              {weather.label}
            </span>
            <p
              className="font-serif text-[15px] leading-tight"
              style={{ color: GLASS.muted }}
            >
              {t("weather.title")}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className="font-serif text-[56px] leading-none"
                style={{
                  color: GLASS.text,
                  textShadow: "0 0 30px rgba(150,206,208,0.25)",
                }}
              >
                {weather.clarityScore}
              </span>
            </div>
          </div>
          <div className="text-right max-w-[52%]">
            <p
              className="font-serif text-[15.5px] leading-snug italic"
              style={{ color: GLASS.text }}
            >
              "{weather.line}"
            </p>
            <p
              className="font-sans text-[12px] leading-snug mt-2"
              style={{ color: GLASS.muted }}
            >
              {weather.subline}
            </p>
          </div>
        </div>

        <div
          className="relative pt-5 grid grid-cols-5 gap-2"
          style={{ borderTop: `1px solid ${GLASS.border}` }}
        >
          {weather.dimensions.map((d, i) => (
            <DimensionBar
              key={d.key}
              score={d.score}
              label={d.label}
              delay={delay + 0.3 + i * 0.1}
            />
          ))}
        </div>

        <p
          className="relative mt-5 font-sans text-[10.5px] uppercase tracking-[0.24em] text-center"
          style={{ color: GLASS.faint }}
        >
          Tap to set tonight's mood
        </p>
      </motion.section>

      <MoodSheet
        open={open}
        onClose={() => setOpen(false)}
        mood={mood}
        setMood={setMood}
      />
    </>
  );
}

function MoodSheet({
  open,
  onClose,
  mood,
  setMood,
}: {
  open: boolean;
  onClose: () => void;
  mood: number;
  setMood: (v: number) => void;
}) {
  const { t } = useLanguage();
  const currentMoodLabel = moodLabel(mood, t);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mood-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{
            background: "rgba(4, 6, 12, 0.55)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <motion.div
            key="mood-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl px-7 pt-4 pb-10"
            style={{
              background:
                "linear-gradient(180deg, rgba(13, 18, 32, 0.96) 0%, rgba(6, 9, 19, 0.98) 100%)",
              borderTop: `1px solid ${GLASS.border}`,
              boxShadow: "0 -20px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* grab handle */}
            <div
              className="mx-auto mb-8 h-1 w-10 rounded-full"
              style={{ background: "rgba(255,255,255,0.18)" }}
              aria-hidden
            />

            <p
              className="font-serif text-[11px] uppercase tracking-[0.32em] text-center mb-8"
              style={{ color: ACCENT.aqua }}
            >
              How heavy is tonight?
            </p>

            <div className="text-center mb-1">
              <span
                className="font-serif text-[72px] leading-none"
                style={{
                  color: GLASS.text,
                  textShadow: "0 0 40px rgba(150,206,208,0.25)",
                }}
              >
                {mood}
              </span>
            </div>

            <motion.p
              key={currentMoodLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="font-serif italic text-[18px] text-center mb-10"
              style={{ color: ACCENT.gold }}
            >
              {currentMoodLabel}
            </motion.p>

            <input
              type="range"
              min={1}
              max={100}
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="mood-slider"
              aria-label={t("weather.sliderAria")}
            />

            <div className="mt-3 flex justify-between font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: GLASS.faint }}>
              <span>{t("weather.range.heavy")}</span>
              <span>{t("weather.range.luminous")}</span>
            </div>

            <button
              onClick={onClose}
              className="mt-10 w-full h-12 rounded-2xl font-serif text-[12px] uppercase tracking-[0.28em]"
              style={{
                background: "rgba(100, 156, 158, 0.16)",
                border: "1px solid rgba(100, 156, 158, 0.32)",
                color: "rgba(150, 206, 208, 0.95)",
              }}
            >
              {formatScoreLabel(t("weather.keepAt"), mood)}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DimensionBar({
  score,
  label,
  delay,
}: {
  score: number;
  label: string;
  delay: number;
}) {
  const fill = Math.max(0, Math.min(100, score)) / 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="font-sans font-semibold text-[12px]"
        style={{ color: GLASS.text }}
      >
        {score}
      </span>
      <div
        className="w-[5px] h-16 relative"
        style={{
          background: "rgba(255,255,255,0.08)",
          borderRadius: "99px",
        }}
      >
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: fill }}
          transition={{ delay, duration: 1.2, ease: [0.6, 0.05, 0.2, 1] }}
          className="absolute bottom-0 left-0 right-0 origin-bottom"
          style={{
            height: "100%",
            borderRadius: "99px",
            background:
              "linear-gradient(to top, rgba(100,156,158,0.55) 0%, rgba(196,169,98,0.95) 100%)",
            boxShadow:
              "0 0 8px rgba(196,169,98,0.45), 0 0 2px rgba(150,206,208,0.5)",
          }}
        />
      </div>
      <span
        className="font-sans text-[9px] uppercase tracking-wider font-medium"
        style={{ color: GLASS.muted }}
      >
        {label}
      </span>
    </div>
  );
}
