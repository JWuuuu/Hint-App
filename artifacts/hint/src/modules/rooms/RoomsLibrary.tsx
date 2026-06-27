import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Search, Sparkles } from "lucide-react";
import { ACCENT } from "../hold/atmosphere";
import { getModulesBySection } from "../home/data/modules";
import { ModuleTileWrapper } from "../home/components/ModuleTile";
import { useLanguage } from "../../lib/i18n";
import type { SectionKey } from "../home/types/home.types";

type RoomFilter = SectionKey | "all";

export function RoomsLibrary() {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<RoomFilter>("all");
  const groups = useMemo(() => getModulesBySection(), []);
  const totalRooms = useMemo(
    () => groups.reduce((total, group) => total + group.modules.length, 0),
    [groups],
  );
  const liveRooms = useMemo(
    () => groups.flatMap((group) => group.modules).filter((module) => module.href),
    [groups],
  );
  const visibleGroups = useMemo(
    () =>
      activeFilter === "all"
        ? groups
        : groups.filter((group) => group.section.key === activeFilter),
    [activeFilter, groups],
  );
  const activeLiveRooms = useMemo(
    () =>
      activeFilter === "all"
        ? liveRooms
        : liveRooms.filter((module) => module.section === activeFilter),
    [activeFilter, liveRooms],
  );
  const filterOptions = useMemo(
    () => [
      { key: "all" as const, label: "All", count: totalRooms },
      ...groups.map((group) => ({
        key: group.section.key,
        label: t(`section.${group.section.key}.label`),
        count: group.modules.length,
      })),
    ],
    [groups, t, totalRooms],
  );

  return (
    <div className="h-full w-full overflow-y-auto overscroll-none pb-16">
      <div className="mx-auto w-full max-w-lg px-4 pt-32 sm:max-w-3xl sm:px-6 md:pt-32 lg:max-w-6xl lg:pt-28">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="mb-7"
        >
          <Link
            href="/app"
            className="mb-5 inline-flex h-9 items-center gap-2 rounded-[8px] border px-3 font-sans text-[11px] uppercase tracking-[0.18em]"
            style={{
              color: "var(--hint-muted)",
              borderColor: "var(--hint-border)",
              background: "var(--hint-surface-soft)",
            }}
          >
            <ArrowLeft size={14} />
            {t("common.home")}
          </Link>

          <div
            className="rounded-[8px] border p-5 sm:p-6"
            style={{
              background: "var(--hint-surface-strong)",
              borderColor: "var(--hint-border)",
              boxShadow: "var(--hint-elevated-shadow)",
            }}
          >
            <p className="font-serif text-[11px] uppercase tracking-[0.32em]" style={{ color: ACCENT.aqua }}>
              {t("rooms.eyebrow")}
            </p>
            <div className="mt-3 grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <h1 className="font-serif text-[34px] leading-none sm:text-[48px]" style={{ color: "var(--hint-text)" }}>
                  {t("rooms.title")}
                </h1>
                <p className="mt-3 max-w-xl font-sans text-[13.5px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
                  {t("rooms.subtitle")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-[8px] border px-3 py-1.5 font-sans text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: ACCENT.gold, borderColor: "rgba(206,178,110,0.24)", background: "rgba(206,178,110,0.08)" }}>
                    {liveRooms.length} open now
                  </span>
                  <span className="rounded-[8px] border px-3 py-1.5 font-sans text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--hint-muted)", borderColor: "var(--hint-border)", background: "var(--hint-input-bg)" }}>
                    {totalRooms} total rooms
                  </span>
                </div>
              </div>
              <div
                className="flex h-11 items-center gap-3 rounded-[8px] border px-4"
                style={{
                  background: "var(--hint-input-bg)",
                  borderColor: "var(--hint-border)",
                }}
              >
                <Search size={16} style={{ color: ACCENT.gold }} />
                <span className="font-sans text-[12.5px]" style={{ color: "var(--hint-faint)" }}>
                  {t("rooms.searchSoon")}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="mb-6 flex gap-2 overflow-x-auto rounded-[16px] border p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ background: "var(--hint-surface-strong)", borderColor: "var(--hint-border)" }}>
          {filterOptions.map((option) => {
            const selected = activeFilter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setActiveFilter(option.key)}
                aria-pressed={selected}
                className="flex h-10 shrink-0 items-center gap-2 rounded-[12px] border px-3 font-sans text-[12px] font-black transition-[transform,opacity] duration-200 hover:-translate-y-0.5"
                style={{
                  background: selected ? "linear-gradient(145deg, rgba(243,212,144,0.9), rgba(122,226,214,0.72))" : "transparent",
                  borderColor: selected ? "rgba(255,255,255,0.34)" : "transparent",
                  color: selected ? "#17110c" : "var(--hint-muted)",
                }}
              >
                <span>{option.label}</span>
                <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: selected ? "rgba(0,0,0,0.12)" : "var(--hint-input-bg)", color: selected ? "#17110c" : "var(--hint-faint)" }}>
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>

        {activeLiveRooms.length ? (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="mb-4 flex items-center justify-between gap-4 px-1">
              <div>
                <h2 className="inline-flex items-center gap-2 font-serif text-[22px] leading-none" style={{ color: ACCENT.gold }}>
                  <Sparkles size={18} />
                  Open now
                </h2>
                <p className="mt-2 max-w-lg font-sans text-[12.5px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
                  Live paths you can enter immediately.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {activeLiveRooms.map((module, idx) => (
                <ModuleTileWrapper
                  key={`live-${module.id}`}
                  module={module}
                  index={idx}
                  baseDelay={0}
                  variant="library"
                />
              ))}
            </div>
          </motion.section>
        ) : null}

        <div className="flex flex-col gap-8">
          {visibleGroups.map(({ section, modules }, i) => (
            <motion.section
              key={section.key}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.58, delay: i * 0.06, ease: "easeOut" }}
            >
              <div className="mb-4 flex items-end justify-between gap-4 px-1">
                <div>
                  <h2 className="font-serif text-[22px] leading-none" style={{ color: ACCENT.gold }}>
                    {t(`section.${section.key}.label`)}
                  </h2>
                  <p className="mt-2 max-w-lg font-sans text-[12.5px] leading-relaxed" style={{ color: "var(--hint-muted)" }}>
                    {t(`section.${section.key}.intro`)}
                  </p>
                </div>
                <span className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--hint-faint)" }}>
                  {modules.length} {t("rooms.count")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {modules.map((m, idx) => (
                  <ModuleTileWrapper
                    key={m.id}
                    module={m}
                    index={idx}
                    baseDelay={0}
                    variant="library"
                  />
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}
