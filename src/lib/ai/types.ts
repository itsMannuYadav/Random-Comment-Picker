/**
 * Provider-agnostic AI interface (doc §34) — call sites (the /api/ai/generate
 * route, prompt builders) only ever depend on this, never on a specific
 * vendor SDK. Adding a second provider means writing one new file that
 * implements this interface and a branch in provider.ts; nothing else in
 * the app changes.
 */
export interface AiGenerateOptions {
  maxTokens?: number;
}

export interface AiProvider {
  readonly name: string;
  generate(prompt: string, options?: AiGenerateOptions): Promise<string>;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("This tool requires an AI provider connection.");
    this.name = "AiNotConfiguredError";
  }
}
