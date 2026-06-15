import { mockAstroProvider } from "./mockAstroProvider";
import type { AstroProvider } from "./types";

export const freeAstrologyApiProvider: AstroProvider = {
  ...mockAstroProvider,
  id: "freeastrologyapi",
  label: "FreeAstrologyAPI adapter",
  isConfigured: () => false,
};
