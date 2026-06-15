export async function getAstroInterpretation(input: {
  kind: "signs" | "transit" | "synastry" | "reportPreview";
  data: unknown;
  tone?: "warm" | "direct" | "mirror";
}) {
  try {
    const response = await fetch("/api/ai/astro-interpretation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("AI_FALLBACK");
    return response.json() as Promise<{ mode: "live" | "fallback"; text?: string; bullets?: string[] }>;
  } catch {
    return { mode: "fallback" as const, text: "The strongest signal becomes useful when it stays grounded in evidence." };
  }
}
