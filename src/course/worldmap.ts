// World-map data: the course as PROVINCES (国) → TRACKS (線) → STATIONS (宿).
//
// A province is one leg of the journey (a script or domain); the tracks are the
// stretches it passes through; the stations are the post-towns you stop at. Station
// numbering is GLOBAL and continuous across the whole course, the way Tōkaidō
// post-towns were counted along the whole route rather than per track.
//
// Scale: only the active province's path is drawn, so the canvas holds one province (~6,000px)
// instead of the whole course. Navigation is provinces-then-tracks — never a flat list
// of every track, which is what stops scrolling from becoming the problem again at
// 50+ tracks. See docs/decisions/0005-provinces-and-tracks.md.
//
// Structure mirrors the authored roster in docs/curriculum/stations.md.
// `href` is set only where a lesson actually exists yet (Stations 1–4 today).

export type Station = {
  id: string;
  n: number;       // global station number (1..N across the whole course)
  title: string;   // what the station TEACHES — the lesson name
  place: string;   // its Tokyo place name in kana (e.g. うえの)
  placeRomaji: string; // the same name in Latin — a label, never a reading aid (P2)
  href?: string;   // set when the station is playable
  x: number;       // GLOBAL canvas coords — the path threads all tracks in order
  y: number;
};

export type Track = {
  id: string;
  n: number;       // track number (1..)
  title: string;   // what the track teaches
  line: string;    // its Tokyo Metro line name, e.g. "Ginza"
  lineKanji: string;  // 銀座線
  code: string;    // the line letter used in station codes: G, M, C, Z, T
  stations: Station[];
};

export type Province = {
  id: string;
  n: number;            // province number (1..)
  title: string;
  subtitle?: string;    // one quiet line for the overview card
  tracks: Track[]; // empty = declared but not yet authored
};

export type BookStop = {
  id: string;
  title: string;
  href: string;
  unlockAfterStation: number;
  x: number;
  y: number;
};

