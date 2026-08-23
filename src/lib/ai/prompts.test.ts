import { describe, expect, it } from "vitest";
import { buildPrompt, parseGeneratorResponse } from "./prompts";

describe("buildPrompt", () => {
  it("includes the topic and asks for JSON only", () => {
    const prompt = buildPrompt("caption", { topic: "a new coffee shop opening" });
    expect(prompt).toContain("a new coffee shop opening");
    expect(prompt).toContain("ONLY valid JSON");
  });

  it("includes optional platform/tone/audience when provided", () => {
    const prompt = buildPrompt("caption", { topic: "launch", platform: "Instagram", tone: "Bold", audience: "Gen Z" });
    expect(prompt).toContain("Instagram");
    expect(prompt).toContain("Bold");
    expect(prompt).toContain("Gen Z");
  });

  it("uses the comment field for reply prompts, not topic", () => {
    const prompt = buildPrompt("reply", { comment: "Love this!" });
    expect(prompt).toContain("Love this!");
  });
});

describe("parseGeneratorResponse", () => {
  it("parses a caption response", () => {
    const raw = JSON.stringify({ caption: "Great day!", hashtags: ["fun", "vibes"], cta: "Follow for more" });
    const result = parseGeneratorResponse("caption", raw);
    expect(result).toEqual({ kind: "caption", caption: "Great day!", hashtags: ["fun", "vibes"], cta: "Follow for more" });
  });

  it("parses a titles response", () => {
    const raw = JSON.stringify({ titles: ["Title A", "Title B"] });
    expect(parseGeneratorResponse("title", raw)).toEqual({ kind: "title", titles: ["Title A", "Title B"] });
  });

  it("strips markdown code fences before parsing", () => {
    const raw = "```json\n" + JSON.stringify({ hashtags: ["a", "b"] }) + "\n```";
    expect(parseGeneratorResponse("hashtag", raw)).toEqual({ kind: "hashtag", hashtags: ["a", "b"] });
  });

  it("throws a friendly error on invalid JSON", () => {
    expect(() => parseGeneratorResponse("title", "not json")).toThrow(/couldn't be read/);
  });

  it("throws a friendly error when the shape doesn't match the kind", () => {
    const raw = JSON.stringify({ wrongField: "x" });
    expect(() => parseGeneratorResponse("description", raw)).toThrow(/expected format/);
  });
});
