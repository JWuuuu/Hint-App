import { useState } from "react";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, ScreenHeader, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { JournalSigil } from "../home/data/sigils";
import {
  useListJournalEntries,
  useCreateJournalEntry,
  getListJournalEntriesQueryKey,
} from "@workspace/api-client-react";
import type { JournalEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAnonId } from "../../lib/identity";
import { useLanguage } from "../../lib/i18n";

function formatDate(iso: string, todayLabel: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  ) {
    return todayLabel;
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const MOODS = [
  { id: "tender", key: "journal.mood.tender" },
  { id: "lighter", key: "journal.mood.lighter" },
  { id: "heavy", key: "journal.mood.heavy" },
  { id: "still", key: "journal.mood.still" },
  { id: "hopeful", key: "journal.mood.hopeful" },
] as const;

function moodText(value: string, t: (key: string) => string) {
  const id = value.trim().toLowerCase();
  const known = MOODS.find((m) => m.id === id);
  return known ? t(known.key) : value;
}

export function JournalView() {
  const anonId = getAnonId();
  const queryClient = useQueryClient();
  const { data, isLoading } = useListJournalEntries({ anonId });
  const createMutation = useCreateJournalEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListJournalEntriesQueryKey({ anonId }),
        });
      },
    },
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const { t } = useLanguage();

  const entries = (data ?? []) as JournalEntry[];

  function handleSave() {
    if (!body.trim()) return;
    createMutation.mutate(
      {
        data: {
          anonId,
          title: title.trim() || undefined,
          body: body.trim(),
          mood: mood ?? undefined,
        },
      },
      {
        onSuccess: () => {
          setTitle("");
          setBody("");
          setMood(null);
        },
      },
    );
  }

  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("journal.eyebrow")}
        title={t("journal.title")}
        subtitle={t("journal.subtitle")}
        sigil={JournalSigil}
        backHref="/app/rooms"
        backLabel={t("common.back")}
      />

      {/* Write */}
      <GlassPanel hero className="mb-6">
        <p
          className="font-serif text-[10px] uppercase tracking-[0.28em] mb-2"
          style={{ color: ACCENT.aqua }}
        >
          {t("journal.promptLabel")}
        </p>
        <p className="font-serif italic text-[16px] leading-snug mb-4" style={{ color: GLASS.text }}>
          {t("journal.prompt")}
        </p>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("journal.titlePlaceholder")}
          className="w-full h-11 rounded-[8px] px-4 mb-3 font-serif text-[14px] bg-transparent focus:outline-none"
          style={{
            background: "rgba(0,0,0,0.25)",
            border: `1px solid ${GLASS.border}`,
            color: GLASS.text,
          }}
          data-testid="input-journal-title"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("journal.bodyPlaceholder")}
          className="w-full h-32 rounded-[8px] px-4 py-3 font-serif text-[14px] bg-transparent focus:outline-none resize-none"
          style={{
            background: "rgba(0,0,0,0.25)",
            border: `1px solid ${GLASS.border}`,
            color: GLASS.text,
          }}
          data-testid="input-journal-body"
        />

        <div className="flex flex-wrap gap-2 mt-3">
          {MOODS.map((m) => {
            const active = mood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(active ? null : m.id)}
                className="font-sans text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors"
                style={{
                  background: active ? "rgba(100,156,158,0.22)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? "rgba(100,156,158,0.5)" : GLASS.border}`,
                  color: active ? "rgba(150,206,208,0.95)" : GLASS.muted,
                }}
                data-testid={`mood-${m.id}`}
              >
                {t(m.key)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!body.trim() || createMutation.isPending}
          className="inline-flex items-center justify-center w-full h-11 rounded-[8px] mt-4 font-serif text-[12px] uppercase tracking-[0.24em] transition-opacity disabled:opacity-40"
          style={{
            background: "rgba(206,178,110,0.14)",
            border: "1px solid rgba(206,178,110,0.34)",
            color: ACCENT.gold,
          }}
          data-testid="button-save-journal"
        >
          {createMutation.isPending ? t("profile.keeping") : t("journal.keep")}
        </button>
      </GlassPanel>

      <section className="mb-6">
        <SectionLabel>{t("journal.past")}</SectionLabel>
        {isLoading ? (
          <p className="font-serif italic text-[13px] py-6 text-center" style={{ color: GLASS.muted }}>
            {t("journal.loading")}
          </p>
        ) : entries.length === 0 ? (
          <GlassPanel>
            <p className="font-sans text-[13px] leading-relaxed text-center" style={{ color: GLASS.muted }}>
              {t("journal.empty")}
            </p>
          </GlassPanel>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((e) => (
              <div
                key={e.id}
                className="px-4 py-4 rounded-[8px]"
                style={{ background: GLASS.panel, border: `1px solid ${GLASS.border}` }}
              >
                <div className="flex items-center justify-between mb-1.5 gap-3">
                  <p className="font-serif text-[14.5px] min-w-0 truncate" style={{ color: GLASS.text }}>
                    {e.title || t("journal.untitled")}
                  </p>
                  {e.mood && (
                    <span
                      className="shrink-0 font-sans text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(100,156,158,0.14)", color: "rgba(150,206,208,0.9)" }}
                    >
                      {moodText(e.mood, t)}
                    </span>
                  )}
                </div>
                <p className="font-sans text-[12.5px] leading-snug whitespace-pre-wrap" style={{ color: GLASS.muted }}>
                  {e.body}
                </p>
                <p
                  className="font-serif text-[10px] uppercase tracking-[0.2em] mt-2"
                  style={{ color: GLASS.faint }}
                >
                  {formatDate(e.createdAt, t("readings.today"))}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppScreen>
  );
}
