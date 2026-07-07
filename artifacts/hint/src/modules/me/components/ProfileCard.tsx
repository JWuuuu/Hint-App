import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  CalendarDays,
  LogIn,
  MapPin,
  Pencil,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { ACCENT, GLASS } from "../../hold/atmosphere";
import { GlassPanel } from "../../../components/app/AppChrome";
import { zodiacSign, initialsFrom } from "../utils";
import type { Profile } from "@workspace/api-client-react";
import { useLanguage } from "../../../lib/i18n";
import { useLocalAccount, type LocalAccount } from "../../../lib/auth";

function accountLabel(account: LocalAccount) {
  return account.email ?? account.phone ?? account.identifier;
}

function providerLabel(provider: LocalAccount["provider"]) {
  if (provider === "email") return "Email";
  if (provider === "phone") return "Phone";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function birthSummary(profile: Profile | null, fallback: string) {
  if (!profile?.birthDate) return fallback;
  return [profile.birthDate, profile.birthTime, profile.birthPlace]
    .filter(Boolean)
    .join(" - ");
}

function DetailLine({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 transform-gpu items-center gap-3 py-3">
      <span
        className="grid size-8 shrink-0 place-items-center rounded-[10px]"
        style={{
          background: "color-mix(in srgb, var(--hint-surface-soft) 76%, transparent)",
          border: `1px solid ${GLASS.border}`,
        }}
      >
        <Icon size={15} color={ACCENT.aqua} />
      </span>
      <span className="min-w-0">
        <span className="block font-sans text-[9.5px] font-black uppercase tracking-[0.13em]" style={{ color: GLASS.faint }}>
          {label}
        </span>
        <span className="mt-0.5 block break-words font-sans text-[12.5px] leading-snug" style={{ color: GLASS.text }}>
          {value}
        </span>
      </span>
    </div>
  );
}

function SignalStat({
  label,
  value,
  tone = ACCENT.gold,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div
      className="min-w-0 transform-gpu rounded-[14px] border px-2.5 py-2.5 text-center transition-transform duration-200 ease-out hover:-translate-y-0.5"
      style={{
        background: "color-mix(in srgb, var(--hint-surface-soft) 72%, transparent)",
        borderColor: "color-mix(in srgb, var(--hint-gold) 18%, var(--hint-border))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
    >
      <p className="truncate font-sans text-[8.5px] font-black uppercase tracking-[0.12em]" style={{ color: GLASS.faint }}>
        {label}
      </p>
      <p className="mt-1 truncate font-sans text-[13px] font-black leading-none" style={{ color: tone }}>
        {value}
      </p>
    </div>
  );
}

export function ProfileCard({
  profile,
  onEdit,
}: {
  profile: Profile | null;
  onEdit: () => void;
}) {
  const { language, t } = useLanguage();
  const account = useLocalAccount();
  const name = profile?.name ?? account?.name ?? t("me.guest");
  const initials = initialsFrom(profile?.name ?? account?.name ?? t("me.guest"));
  const sign = zodiacSign(profile?.birthDate, language);
  const accountDetail = account
    ? `${providerLabel(account.provider)} - ${accountLabel(account)}`
    : t("account.guestSession");
  const signalLabel = sign ?? "Add birth";
  const accessLabel = account ? "Verified" : "Guest";
  const memoryLabel = profile?.birthDate ? "Personal" : "General";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.992 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: [0.2, 0.78, 0.2, 1] }}
      className="transform-gpu"
    >
      <GlassPanel hero>
        <div className="flex items-start gap-3">
          <div
            className="grid size-12 shrink-0 place-items-center rounded-[16px]"
            style={{
              background: "var(--hint-me-avatar-bg)",
              border: `1px solid ${GLASS.borderStrong}`,
              boxShadow: "var(--hint-me-avatar-shadow)",
            }}
          >
            <span className="font-sans text-[17px] font-black" style={{ color: GLASS.text }}>
              {initials}
            </span>
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="min-w-0 truncate font-sans text-[22px] font-black leading-none" style={{ color: GLASS.text }}>
                {name}
              </h2>
              {account ? <ShieldCheck size={16} color="var(--hint-rose)" className="shrink-0" /> : null}
            </div>
            <p className="mt-1.5 break-words font-sans text-[12.5px] leading-snug" style={{ color: GLASS.muted }}>
              {accountDetail}
            </p>
          </div>

          <button
            type="button"
            onClick={onEdit}
            className="hint-tap-sparkle grid size-10 shrink-0 transform-gpu place-items-center rounded-full border transition-transform duration-150 active:scale-[0.96]"
            style={{
              background: "color-mix(in srgb, var(--hint-surface-soft) 86%, transparent)",
              borderColor: "color-mix(in srgb, var(--hint-gold) 24%, var(--hint-border))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.24)",
            }}
            aria-label={t("me.editProfile")}
            data-testid="button-edit-profile"
          >
            <Pencil size={15} color={ACCENT.gold} />
          </button>
        </div>

        {!account ? (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Link
              href="/app/signup"
              className="hint-soft-button hint-pressable inline-flex h-10 items-center justify-center gap-2 rounded-full font-sans text-[11.5px] font-black uppercase tracking-[0.1em]"
            >
              <UserPlus size={15} />
              {t("account.signup")}
            </Link>
            <Link
              href="/app/login?mode=login"
              className="hint-ghost-button hint-pressable inline-flex h-10 items-center justify-center gap-2 rounded-full font-sans text-[11.5px] font-black uppercase tracking-[0.1em]"
            >
              <LogIn size={15} />
              {t("account.login")}
            </Link>
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-3 gap-2">
          <SignalStat label="Signal" value={signalLabel} tone={ACCENT.aqua} />
          <SignalStat label="Access" value={accessLabel} />
          <SignalStat label="Memory" value={memoryLabel} tone="var(--hint-rose)" />
        </div>

        <div className="mt-3 border-t" style={{ borderColor: GLASS.border }}>
          <DetailLine
            icon={CalendarDays}
            label={t("account.birthProfile")}
            value={birthSummary(profile, t("account.birthMissing"))}
          />
          <div className="h-px" style={{ background: GLASS.border }} />
          <DetailLine
            icon={sign ? Sparkles : UserRound}
            label={t("nav.astrology")}
            value={sign ?? t("me.settings.profileDetailMissing")}
          />
          {profile?.birthPlace ? (
            <>
              <div className="h-px" style={{ background: GLASS.border }} />
              <DetailLine icon={MapPin} label={t("birthProfile.place")} value={profile.birthPlace} />
            </>
          ) : null}
        </div>
      </GlassPanel>
    </motion.div>
  );
}
