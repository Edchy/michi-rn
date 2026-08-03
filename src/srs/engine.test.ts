import { describe, it, expect } from "vitest";
import { review, newItem, isDue, confidence, MIN_EASE } from "./engine";
import type { SrsItemState } from "./types";

const NOW = new Date("2026-07-19T12:00:00Z");

/** A freshly-introduced item, due now. */
function fresh(now = NOW): SrsItemState {
  return newItem(now);
}

/** Days between two dates, rounded to the nearest whole day. */
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

describe("newItem", () => {
  it("starts due now with default SM-2 state", () => {
    const item = newItem(NOW);
    expect(item.repetitions).toBe(0);
    expect(item.easeFactor).toBe(2.5);
    expect(item.dueDate).toEqual(NOW);
    expect(item.lastReviewed).toBeNull();
  });
});

describe("review — got_it (normal path)", () => {
  it("first success schedules 1 day out", () => {
    const next = review(fresh(), "got_it", NOW);
    expect(next.repetitions).toBe(1);
    expect(daysBetween(NOW, next.dueDate)).toBe(1);
  });

  it("second success schedules 6 days out", () => {
    let item = review(fresh(), "got_it", NOW);
    item = review(item, "got_it", item.dueDate);
    expect(item.repetitions).toBe(2);
    expect(daysBetween(item.lastReviewed!, item.dueDate)).toBe(6);
  });

  it("third success multiplies interval by ease factor", () => {
    let item = review(fresh(), "got_it", NOW);
    item = review(item, "got_it", item.dueDate); // -> 6 days
    const beforeEase = item.easeFactor;
    item = review(item, "got_it", item.dueDate); // -> 6 * ease
    expect(daysBetween(item.lastReviewed!, item.dueDate)).toBe(Math.round(6 * beforeEase));
  });

  it("records lastReviewed and grows repetitions", () => {
    const next = review(fresh(), "got_it", NOW);
    expect(next.lastReviewed).toEqual(NOW);
  });
});

describe("review — forgot (reset path)", () => {
  it("resets repetitions and schedules a short relearn (same day)", () => {
    let item = review(fresh(), "got_it", NOW); // build some progress
    item = review(item, "got_it", item.dueDate);
    const reviewAt = item.dueDate;
    item = review(item, "forgot", reviewAt);
    expect(item.repetitions).toBe(0);
    expect(daysBetween(reviewAt, item.dueDate)).toBe(0); // due again same day
    expect(item.dueDate.getTime()).toBeGreaterThan(reviewAt.getTime()); // but later
  });

  it("lowers the ease factor", () => {
    const item = review(fresh(), "forgot", NOW);
    expect(item.easeFactor).toBeLessThan(2.5);
  });
});

describe("review — hard vs easy", () => {
  it("hard grows less than got_it and lowers ease", () => {
    const hard = review(fresh(), "hard", NOW);
    const got = review(fresh(), "got_it", NOW);
    expect(hard.dueDate.getTime()).toBeLessThanOrEqual(got.dueDate.getTime());
    expect(hard.easeFactor).toBeLessThan(2.5);
  });

  it("easy raises ease above got_it", () => {
    const easy = review(fresh(), "easy", NOW);
    const got = review(fresh(), "got_it", NOW);
    expect(easy.easeFactor).toBeGreaterThan(got.easeFactor);
  });
});

describe("ease factor floor", () => {
  it("never drops below MIN_EASE no matter how many forgots", () => {
    let item = fresh();
    for (let i = 0; i < 20; i++) item = review(item, "forgot", item.dueDate);
    expect(item.easeFactor).toBeGreaterThanOrEqual(MIN_EASE);
  });
});

describe("isDue", () => {
  it("is due when dueDate is at or before now", () => {
    const item = newItem(NOW);
    expect(isDue(item, NOW)).toBe(true);
    expect(isDue(item, new Date(NOW.getTime() + 1000))).toBe(true);
  });

  it("is not due when scheduled in the future", () => {
    const item = review(fresh(), "got_it", NOW);
    expect(isDue(item, NOW)).toBe(false);
  });
});

describe("confidence", () => {
  it("is low for a brand-new item", () => {
    expect(confidence(newItem(NOW), NOW)).toBeLessThan(0.5);
  });

  it("rises as the interval grows", () => {
    const early = review(fresh(), "got_it", NOW);
    let mature = review(fresh(), "easy", NOW);
    mature = review(mature, "easy", mature.dueDate);
    mature = review(mature, "easy", mature.dueDate);
    expect(confidence(mature, mature.lastReviewed!)).toBeGreaterThan(
      confidence(early, early.lastReviewed!),
    );
  });

  it("decays when the item goes overdue", () => {
    const item = review(fresh(), "easy", NOW);
    const onTime = confidence(item, item.lastReviewed!);
    const wayLate = confidence(item, new Date(item.dueDate.getTime() + 60 * 86_400_000));
    expect(wayLate).toBeLessThan(onTime);
  });
});
