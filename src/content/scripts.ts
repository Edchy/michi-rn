/**
 * Station 1 — "The three scripts" (しんばし).
 *
 * An orientation station: no drills, no SRS seeds. The learner meets the writing
 * system before being asked to learn any of it — one idea per slide, one example
 * word per script. Depth (origins, a mixed three-script sentence) lives in the
 * book stop after the station (codex: "Three scripts, one language"), never here.
 *
 * Sound clips reuse the per-kana recordings in public/audio/hiragana, so every
 * example word can be played syllable by syllable (lib/audio.ts).
 */

/** One syllable of an example word — glyph plus the kana id its clip is keyed by. */
export type Syllable = { glyph: string; id: string; say: string };

export type Word = {
  word: string;
  /** A complete-word recording. Never synthesize words by overlapping kana clips. */
  audioSrc: string;
  /** The word's sounds. For kanji these are its *reading*, not its characters. */
  syllables: Syllable[];
  meaning: string;
  note?: string;
  /** True when `word` is written in characters the syllables don't spell out (kanji). */
  readingDiffers?: boolean;
};

/** A script, as the learner meets it here. */
export type Script = {
  id: "hiragana" | "katakana" | "kanji";
  name: string;
  glyph: string; // the script's own name, written in itself where it can be
  /** A compact lead and supporting thought. Depth lives in the optional book stop. */
  blurb: { lead: string; detail: string };
  words: Word[];
};

const syl = (glyph: string, id: string, say: string): Syllable => ({ glyph, id, say });

/**
 * Words for the romaji step: familiar in English, and each one splits cleanly into
 * its sounds. Kept to two so the station stays light — more examples, and the point
 * about why the split matters, live in the book stop ("Three scripts, one language").
 *
 * Written in hiragana here on purpose. Real text writes these 津波 and カラオケ, but the
 * station's point is one sound, one symbol, and hiragana is the only script the learner
 * is about to meet. The book stop shows カラオケ in its own script.
 */
export const ROMAJI_WORDS: Word[] = [
  {
    word: "つなみ",
    audioSrc: "/audio/words/tsunami.mp3",
    syllables: [syl("つ", "hira_tsu", "tsu"), syl("な", "hira_na", "na"), syl("み", "hira_mi", "mi")],
    meaning: "tsunami",
  },
  {
    word: "からおけ",
    audioSrc: "/audio/words/karaoke.mp3",
    syllables: [
      syl("か", "hira_ka", "ka"),
      syl("ら", "hira_ra", "ra"),
      syl("お", "hira_o", "o"),
      syl("け", "hira_ke", "ke"),
    ],
    meaning: "karaoke",
  },
];

/** The app's name shown through the three writing systems, without introducing it as
 * curriculum to memorize. The hiragana reading owns the two reusable audio clips. */
export const MICHI = {
  hiragana: "みち",
  katakana: "ミチ",
  kanji: "道",
  audioSrc: "/audio/words/michi.mp3",
  syllables: [syl("み", "hira_mi", "mi"), syl("ち", "hira_chi", "chi")],
  meaning: "path",
} as const;

export const SCRIPTS: Script[] = [
  {
    id: "hiragana",
    name: "Hiragana",
    glyph: "ひらがな",
    blurb: {
      lead: "The foundation: 46 symbols, each with one stable sound.",
      detail: "Anything Japanese can be written in hiragana, so it is the first script you will learn.",
    },
    words: [
      {
        word: "わたし",
        audioSrc: "/audio/words/watashi.mp3",
        syllables: [syl("わ", "hira_wa", "wa"), syl("た", "hira_ta", "ta"), syl("し", "hira_shi", "shi")],
        meaning: "I / me",
      },
    ],
  },
  {
    id: "katakana",
    name: "Katakana",
    glyph: "カタカナ",
    blurb: {
      lead: "The same sounds, sharper shapes.",
      detail: "Katakana often marks words borrowed from other languages.",
    },
    words: [
      {
        word: "カメラ",
        audioSrc: "/audio/words/camera.mp3",
        syllables: [syl("カ", "hira_ka", "ka"), syl("メ", "hira_me", "me"), syl("ラ", "hira_ra", "ra")],
        meaning: "camera",
      },
    ],
  },
  {
    id: "kanji",
    name: "Kanji",
    glyph: "漢字",
    blurb: {
      lead: "Characters that carry meaning rather than a single sound.",
      detail: "There are thousands, but you will learn them gradually, a few at a time.",
    },
    words: [
      {
        word: "山",
        audioSrc: "/audio/words/yama.mp3",
        syllables: [syl("や", "hira_ya", "ya"), syl("ま", "hira_ma", "ma")],
        meaning: "mountain",
        readingDiffers: true,
      },
    ],
  },
];
