import { describe, expect, it } from "vitest";
import { applyFilters } from "./pipeline";
import type { NormalizedComment } from "@/types/comment";

function comment(overrides: Partial<NormalizedComment>): NormalizedComment {
  return {
    id: overrides.id ?? Math.random().toString(36),
    platform: "youtube",
    postId: "post1",
    text: "hello world",
    isReply: false,
    parentId: null,
    ...overrides,
  };
}

describe("applyFilters", () => {
  it("removes empty comments by default", () => {
    const comments = [comment({ id: "1", text: "" }), comment({ id: "2", text: "hi" })];
    const { eligible } = applyFilters(comments, {});
    expect(eligible.map((c) => c.id)).toEqual(["2"]);
  });

  it("excludes replies when replyMode is 'exclude'", () => {
    const comments = [
      comment({ id: "1", isReply: false }),
      comment({ id: "2", isReply: true, parentId: "1" }),
    ];
    const { eligible } = applyFilters(comments, { replyMode: "exclude" });
    expect(eligible.map((c) => c.id)).toEqual(["1"]);
  });

  it("filters by keyword (case-insensitive)", () => {
    const comments = [comment({ id: "1", text: "I love GIVEAWAYS" }), comment({ id: "2", text: "meh" })];
    const { eligible } = applyFilters(comments, { keyword: "giveaway" });
    expect(eligible.map((c) => c.id)).toEqual(["1"]);
  });

  it("filters by hashtag, ignoring partial word matches", () => {
    const comments = [
      comment({ id: "1", text: "entering #giveaway now" }),
      comment({ id: "2", text: "#giveaways are fun" }),
    ];
    const { eligible } = applyFilters(comments, { hashtag: "giveaway" });
    expect(eligible.map((c) => c.id)).toEqual(["1"]);
  });

  it("enforces min/max text length", () => {
    const comments = [
      comment({ id: "1", text: "hi" }),
      comment({ id: "2", text: "a reasonably long comment" }),
      comment({ id: "3", text: "x".repeat(500) }),
    ];
    const { eligible } = applyFilters(comments, { minLength: 5, maxLength: 100 });
    expect(eligible.map((c) => c.id)).toEqual(["2"]);
  });

  it("excludes links when requested", () => {
    const comments = [
      comment({ id: "1", text: "check out https://spam.example" }),
      comment({ id: "2", text: "no links here" }),
    ];
    const { eligible } = applyFilters(comments, { excludeLinks: true });
    expect(eligible.map((c) => c.id)).toEqual(["2"]);
  });

  it("removes duplicate comment text", () => {
    const comments = [
      comment({ id: "1", text: "Pick me!" }),
      comment({ id: "2", text: "pick me!  " }),
      comment({ id: "3", text: "Something else" }),
    ];
    const { eligible } = applyFilters(comments, { removeDuplicateComments: true });
    expect(eligible.map((c) => c.id)).toEqual(["1", "3"]);
  });

  it("enforces one entry per person, keeping the first occurrence", () => {
    const comments = [
      comment({ id: "1", authorId: "u1", text: "first" }),
      comment({ id: "2", authorId: "u1", text: "second" }),
      comment({ id: "3", authorId: "u2", text: "third" }),
    ];
    const { eligible } = applyFilters(comments, { onePerPerson: true });
    expect(eligible.map((c) => c.id)).toEqual(["1", "3"]);
  });

  it("filters by date range", () => {
    const comments = [
      comment({ id: "1", createdAt: "2026-01-01T00:00:00Z" }),
      comment({ id: "2", createdAt: "2026-06-01T00:00:00Z" }),
      comment({ id: "3", createdAt: "2026-12-01T00:00:00Z" }),
    ];
    const { eligible } = applyFilters(comments, { after: "2026-03-01", before: "2026-09-01" });
    expect(eligible.map((c) => c.id)).toEqual(["2"]);
  });

  it("records a step for every applied filter, in order", () => {
    const comments = [comment({ id: "1", text: "giveaway entry" })];
    const { steps } = applyFilters(comments, { keyword: "giveaway", onePerPerson: true });
    expect(steps.map((s) => s.label)).toEqual([
      "Total comments",
      "Remove empty comments",
      'Contains "giveaway"',
      "One entry per person",
    ]);
  });
});