// One continuous path flowing left→right. y alternates to keep the curve lively;
// x steps ~320 per station and continues rightward across track boundaries.
export const PROVINCES: Province[] = [
  {
    id: "hiragana", n: 1, title: "Hiragana", subtitle: "46 kana, first words",
    tracks: [
      // Ginza 銀座線 — Tokyo's oldest line, so it opens the course. Its first three
      // stops are chosen to be READABLE as the learner earns them: あさくさ needs only
      // あ/さ/く (station 3's worth of kana), うえの adds の.
      {
        id: "first-sounds", n: 1, title: "First sounds",
        line: "Ginza", lineKanji: "銀座線", code: "G",
        stations: [
          // Station 1 teaches no kana — it's the orientation stop: what the three scripts
          // are, before any of them is learned. しぶや is a placeholder-free real stop; we
          // use しんばし (Shinbashi), the Ginza Line's original terminus.
          { id: "three-scripts", n: 1, title: "The three scripts", place: "しんばし",  placeRomaji: "Shinbashi", href: "/tracks/three-scripts", x: 240, y: 500 },
          { id: "vowels",       n: 2, title: "First sounds",     place: "あさくさ",   placeRomaji: "Asakusa",  href: "/tracks/first-sounds", x: 560, y: 620 },
          { id: "k-row",        n: 3, title: "The K row",        place: "うえの",     placeRomaji: "Ueno",     href: "/tracks/k-row", x: 880,  y: 470 },
          { id: "look-back-1",  n: 4, title: "A first look back", place: "なかの",    placeRomaji: "Nakano",   href: "/tracks/first-look-back", x: 1200,  y: 560 },
        ],
      },
      // Marunouchi 丸ノ内線 — まるのうち itself is basic-46-clean.
      {
        id: "reading-on", n: 2, title: "Reading on",
        line: "Marunouchi", lineKanji: "丸ノ内線", code: "M",
        stations: [
          { id: "s-row",        n: 5, title: "The S row",        place: "しんじゅく", placeRomaji: "Shinjuku", href: "/tracks/s-row", x: 1520, y: 400 },
          { id: "t-row",        n: 6, title: "The T row",        place: "おおてまち", placeRomaji: "Ōtemachi", href: "/tracks/t-row", x: 1840, y: 560 },
          { id: "n-row",        n: 7, title: "The N row",        place: "いけぶくろ", placeRomaji: "Ikebukuro", href: "/tracks/n-row", x: 2160, y: 440 },
          // The first connected reading, and the reason the N row comes just before it:
          // の is what lets a line join two words instead of listing them.
          { id: "reading-on",   n: 8, title: "Reading on",       place: "ぎんざ",    placeRomaji: "Ginza",    href: "/tracks/reading-on", x: 2480, y: 580 },
        ],
      },
      // Chiyoda 千代田線
      {
        id: "completing-kana", n: 3, title: "Completing the kana",
        line: "Chiyoda", lineKanji: "千代田線", code: "C",
        stations: [
          { id: "h-row",        n: 9,  title: "The H row",       place: "おもてさんどう", placeRomaji: "Omotesandō", x: 2800, y: 420 },
          { id: "m-row",        n: 10,  title: "The M row",       place: "ろっぽんぎ", placeRomaji: "Roppongi", x: 3120, y: 560 },
          { id: "yw-rows",      n: 11, title: "The Y & W rows",  place: "よよぎ",     placeRomaji: "Yoyogi",   x: 3440, y: 400 },
          { id: "r-row-n",      n: 12, title: "The R row & ん",   place: "おちゃのみず", placeRomaji: "Ochanomizu", x: 3760, y: 540 },
        ],
      },
      // Hanzōmon 半蔵門線 — code Z, not H: Tokyo Metro gave H to Hibiya, so Hanzōmon
      // takes its letter from the last syllable instead. The real system's choice.
      {
        id: "words-grammar", n: 4, title: "First words & grammar",
        line: "Hanzōmon", lineKanji: "半蔵門線", code: "Z",
        stations: [
          { id: "mastery",      n: 13, title: "Hiragana mastery", place: "しぶや",   placeRomaji: "Shibuya",  x: 4080, y: 420 },
          { id: "words-nature", n: 14, title: "Words of nature",  place: "かんだ",   placeRomaji: "Kanda",    x: 4400, y: 560 },
          { id: "words-animals",n: 15, title: "Words of animals", place: "あきはばら", placeRomaji: "Akihabara", x: 4720, y: 440 },
          { id: "first-sentence",n: 16, title: "A first sentence", place: "にほんばし", placeRomaji: "Nihonbashi", x: 5040, y: 580 },
          { id: "hiragana-complete", n: 17, title: "Hiragana complete", place: "とうきょう", placeRomaji: "Tōkyō", x: 5360, y: 440 },
        ],
      },
    ],
  },
  // Declared, not yet authored. Empty `tracks` reads as "Not yet built" in the
  // overview — honest rather than a fake "coming soon" (P5). Authoring one means
  // appending tracks with x continuing rightward; nothing else changes.
  { id: "katakana", n: 2, title: "Katakana",   subtitle: "The second script", tracks: [] },
  { id: "kanji",    n: 3, title: "First kanji", subtitle: "Where meaning lives", tracks: [] },
  { id: "words",    n: 4, title: "Words & sentences", subtitle: "The language starts to feel real", tracks: [] },
];

// every authored track, in global order
export const TRACKS: Track[] = PROVINCES.flatMap((r) => r.tracks);

// flattened station list in global order — the path threads through all of them
export const STATIONS: Station[] = TRACKS.flatMap((p) => p.stations);
export const TOTAL_STATIONS = STATIONS.length;

export const BOOK_STOPS: BookStop[] = [
  {
    id: "three-scripts-one-language",
    title: "Three scripts, one language",
    href: "/codex/three-scripts-one-language",
    unlockAfterStation: 1,
    x: 400,
    y: 585,
  },
  {
    id: "five-sounds-that-hold-still",
    title: "Five sounds that hold still",
    href: "/codex/five-sounds-that-hold-still",
    // On the curve between あさくさ (2) and うえの (3): the bézier passes (720, 547),
    // and the marker sits a few px below the ink as the first stop does.
    unlockAfterStation: 2,
    x: 720,
    y: 554,
  },
  {
    id: "rows-and-the-table",
    title: "Rows, and the table they sit in",
    href: "/codex/rows-and-the-table",
    // On the curve between うえの (3) and なかの (4): the bézier passes (1040, 514),
    // and the marker sits a few px below the ink as the first stop does.
    unlockAfterStation: 3,
    x: 1040,
    y: 521,
  },
  {
    id: "why-the-kana-are-ordered",
    title: "Why the kana are ordered as they are",
    href: "/codex/why-the-kana-are-ordered",
    // On the curve between ぎんざ (8) and おもてさんどう (9): the bézier passes
    // (2640, 500), and the marker sits a few px below the ink as the first stop does.
    unlockAfterStation: 8,
    x: 2640,
    y: 507,
  },
];

