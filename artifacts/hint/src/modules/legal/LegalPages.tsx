import { Link } from "wouter";
import { Mail, ShieldCheck, ScrollText } from "lucide-react";
import { ACCENT, GLASS } from "../hold/atmosphere";
import { AppScreen, GlassPanel, ScreenHeader, SectionLabel } from "../../components/app/AppChrome";
import { CONTACT_EMAIL, LEGAL_DISCLAIMER } from "../../components/LegalNotice";

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
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms" },
        { href: "/disclaimer", label: "Disclaimer" },
        { href: "/contact", label: "Contact" },
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
  return (
    <GlassPanel hero className="mb-6">
      <p className="font-serif text-[16px] leading-snug" style={{ color: GLASS.text }}>
        {LEGAL_DISCLAIMER}
      </p>
    </GlassPanel>
  );
}

export function PrivacyPolicyView() {
  return (
    <AppScreen>
      <ScreenHeader
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="A simple beta summary of what Hint stores and how it is used."
        sigil={ShieldCheck}
        backHref="/me"
        backLabel="Me"
      />
      <DisclaimerPanel />

      <section className="mb-6">
        <SectionLabel>Privacy Basics</SectionLabel>
        <GlassPanel>
          <LegalList
            items={[
              "Hint uses an anonymous browser id to keep your profile, readings, daily pulls, and journal entries connected to this device.",
              "Profile details and emotional notes are used to make the app feel continuous and personal inside your own Hint experience.",
              "You can clear local and saved Hint history from the Me page settings.",
              `For beta support or privacy questions, contact ${CONTACT_EMAIL}.`,
            ]}
          />
        </GlassPanel>
      </section>

      <LegalLinks />
    </AppScreen>
  );
}

export function TermsView() {
  return (
    <AppScreen>
      <ScreenHeader
        eyebrow="Legal"
        title="Terms"
        subtitle="Basic beta terms for using Hint."
        sigil={ScrollText}
        backHref="/me"
        backLabel="Me"
      />
      <DisclaimerPanel />

      <section className="mb-6">
        <SectionLabel>Use Of Hint</SectionLabel>
        <GlassPanel>
          <LegalList
            items={[
              "Hint is a reflective tarot and journaling experience, not a professional advice service.",
              "Do not use Hint as a substitute for medical care, therapy, legal advice, financial advice, emergency support, or crisis services.",
              "You are responsible for the choices you make outside the app.",
              "Beta features may change, break, or be removed as the product develops.",
            ]}
          />
        </GlassPanel>
      </section>

      <LegalLinks />
    </AppScreen>
  );
}

export function DisclaimerView() {
  return (
    <AppScreen>
      <ScreenHeader
        eyebrow="Legal"
        title="Disclaimer"
        subtitle="The boundaries for using Hint during beta."
        sigil={ShieldCheck}
        backHref="/me"
        backLabel="Me"
      />
      <DisclaimerPanel />

      <section className="mb-6">
        <SectionLabel>Use Boundaries</SectionLabel>
        <GlassPanel>
          <LegalList
            items={[
              "Hint is for entertainment, journaling, tarot-inspired reflection, and self-inquiry.",
              "Hint does not diagnose, treat, advise, or replace qualified medical, mental health, legal, financial, or emergency professionals.",
              "Do not use Hint as the only basis for decisions involving safety, health, money, legal rights, employment, housing, or urgent personal risk.",
              "If you are in immediate danger or crisis, contact local emergency services or a qualified crisis resource.",
            ]}
          />
        </GlassPanel>
      </section>

      <LegalLinks />
    </AppScreen>
  );
}

export function ContactView() {
  return (
    <AppScreen>
      <ScreenHeader
        eyebrow="Support"
        title="Contact"
        subtitle="Questions, privacy requests, and beta feedback can start here."
        sigil={Mail}
        backHref="/me"
        backLabel="Me"
      />
      <DisclaimerPanel />

      <section className="mb-6">
        <SectionLabel>Contact Email</SectionLabel>
        <GlassPanel>
          <LegalText>
            {`For support, privacy questions, feedback, or beta issues, email ${CONTACT_EMAIL}.`}
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
            Email Support
          </a>
        </GlassPanel>
      </section>

      <LegalLinks />
    </AppScreen>
  );
}
