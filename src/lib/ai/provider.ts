import "server-only";
import { AnthropicProvider } from "./anthropic-provider";
import type { AiProvider } from "./types";

/**
 * The one place that knows which vendor is behind AI_PROVIDER_API_KEY.
 * Swapping providers (or adding a second one selected by a different env
 * var) only ever touches this function — every call site depends on the
 * AiProvider interface, never on a specific SDK.
 */
export function getAiProvider(): AiProvider | null {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) return null;
  return new AnthropicProvider(apiKey);
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_PROVIDER_API_KEY);
}
