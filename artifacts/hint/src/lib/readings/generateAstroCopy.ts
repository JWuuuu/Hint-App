import { getAstroInterpretation } from "../ai/astroInterpretationClient";

export function generateAstroCopy(input: Parameters<typeof getAstroInterpretation>[0]) {
  return getAstroInterpretation(input);
}
