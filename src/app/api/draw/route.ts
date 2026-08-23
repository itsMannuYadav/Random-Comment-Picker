import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyFilters } from "@/core/comment-engine/pipeline";
import { runDraw } from "@/core/random/drawEngine";
import { encodeDrawToken, generateFriendlyDrawId } from "@/core/verification/token";
import type { DrawRecord } from "@/core/verification/types";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { checkRateLimit, getClientKey } from "@/core/rate-limit/limiter";
import { ALL_PLATFORMS, type Platform } from "@/types/platform";

const RATE_LIMIT = 20; // draws per window, per IP
const RATE_WINDOW_MS = 60_000;

const platformEnum = z.enum(ALL_PLATFORMS as [Platform, ...Platform[]]);
const shortString = z.string().max(2000);

const commentSchema = z.object({
  id: shortString,
  platform: platformEnum,
  postId: shortString,
  authorId: shortString.optional(),
  authorName: shortString.optional(),
  authorUsername: shortString.optional(),
  authorAvatarUrl: shortString.optional(),
  text: z.string().max(15_000),
  createdAt: shortString.optional(),
  updatedAt: shortString.optional(),
  likeCount: z.number().optional(),
  score: z.number().optional(),
  replyCount: z.number().optional(),
  parentId: shortString.nullable().optional(),
  isReply: z.boolean(),
  permalink: shortString.optional(),
});

const filtersSchema = z.object({
  onePerPerson: z.boolean().optional(),
  replyMode: z.enum(["include", "exclude", "only"]).optional(),
  removeDuplicateComments: z.boolean().optional(),
  keyword: z.string().max(200).optional(),
  hashtag: z.string().max(200).optional(),
  phrase: z.string().max(200).optional(),
  minLength: z.number().min(0).max(15_000).optional(),
  maxLength: z.number().min(0).max(15_000).optional(),
  excludeLinks: z.boolean().optional(),
  excludeEmpty: z.boolean().optional(),
  blockedWords: z.array(z.string().max(100)).max(100).optional(),
  after: shortString.optional(),
  before: shortString.optional(),
});

const bodySchema = z.object({
  platform: platformEnum,
  sourceId: shortString,
  sourceUrl: shortString,
  sourceTitle: shortString.optional(),
  comments: z.array(commentSchema).max(200_000),
  filters: filtersSchema,
  winnerCount: z.number().int().min(1).max(1000),
  previousWinners: z.array(commentSchema).max(1000).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const clientKey = getClientKey(req.headers);
    const rate = checkRateLimit(`draw:${clientKey}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      throw new ApiError("rate-limited", "You're running draws too quickly. Please slow down.");
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError("invalid-request", "The draw request was malformed.");
    }
    const { platform, sourceId, sourceUrl, sourceTitle, comments, filters, winnerCount, previousWinners } =
      parsed.data;

    // Never trust client-computed eligibility — recompute from the raw comment set server-side.
    const { eligible } = applyFilters(comments, filters);

    const excludeIds = new Set(previousWinners.map((w) => w.id));
    const result = await runDraw(eligible, winnerCount, excludeIds);

    const allWinners = [...previousWinners, ...result.winners];

    const record: DrawRecord = {
      id: generateFriendlyDrawId(),
      platform,
      sourceId,
      sourceUrl,
      sourceTitle,
      totalComments: comments.length,
      eligibleEntries: result.eligibleEntries,
      filters,
      winners: allWinners,
      candidatePoolHash: result.candidatePoolHash,
      algorithmVersion: result.algorithmVersion,
      createdAt: new Date().toISOString(),
    };

    const token = await encodeDrawToken(record);

    return NextResponse.json({ token, drawId: record.id, record });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
