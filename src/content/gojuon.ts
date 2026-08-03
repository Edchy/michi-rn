/**
 * The gojūon (五十音) table: the whole hiragana set laid out as rows of five, in the
 * order Japanese itself uses. Shown at the end of a station as a map of the province,
 * so the learner sees where the five characters they just learned actually sit.
 *
 * Empty cells are real gaps in the language (the y-row lost its i/e sounds, the w-row
 * kept only wa and wo), not missing data. ん sits outside the table entirely.
 */
export type GojuonRow = {
  /** Matches a station's row id, so a station can mark its own row. */
  id: string;
  /** The row label the learner sees. */
  label: string;
  /** Five cells in あいうえお order; null where the language has no such sound. */
  cells: (string | null)[];
};

export const GOJUON: GojuonRow[] = [
  { id: "vowels", label: "vowels", cells: ["あ", "い", "う", "え", "お"] },
  { id: "k-row", label: "k", cells: ["か", "き", "く", "け", "こ"] },
  { id: "s-row", label: "s", cells: ["さ", "し", "す", "せ", "そ"] },
  { id: "t-row", label: "t", cells: ["た", "ち", "つ", "て", "と"] },
  { id: "n-row", label: "n", cells: ["な", "に", "ぬ", "ね", "の"] },
  { id: "h-row", label: "h", cells: ["は", "ひ", "ふ", "へ", "ほ"] },
  { id: "m-row", label: "m", cells: ["ま", "み", "む", "め", "も"] },
  { id: "y-row", label: "y", cells: ["や", null, "ゆ", null, "よ"] },
  { id: "r-row", label: "r", cells: ["ら", "り", "る", "れ", "ろ"] },
  { id: "w-row", label: "w", cells: ["わ", null, null, null, "を"] },
  { id: "n-alone", label: "", cells: ["ん", null, null, null, null] },
];

export const GOJUON_COUNT = GOJUON.reduce(
  (n, row) => n + row.cells.filter(Boolean).length,
  0,
);
