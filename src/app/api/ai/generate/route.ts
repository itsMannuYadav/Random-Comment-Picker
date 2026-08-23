import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/provider";
import { buildPrompt, parseGeneratorResponse } from "@/lib/ai/prompts";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { checkRateLimit, getClientKey } from "@/core/rate-limit/limiter";

const KINDS = ["caption", "title", "hashtag", "hook", "description", "reply"] as const;

const bodySchema = z.object({
  kind: z.enum(KINDS),
  input: z.object({
    topic: z.string().trim().max(500).optional(),
    platform: z.string().trim().max(50).optional(),
    tone: z.string().trim().max(50).optional(),
    audience: z.string().trim().max(200).optional(),
    comment: z.string().trim().max(2000).optional(),
  }),
});

// AI calls carry real per-request cost, unlike everything else in the app — kept tighter than the platform API limits.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const clientKey = getClientKey(req.headers);
    const rate = checkRateLimit(`ai:generate:${clientKey}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      throw new ApiError("rate-limited", "You're generating too quickly. Please slow down.");
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError("invalid-request", "Please provide valid input.");
    }
    const { kind, input } = parsed.data;

    if (kind === "reply" && !input.comment) {
      throw new ApiError("invalid-request", "Please provide a comment to reply to.");
    }
    if (kind !== "reply" && !input.topic) {
      throw new ApiError("invalid-request", "Please provide a topic.");
    }

    const provider = getAiProvider();
    if (!provider) {
      throw new ApiError("not-configured", "This tool requires an AI provider connection.");
    }

    const prompt = buildPrompt(kind, input);
    const raw = await provider.generate(prompt, { maxTokens: 1024 });
    const result = parseGeneratorResponse(kind, raw);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
