import { useState } from "react";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import type { Profile, ProfileInput } from "@workspace/api-client-react";
import { useLanguage } from "../../lib/i18n";

/**
 * ProfileForm — the on-brand identity ritual. Captures name + date of birth,
 * with optional birth time / place. Reused for first-entry onboarding and for
 * editing later from the Vault.
 */

interface Props {
  initial?: Profile | null;
  submitLabel: string;
  onSubmit: (input: Omit<ProfileInput, "anonId">) => void | Promise<void>;
  isSaving?: boolean;
  onCancel?: () => void;
}

function Field({
  label,
  children,
  optional,
  optionalText = "optional",
}: {
  label: string;
  children: React.ReactNode;
  optional?: boolean;
  optionalText?: string;
}) {
  return (
    <label className="block">
      <span
        className="font-serif text-[10px] uppercase tracking-[0.28em] flex items-center gap-2 mb-2"
        style={{ color: GLASS.muted }}
      >
        {label}
        {optional && (
          <span style={{ color: GLASS.faint }} className="tracking-normal lowercase italic">
            {optionalText}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full h-12 rounded-[8px] px-4 font-serif text-[15px] bg-transparent focus:outline-none transition-colors";

const inputStyle = {
  background: "rgba(0,0,0,0.25)",
  border: `1px solid ${GLASS.border}`,
  color: GLASS.text,
} as const;

function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function isCompleteBirthDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  isSaving,
  onCancel,
}: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState(initial?.name ?? "");
  const [birthDate, setBirthDate] = useState(formatBirthDateInput(initial?.birthDate ?? ""));
  const [birthTime, setBirthTime] = useState(initial?.birthTime ?? "");
  const [birthPlace, setBirthPlace] = useState(initial?.birthPlace ?? "");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && isCompleteBirthDate(birthDate);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError(t("profile.requiredError"));
      return;
    }
    setError(null);
    void Promise.resolve(onSubmit({
      name: name.trim(),
      birthDate,
      birthTime: birthTime.trim() || undefined,
      birthPlace: birthPlace.trim() || undefined,
    })).catch(() => {
      setError("Could not save your birth details. Please try again.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label={t("profile.nameLabel")}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("profile.namePlaceholder")}
          autoComplete="name"
          className={inputClass}
          style={inputStyle}
          data-testid="input-name"
        />
      </Field>

      <Field label={t("profile.birthLabel")}>
        <input
          type="text"
          value={birthDate}
          onChange={(e) => setBirthDate(formatBirthDateInput(e.target.value))}
          onInput={(e) => setBirthDate(formatBirthDateInput(e.currentTarget.value))}
          placeholder="YYYY-MM-DD"
          autoComplete="bday"
          inputMode="numeric"
          maxLength={10}
          pattern="\d{4}-\d{2}-\d{2}"
          className={inputClass}
          style={inputStyle}
          data-testid="input-birthdate"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t("profile.timeLabel")} optional optionalText={t("profile.optional")}>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className={inputClass}
            style={inputStyle}
            data-testid="input-birthtime"
          />
        </Field>
        <Field label={t("profile.placeLabel")} optional optionalText={t("profile.optional")}>
          <input
            type="text"
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            placeholder={t("profile.cityPlaceholder")}
            className={inputClass}
            style={inputStyle}
            data-testid="input-birthplace"
          />
        </Field>
      </div>

      {error && (
        <p className="font-sans text-[12px]" style={{ color: ACCENT.lavender }}>
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 mt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center w-full h-12 rounded-[8px] font-serif text-[12px] uppercase tracking-[0.24em] transition-opacity disabled:opacity-50"
          style={{
            background: "rgba(206,178,110,0.14)",
            border: "1px solid rgba(206,178,110,0.34)",
            color: ACCENT.gold,
          }}
          data-testid="button-save-profile"
        >
          {isSaving ? t("profile.keeping") : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="font-serif text-[11px] uppercase tracking-[0.22em] py-2"
            style={{ color: GLASS.faint }}
          >
            {t("profile.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