/**
 * Whether a book stop sits between this station and the next one.
 *
 * Derived from the map rather than restated in station content, so a completion slide can
 * mention the stop without an author remembering to keep the two in sync. Book stops
 * unlock *after* a station number, which is the same thing as sitting on the path out of
 * it.
 */
export function hasBookStopAfter(stationId: string): boolean {
  const station = STATIONS.find((s) => s.id === stationId);
  return station ? BOOK_STOPS.some((stop) => stop.unlockAfterStation === station.n) : false;
}

// done / current / locked — used for both tracks and provinces
export type ProgressState = "done" | "current" | "locked";

// which track a global station index belongs to
export function trackOfStation(index: number): number {
  let seen = 0;
  for (let p = 0; p < TRACKS.length; p++) {
    seen += TRACKS[p]!.stations.length;
    if (index < seen) return p;
  }
  return TRACKS.length - 1;
}

// global index of the first station in a track
export function firstStationOfTrack(p: number): number {
  let seen = 0;
  for (let i = 0; i < p; i++) seen += TRACKS[i]!.stations.length;
  return seen;
}

// completion state of a whole track, given the global furthest-unlocked position
export function trackState(p: number, position: number): ProgressState {
  const start = firstStationOfTrack(p);
  const end = start + TRACKS[p]!.stations.length; // exclusive
  if (position >= end) return "done";
  if (position >= start) return "current";
  return "locked";
}

// which province a global track index belongs to
export function provinceOfTrack(p: number): number {
  let seen = 0;
  for (let r = 0; r < PROVINCES.length; r++) {
    seen += PROVINCES[r]!.tracks.length;
    if (p < seen) return r;
  }
  return PROVINCES.length - 1;
}

// global index of the first track in a province
export function firstTrackOfProvince(r: number): number {
  let seen = 0;
  for (let i = 0; i < r; i++) seen += PROVINCES[i]!.tracks.length;
  return seen;
}

// completion state of a whole province. An unauthored province is always locked — without
// this guard its empty index range would read as `current`.
export function provinceState(r: number, position: number): ProgressState {
  const count = PROVINCES[r]!.tracks.length;
  if (count === 0) return "locked";
  const start = firstStationOfTrack(firstTrackOfProvince(r));
  const end = start + PROVINCES[r]!.tracks.reduce((n, p) => n + p.stations.length, 0);
  if (position >= end) return "done";
  if (position >= start) return "current";
  return "locked";
}

// global station index range of a province — [start, end) — for per-province path drawing
export function stationRangeOfProvince(r: number): { start: number; count: number } {
  const start = firstStationOfTrack(firstTrackOfProvince(r));
  const count = PROVINCES[r]!.tracks.reduce((n, p) => n + p.stations.length, 0);
  return { start, count };
}

// How many distinct track hues exist (see --color-track-* in globals.css).
export const TRACK_HUES = 5;

/**
 * The CSS custom-property value for a track's hue, keyed by its position WITHIN its
 * province — so every province opens on track-1's color rather than continuing the
 * cycle. Cycles if a province ever holds more than TRACK_HUES tracks.
 */
export function trackHue(trackIndex: number): string {
  const withinProvince = trackIndex - firstTrackOfProvince(provinceOfTrack(trackIndex));
  return `var(--color-track-${(withinProvince % TRACK_HUES) + 1})`;
}

/**
 * A station plus the identity of the track it sits on, keyed by the global station
 * number (1-based, as `Station.n` and `BookStop.unlockAfterStation` use). Book stops
 * use this to show which stop on the map they belong to.
 */
export function stationBadge(n: number): {
  station: Station;
  track: Track;
  hue: string;
} | undefined {
  const index = STATIONS.findIndex((s) => s.n === n);
  if (index < 0) return undefined;
  const trackIndex = trackOfStation(index);
  return { station: STATIONS[index]!, track: TRACKS[trackIndex]!, hue: trackHue(trackIndex) };
}
