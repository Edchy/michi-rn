import { K_ROW, N_ROW, S_ROW, T_ROW, VOWELS, type Kana } from "./hiragana";
import type { QuestionType } from "./question";

/**
 * The kana-teaching station shape, shared by station 2 (あいうえお) and station 3
 * (the k-row). A track is an ordered queue of steps the learner walks through
 * (session-flow.md §1). Practice is *blocked then interleaved*: each drill type
 * is its own block, mastered in turn (easiest → hardest), then a final mixed
 * block interleaves them all as a consolidation capstone.
 */
export type Step =
  | { kind: "intro" } // a brief explainer of what's about to happen
  // A refresher on earlier kana needs announcing first: dropping the learner into a
  // vowel drill on a station billed as the k row reads as a bug, not as revision.
  | { kind: "reviewIntro"; pool: Kana[] }
  // Open-book pairing: the whole set stays on screen while sounds play. Sits between
  // teaching and the graded drills so the sound-shape link is *built* before it is
  // tested. Without it the learner goes from one tap per glyph straight to picking
  // blind, which is guessing, and guessing teaches nothing.
  | { kind: "match"; pool: Kana[] }
  | { kind: "review"; pool: Kana[] } // warm up kana from earlier stations before adding more
  | { kind: "teach"; kana: Kana } // hear it, say it
  | { kind: "reveal"; kana: Kana[] } // "these sounds have shapes" — the family
  | { kind: "context"; kana: Kana[] } // name hiragana after the learner has used it
  | { kind: "read"; word: ReadableWord } // read a real word, built only from known kana
  // One line of connected Japanese, read for meaning rather than decoded for a score.
  // Ungraded by construction: `ReadableLine` has nowhere to put a right answer.
  | { kind: "readLine"; line: ReadableLine; index: number; total: number }
  | { kind: "rehearse"; pool: Kana[] } // guided speaking, not an assessed drill
  | { kind: "guidedTrace"; kana: Kana } // ungraded motor rehearsal with a faint guide
  | { kind: "blankRecall"; kana: Kana } // draw from memory, then reveal for comparison
  // The gojūon table, with the row just learned landing into it. Ends the station by
  // placing the five new characters in the map of the whole set.
  | { kind: "grid" }
  | {
      kind: "drill";
      pool: Kana[];
      types: QuestionType[];
      role: "practice" | "checkpoint" | "consolidation";
    }
  | { kind: "done"; learned: Kana[] };

/**
 * A word the learner can decode unaided, because every kana in it is already taught.
 *
 * In province 1 a word connects characters the learner already has (PLAN.md rule 11). It
 * is read once as proof the kana work, never scheduled for review, and its meaning is
 * revealed rather than tested. No station may claim the learner knows it.
 *
 * The "already taught" part is enforced: the station's `application.itemIds` in
 * station-spec.ts derives from this word's own kana, so `validateStationCourse` fails if
 * a word reaches a station before one of its characters has been introduced.
 */
export type ReadableWord = { kana: Kana[]; meaning: string; note: string; audioSrc: string };

/**
 * One line of connected Japanese, for a narrative station.
 *
 * This is deliberately NOT a `ReadableWord[]`. A word is a payoff at the end of an
 * acquisition station: decode it, get the meaning, move on. A line is the opposite job.
 * The learner reads several pieces in sequence and takes the meaning of the whole, which
 * is the one thing recognition drills cannot teach and the reason this station type
 * exists (PLAN.md: the connected-reading decision).
 *
 * The shape enforces the honesty rules rather than trusting authors to remember them:
 *
 * - `glyphs` is the line as the learner sees it. No `say`, no romaji, no per-character
 *   labels. Latin letters under connected text are the crutch the learner would read
 *   instead of the Japanese.
 * - There is no `question`, no `answer`, and no `options` field. A line cannot be turned
 *   into a checkpoint prompt because there is nowhere to put the right answer. Rule 7
 *   puts real use outside graded evidence, and this type makes that structural.
 * - `meaning` is revealed after the learner has read, never tested.
 *
 * `audioSrc` is optional and currently unset for every line: word audio is the project's
 * top content blocker, and connected reading should not wait on it. When recordings
 * exist, filling this in is the only change needed.
 */
