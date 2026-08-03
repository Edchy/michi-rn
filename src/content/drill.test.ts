import { describe, it, expect } from "vitest";
import {
  CheckpointProgress,
  ChoiceProgress,
  ConsolidationProgress,
  DrillProgress,
} from "./drill";

const IDS = ["a", "i", "u", "e", "o"];

describe("ChoiceProgress", () => {
  it("takes three correct answers at two options, then two at each later level", () => {
    const p = new ChoiceProgress(5);
    expect(p.optionCount).toBe(2);

    p.mark(true);
    p.mark(true);
    expect(p.optionCount).toBe(2);
    p.mark(true);
    expect(p.optionCount).toBe(3);

    for (const expected of [4, 5]) {
      p.mark(true);
      p.mark(true);
      expect(p.optionCount).toBe(expected);
    }

    p.mark(true);
    p.mark(true);
    expect(p.optionCount).toBe(5);
    expect(p.done).toBe(true);
  });

  it("moves mastery backward on a miss and resets the correct streak", () => {
    const p = new ChoiceProgress(5);
    p.mark(true);
    expect(p.masteryPoints).toBe(1);
    p.mark(false);
    expect(p.masteryPoints).toBe(0);
    p.mark(true);
    expect(p.optionCount).toBe(2);
    p.mark(true);
    expect(p.optionCount).toBe(2);
    p.mark(true);
    expect(p.optionCount).toBe(3);
  });

  it("drops a level after two consecutive misses, but not after one", () => {
    const p = new ChoiceProgress(5);
    p.mark(true);
    p.mark(true);
    p.mark(true);
    expect(p.optionCount).toBe(3);

    p.mark(false);
    expect(p.optionCount).toBe(3);
    p.mark(false);
    expect(p.optionCount).toBe(2);
  });

  it("a correct answer clears the miss streak", () => {
    const p = new ChoiceProgress(5);
    p.mark(true);
    p.mark(true);
    p.mark(true);
    p.mark(false);
    p.mark(true);
    p.mark(false);
    expect(p.optionCount).toBe(3);
  });
});

describe("DrillProgress", () => {
  it("is not done until every item has been correct", () => {
    const p = new DrillProgress(IDS);
    expect(p.done).toBe(false);
    for (const id of IDS.slice(0, 4)) p.mark(id, true);
    expect(p.done).toBe(false); // one still missing
    p.mark("o", true);
    expect(p.done).toBe(true);
  });

  it("a wrong answer does not count toward completion", () => {
    const p = new DrillProgress(IDS);
    for (const id of IDS) p.mark(id, false);
    expect(p.done).toBe(false);
  });

  it("an item stays satisfied once gotten right (a later miss doesn't un-do it)", () => {
    const p = new DrillProgress(IDS);
    for (const id of IDS) p.mark(id, true);
    expect(p.done).toBe(true);
    p.mark("a", false); // miss it again
    expect(p.done).toBe(true);
  });
});

describe("CheckpointProgress", () => {
  it("covers every item in every declared direction exactly once when correct", () => {
    const checkpoint = new CheckpointProgress(
      ["a", "i"],
      ["hearPickChar", "seePickSound"],
      () => 0.999,
    );
    const seen: string[] = [];
    while (!checkpoint.done) {
      seen.push(`${checkpoint.current.itemId}:${checkpoint.current.type}`);
      checkpoint.mark(true);
    }

    expect(new Set(seen)).toEqual(
      new Set([
        "a:hearPickChar",
        "a:seePickSound",
        "i:hearPickChar",
        "i:seePickSound",
      ]),
    );
    expect(checkpoint.completedCount).toBe(4);
    expect(checkpoint.targetCount).toBe(4);
  });

  it("requeues only a miss after intervening targets and marks it as recovery", () => {
    const checkpoint = new CheckpointProgress(
      ["a", "i", "u"],
      ["hearPickChar"],
      () => 0.999,
    );
    expect(checkpoint.current.itemId).toBe("a");
    checkpoint.mark(false);
    expect(checkpoint.current.itemId).toBe("i");
    checkpoint.mark(true);
    expect(checkpoint.current.itemId).toBe("u");
    checkpoint.mark(true);
    expect(checkpoint.current).toMatchObject({ itemId: "a", recovery: true });
    checkpoint.mark(true);
    expect(checkpoint.done).toBe(true);
  });
});

describe("ConsolidationProgress", () => {
  it("covers every item once and balances both directions", () => {
    const itemIds = Array.from({ length: 10 }, (_, index) => `item_${index}`);
    const progress = new ConsolidationProgress(itemIds, () => 0.999);
    const seen: Array<{ itemId: string; type: string }> = [];
    while (!progress.done) {
      seen.push(progress.current);
      progress.mark(true);
    }

    expect(new Set(seen.map((target) => target.itemId))).toEqual(new Set(itemIds));
    expect(seen.filter((target) => target.type === "hearPickChar")).toHaveLength(5);
    expect(seen.filter((target) => target.type === "seePickSound")).toHaveLength(5);
    expect(progress.targetCount).toBe(10);
    expect(progress.completedCount).toBe(10);
  });

  it("requeues only a missed item-direction target", () => {
    const progress = new ConsolidationProgress(["a", "i", "u"], () => 0.999);
    const missed = progress.current;
    progress.mark(false);
    progress.mark(true);
    progress.mark(true);
    expect(progress.current).toMatchObject({ ...missed, recovery: true });
    progress.mark(true);
    expect(progress.done).toBe(true);
  });
});
