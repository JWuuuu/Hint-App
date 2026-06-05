import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Search } from "lucide-react";
import { ACCENT } from "../hold/atmosphere";
import { getModulesBySection } from "../home/data/modules";
import { ModuleTileWrapper } from "../home/components/ModuleTile";
import { useLanguage } from "../../lib/i18n";

export function RoomsLibrary() {
  const { t } = useLanguage();
  const groups = getModulesBySection();

  return (
    <div className="h-full w-full overflow-y-auto overscroll-none pb-16">
      <div className="mx-auto w-full max-w-lg px-4 pt-24 sm:max-w-3xl sm:px-6 md:pt-24 lg:max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="mb-7"
        >
          <Link
            href="/"
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

        <div className="flex flex-col gap-8">
          {groups.map(({ section, modules }, i) => (
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
