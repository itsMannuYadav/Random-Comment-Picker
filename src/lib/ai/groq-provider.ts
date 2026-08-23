import "server-only";
import Groq from "groq-sdk";
import type { AiProvider, AiGenerateOptions } from "./types";

// GPT-OSS 120B — Groq's flagship general-purpose open-weight model as of
// this writing (console.groq.com/docs/models). Verify before changing: Groq
// regularly retires older models, and a stale ID here fails every request.
const MODEL = "openai/gpt-oss-120b";

export class GroqProvider implements AiProvider {
  readonly name = "groq";
  private client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async generate(prompt: string, options?: AiGenerateOptions): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: MODEL,
      max_tokens: options?.maxTokens ?? 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error("The AI provider returned an empty response.");
    }
    return text;
  }
}
