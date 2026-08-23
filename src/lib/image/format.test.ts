import { describe, expect, it } from "vitest";
import { formatBytes, percentSaved, FORMAT_LABEL, FORMAT_EXTENSION } from "./format";

describe("formatBytes", () => {
  it("formats sub-1KB values in bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats KB with one decimal under 10", () => {
    expect(formatBytes(2048)).toBe("2.0 KB");
  });

  it("formats MB values with one decimal under 10", () => {
    expect(formatBytes(3.8 * 1024 * 1024)).toBe("3.8 MB");
  });

  it("drops the decimal at 10 and above", () => {
    expect(formatBytes(12 * 1024 * 1024)).toBe("12 MB");
  });
});

describe("percentSaved", () => {
  it("computes the percentage reduction", () => {
    expect(percentSaved(1000, 300)).toBe(70);
  });

  it("floors at 0 when the new size isn't smaller", () => {
    expect(percentSaved(1000, 1200)).toBe(0);
  });

  it("returns 0 for a zero-byte original rather than dividing by zero", () => {
    expect(percentSaved(0, 0)).toBe(0);
  });
});

describe("format tables", () => {
  it("have an extension and label for every declared format", () => {
    const formats = Object.keys(FORMAT_LABEL) as (keyof typeof FORMAT_LABEL)[];
    for (const format of formats) {
      expect(FORMAT_EXTENSION[format]).toBeTruthy();
    }
  });
});
