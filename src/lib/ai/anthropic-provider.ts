import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AiProvider, AiGenerateOptions } from "./types";

const MODEL = "claude-opus-5";

export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string, options?: AiGenerateOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: options?.maxTokens ?? 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("The AI provider returned an empty response.");
    }
    return textBlock.text;
  }
}
