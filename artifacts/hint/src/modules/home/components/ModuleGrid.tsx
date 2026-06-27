import { getFeaturedModules } from "../data/modules";
import { ModuleTileWrapper } from "./ModuleTile";
import type { ModuleDefinition } from "../types/home.types";

interface Props {
  /** Outer reveal delay (seconds) — tiles fade in after this. */
  delay?: number;
  /** Modules to render. Defaults to the curated home rail subset. */
  modules?: ModuleDefinition[];
}

export function ModuleGrid({ delay = 0, modules }: Props) {
  const items = modules ?? getFeaturedModules();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((m, i) => (
        <ModuleTileWrapper key={m.id} module={m} index={i} baseDelay={delay} />
      ))}
    </div>
  );
}
