import { describe, expect, it } from "vitest";
import { runDraw } from "./drawEngine";
import type { NormalizedComment } from "@/types/comment";

function makeEntries(n: number): NormalizedComment[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i}`,
    platform: "youtube" as const,
    postId: "post1",
    text: `comment ${i}`,
    isReply: false,
    parentId: null,
  }));
}

describe("runDraw", () => {
  it("selects exactly the requested number of winners", async () => {
    const result = await runDraw(makeEntries(50), 3);
    expect(result.winners).toHaveLength(3);
    expect(new Set(result.winners.map((w) => w.id)).size).toBe(3);
  });

  it("never selects the same entry twice within one draw", async () => {
    const result = await runDraw(makeEntries(10), 10);
    expect(new Set(result.winners.map((w) => w.id)).size).toBe(10);
  });

  it("excludes previously selected winners when given excludeIds", async () => {
    const entries = makeEntries(5);
    const excludeIds = new Set(["c0", "c1"]);
    const result = await runDraw(entries, 3, excludeIds);
    expect(result.winners.some((w) => excludeIds.has(w.id))).toBe(false);
  });

  it("throws when asking for more winners than eligible entries remain", async () => {
    await expect(runDraw(makeEntries(2), 3)).rejects.toThrow();
  });

  it("produces the same candidate pool hash regardless of input order", async () => {
    const entries = makeEntries(10);
    const shuffled = [...entries].reverse();
    const a = await runDraw(entries, 1);
    const b = await runDraw(shuffled, 1);
    expect(a.candidatePoolHash).toBe(b.candidatePoolHash);
  });

  it("produces a different hash when the pool changes", async () => {
    const a = await runDraw(makeEntries(10), 1);
    const b = await runDraw(makeEntries(9), 1);
    expect(a.candidatePoolHash).not.toBe(b.candidatePoolHash);
  });
});
