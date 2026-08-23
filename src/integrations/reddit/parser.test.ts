import { describe, expect, it } from "vitest";
import { parseRedditUrl } from "./parser";

describe("parseRedditUrl", () => {
  it("parses a standard post URL", () => {
    expect(parseRedditUrl("https://www.reddit.com/r/aww/comments/abc123/cute_dog/")).toEqual({
      subreddit: "aww",
      postId: "abc123",
    });
  });

  it("parses a post URL without a trailing slug", () => {
    expect(parseRedditUrl("https://www.reddit.com/r/aww/comments/abc123")).toEqual({
      subreddit: "aww",
      postId: "abc123",
    });
  });

  it("parses old.reddit.com", () => {
    expect(parseRedditUrl("https://old.reddit.com/r/aww/comments/abc123/cute_dog/")).toEqual({
      subreddit: "aww",
      postId: "abc123",
    });
  });

  it("parses a redd.it short link", () => {
    expect(parseRedditUrl("https://redd.it/abc123")).toEqual({ subreddit: null, postId: "abc123" });
  });

  it("rejects a user profile URL", () => {
    expect(parseRedditUrl("https://www.reddit.com/user/someone/")).toBeNull();
  });

  it("rejects a non-Reddit domain", () => {
    expect(parseRedditUrl("https://example.com/r/aww/comments/abc123/")).toBeNull();
  });

  it("rejects malformed URLs", () => {
    expect(parseRedditUrl("not a url")).toBeNull();
  });
});
