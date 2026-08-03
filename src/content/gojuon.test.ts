import { describe, expect, it } from "vitest";
import { GOJUON, GOJUON_COUNT } from "./gojuon";
import { K_ROW, VOWELS } from "./hiragana";

describe("gojūon table", () => {
  it("holds all 46 hiragana, none repeated", () => {
    const cells = GOJUON.flatMap((r) => r.cells).filter(Boolean);
    expect(cells).toHaveLength(46);
    expect(new Set(cells).size).toBe(46);
    expect(GOJUON_COUNT).toBe(46);
  });

  it("is five columns wide on every row", () => {
    for (const row of GOJUON) expect(row.cells).toHaveLength(5);
  });

  it("keeps the w-row (わ, を) and ん", () => {
    expect(GOJUON.find((r) => r.id === "w-row")?.cells).toEqual(["わ", null, null, null, "を"]);
    expect(GOJUON.find((r) => r.id === "n-alone")?.cells[0]).toBe("ん");
  });

  it("matches the taught rows, so the grid cannot drift from the stations", () => {
    expect(GOJUON.find((r) => r.id === "vowels")?.cells).toEqual(VOWELS.map((k) => k.glyph));
    expect(GOJUON.find((r) => r.id === "k-row")?.cells).toEqual(K_ROW.map((k) => k.glyph));
  });
});
