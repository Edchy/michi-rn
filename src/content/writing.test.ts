import { describe, expect, it } from "vitest";
import { brushWidth } from "./writing";

describe("brushWidth", () => {
  it("scales with the responsive surface", () => {
    expect(brushWidth(0.5, 160)).toBeCloseTo(brushWidth(0.5, 320) / 2);
  });

  it("gives pressure a restrained thick-brush variation", () => {
    expect(brushWidth(1, 320)).toBeGreaterThan(brushWidth(0.2, 320));
    expect(brushWidth(1, 320)).toBeLessThanOrEqual(22.5);
  });

  it("uses a useful mouse fallback when pressure is unavailable", () => {
    expect(brushWidth(0, 320)).toBe(brushWidth(0.5, 320));
  });
});
