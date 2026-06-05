import { Link } from "wouter";

export const LEGAL_DISCLAIMER =
  "For entertainment and self-reflection only. This is not medical, legal, financial, or mental health advice.";

export const CONTACT_EMAIL = "support@hint.app";

export function LegalNotice() {
  return (
    <aside
      className="fixed inset-x-3 bottom-[116px] z-40 mx-auto max-w-6xl rounded-[8px] border px-3 py-2 md:bottom-auto md:top-[72px] md:flex md:items-center md:justify-between md:gap-4"
      style={{
        color: "var(--hint-muted)",
        background: "color-mix(in srgb, var(--hint-bg) 68%, transparent)",
        borderColor: "var(--hint-border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <p className="font-sans text-[10.5px] leading-snug md:text-[11px]">
        {LEGAL_DISCLAIMER}
      </p>
      <nav className="mt-1.5 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[10px] font-medium uppercase tracking-[0.12em] md:mt-0">
        <Link href="/privacy" style={{ color: "var(--hint-text)" }}>
          Privacy Policy
        </Link>
        <Link href="/terms" style={{ color: "var(--hint-text)" }}>
          Terms
        </Link>
        <Link href="/contact" style={{ color: "var(--hint-text)" }}>
          Contact
        </Link>
      </nav>
    </aside>
  );
}
