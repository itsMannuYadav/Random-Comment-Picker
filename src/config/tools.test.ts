import { describe, expect, it } from "vitest";
import { TOOL_REGISTRY, getPopularTools, getRelatedTools, getToolsByCategory, isToolOpenable, searchTools } from "@/config/tools";
import { TOOL_CATEGORIES } from "@/config/categories";

const categoryIds = new Set(TOOL_CATEGORIES.map((category) => category.id));

describe("tool registry", () => {
  it("has unique ids", () => {
    const ids = TOOL_REGISTRY.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only references defined categories", () => {
    for (const tool of TOOL_REGISTRY) {
      expect(categoryIds.has(tool.category)).toBe(true);
    }
  });

  it("routes every tool under /tools/", () => {
    for (const tool of TOOL_REGISTRY) {
      expect(tool.href.startsWith("/tools/")).toBe(true);
    }
  });

  it("marks exactly the tools that actually work as available", () => {
    const available = TOOL_REGISTRY.filter((tool) => tool.status === "available");
    expect(available.map((tool) => tool.id).sort()).toEqual([
      "audio-compressor",
      "audio-converter",
      "audio-metadata",
      "caption-generator",
      "comment-picker",
      "comment-reply-generator",
      "description-generator",
      "frame-extractor",
      "hashtag-generator",
      "hook-generator",
      "image-compressor",
      "image-converter",
      "image-resizer",
      "qr-generator",
      "qr-scanner",
      "social-links",
      "social-metadata",
      "thumbnail-downloader",
      "title-generator",
      "url-analyzer",
      "url-cleaner",
      "video-compressor",
      "video-converter",
      "video-downloader",
      "video-to-gif",
      "video-to-thumbnail",
    ]);
  });

  // The AI generators are implemented exactly like YouTube/Reddit: real code,
  // gated by a server env var, not a structural gap like Instagram's missing
  // OAuth flow — so "available" (not "requires-connection") is the accurate
  // status. No registry entry currently uses "requires-connection"; the
  // status stays defined for a future tool with a genuine connection gap.
  it("has no tool marked requires-connection right now", () => {
    const gated = TOOL_REGISTRY.filter((tool) => tool.status === "requires-connection");
    expect(gated).toEqual([]);
  });
});

describe("isToolOpenable", () => {
  it("treats available, beta and requires-connection as openable", () => {
    expect(isToolOpenable("available")).toBe(true);
    expect(isToolOpenable("beta")).toBe(true);
    expect(isToolOpenable("requires-connection")).toBe(true);
  });

  it("treats coming-soon as not openable", () => {
    expect(isToolOpenable("coming-soon")).toBe(false);
  });
});

describe("getToolsByCategory", () => {
  it("returns only tools in the requested category", () => {
    const results = getToolsByCategory("images");
    expect(results.length).toBeGreaterThan(0);
    for (const tool of results) {
      expect(tool.category).toBe("images");
    }
  });
});

describe("getPopularTools", () => {
  it("returns only tools flagged popular", () => {
    const results = getPopularTools();
    expect(results.length).toBeGreaterThan(0);
    for (const tool of results) {
      expect(tool.popular).toBe(true);
    }
  });
});

describe("searchTools", () => {
  it("matches by name", () => {
    const results = searchTools("comment picker");
    expect(results.some((tool) => tool.id === "comment-picker")).toBe(true);
  });

  it("matches by keyword substring across multiple tools", () => {
    const results = searchTools("thumbnail");
    expect(results.map((tool) => tool.id)).toEqual(
      expect.arrayContaining(["thumbnail-downloader", "thumbnail-checker", "video-to-thumbnail"])
    );
  });

  it("returns no results for an empty query", () => {
    expect(searchTools("   ")).toEqual([]);
  });

  it("is case-insensitive", () => {
    const results = searchTools("COMPRESS");
    expect(results.length).toBeGreaterThan(0);
  });
});

describe("getRelatedTools", () => {
  it("never includes the tool itself", () => {
    const results = getRelatedTools("comment-picker");
    expect(results.some((tool) => tool.id === "comment-picker")).toBe(false);
  });

  it("prefers same-category tools before topping up with popular ones", () => {
    const results = getRelatedTools("comment-picker", 2);
    expect(results.length).toBe(2);
    expect(results.every((tool) => tool.category === "engage")).toBe(true);
  });

  it("tops up with popular tools from other categories when the category runs out", () => {
    const results = getRelatedTools("comment-picker", 3);
    expect(results.length).toBe(3);
    expect(results.some((tool) => tool.category !== "engage")).toBe(true);
  });

  it("returns an empty array for an unknown id", () => {
    expect(getRelatedTools("does-not-exist")).toEqual([]);
  });
});
