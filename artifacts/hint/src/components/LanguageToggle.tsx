import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { ACCENT } from "../modules/hold/atmosphere";
import { useLanguage, type HintLanguage } from "../lib/i18n";

interface Props {
  className?: string;
  compact?: boolean;
  menuPlacement?: "top" | "bottom";
}

export function LanguageToggle({ className = "", compact = false, menuPlacement = "top" }: Props) {
  const { language, languages, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeLanguage = languages.find((option) => option.code === language) ?? languages[0]!;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const chooseLanguage = (nextLanguage: HintLanguage) => {
    setLanguage(nextLanguage);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`pointer-events-auto relative ${className || "inline-flex"}`}>
      <button
        type="button"
        aria-label={t("language.switchAria")}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t("language.switchAria")}
        onClick={() => setOpen((current) => !current)}
        className={
          compact
            ? "hint-tap-sparkle relative grid size-10 place-items-center rounded-full border font-sans text-[8px] font-bold uppercase tracking-[0.04em] transition-colors"
            : "inline-flex h-11 items-center gap-2 rounded-[8px] border px-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors md:h-9"
        }
        style={{
          color: "var(--hint-text)",
          background: "color-mix(in srgb, var(--hint-surface-soft) 90%, transparent)",
          borderColor: open ? "color-mix(in srgb, var(--hint-rose) 38%, var(--hint-border-strong))" : "var(--hint-border)",
          boxShadow: open
            ? "0 0 0 1px color-mix(in srgb, var(--hint-rose) 18%, transparent), 0 12px 24px color-mix(in srgb, var(--hint-rose) 14%, transparent), inset 0 1px 0 rgba(255,255,255,0.24)"
            : "inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 22px color-mix(in srgb, var(--hint-rose) 10%, transparent)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
        data-testid="button-language-toggle"
      >
        {compact ? (
          <Globe2 size={18} strokeWidth={1.85} style={{ color: "var(--hint-text)" }} />
        ) : (
          <>
            <Globe2 size={14} strokeWidth={1.8} style={{ color: ACCENT.aqua }} />
            <span>{activeLanguage.shortLabel}</span>
            <ChevronDown
              size={12}
              strokeWidth={2}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
              style={{ color: "var(--hint-faint)" }}
            />
          </>
        )}
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t("language.switchAria")}
          className={`absolute right-0 z-[70] w-44 overflow-hidden rounded-[18px] border p-1.5 ${
            menuPlacement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          style={{
            background: "var(--hint-liquid-panel)",
            borderColor: "var(--hint-liquid-border)",
            boxShadow: "var(--hint-liquid-shadow)",
            backdropFilter: "blur(26px) saturate(1.25)",
            WebkitBackdropFilter: "blur(26px) saturate(1.25)",
          }}
        >
          {languages.map((option) => {
            const selected = option.code === language;
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => chooseLanguage(option.code)}
                className="flex h-11 w-full items-center justify-between rounded-[13px] px-3 text-left font-sans text-[12px] font-semibold transition-colors md:h-9"
                style={{
                  color: selected ? "var(--hint-text)" : "var(--hint-muted)",
                  background: selected ? "color-mix(in srgb, var(--hint-rose) 16%, var(--hint-surface-soft))" : "transparent",
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: selected ? ACCENT.aqua : "var(--hint-border)",
                    }}
                  />
                  <span>{option.label}</span>
                </span>
                {selected ? <Check size={14} strokeWidth={2} style={{ color: ACCENT.aqua }} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
