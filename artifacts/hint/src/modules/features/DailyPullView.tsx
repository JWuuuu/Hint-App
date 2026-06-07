import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, ScreenHeader, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { DailyPullSigil } from "../home/data/sigils";
import { DailyReportCard } from "../home/components/DailyReportCard";
import {
  useGetOrCreateDailyPull,
  useUpdateDailyPull,
} from "@workspace/api-client-react";
import type { DailyPull } from "@workspace/api-client-react";
import { getAnonId, getLocalDateString } from "../../lib/identity";
import { useLanguage } from "../../lib/i18n";

export function DailyPullView() {
  const drawMutation = useGetOrCreateDailyPull();
  const updateMutation = useUpdateDailyPull();
  const [pull, setPull] = useState<DailyPull | null>(null);
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const drewRef = useRef(false);
  const dateRef = useRef(getLocalDateString());
  const { t } = useLanguage();

  // Draw (or fetch the already-saved) pull for today, exactly once.
  useEffect(() => {
    if (drewRef.current) return;
    drewRef.current = true;
    drawMutation.mutate(
      { data: { anonId: getAnonId(), date: dateRef.current } },
      {
        onSuccess: (data) => {
          setPull(data);
          setNote(data.note ?? "");
          setSavedNote(data.note ?? "");
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveNote() {
    if (!pull || note === savedNote) return;
    updateMutation.mutate(
      { data: { anonId: getAnonId(), date: dateRef.current, note } },
      { onSuccess: (data) => setSavedNote(data.note ?? "") },
    );
  }

  return (
    <AppScreen>
      <div className="hidden lg:block">
        <ScreenHeader
          eyebrow={t("dailyPull.eyebrow")}
          title={t("dailyPull.title")}
          subtitle={t("dailyPull.subtitle")}
          sigil={DailyPullSigil}
        />
      </div>

      <DailyReportCard
        detailed
        className="mb-5 lg:mb-6"
        cardOverride={
          pull
            ? {
                cardId: pull.cardId,
                cardName: pull.cardName,
                whisper: pull.whisper,
              }
            : null
        }
      />

      {drawMutation.isError && (
        <GlassPanel className="mb-6">
          <p className="font-serif italic text-[14px] text-center" style={{ color: GLASS.muted }}>
            {t("dailyPull.error")}
          </p>
        </GlassPanel>
      )}

      {pull && (
        <section className="mb-6">
          <SectionLabel>{t("dailyPull.noteTitle")}</SectionLabel>
          <GlassPanel>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={saveNote}
              placeholder={t("dailyPull.notePlaceholder")}
              className="w-full h-24 rounded-[8px] px-4 py-3 font-serif text-[14px] bg-transparent focus:outline-none resize-none"
              style={{
                background: "rgba(0,0,0,0.25)",
                border: `1px solid ${GLASS.border}`,
                color: GLASS.text,
              }}
              data-testid="input-pull-note"
            />
            <div className="flex items-center justify-between mt-2 h-4">
              <span className="font-sans text-[11px]" style={{ color: GLASS.faint }}>
                {updateMutation.isPending
                  ? t("profile.keeping")
                  : note === savedNote && savedNote
                    ? t("dailyPull.kept")
                    : ""}
              </span>
            </div>
          </GlassPanel>
        </section>
      )}

      <section className="mb-6">
        <SectionLabel>{t("dailyPull.sitTitle")}</SectionLabel>
        <GlassPanel>
          <p className="font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
            {t("dailyPull.sitBody")}
          </p>
          <Link
            href="/tarot"
            className="inline-flex items-center justify-center w-full h-11 rounded-[8px] mt-4 font-serif text-[12px] uppercase tracking-[0.24em]"
            style={{
              background: "rgba(206,178,110,0.12)",
              border: "1px solid rgba(206,178,110,0.3)",
              color: ACCENT.gold,
            }}
          >
            {t("dailyPull.openRoom")}
          </Link>
        </GlassPanel>
      </section>
    </AppScreen>
  );
}
