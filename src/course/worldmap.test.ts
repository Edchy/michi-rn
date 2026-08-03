import { describe, expect, it } from "vitest";
import {
  PROVINCES,
  TRACKS,
  STATIONS,
  TOTAL_STATIONS,
  trackOfStation,
  firstStationOfTrack,
  trackState,
  provinceOfTrack,
  firstTrackOfProvince,
  provinceState,
  stationRangeOfProvince,
  trackHue,
  TRACK_HUES,
  hasBookStopAfter,
} from "./worldmap";

describe("worldmap structure", () => {
  it("nests hiragana's tracks under province 1 without losing any station", () => {
    expect(TRACKS).toHaveLength(4);
    expect(TOTAL_STATIONS).toBe(17);
    expect(PROVINCES[0]!.tracks).toHaveLength(4);
  });

  it("numbers stations contiguously 1..N in path order", () => {
    expect(STATIONS.map((s) => s.n)).toEqual(
      Array.from({ length: TOTAL_STATIONS }, (_, i) => i + 1),
    );
  });

  it("round-trips every track through its province", () => {
    TRACKS.forEach((_, p) => {
      const r = provinceOfTrack(p);
      expect(p).toBeGreaterThanOrEqual(firstTrackOfProvince(r));
      expect(p).toBeLessThan(firstTrackOfProvince(r) + PROVINCES[r]!.tracks.length);
    });
  });

  it("round-trips every station through its track", () => {
    STATIONS.forEach((_, i) => {
      const p = trackOfStation(i);
      expect(i).toBeGreaterThanOrEqual(firstStationOfTrack(p));
      expect(i).toBeLessThan(firstStationOfTrack(p) + TRACKS[p]!.stations.length);
    });
  });
});

describe("progress states", () => {
  it("walks track 1 from current to done", () => {
    expect(trackState(0, 0)).toBe("current");
    expect(trackState(0, 4)).toBe("done");
    expect(trackState(1, 0)).toBe("locked");
  });

  it("keeps an unauthored province locked even once the course is finished", () => {
    // the guard that matters: an empty track range must not read as `current`
    expect(PROVINCES[1]!.tracks).toHaveLength(0);
    expect(provinceState(1, TOTAL_STATIONS)).toBe("locked");
    expect(provinceState(1, 0)).toBe("locked");
  });

  it("tracks province 1 across the whole course", () => {
    expect(provinceState(0, 0)).toBe("current");
    expect(provinceState(0, TOTAL_STATIONS)).toBe("done");
  });

  it("reports a province's station range for per-province path drawing", () => {
    expect(stationRangeOfProvince(0)).toEqual({ start: 0, count: 17 });
    expect(stationRangeOfProvince(1)).toEqual({ start: 17, count: 0 });
  });
});

describe("subway naming", () => {
  it("gives every station a kana place name and a romaji label", () => {
    STATIONS.forEach((s) => {
      expect(s.place).toMatch(/^[぀-ゟ]+$/); // hiragana only, no kanji/katakana
      expect(s.placeRomaji.length).toBeGreaterThan(0);
    });
  });

  it("never repeats a place name", () => {
    const places = STATIONS.map((s) => s.place);
    expect(new Set(places).size).toBe(places.length);
  });

  it("gives every track a real line name and a single-letter code", () => {
    TRACKS.forEach((t) => {
      expect(t.line.length).toBeGreaterThan(0);
      expect(t.lineKanji).toMatch(/線$/);
      expect(t.code).toMatch(/^[A-Z]$/);
    });
  });

  it("uses a distinct line code per track within a province", () => {
    PROVINCES.forEach((p) => {
      const codes = p.tracks.map((t) => t.code);
      expect(new Set(codes).size).toBe(codes.length);
    });
  });
});

describe("track hues", () => {
  it("gives each track in a province a distinct hue", () => {
    const hues = PROVINCES[0]!.tracks.map((_, j) => trackHue(j));
    expect(new Set(hues).size).toBe(hues.length);
  });

  it("restarts the cycle in each province, so every province opens on hue 1", () => {
    // track 0 is the first of province 1; whatever the next province's first track
    // index turns out to be, it must land back on the same hue.
    expect(trackHue(0)).toBe("var(--color-track-1)");
    expect(trackHue(firstTrackOfProvince(1))).toBe("var(--color-track-1)");
  });

  it("only ever names a hue that exists in the stylesheet", () => {
    // guards the modulo: no province, however long, can reference --color-track-6+
    TRACKS.forEach((_, j) => {
      const n = Number(trackHue(j).match(/track-(\d+)/)![1]);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(TRACK_HUES);
    });
  });
});

// A completion slide tells the learner whether a book stop is coming, so this lookup has
// to agree with the map. Promising one that is not there sends them hunting for nothing.
describe("book stops on the way out of a station", () => {
  it("reports the stops the map actually places", () => {
    expect(hasBookStopAfter("vowels")).toBe(true);
    expect(hasBookStopAfter("k-row")).toBe(true);
  });

  it("reports none where the map places none", () => {
    // The next stop after this one unlocks at station 8, not 4.
    expect(hasBookStopAfter("look-back-1")).toBe(false);
  });

  it("is false for an unknown station rather than throwing", () => {
    expect(hasBookStopAfter("not-a-station")).toBe(false);
  });
});
