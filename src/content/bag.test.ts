import { describe, it, expect } from "vitest";
import { ShuffleBag } from "./bag";

const ITEMS = ["a", "b", "c", "d", "e"].map((id) => ({ id }));

describe("ShuffleBag", () => {
  it("draws all items once before any repeats", () => {
    const bag = new ShuffleBag(ITEMS);
    const first5 = Array.from({ length: 5 }, () => bag.next().id);
    expect(new Set(first5).size).toBe(5); // every item exactly once
  });

  it("covers all items evenly across many draws", () => {
    const bag = new ShuffleBag(ITEMS);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 500; i++) {
      const id = bag.next().id;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    // 500 draws / 5 items = 100 each; every item must appear ~evenly, none skipped
    for (const { id } of ITEMS) expect(counts[id]).toBe(100);
  });

  it("does not hand back avoidId across a reshuffle boundary", () => {
    const bag = new ShuffleBag(ITEMS);
    let prev = "";
    for (let i = 0; i < 300; i++) {
      const id = bag.next(prev).id;
      expect(id).not.toBe(prev); // never the same item twice in a row
      prev = id;
    }
  });

  it("handles a single-item bag without infinite trouble", () => {
    const bag = new ShuffleBag([{ id: "only" }]);
    expect(bag.next().id).toBe("only");
    expect(bag.next("only").id).toBe("only"); // can't avoid it; returns it anyway
  });
});
