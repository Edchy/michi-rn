/**
 * Seed content for the first stations: the five vowels (あ-row of the gojūon) and
 * the k-row built on them.
 * Deliberately tiny — real content-as-data (content-model.md) comes later.
 * `id` is the join key to a learner's SrsItemState (data-model.md).
 */
export interface Kana {
  id: string;
  glyph: string;
  reading: string; // the sound — never shown as a romaji reading aid (P2); used for TTS + labels
  say: string; // the sound as the learner says it, for the teaching beat ("a", "i"...)
  hints: readonly string[]; // rotating pronunciation prompts for production practice
}

export const VOWELS: Kana[] = [
  {
    id: "hira_a",
    glyph: "あ",
    reading: "a",
    say: "a",
    hints: [
      'Like the "a" in "father."',
      "A clean, open a. Short and steady.",
      "Keep it pure: a, without sliding into uh.",
    ],
  },
  {
    id: "hira_i",
    glyph: "い",
    reading: "i",
    say: "i",
    hints: [
      'Like the "ee" in "see," but shorter.',
      "Smile lightly and make a clean i.",
      "Keep the sound steady, without a trailing y.",
    ],
  },
  {
    id: "hira_u",
    glyph: "う",
    reading: "u",
    say: "u",
    hints: [
      // English writes two different sounds "oo": the long one in "food" and the short
      // one in "look". う is the short one, so the hint has to say which, not just "oo".
      'The short "oo" in "look" and "book," not the long "oo" in "food."',
      "A short u with relaxed lips, never pushed forward.",
      "Keep the lips easy and the sound compact.",
    ],
  },
  {
    id: "hira_e",
    glyph: "え",
    reading: "e",
    say: "e",
    hints: [
      'Like the "e" in "bed."',
      "A clean e. Short and steady.",
      "Keep it open and finish without gliding into ay.",
    ],
  },
  {
    id: "hira_o",
    glyph: "お",
    reading: "o",
    say: "o",
    hints: [
      'Like the "oh" in "boat," but shorter, without the lingering "ow".',
      "A short, pure o. Do not let it turn into ow.",
      "Round gently, then stop the sound cleanly.",
    ],
  },
];

/**
 * The k-row (か行): the k sound joined to each of the five vowels, in gojūon order.
 * Every one is regular, so the hints are about the vowel the learner already knows
 * rather than about anything new in the consonant.
 */
export const K_ROW: Kana[] = [
  {
    id: "hira_ka",
    glyph: "か",
    reading: "ka",
    say: "ka",
    hints: [
      // No ": ka" tail. The chip renders the vowel as あ (a), so naming the result here
      // just repeats it. The other K-row hints keep a tail because it adds an English
      // anchor ("like the start of key") rather than restating the sum.
      "k plus あ.",
      "A clean ka, with the same open vowel as あ.",
      "Keep the vowel pure: ka, not kuh.",
    ],
  },
  {
    id: "hira_ki",
    glyph: "き",
    reading: "ki",
    say: "ki",
    hints: [
      "k plus い: ki, like the start of \"key.\"",
      "A short, clean ki. Do not let it trail off.",
      "Same vowel as い, with a k in front.",
    ],
  },
  {
    id: "hira_ku",
    glyph: "く",
    reading: "ku",
    say: "ku",
    hints: [
      // Same trap as う: "koo" alone reads as "coo". Name the short vowel explicitly.
      'k plus う: the short "oo" in "look," so it sounds like the start of "cook," not "coo."',
      "A compact ku, with the same relaxed lips as う.",
      "Short and light. Do not stretch the vowel out.",
    ],
  },
  {
    id: "hira_ke",
    glyph: "け",
    reading: "ke",
    say: "ke",
    hints: [
      "k plus え: ke, like the start of \"kettle.\"",
      "A clean ke. Stop it before it slides into kay.",
      "Same open e as え, with a k in front.",
    ],
  },
  {
    id: "hira_ko",
    glyph: "こ",
    reading: "ko",
    say: "ko",
    hints: [
      "k plus お: ko, like the start of \"coat.\"",
      "A short, pure ko. No trailing ow.",
      "Round gently, then cut the sound off.",
    ],
  },
];

/**
 * The s-row (さ行): s joined to each vowel, with one genuine irregularity. し is "shi",
 * not "si" — the sound shifted in Japanese itself, so it is a fact about the language
 * rather than a spelling convention, and the hints name it plainly instead of letting
 * the learner infer a pattern that then breaks.
 */
