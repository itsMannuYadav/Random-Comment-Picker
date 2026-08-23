import { describe, expect, it } from "vitest";
import { secureRandomInt, secureSample } from "./secureRandom";

describe("secureRandomInt", () => {
  it("stays within [0, maxExclusive) across many draws", () => {
    for (let i = 0; i < 2000; i++) {
      const n = secureRandomInt(7);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
    }
  });

  it("handles maxExclusive = 1 deterministically", () => {
    expect(secureRandomInt(1)).toBe(0);
  });

  it("produces every value in a small range over enough draws", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(secureRandomInt(3));
    expect(seen).toEqual(new Set([0, 1, 2]));
  });
});

describe("secureSample", () => {
  it("returns exactly `count` items with no duplicates", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const sample = secureSample(items, 5);
    expect(sample).toHaveLength(5);
    expect(new Set(sample).size).toBe(5);
    for (const item of sample) expect(items).toContain(item);
  });

  it("does not mutate the input array", () => {
    const items = [1, 2, 3, 4, 5];
    const copy = [...items];
    secureSample(items, 3);
    expect(items).toEqual(copy);
  });

  it("returns all items when count equals the pool size", () => {
    const items = [1, 2, 3];
    const sample = secureSample(items, 3);
    expect(new Set(sample)).toEqual(new Set(items));
  });

  it("throws when count exceeds the pool size", () => {
    expect(() => secureSample([1, 2], 3)).toThrow();
  });

  it("distributes selection roughly evenly across positions (no obvious bias)", () => {
    const items = [0, 1, 2, 3, 4];
    const counts = [0, 0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) {
      const [picked] = secureSample(items, 1);
      counts[picked]++;
    }
    for (const count of counts) {
      expect(count).toBeGreaterThan(4000 / 5 - 250);
      expect(count).toBeLessThan(4000 / 5 + 250);
    }
  });
});
