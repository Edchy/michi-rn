import type { Grade, SrsItemState } from "./types";

/** SM-2's ease-factor floor. Ease never drops below this. */
export const MIN_EASE = 1.3;

const DAY_MS = 86_400_000;
/** Relearn delay for a "forgot" grade: same day, a few minutes out. */
const RELEARN_MS = 5 * 60_000;

/** Ease-factor delta and whether the grade counts as a successful recall. */
const GRADES: Record<Grade, { easeDelta: number; passed: boolean }> = {
  forgot: { easeDelta: -0.2, passed: false },
  hard: { easeDelta: -0.15, passed: true },
  got_it: { easeDelta: 0, passed: true },
  easy: { easeDelta: 0.15, passed: true },
};

/** A freshly-introduced item: default SM-2 state, due immediately. */
export function newItem(now: Date): SrsItemState {
  return {
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    dueDate: now,
    lastReviewed: null,
  };
}

/** Apply a review grade at time `now`, returning the item's new SM-2 state. */
export function review(item: SrsItemState, grade: Grade, now: Date): SrsItemState {
  const { easeDelta, passed } = GRADES[grade];
  const easeFactor = Math.max(MIN_EASE, item.easeFactor + easeDelta);

  if (!passed) {
    return {
      interval: 0,
      easeFactor,
      repetitions: 0,
      dueDate: new Date(now.getTime() + RELEARN_MS),
      lastReviewed: now,
    };
  }

  const repetitions = item.repetitions + 1;
  let interval: number;
  if (repetitions === 1) interval = 1;
  else if (repetitions === 2) interval = 6;
  else interval = Math.round(item.interval * easeFactor);
  if (grade === "hard") interval = Math.max(1, Math.round(interval * 0.5));

  return {
    interval,
    easeFactor,
    repetitions,
    dueDate: new Date(now.getTime() + interval * DAY_MS),
    lastReviewed: now,
  };
}

/** Is this item due for review at time `now`? */
export function isDue(item: SrsItemState, now: Date): boolean {
  return item.dueDate.getTime() <= now.getTime();
}

/** The review queue: every due item, in the given order. */
export function dueItems<T extends SrsItemState>(items: T[], now: Date): T[] {
  return items.filter((item) => isDue(item, now));
}

/**
 * Confidence in [0, 1): rises with interval, decays once overdue.
 * Derived from SM-2 state — never stored (see data-model.md, P5).
 */
export function confidence(item: SrsItemState, now: Date): number {
  if (item.interval <= 0) return 0;
  const overdueDays = Math.max(0, (now.getTime() - item.dueDate.getTime()) / DAY_MS);
  const strength = item.interval / (item.interval + 1); // grows toward 1 with interval
  const decay = Math.exp(-overdueDays / item.interval); // half-life scales with interval
  return strength * decay;
}