export const S_ROW: Kana[] = [
  {
    id: "hira_sa",
    glyph: "さ",
    reading: "sa",
    say: "sa",
    hints: [
      "s plus あ.",
      'A clean sa, like the start of "sock" with the open vowel of あ.',
      "Keep the vowel pure: sa, not suh.",
    ],
  },
  {
    id: "hira_shi",
    glyph: "し",
    reading: "shi",
    say: "shi",
    hints: [
      // The one break in the row. Say it before the learner predicts "si" and is wrong.
      'This one breaks the pattern: not "si" but shi, like the start of "sheep."',
      "The s softens into sh here. It is the sound Japanese uses, not a spelling rule.",
      "A short shi. Do not stretch it into shee.",
    ],
  },
  {
    id: "hira_su",
    glyph: "す",
    reading: "su",
    say: "su",
    hints: [
      's plus う: the short "oo" in "look," so it sounds like the start of "soot."',
      "A compact su, with the same relaxed lips as う.",
      "Light and short. The vowel almost disappears in fast speech.",
    ],
  },
  {
    id: "hira_se",
    glyph: "せ",
    reading: "se",
    say: "se",
    hints: [
      's plus え: se, like the start of "settle."',
      "A clean se. Stop it before it slides into say.",
      "Same open e as え, with an s in front.",
    ],
  },
  {
    id: "hira_so",
    glyph: "そ",
    reading: "so",
    say: "so",
    hints: [
      's plus お: so, like the start of "soak."',
      "A short, pure so. No trailing ow.",
      "Round gently, then cut the sound off.",
    ],
  },
];

/**
 * The t-row (た行): the row with two irregularities rather than one. ち is "chi" and つ
 * is "tsu", both named plainly in their leading hints for the same reason し is.
 */
export const T_ROW: Kana[] = [
  {
    id: "hira_ta",
    glyph: "た",
    reading: "ta",
    say: "ta",
    hints: [
      "t plus あ.",
      'A clean ta, like the start of "top" with the open vowel of あ.',
      "Keep the vowel pure: ta, not tuh.",
    ],
  },
  {
    id: "hira_chi",
    glyph: "ち",
    reading: "chi",
    say: "chi",
    hints: [
      'Not "ti" but chi, like the start of "cheese."',
      "The t softens into ch here, the same way し softens to shi.",
      "A short chi. Do not stretch it into chee.",
    ],
  },
  {
    id: "hira_tsu",
    glyph: "つ",
    reading: "tsu",
    say: "tsu",
    hints: [
      // Genuinely unfamiliar to English speakers at the start of a word, so anchor it
      // to a position where English does make the sound.
      'Not "tu" but tsu, like the end of "cats" with the short "oo" of "look."',
      "One sound, not two. The t and s land together.",
      "English uses it at the end of words, never the start. Japanese starts with it.",
    ],
  },
  {
    id: "hira_te",
    glyph: "て",
    reading: "te",
    say: "te",
    hints: [
      't plus え: te, like the start of "ten."',
      "A clean te. Stop it before it slides into tay.",
      "Same open e as え, with a t in front.",
    ],
  },
  {
    id: "hira_to",
    glyph: "と",
    reading: "to",
    say: "to",
    hints: [
      't plus お: to, like the start of "toe."',
      "A short, pure to. No trailing ow.",
      "Round gently, then cut the sound off.",
    ],
  },
];

/**
 * The n-row (な行): five regular sounds, and the row that makes real sentences possible.
 * の is the connecting particle the first connected-reading station leans on.
 */
export const N_ROW: Kana[] = [
  {
    id: "hira_na",
    glyph: "な",
    reading: "na",
    say: "na",
    hints: [
      "n plus あ.",
      'A clean na, like the start of "not" with the open vowel of あ.',
      "Keep the vowel pure: na, not nuh.",
    ],
  },
  {
    id: "hira_ni",
    glyph: "に",
    reading: "ni",
    say: "ni",
    hints: [
      'n plus い: ni, like the start of "neat."',
      "A short, clean ni. Do not let it trail off.",
      "Same vowel as い, with an n in front.",
    ],
  },
  {
    id: "hira_nu",
    glyph: "ぬ",
    reading: "nu",
    say: "nu",
    hints: [
      'n plus う: the short "oo" in "look," so it sounds like the start of "nook."',
      "A compact nu, with the same relaxed lips as う.",
      "Short and light. Do not stretch the vowel out.",
    ],
  },
  {
    id: "hira_ne",
    glyph: "ね",
    reading: "ne",
    say: "ne",
    hints: [
      'n plus え: ne, like the start of "nest."',
      "A clean ne. Stop it before it slides into nay.",
      "Same open e as え, with an n in front.",
    ],
  },
  {
    id: "hira_no",
    glyph: "の",
    reading: "no",
    say: "no",
    hints: [
      'n plus お: no, like the start of "note."',
      "A short, pure no. No trailing ow.",
      "Round gently, then cut the sound off.",
    ],
  },
];
