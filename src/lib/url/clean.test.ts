import { describe, expect, it } from "vitest";
import { cleanUrl } from "./clean";

describe("cleanUrl", () => {
  it("strips utm params", () => {
    const result = cleanUrl("https://youtube.com/watch?v=ABC123&utm_source=test&utm_medium=social");
    expect(result?.clean).toBe("https://youtube.com/watch?v=ABC123");
    expect(result?.removedParams.sort()).toEqual(["utm_medium", "utm_source"]);
  });

  it("keeps content params untouched", () => {
    const result = cleanUrl("https://youtube.com/watch?v=ABC123&t=30");
    expect(result?.clean).toBe("https://youtube.com/watch?v=ABC123&t=30");
    expect(result?.removedParams).toEqual([]);
  });

  it("strips fbclid and gclid", () => {
    const result = cleanUrl("https://example.com/post?fbclid=xyz&gclid=abc");
    expect(result?.clean).toBe("https://example.com/post");
  });

  it("returns null for an invalid URL", () => {
    expect(cleanUrl("not a url")).toBeNull();
  });

  it("returns null for a non-http(s) protocol", () => {
    expect(cleanUrl("javascript:alert(1)")).toBeNull();
  });

  it("returns an unchanged URL when there's nothing to strip", () => {
    const result = cleanUrl("https://example.com/page");
    expect(result?.clean).toBe("https://example.com/page");
    expect(result?.removedParams).toEqual([]);
  });
});
