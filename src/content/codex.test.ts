import { describe, it, expect } from "vitest";
import { CODEX_ENTRIES, codexEntry } from "./codex";
import { BOOK_STOPS, TOTAL_STATIONS } from "../course/worldmap";

describe("codex entries", () => {
  it("has a unique slug per entry", () => {
    const slugs = CODEX_ENTRIES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("unlocks every entry at a station that exists", () => {
    for (const entry of CODEX_ENTRIES) {
      expect(entry.unlockAfterStation).toBeGreaterThanOrEqual(1);
      expect(entry.unlockAfterStation).toBeLessThanOrEqual(TOTAL_STATIONS);
    }
  });

  it("gives every entry a summary and at least one section of prose", () => {
    for (const entry of CODEX_ENTRIES) {
      expect(entry.summary.length).toBeGreaterThan(0);
      expect(entry.sections.length).toBeGreaterThan(0);
      for (const section of entry.sections) {
        expect(section.heading.length).toBeGreaterThan(0);
        expect(section.paragraphs.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("book stops on the map", () => {
  // The map links straight to /codex/<slug>; a stop pointing at a missing entry
  // would render a 404 beside the path.
  it("points every book stop at an entry that exists, unlocking together", () => {
    for (const stop of BOOK_STOPS) {
      const entry = codexEntry(stop.id);
      expect(entry, `no codex entry for book stop "${stop.id}"`).toBeDefined();
      expect(stop.href).toBe(`/codex/${stop.id}`);
      expect(stop.unlockAfterStation).toBe(entry!.unlockAfterStation);
    }
  });
});