export type ReadableLine = {
  /** The line in kana, exactly as displayed. */
  glyphs: string;
  /** What it means, revealed after reading. */
  meaning: string;
  /** Optional one-line note: a particle's job, a piece of context. Never a test. */
  note?: string;
  audioSrc?: string;
};

/**
 * A narrative station's content: a few connected lines that build on each other.
 *
 * Kept small on purpose. This is not a story and does not pretend to be one; a story
 * needs vocabulary and characters that province 1 does not have yet. It is the first
 * place the learner reads Japanese longer than one word and takes meaning from it.
 */
export type Passage = {
  /** The framing the learner reads first, in plain English. */
  opening: string;
  lines: readonly ReadableLine[];
};

/**
 * Recognition drills and a mixed capstone, easiest direction first.
 *
 * seePickSound keeps the glyph on screen while you choose, so it is recognition: the cue
 * is present the whole time. hearPickChar gives you nothing to look at until you commit,
 * which makes it recall-like and much harder on a set met minutes ago. Running it first
 * (as this did) meant guessing, and guessing teaches nothing.
 */
const ASSESSED_DRILL_BLOCKS: Array<{
  types: QuestionType[];
  role: "practice" | "checkpoint";
}> = [
  { types: ["seePickSound"], role: "practice" },
  { types: ["hearPickChar"], role: "practice" },
  { types: ["hearPickChar", "seePickSound"], role: "checkpoint" },
];

/**
 * One acquisition station: teach a gojūon row, drill it, then use it.
 *
 * Every x-row station is this function plus content. The three things that genuinely
 * vary are parameters:
 *
 * - `review`: the earlier kana to warm up first. The vowels open the curriculum and have
 *   nothing behind them, so they pass none and the two review steps drop out.
 * - `word`: the real word this row unlocks (rule 11). The vowels alone cannot spell one,
 *   so they hand over to the grid instead.
 * - `trace`: one kana to meet by hand. Only あ has canonical stroke data today.
 *
 * Step order is fixed here rather than per station, because the order *is* the teaching
 * claim: connect the sound and shape, test it, and only then use it. `context` sits after
 * the drills and immediately before the payoff it promises.
 */
export function buildRowStation({
  row,
  review = [],
  word,
  trace,
}: {
  row: Kana[];
  review?: Kana[];
  word?: ReadableWord;
  trace?: Kana;
}): Step[] {
  const drills: Step[] = ASSESSED_DRILL_BLOCKS.map(({ types, role }) => ({
    kind: "drill", pool: row, types, role,
  }));
  return [
    { kind: "intro" },
    ...(review.length
      ? ([
          { kind: "reviewIntro", pool: review },
          { kind: "review", pool: review },
        ] satisfies Step[])
      : []),
    ...row.map((kana): Step => ({ kind: "teach", kana })),
    { kind: "reveal", kana: row },
    { kind: "match", pool: row },
    ...drills,
    ...(trace ? ([{ kind: "guidedTrace", kana: trace }] satisfies Step[]) : []),
    { kind: "rehearse", pool: row },
    { kind: "context", kana: row },
    ...(word ? ([{ kind: "read", word }] satisfies Step[]) : []),
    { kind: "grid" },
    { kind: "done", learned: row },
  ];
}

export function buildTrack1(): Step[] {
  return buildRowStation({ row: VOWELS, trace: VOWELS[0]! });
}

/** えき — a station, and the first word the learner can read unaided (え + き). */
export const EKI: ReadableWord = {
  kana: [VOWELS[3]!, K_ROW[1]!],
  audioSrc: "/audio/words/eki-station.mp3",
  meaning: "station",
  note: "The place where a train stops.",
};

/**
 * Station 3 — "The K row" (うえの).
 *
 * Same shape as station 2, with two additions its spec calls for: it opens by
 * reviewing the vowels (the learner has them now, so the station starts from what
 * they know), and it ends on reading えき, the first real word. The drill pool is
 * the k-row alone; mixing the vowels back in is station 4's consolidation job.
 */
export function buildTrack2(): Step[] {
  return buildRowStation({ row: K_ROW, review: VOWELS, word: EKI });
}

