export type GeneratorKind = "caption" | "title" | "hashtag" | "hook" | "description" | "reply";

export interface GeneratorInput {
  topic?: string;
  platform?: string;
  tone?: string;
  audience?: string;
  comment?: string;
}

export type GeneratorOutput =
  | { kind: "caption"; caption: string; hashtags: string[]; cta: string }
  | { kind: "title"; titles: string[] }
  | { kind: "hashtag"; hashtags: string[] }
  | { kind: "hook"; hooks: string[] }
  | { kind: "description"; description: string }
  | { kind: "reply"; replies: string[] };

function platformHint(platform?: string): string {
  return platform ? ` for ${platform}` : "";
}

/** Every prompt ends with an explicit JSON-only instruction so the response can be parsed reliably. */
export function buildPrompt(kind: GeneratorKind, input: GeneratorInput): string {
  switch (kind) {
    case "caption":
      return (
        `Write one social media caption${platformHint(input.platform)} about: "${input.topic}".` +
        (input.tone ? ` Tone: ${input.tone}.` : "") +
        (input.audience ? ` Audience: ${input.audience}.` : "") +
        `\nRespond with ONLY valid JSON, no markdown fences, matching exactly this shape: {"caption": string, "hashtags": string[], "cta": string}`
      );
    case "title":
      return (
        `Generate 5 distinct YouTube title concepts for a video about: "${input.topic}".` +
        (input.tone ? ` Tone: ${input.tone}.` : "") +
        `\nRespond with ONLY valid JSON: {"titles": string[]}`
      );
    case "hashtag":
      return (
        `Suggest 10 relevant hashtags${platformHint(input.platform)} for content about: "${input.topic}".` +
        `\nRespond with ONLY valid JSON: {"hashtags": string[]}`
      );
    case "hook":
      return (
        `Write 5 distinct opening hooks (the first spoken or written line) for content about: "${input.topic}".` +
        (input.tone ? ` Tone: ${input.tone}.` : "") +
        `\nRespond with ONLY valid JSON: {"hooks": string[]}`
      );
    case "description":
      return (
        `Write one ${input.platform || "YouTube"} description for content about: "${input.topic}".` +
        (input.audience ? ` Audience: ${input.audience}.` : "") +
        `\nRespond with ONLY valid JSON: {"description": string}`
      );
    case "reply":
      return (
        `Suggest 3 distinct, friendly, on-brand replies to this comment: "${input.comment}".` +
        `\nRespond with ONLY valid JSON: {"replies": string[]}`
      );
  }
}

/** Strips accidental markdown code fences before parsing — some models wrap JSON in ```json anyway despite instructions. */
function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

export function parseGeneratorResponse(kind: GeneratorKind, raw: string): GeneratorOutput {
  let data: unknown;
  try {
    data = JSON.parse(stripFences(raw));
  } catch {
    throw new Error("The AI response couldn't be read. Please try again.");
  }

  if (typeof data !== "object" || data === null) {
    throw new Error("The AI response couldn't be read. Please try again.");
  }
  const obj = data as Record<string, unknown>;

  switch (kind) {
    case "caption":
      if (typeof obj.caption !== "string" || !Array.isArray(obj.hashtags) || typeof obj.cta !== "string") break;
      return { kind, caption: obj.caption, hashtags: obj.hashtags.filter((h): h is string => typeof h === "string"), cta: obj.cta };
    case "title":
      if (!Array.isArray(obj.titles)) break;
      return { kind, titles: obj.titles.filter((t): t is string => typeof t === "string") };
    case "hashtag":
      if (!Array.isArray(obj.hashtags)) break;
      return { kind, hashtags: obj.hashtags.filter((h): h is string => typeof h === "string") };
    case "hook":
      if (!Array.isArray(obj.hooks)) break;
      return { kind, hooks: obj.hooks.filter((h): h is string => typeof h === "string") };
    case "description":
      if (typeof obj.description !== "string") break;
      return { kind, description: obj.description };
    case "reply":
      if (!Array.isArray(obj.replies)) break;
      return { kind, replies: obj.replies.filter((r): r is string => typeof r === "string") };
  }

  throw new Error("The AI response wasn't in the expected format. Please try again.");
}
