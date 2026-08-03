import { existsSync, readdirSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { buildTrack0 } from "./track0";
import { MICHI, ROMAJI_WORDS, SCRIPTS } from "./scripts";

describe("buildTrack0 — the three-scripts orientation station", () => {
  const steps = buildTrack0();

  it("welcomes, explains controls, teaches the scripts, then uses the name as synthesis", () => {
    expect(steps[0]!.kind).toBe("welcome");
    expect(steps[1]!.kind).toBe("controls");
    expect(steps[2]!.kind).toBe("open");
    // Asserted as an ordering rather than by tail index, so the sequence survives a
    // step being added between the synthesis and the handoff.
    const at = (kind: string) => steps.findIndex((step) => step.kind === kind);
    expect(at("michi")).toBeLessThan(at("romaji"));
    // Romaji is set aside before the beats slide, so the learner hears つなみ as Japanese
    // sound rather than as respelled English.
    expect(at("romaji")).toBeLessThan(at("beats"));
    expect(steps.at(-1)!.kind).toBe("handoff");

    const scripts = steps.flatMap((s) => (s.kind === "script" ? [s.script.id] : []));
    expect(scripts).toEqual(["hiragana", "katakana", "kanji"]);
  });

  it("romaji is named but is not one of the scripts (P2)", () => {
    expect(steps.filter((s) => s.kind === "romaji")).toHaveLength(1);
    expect(SCRIPTS.some((s) => (s.id as string) === "romaji")).toBe(false);
  });

  // The sound system is explained before the learner meets 46 shapes, so the shapes
  // arrive as spellings of a regular sound system rather than as 46 separate facts.
  it("explains how the sounds work before handing off to the first five", () => {
    const beats = steps.findIndex((step) => step.kind === "beats");
    expect(beats).toBeGreaterThan(-1);
    expect(beats).toBeLessThan(steps.findIndex((step) => step.kind === "handoff"));
    // It leans on つなみ, which splits into three even pieces and already has audio.
    expect(ROMAJI_WORDS[0]!.syllables).toHaveLength(3);
  });

  it("stays light: exactly one example word per script", () => {
    for (const script of SCRIPTS) {
      expect(script.words).toHaveLength(1);
    }
  });
});

describe("script example words", () => {
  const words = [
    ...SCRIPTS.flatMap((s) => s.words),
    ...ROMAJI_WORDS,
    {
      word: MICHI.hiragana,
      audioSrc: MICHI.audioSrc,
      syllables: [...MICHI.syllables],
      meaning: MICHI.meaning,
    },
  ];

  it("shows Michi in all three scripts with its two-sound reading", () => {
    expect([MICHI.hiragana, MICHI.katakana, MICHI.kanji]).toEqual(["みち", "ミチ", "道"]);
    expect(MICHI.syllables.map((syllable) => syllable.say)).toEqual(["mi", "chi"]);
    expect(MICHI.meaning).toBe("path");
  });

  it("every syllable carries a kana id an audio clip can be keyed by", () => {
    for (const word of words) {
      expect(word.syllables.length).toBeGreaterThan(0);
      for (const s of word.syllables) {
        expect(s.id).toMatch(/^hira_[a-z]+$/);
        expect(s.glyph).not.toBe("");
      }
    }
  });

  it("every example has a complete-word recording", () => {
    for (const word of words) {
      expect(word.audioSrc).toMatch(/^\/audio\/words\/.+\.mp3$/);
      expect(existsSync(`assets${word.audioSrc}`), word.audioSrc).toBe(true);
    }
  });

  // The ids are hand-written, so a typo would ship a word with one silent syllable.
  it.each(["webm", "mp3"])("every syllable id has a real %s clip", (ext) => {
    const clips = new Set(
      readdirSync("assets/audio/hiragana")
        .filter((f) => f.endsWith(`.${ext}`))
        .map((f) => f.replace(new RegExp(`\\.${ext}$`), "")),
    );
    for (const word of words) {
      for (const s of word.syllables) {
        expect(clips, `${word.meaning}: ${s.glyph}`).toContain(s.id);
      }
    }
  });
});
