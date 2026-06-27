import { useState } from "react";
import type { DailyTransit } from "../../lib/astro/providers/types";

export function SkyDeckEvidenceDrawer({ evidence }: { evidence: DailyTransit[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="skydeck-evidence">
      <button type="button" className="skydeck-evidence__toggle" onClick={() => setOpen((value) => !value)}>
        Sky Evidence
        <span aria-hidden="true">{open ? "Close" : "Open"}</span>
      </button>
      {open && (
        <div className="skydeck-evidence__body">
          {evidence.map((signal) => (
            <div key={signal.id} className="skydeck-evidence__row">
              <strong>{signal.label}</strong>
              <span>{signal.themes.slice(0, 2).join(" · ")}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
