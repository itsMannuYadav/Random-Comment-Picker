import { describe, expect, it } from "vitest";
import { formatTimestamp } from "./frame";

describe("formatTimestamp", () => {
  it("formats whole minutes and seconds", () => {
    expect(formatTimestamp(75)).toBe("1:15");
  });

  it("pads seconds under 10", () => {
    expect(formatTimestamp(65)).toBe("1:05");
  });

  it("floors fractional seconds", () => {
    expect(formatTimestamp(59.9)).toBe("0:59");
  });

  it("treats NaN/negative as 0:00", () => {
    expect(formatTimestamp(NaN)).toBe("0:00");
    expect(formatTimestamp(-5)).toBe("0:00");
  });
});
