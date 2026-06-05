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
}

export function RecordsGrid({ stats }: { stats?: UserStats }) {
  const { t } = useLanguage();
  const records: Record[] = [
    { icon: BookOpen, label: t("me.record.archive"), count: String(stats?.readings ?? 0), href: "/readings" },
    { icon: NotebookPen, label: t("me.record.journals"), count: `${stats?.journals ?? 0} ${t("me.notes")}`, href: "/journal" },
    { icon: Bookmark, label: t("me.record.saved"), count: "0" },
    { icon: History, label: t("me.record.history"), count: `${stats?.pulls ?? 0}` },
    { icon: HelpCircle, label: t("me.record.questions"), count: "0" },
    { icon: HeartPulse, label: t("me.record.mood"), count: `0 ${t("me.notes")}` },
    { icon: ShoppingBag, label: t("me.record.orders"), count: "0" },
    { icon: Users, label: t("me.record.circle"), count: "0" },
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
          return (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: Math.min(i, 6) * 0.04, ease: "easeOut" }}
            >
              {r.href ? (
                <Link href={r.href} className="block h-full">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
