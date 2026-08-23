import { describe, expect, it } from "vitest";
import { scaledDimension } from "./resize";

describe("scaledDimension", () => {
  it("keeps aspect ratio when width changes", () => {
    expect(scaledDimension({ width: 1000, height: 500 }, "width", 400)).toEqual({ width: 400, height: 200 });
  });

  it("keeps aspect ratio when height changes", () => {
    expect(scaledDimension({ width: 1000, height: 500 }, "height", 100)).toEqual({ width: 200, height: 100 });
  });

  it("never produces a dimension below 1px", () => {
    expect(scaledDimension({ width: 1000, height: 500 }, "width", 0)).toEqual({ width: 1, height: 1 });
  });

  it("rounds to whole pixels", () => {
    expect(scaledDimension({ width: 1000, height: 333 }, "width", 100)).toEqual({ width: 100, height: 33 });
  });
});
