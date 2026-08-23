import { describe, expect, it } from "vitest";
import { parseYouTubeUrl } from "./parser";

describe("parseYouTubeUrl", () => {
  it("parses a standard watch URL", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("parses a youtu.be short link", () => {
    expect(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({ videoId: "dQw4w9WgXcQ" });
  });

  it("parses a youtu.be short link with extra query params", () => {
    expect(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ?t=42")).toEqual({ videoId: "dQw4w9WgXcQ" });
  });

  it("parses a shorts URL", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toEqual({
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("parses a bare youtube.com watch URL without www", () => {
    expect(parseYouTubeUrl("https://youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("rejects a non-YouTube domain", () => {
    expect(parseYouTubeUrl("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });

  it("rejects a domain merely containing 'youtube'", () => {
    expect(parseYouTubeUrl("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ")).toBeNull();
  });

  it("rejects a watch URL with no video ID", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/watch")).toBeNull();
  });

  it("rejects the channel homepage", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/@SomeChannel")).toBeNull();
  });

  it("rejects malformed URLs", () => {
    expect(parseYouTubeUrl("not a url")).toBeNull();
    expect(parseYouTubeUrl("")).toBeNull();
  });

  it("rejects javascript: URLs", () => {
    expect(parseYouTubeUrl("javascript:alert(1)")).toBeNull();
  });
});
