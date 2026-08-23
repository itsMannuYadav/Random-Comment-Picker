import { describe, expect, it } from "vitest";
import { channelLabel } from "./metadata";

describe("channelLabel", () => {
  it("labels 1 channel as Mono", () => {
    expect(channelLabel(1)).toBe("Mono");
  });

  it("labels 2 channels as Stereo", () => {
    expect(channelLabel(2)).toBe("Stereo");
  });

  it("labels other counts numerically", () => {
    expect(channelLabel(6)).toBe("6 channels");
  });
});
