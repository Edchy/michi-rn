import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { K_ROW, N_ROW, S_ROW, T_ROW, VOWELS } from "./hiragana";

/** Every kana the course teaches today. New rows join here and inherit every check. */
const ALL = [...VOWELS, ...K_ROW, ...S_ROW, ...T_ROW, ...N_ROW];

describe("pronunciation prompts", () => {
  it("provides multiple non-empty variants for every kana", () => {
    for (const kana of ALL) {
      expect(kana.hints.length).toBeGreaterThanOrEqual(3);
      expect(kana.hints.every((hint) => hint.trim().length > 0)).toBe(true);
    }
  });
});

// English spells two different vowels "oo" (long: food; short: look). う and く are the
// short one, so a hint that just says "oo" leaves the learner guessing which.
describe("the ambiguous \"oo\" sound", () => {
  it("pins down which \"oo\" is meant for う and く", () => {
    for (const kana of ALL) {
      if (!kana.reading.endsWith("u")) continue;
      const first = kana.hints[0]!;
      expect(first, `${kana.glyph} leads with an unqualified "oo"`).toMatch(/look|book/);
    }
  });
});

describe("the s-row", () => {
  it("runs the s sound across the five vowels, with し irregular", () => {
    expect(S_ROW.map((k) => k.glyph)).toEqual(["さ", "し", "す", "せ", "そ"]);
    // "shi", not "si". Recording it here means a later tidy-up toward a regular pattern
    // fails loudly rather than teaching a sound Japanese does not use.
    expect(S_ROW.map((k) => k.reading)).toEqual(["sa", "shi", "su", "se", "so"]);
  });

  it("warns in し's leading hint that it breaks the pattern", () => {
    const shi = S_ROW.find((k) => k.glyph === "し")!;
    expect(shi.hints[0]).toMatch(/breaks the pattern/);
  });
});

describe("the k-row", () => {
  it("runs the k sound across the five vowels in gojūon order", () => {
    expect(K_ROW.map((k) => k.reading)).toEqual(["ka", "ki", "ku", "ke", "ko"]);
    expect(K_ROW.map((k) => k.glyph)).toEqual(["か", "き", "く", "け", "こ"]);
  });

  // Teach and drill steps play every kana, so a missing clip is a silent lesson.
  // Both formats are shipped (webm for the browsers that take it, mp3 as fallback),
  // so a gap in either one is silence for whoever lands on that branch.
  it.each(["webm", "mp3"])("has a %s clip for every kana", (ext) => {
    const clips = new Set(
      readdirSync("assets/audio/hiragana")
        .filter((f) => f.endsWith(`.${ext}`))
        .map((f) => f.replace(new RegExp(`\\.${ext}$`), "")),
    );
    for (const kana of ALL) {
      expect(clips, kana.glyph).toContain(kana.id);
    }
  });
});
