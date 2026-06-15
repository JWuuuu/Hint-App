import { mockAstroProvider } from "./providers/mockAstroProvider";
import type { AstroProvider, AstroProviderId } from "./providers/types";

const PROVIDERS: Record<AstroProviderId, AstroProvider> = {
  mock: mockAstroProvider,
  freeastrologyapi: mockAstroProvider,
  astrologyapi: mockAstroProvider,
};

export function getAstroProvider(providerId: AstroProviderId = "mock"): AstroProvider {
  const provider = PROVIDERS[providerId] ?? mockAstroProvider;
  return provider.isConfigured() ? provider : mockAstroProvider;
}
