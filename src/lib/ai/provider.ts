import "server-only";
import { GroqProvider } from "./groq-provider";
import type { AiProvider } from "./types";

/**
 * The one place that knows which vendor is behind AI_PROVIDER_API_KEY.
 * Currently Groq (see groq-provider.ts) — anthropic-provider.ts is a second,
 * fully working implementation of the same AiProvider interface kept for
 * reference; swapping the active vendor is a one-line change here, and
 * every call site (the /api/ai/generate route, the generator pages)
 * depends only on the AiProvider interface, never on a specific SDK.
 */
export function getAiProvider(): AiProvider | null {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) return null;
  return new GroqProvider(apiKey);
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_PROVIDER_API_KEY);
}
