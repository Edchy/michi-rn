import type { Kana } from "./hiragana";

/**
 * A drill question. The adaptive drill interleaves several *types* that all
 * exercise the same five vowels from different angles (recognition both
 * directions, plus production) — interleaving beats blocked practice for
 * retention. The drill state machine (drill.ts) is type-agnostic; only the
 * prompt/answer presentation differs per type.
 */
export type QuestionType =
  | "hearPickChar" // hear the sound → pick the character   (ear → eye)
  | "seePickSound" // see the character → pick the sound     (eye → ear)
  | "sayAloud"; // see the character → say it aloud       (production, self-confirm)

/** Types that show a set of options to choose among. `sayAloud` has no options. */
const PICK_TYPES: QuestionType[] = ["hearPickChar", "seePickSound"];

export interface Question {
  type: QuestionType;
  answer: Kana;
  options: Kana[]; // the choices for pick-types; empty for sayAloud
}

function randInt(n: number): number {
  return Math.floor(Math.random() * n);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function pickType(types: QuestionType[]): QuestionType {
  return types[randInt(types.length)]!;
}

/**
 * Build one question for a given `answer` (drawn by the caller, e.g. from a
 * ShuffleBag so coverage is even) and type: for pick-types, `answer` plus
 * (optionCount − 1) distractors from `pool`, all shuffled.
 */
export function makeQuestion(
  pool: Kana[],
  answer: Kana,
  type: QuestionType,
  optionCount: number,
): Question {
  if (!PICK_TYPES.includes(type)) {
    return { type, answer, options: [] };
  }
  const distractors = shuffle(pool.filter((k) => k.id !== answer.id)).slice(0, optionCount - 1);
  return { type, answer, options: shuffle([answer, ...distractors]) };
}
