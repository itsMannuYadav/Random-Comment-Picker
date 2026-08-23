import type { NormalizedComment } from "@/types/comment";
import type { DrawFilters } from "./types";

const URL_RE = /https?:\/\/\S+|www\.\S+/i;
const HASHTAG_RE_BASE = /#[\p{L}\p{N}_]+/gu;

function normalizeForDedupe(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function applyReplyMode(comments: NormalizedComment[], mode: NonNullable<DrawFilters["replyMode"]>): NormalizedComment[] {
  if (mode === "exclude") return comments.filter((c) => !c.isReply);
  if (mode === "only") return comments.filter((c) => c.isReply);
  return comments;
}

function applyExcludeEmpty(comments: NormalizedComment[]): NormalizedComment[] {
  return comments.filter((c) => c.text.trim().length > 0);
}

function applyExcludeLinks(comments: NormalizedComment[]): NormalizedComment[] {
  return comments.filter((c) => !URL_RE.test(c.text));
}

function applyBlockedWords(comments: NormalizedComment[], blocked: string[]): NormalizedComment[] {
  const lowered = blocked.map((w) => w.toLowerCase()).filter(Boolean);
  if (lowered.length === 0) return comments;
  return comments.filter((c) => {
    const text = c.text.toLowerCase();
    return !lowered.some((w) => text.includes(w));
  });
}

function applyKeyword(comments: NormalizedComment[], keyword: string): NormalizedComment[] {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return comments;
  return comments.filter((c) => c.text.toLowerCase().includes(needle));
}

function applyPhrase(comments: NormalizedComment[], phrase: string): NormalizedComment[] {
  return applyKeyword(comments, phrase);
}

function applyHashtag(comments: NormalizedComment[], hashtag: string): NormalizedComment[] {
  const needle = hashtag.trim().replace(/^#/, "").toLowerCase();
  if (!needle) return comments;
  return comments.filter((c) => {
    const tags = c.text.match(HASHTAG_RE_BASE) ?? [];
    return tags.some((tag) => tag.slice(1).toLowerCase() === needle);
  });
}

function applyLength(comments: NormalizedComment[], min?: number, max?: number): NormalizedComment[] {
  return comments.filter((c) => {
    const len = c.text.trim().length;
    if (min !== undefined && len < min) return false;
    if (max !== undefined && len > max) return false;
    return true;
  });
}

function applyDateRange(comments: NormalizedComment[], after?: string, before?: string): NormalizedComment[] {
  const afterTime = after ? new Date(after).getTime() : undefined;
  const beforeTime = before ? new Date(before).getTime() : undefined;
  if (afterTime === undefined && beforeTime === undefined) return comments;

  return comments.filter((c) => {
    if (!c.createdAt) return false;
    const t = new Date(c.createdAt).getTime();
    if (afterTime !== undefined && t < afterTime) return false;
    if (beforeTime !== undefined && t > beforeTime) return false;
    return true;
  });
}

function applyRemoveDuplicateComments(comments: NormalizedComment[]): NormalizedComment[] {
  const seen = new Set<string>();
  return comments.filter((c) => {
    const key = normalizeForDedupe(c.text);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyOnePerPerson(comments: NormalizedComment[]): NormalizedComment[] {
  const seen = new Set<string>();
  return comments.filter((c) => {
    const key = c.authorId || c.authorUsername || c.authorName;
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const filterSteps = {
  replyMode: applyReplyMode,
  excludeEmpty: applyExcludeEmpty,
  excludeLinks: applyExcludeLinks,
  blockedWords: applyBlockedWords,
  keyword: applyKeyword,
  phrase: applyPhrase,
  hashtag: applyHashtag,
  length: applyLength,
  dateRange: applyDateRange,
  removeDuplicateComments: applyRemoveDuplicateComments,
  onePerPerson: applyOnePerPerson,
};
