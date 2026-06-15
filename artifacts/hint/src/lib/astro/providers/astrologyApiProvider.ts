import { mockAstroProvider } from "./mockAstroProvider";
import type { AstroProvider } from "./types";

export const astrologyApiProvider: AstroProvider = {
  ...mockAstroProvider,
  id: "astrologyapi",
  label: "AstrologyAPI adapter",
  isConfigured: () => false,
};
