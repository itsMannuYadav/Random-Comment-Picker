import { afterEach, describe, expect, it, vi } from "vitest";
import { getRedditVideoFormats } from "./video";
import { RedditApiError, type RedditPostData } from "./types";

const SAMPLE_MPD = `<MPD><Period>
  <AdaptationSet mimeType="video/mp4">
    <Representation id="0" bandwidth="4500000" width="1920" height="1080"><BaseURL>DASH_1080.mp4</BaseURL></Representation>
    <Representation id="1" bandwidth="800000" width="640" height="360"><BaseURL>DASH_360.mp4</BaseURL></Representation>
  </AdaptationSet>
  <AdaptationSet mimeType="audio/mp4">
    <Representation id="a" bandwidth="128000"><BaseURL>DASH_audio.mp4</BaseURL></Representation>
  </AdaptationSet>
</Period></MPD>`;

function makePost(overrides: Partial<RedditPostData> = {}): RedditPostData {
  return {
    id: "abc123",
    secure_media: {
      reddit_video: {
        fallback_url: "https://v.redd.it/xyz789/DASH_720.mp4?source=fallback",
        dash_url: "https://v.redd.it/xyz789/DASHPlaylist.mpd",
        height: 720,
        width: 1280,
        duration: 42,
      },
    },
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getRedditVideoFormats", () => {
  it("throws a not-a-video error (not a generic/config error) for a post with no Reddit-hosted video", async () => {
    try {
      await getRedditVideoFormats(makePost({ secure_media: null }));
      expect.unreachable("expected getRedditVideoFormats to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(RedditApiError);
      expect((err as RedditApiError).kind).toBe("not-a-video");
      expect((err as RedditApiError).status).toBe(400);
    }
  });

  it("uses the full manifest resolution list when the manifest is reachable and audio exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (init?.method === "HEAD") return new Response(null, { status: 200 });
        if (url.includes("DASHPlaylist.mpd")) return new Response(SAMPLE_MPD, { status: 200 });
        return new Response(null, { status: 404 });
      })
    );

    const result = await getRedditVideoFormats(makePost());
    const videoFormats = result.formats.filter((f) => f.kind === "video");
    expect(videoFormats.map((f) => f.label)).toEqual(["1080p", "360p"]);
    expect(videoFormats.every((f) => f.delivery === "mux" && f.audioUrl)).toBe(true);
    expect(result.formats.some((f) => f.kind === "audio")).toBe(true);
    expect(result.durationSeconds).toBe(42);
  });

  it("falls back to the single guaranteed resolution when the manifest fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "HEAD") return new Response(null, { status: 200 });
        return new Response(null, { status: 500 }); // manifest fetch fails
      })
    );

    const result = await getRedditVideoFormats(makePost());
    const videoFormats = result.formats.filter((f) => f.kind === "video");
    expect(videoFormats).toHaveLength(1);
    expect(videoFormats[0].label).toBe("720p");
    expect(videoFormats[0].url).toBe("https://v.redd.it/xyz789/DASH_720.mp4?source=fallback");
  });

  it("falls back to the single resolution when the manifest doesn't parse into anything", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "HEAD") return new Response(null, { status: 200 });
        return new Response("<MPD></MPD>", { status: 200 });
      })
    );

    const result = await getRedditVideoFormats(makePost());
    expect(result.formats.filter((f) => f.kind === "video")).toHaveLength(1);
  });

  it("marks formats as direct delivery with no audio format when there's no audio track", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "HEAD") return new Response(null, { status: 404 }); // no audio track
        return new Response(null, { status: 500 });
      })
    );

    const result = await getRedditVideoFormats(makePost());
    expect(result.formats.every((f) => f.kind !== "audio")).toBe(true);
    expect(result.formats[0].delivery).toBe("direct");
    expect(result.formats[0].audioUrl).toBeUndefined();
  });
});