/**
 * Station 5 — "The S row" (しぶや).
 *
 * The first station authored purely as content: one `buildRowStation` call, no new step
 * kind and no page logic. It reviews the k-row rather than the vowels, because the k-row
 * is what the learner met most recently and least securely; the vowels keep returning
 * through scheduled review instead.
 *
 * It ends without a word. さかな is the natural one (every kana is now taught) but there
 * is no recording for it, and every other readable word is blocked the same way. The word
 * is a payoff, not a completion requirement, so the station ships without one rather than
 * waiting on audio. Adding it later is one `word:` argument.
 */
export function buildTrack4(): Step[] {
  return buildRowStation({ row: S_ROW, review: K_ROW });
}

/**
 * Station 6 — "The T row" (おおてまち).
 *
 * Two irregularities rather than one: ち is chi and つ is tsu. Both are taught in their
 * own slides like any other kana; the row needs no special handling.
 */
export function buildTrack5(): Step[] {
  return buildRowStation({ row: T_ROW, review: S_ROW });
}

/**
 * Station 7 — "The N row" (いけぶくろ).
 *
 * The row that makes connected reading possible, because の joins two nouns. The
 * narrative station immediately after it depends on this.
 */
export function buildTrack6(): Step[] {
  return buildRowStation({ row: N_ROW, review: T_ROW });
}

/**
 * Station 8 — "Reading on" (ぎんざ): the first connected Japanese.
 *
 * Every line uses only the 25 kana taught by station 7 (あ, か, さ, た, な rows). The
 * lines build: two nouns, then の joining them, then a short statement. The learner is
 * never asked to answer anything.
 *
 * A note on の. It is introduced here as a job rather than as grammar terminology: it
 * links two nouns and the second one is the thing being described. That is enough to read
 * the line, and the fuller account belongs in a book stop, not on the path.
 */
export const FIRST_PASSAGE: Passage = {
  opening: "Every character here is one you know. Read each line before you turn it over.",
  lines: [
    {
      glyphs: "そと",
      meaning: "outside",
      note: "Two kana you have known since the S and T rows.",
    },
    {
      glyphs: "ねこ",
      meaning: "a cat",
    },
    {
      // The particle beat. Two known nouns and one new job between them.
      glyphs: "そとのねこ",
      meaning: "the cat outside",
      note: "の joins two words. The second one is the thing being described.",
    },
    {
      // Deliberately still a noun phrase rather than a sentence. A real sentence needs
      // は, which belongs to the H row and is two stations away; writing one without it
      // would mean inventing ungrammatical Japanese to hit a target. The honest ceiling
      // for 25 kana is the noun phrase, and it is already connected reading.
      glyphs: "そとのちいさいねこ",
      meaning: "the small cat outside",
      note: "Nine characters, and you read all of them.",
    },
  ],
};

/**
 * Build a narrative station: an opening, the lines in order, and a close.
 *
 * There is no drill, no checkpoint, and no `done.learned`, because the station introduces
 * no review target. It cannot be completed incorrectly.
 */
export function buildNarrativeStation(passage: Passage): Step[] {
  return [
    { kind: "intro" },
    ...passage.lines.map(
      (line, index): Step => ({
        kind: "readLine",
        line,
        index,
        total: passage.lines.length,
      }),
    ),
    { kind: "done", learned: [] },
  ];
}

export function buildTrack7(): Step[] {
  return buildNarrativeStation(FIRST_PASSAGE);
}

/** The first complete learning set: the vowels and k-row together. */
export const FIRST_TEN = [...VOWELS, ...K_ROW];

/**
 * Station 4 — "A first look back" (なかの).
 *
 * No new teaching and no new SRS seeds. The learner gets one open refresher,
 * one adaptive mixed-recall block across all ten kana, then reads えき again.
 * Keeping this as a short checkpoint makes consolidation feel like part of the
 * path rather than a second exam immediately after station 3.
 */
export function buildTrack3(): Step[] {
  const intro: Step = { kind: "intro" };
  const recall: Step = {
    kind: "drill",
    pool: FIRST_TEN,
    types: ["hearPickChar", "seePickSound"],
    role: "consolidation",
  };
  const read: Step = { kind: "read", word: EKI };
  const writeA: Step = { kind: "blankRecall", kana: VOWELS[0]! };
  const grid: Step = { kind: "grid" };
  const done: Step = { kind: "done", learned: [] };
  return [intro, recall, writeA, read, grid, done];
}
