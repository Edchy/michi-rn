import { describe, it, expect } from "vitest";
import { makeQuestion, type QuestionType } from "./question";
import { VOWELS } from "./hiragana";

const ANSWER = VOWELS[0]!; // あ

describe("makeQuestion — pick types", () => {
  for (const type of ["hearPickChar", "seePickSound"] as QuestionType[]) {
    it(`${type}: the given answer is among the options, correct count, no dupes`, () => {
      for (let i = 0; i < 50; i++) {
        const q = makeQuestion(VOWELS, ANSWER, type, 3);
        expect(q.answer).toBe(ANSWER);
        expect(q.options).toContain(ANSWER);
        expect(q.options).toHaveLength(3);
        expect(new Set(q.options.map((k) => k.id)).size).toBe(3); // distinct
      }
    });
  }

  it("respects the requested option count", () => {
    expect(makeQuestion(VOWELS, ANSWER, "hearPickChar", 2).options).toHaveLength(2);
    expect(makeQuestion(VOWELS, ANSWER, "hearPickChar", 5).options).toHaveLength(5);
  });
});

describe("makeQuestion — sayAloud", () => {
  it("has the given answer but no options", () => {
    const q = makeQuestion(VOWELS, ANSWER, "sayAloud", 3);
    expect(q.answer).toBe(ANSWER);
    expect(q.options).toHaveLength(0);
  });
});
