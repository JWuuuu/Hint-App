import { Link } from "wouter";
import { Info, Mail, ShieldCheck, ScrollText } from "lucide-react";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, GlassPanel, ScreenHeader, SectionLabel } from "../../components/app/AppChrome";
import { CONTACT_EMAIL } from "../../components/LegalNotice";
import { useLanguage } from "../../lib/i18n";

function LegalText({ children }: { children: string }) {
  return (
    <p className="font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
      {children}
    </p>
  );
}

function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 font-sans text-[13px] leading-relaxed" style={{ color: GLASS.muted }}>
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full" style={{ background: ACCENT.gold }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function LegalLinks() {
  const { t } = useLanguage();
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {[
        { href: "/about", label: t("legal.aboutTitle") },
        { href: "/privacy", label: t("me.privacyPolicy") },
        { href: "/terms", label: t("me.terms") },
        { href: "/disclaimer", label: t("legal.disclaimerTitle") },
        { href: "/contact", label: t("me.contact") },
      ].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex h-9 items-center justify-center rounded-[8px] px-3 font-sans text-[12px] transition-opacity hover:opacity-80"
          style={{
            background: "rgba(255,255,255,0.045)",
            border: `1px solid ${GLASS.border}`,
            color: GLASS.text,
          }}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function DisclaimerPanel() {
  const { t } = useLanguage();
  return (
    <GlassPanel hero className="mb-6">
      <p className="font-serif text-[16px] leading-snug" style={{ color: GLASS.text }}>
        {t("legal.disclaimer")}
      </p>
    </GlassPanel>
  );
}

export function PrivacyPolicyView() {
  const { t } = useLanguage();
  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("legal.eyebrow")}
        title={t("me.privacyPolicy")}
        subtitle={t("legal.privacySubtitle")}
        sigil={ShieldCheck}
        backHref="/app/profile"
        backLabel={t("nav.me")}
      />
      <DisclaimerPanel />

      <section className="mb-6">
        <SectionLabel>{t("legal.privacyBasics")}</SectionLabel>
        <GlassPanel>
          <LegalList
            items={[
              t("legal.privacy.item1"),
              t("legal.privacy.item2"),
              t("legal.privacy.item3"),
              t("legal.privacy.item4"),
            ]}
          />
        </GlassPanel>
      </section>

      <LegalLinks />
    </AppScreen>
  );
}

export function AboutView() {
  const { t } = useLanguage();
  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("legal.aboutEyebrow")}
        title={t("legal.aboutTitle")}
        subtitle={t("legal.aboutSubtitle")}
        sigil={Info}
        backHref="/app/profile"
        backLabel={t("nav.me")}
      />
      <DisclaimerPanel />

      <section className="mb-6">
        <SectionLabel>{t("legal.whatHintIs")}</SectionLabel>
        <GlassPanel>
          <LegalList
            items={[
              t("legal.about.item1"),
              t("legal.about.item2"),
              t("legal.about.item3"),
              t("legal.about.item4"),
            ]}
          />
        </GlassPanel>
      </section>

      <LegalLinks />
    </AppScreen>
  );
}

export function TermsView() {
  const { t } = useLanguage();
  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("legal.eyebrow")}
        title={t("me.terms")}
        subtitle={t("legal.termsSubtitle")}
        sigil={ScrollText}
        backHref="/app/profile"
        backLabel={t("nav.me")}
      />
      <DisclaimerPanel />

      <section className="mb-6">
        <SectionLabel>{t("legal.useOfHint")}</SectionLabel>
        <GlassPanel>
          <LegalList
            items={[
              t("legal.terms.item1"),
              t("legal.terms.item2"),
              t("legal.terms.item3"),
              t("legal.terms.item4"),
            ]}
          />
        </GlassPanel>
      </section>

      <LegalLinks />
    </AppScreen>
  );
}

export function DisclaimerView() {
  const { t } = useLanguage();
  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("legal.eyebrow")}
        title={t("legal.disclaimerTitle")}
        subtitle={t("legal.disclaimerSubtitle")}
        sigil={ShieldCheck}
        backHref="/app/profile"
        backLabel={t("nav.me")}
      />
      <DisclaimerPanel />

      <section className="mb-6">
        <SectionLabel>{t("legal.useBoundaries")}</SectionLabel>
        <GlassPanel>
          <LegalList
            items={[
              t("legal.disclaimer.item1"),
              t("legal.disclaimer.item2"),
              t("legal.disclaimer.item3"),
              t("legal.disclaimer.item4"),
            ]}
          />
        </GlassPanel>
      </section>

      <LegalLinks />
    </AppScreen>
  );
}

export function ContactView() {
  const { t } = useLanguage();
  return (
    <AppScreen>
      <ScreenHeader
        eyebrow={t("me.support")}
        title={t("me.contact")}
        subtitle={t("legal.contactSubtitle")}
        sigil={Mail}
        backHref="/app/profile"
        backLabel={t("nav.me")}
      />
      <DisclaimerPanel />

      <section className="mb-6">
        <SectionLabel>{t("legal.contactEmail")}</SectionLabel>
        <GlassPanel>
          <LegalText>
            {t("legal.contactBody")}
          </LegalText>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] font-serif text-[12px] uppercase tracking-[0.24em] transition-opacity hover:opacity-90"
            style={{
              background: "rgba(100,156,158,0.16)",
              border: "1px solid rgba(100,156,158,0.32)",
              color: "rgba(150,206,208,0.95)",
            }}
          >
            {t("legal.emailSupport")}
          </a>
        </GlassPanel>
      </section>

      <LegalLinks />
    </AppScreen>
  );
}
