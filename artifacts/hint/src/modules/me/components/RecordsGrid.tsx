import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  BookOpen,
  NotebookPen,
  Bookmark,
  History,
  HelpCircle,
  HeartPulse,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { SectionLabel } from "../../../components/app/AppChrome";
import type { UserStats } from "@workspace/api-client-react";
import { useLanguage } from "../../../lib/i18n";

interface Record {
  icon: LucideIcon;
  label: string;
  count: string;
  href?: string;
  comingSoon?: boolean;
}

export function RecordsGrid({
  stats,
  localReadingCount = 0,
  localPullCount = 0,
  localQuestionCount = 0,
}: {
  stats?: UserStats;
  localReadingCount?: number;
  localPullCount?: number;
  localQuestionCount?: number;
}) {
  const { t } = useLanguage();
  const readingCount = Math.max(stats?.readings ?? 0, localReadingCount);
  const pullCount = Math.max(stats?.pulls ?? 0, localPullCount);
  const records: Record[] = [
    { icon: BookOpen, label: t("me.record.archive"), count: String(readingCount), href: "/app/readings" },
    { icon: NotebookPen, label: t("me.record.journals"), count: `${stats?.journals ?? 0} ${t("me.notes")}`, href: "/app/journal" },
    { icon: Bookmark, label: t("me.record.saved"), count: "0", comingSoon: true },
    { icon: History, label: t("me.record.history"), count: `${pullCount}`, href: "/app/readings" },
    { icon: HelpCircle, label: t("me.record.questions"), count: String(localQuestionCount), href: "/app/readings" },
    { icon: HeartPulse, label: t("me.record.mood"), count: `0 ${t("me.notes")}`, comingSoon: true },
    { icon: ShoppingBag, label: t("me.record.orders"), count: "0", comingSoon: true },
    { icon: Users, label: t("me.record.circle"), count: "0", comingSoon: true },
  ];

  return (
    <section>
      <SectionLabel>{t("me.records")}</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        {records.map((r, i) => {
          const Icon = r.icon;
          const inner = (
            <div
              className="flex items-center gap-3 px-3.5 py-3.5 rounded-[8px] h-full transition-colors hover:bg-white/[0.03]"
              style={{ background: GLASS.panel, border: `1px solid ${GLASS.border}` }}
            >
              <span
                className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(100,156,158,0.10)",
                  border: "1px solid rgba(100,156,158,0.2)",
                }}
              >
                <Icon size={16} color={ACCENT.aqua} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[13.5px] leading-tight truncate" style={{ color: GLASS.text }}>
                  {r.label}
                </p>
                <p className="font-sans text-[11.5px] mt-0.5 tabular-nums" style={{ color: GLASS.faint }}>
                  {r.count}
                </p>
              </div>
            </div>
          );
          const card = (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 8, scale: 0.994 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.3, delay: Math.min(i, 4) * 0.025, ease: [0.2, 0.78, 0.2, 1] }}
              className="transform-gpu"
            >
              {r.href ? (
                <Link href={r.href} className="block h-full">
                  {inner}
                </Link>
              ) : (
                <div aria-disabled="true" className="relative cursor-default opacity-60">
                  {inner}
                  <span
                    className="absolute right-3 top-3 rounded-full border px-2 py-0.5 font-sans text-[8px] uppercase tracking-[0.1em]"
                    style={{
                      color: GLASS.faint,
                      borderColor: GLASS.border,
                      background: "rgba(255,255,255,0.035)",
                    }}
                  >
                    Soon
                  </span>
                </div>
              )}
            </motion.div>
          );
          return card;
        })}
      </div>
    </section>
  );
}
