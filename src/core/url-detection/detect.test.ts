import { describe, expect, it } from "vitest";
import { detectPlatformFromUrl } from "./detect";

describe("detectPlatformFromUrl", () => {
  it("detects a YouTube URL", () => {
    expect(detectPlatformFromUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      platform: "youtube",
      resourceId: "dQw4w9WgXcQ",
    });
  });

  it("detects a Reddit URL with subreddit metadata", () => {
    const result = detectPlatformFromUrl("https://www.reddit.com/r/aww/comments/abc123/title/");
    expect(result).toMatchObject({ platform: "reddit", resourceId: "abc123", meta: { subreddit: "aww" } });
  });

  it("detects MyCP's own /y/ short link", () => {
    expect(detectPlatformFromUrl("http://localhost:3000/y/dQw4w9WgXcQ")).toEqual({
      platform: "youtube",
      resourceId: "dQw4w9WgXcQ",
    });
  });

  it("detects MyCP's own /watch?v= link", () => {
    expect(detectPlatformFromUrl("http://localhost:3000/watch?v=dQw4w9WgXcQ")).toEqual({
      platform: "youtube",
      resourceId: "dQw4w9WgXcQ",
    });
  });

  it("returns unknown for an unsupported domain", () => {
    expect(detectPlatformFromUrl("https://example.com/whatever")).toEqual({ platform: "unknown" });
  });

  it("returns unknown for a malformed URL", () => {
    expect(detectPlatformFromUrl("definitely not a url")).toEqual({ platform: "unknown" });
  });

  it("returns unknown for an internal-network-looking host (SSRF guard)", () => {
    expect(detectPlatformFromUrl("http://169.254.169.254/latest/meta-data/")).toEqual({ platform: "unknown" });
    expect(detectPlatformFromUrl("http://localhost/admin")).toEqual({ platform: "unknown" });
  });
});
