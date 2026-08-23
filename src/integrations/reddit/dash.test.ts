import { describe, expect, it } from "vitest";
import { parseDashManifest } from "./dash";

const SAMPLE_MPD = `<?xml version="1.0" encoding="utf-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static">
  <Period>
    <AdaptationSet mimeType="video/mp4" segmentAlignment="true">
      <Representation id="0" bandwidth="4500000" width="1920" height="1080" codecs="avc1.640028">
        <BaseURL>DASH_1080.mp4</BaseURL>
      </Representation>
      <Representation id="1" bandwidth="2200000" width="1280" height="720" codecs="avc1.4d401f">
        <BaseURL>DASH_720.mp4</BaseURL>
      </Representation>
      <Representation id="2" bandwidth="800000" width="640" height="360" codecs="avc1.4d401e">
        <BaseURL>DASH_360.mp4</BaseURL>
      </Representation>
    </AdaptationSet>
    <AdaptationSet mimeType="audio/mp4">
      <Representation id="AUDIO-1" bandwidth="128000" codecs="mp4a.40.2">
        <BaseURL>DASH_audio.mp4</BaseURL>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;

const MANIFEST_URL = "https://v.redd.it/abc123xyz/DASHPlaylist.mpd";

describe("parseDashManifest", () => {
  it("extracts every video representation with resolved URLs", () => {
    const reps = parseDashManifest(SAMPLE_MPD, MANIFEST_URL);
    const video = reps.filter((r) => r.mimeType === "video");
    expect(video).toHaveLength(3);
    expect(video.map((r) => r.height)).toEqual([1080, 720, 360]);
    expect(video[0].url).toBe("https://v.redd.it/abc123xyz/DASH_1080.mp4");
  });

  it("extracts the audio representation", () => {
    const reps = parseDashManifest(SAMPLE_MPD, MANIFEST_URL);
    const audio = reps.filter((r) => r.mimeType === "audio");
    expect(audio).toHaveLength(1);
    expect(audio[0].url).toBe("https://v.redd.it/abc123xyz/DASH_audio.mp4");
  });

  it("resolves BaseURL relative to the manifest's own directory, not its filename", () => {
    const reps = parseDashManifest(SAMPLE_MPD, "https://v.redd.it/abc123xyz/DASHPlaylist.mpd?extra=1");
    expect(reps[0].url.startsWith("https://v.redd.it/abc123xyz/")).toBe(true);
  });

  it("returns an empty array for malformed input rather than throwing", () => {
    expect(parseDashManifest("not xml at all", MANIFEST_URL)).toEqual([]);
    expect(parseDashManifest("", MANIFEST_URL)).toEqual([]);
  });

  it("returns an empty array when the manifest URL itself is invalid", () => {
    expect(parseDashManifest(SAMPLE_MPD, "not a url")).toEqual([]);
  });

  it("ignores AdaptationSets with an unrecognized mimeType", () => {
    const xml = `<MPD><Period><AdaptationSet mimeType="text/vtt"><Representation id="s" bandwidth="1"><BaseURL>subs.vtt</BaseURL></Representation></AdaptationSet></Period></MPD>`;
    expect(parseDashManifest(xml, MANIFEST_URL)).toEqual([]);
  });
});
