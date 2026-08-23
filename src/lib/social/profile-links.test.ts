import { describe, expect, it } from "vitest";
import { sanitizeUsername, generateProfileLinks, PROFILE_LINK_TEMPLATES } from "./profile-links";

describe("sanitizeUsername", () => {
  it("strips a leading @", () => {
    expect(sanitizeUsername("@mannu")).toBe("mannu");
  });

  it("trims whitespace", () => {
    expect(sanitizeUsername("  mannu  ")).toBe("mannu");
  });

  it("rejects empty input", () => {
    expect(sanitizeUsername("   ")).toBeNull();
  });

  it("rejects usernames containing whitespace", () => {
    expect(sanitizeUsername("mannu yadav")).toBeNull();
  });

  it("rejects usernames containing a slash", () => {
    expect(sanitizeUsername("mannu/yadav")).toBeNull();
  });
});

describe("generateProfileLinks", () => {
  it("generates one link per template", () => {
    const links = generateProfileLinks("mannu");
    expect(links.length).toBe(PROFILE_LINK_TEMPLATES.length);
    expect(links.every((l) => l.url.includes("mannu"))).toBe(true);
  });

  it("uses the @-prefixed pattern for platforms that need it", () => {
    const links = generateProfileLinks("mannu");
    const youtube = links.find((l) => l.id === "youtube");
    expect(youtube?.url).toBe("https://youtube.com/@mannu");
  });
});
