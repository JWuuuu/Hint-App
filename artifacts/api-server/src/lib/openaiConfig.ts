import OpenAI from "openai";

export const openaiApiKey =
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;

export const openaiBaseURL =
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ??
  process.env.OPENAI_BASE_URL ??
  undefined;

export const openaiModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export const openaiTtsModel =
  process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";

export const openaiTtsVoice = process.env.OPENAI_TTS_VOICE ?? "coral";

export function requireOpenAIKey(): string {
  if (!openaiApiKey) {
    throw new Error("Missing OpenAI credentials. Set OPENAI_API_KEY.");
  }

  return openaiApiKey;
}

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  openaiClient ??= new OpenAI({
    apiKey: requireOpenAIKey(),
    baseURL: openaiBaseURL,
    maxRetries: 0,
    timeout: 20_000,
  });

  return openaiClient;
}
