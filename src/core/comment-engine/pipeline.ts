import type { NormalizedComment } from "@/types/comment";
import { filterSteps } from "./filters";
import type { DrawFilters, FilterResult, FilterStep } from "./types";

/**
 * Runs the full filter pipeline and records the comment count after each
 * stage, so the UI can show a transparent "12,483 → 11,204 after dedup →
 * 9,821 eligible" breakdown instead of a single opaque number.
 */
export function applyFilters(comments: NormalizedComment[], filters: DrawFilters): FilterResult {
  const steps: FilterStep[] = [{ label: "Total comments", count: comments.length }];
  let current = comments;

  current = filterSteps.excludeEmpty(current);
  steps.push({ label: "Remove empty comments", count: current.length });

  current = filterSteps.replyMode(current, filters.replyMode ?? "include");
  if (filters.replyMode && filters.replyMode !== "include") {
    steps.push({
      label: filters.replyMode === "exclude" ? "Exclude replies" : "Replies only",
      count: current.length,
    });
  }

  if (filters.excludeLinks) {
    current = filterSteps.excludeLinks(current);
    steps.push({ label: "Exclude links", count: current.length });
  }

  if (filters.blockedWords && filters.blockedWords.length > 0) {
    current = filterSteps.blockedWords(current, filters.blockedWords);
    steps.push({ label: "Remove blocked words", count: current.length });
  }

  if (filters.keyword) {
    current = filterSteps.keyword(current, filters.keyword);
    steps.push({ label: `Contains "${filters.keyword}"`, count: current.length });
  }

  if (filters.phrase) {
    current = filterSteps.phrase(current, filters.phrase);
    steps.push({ label: `Contains phrase`, count: current.length });
  }

  if (filters.hashtag) {
    current = filterSteps.hashtag(current, filters.hashtag);
    steps.push({ label: `Has hashtag #${filters.hashtag.replace(/^#/, "")}`, count: current.length });
  }

  if (filters.minLength !== undefined || filters.maxLength !== undefined) {
    current = filterSteps.length(current, filters.minLength, filters.maxLength);
    steps.push({ label: "Text length", count: current.length });
  }

  if (filters.after || filters.before) {
    current = filterSteps.dateRange(current, filters.after, filters.before);
    steps.push({ label: "Date range", count: current.length });
  }

  if (filters.removeDuplicateComments) {
    current = filterSteps.removeDuplicateComments(current);
    steps.push({ label: "Remove duplicate comments", count: current.length });
  }

  if (filters.onePerPerson) {
    current = filterSteps.onePerPerson(current);
    steps.push({ label: "One entry per person", count: current.length });
  }

  return { eligible: current, steps };
}
