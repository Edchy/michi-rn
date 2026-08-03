import { describe, expect, it } from "vitest";
import type { ReviewTarget } from "../content/station-spec";
import {
  emptyLearnerState,
  introduceReviewTarget,
  recordReviewAttempt,
  type LearnerState,
} from "../lib/learner-state";
import { BoundedReviewProgress, planOpeningReview, planRecovery } from "./session-planner";

const NOW = new Date("2026-07-29T12:00:00Z");

function target(itemId: string, capability: ReviewTarget["capability"] = "sound-to-symbol") {
  return { itemId, capability } satisfies ReviewTarget;
}

function dueState(targets: readonly ReviewTarget[]): LearnerState {
  return targets.reduce(
    (state, reviewTarget) => introduceReviewTarget(state, reviewTarget, NOW),
    emptyLearnerState(),
  );
}

describe("planOpeningReview", () => {
  it("selects only due targets declared as station prerequisites", () => {
    const a = target("hira_a");
    const i = target("hira_i");
    const unrelated = target("hira_ka");
    let state = dueState([a, i, unrelated]);
    state = recordReviewAttempt(
      state,
      i,
      { correct: true, source: "checkpoint" },
      NOW,
    );

    const plan = planOpeningReview({
      state,
      prerequisites: [a, i],
      now: NOW,
    });

    expect(plan.kind).toBe("review");
    expect(plan.targets).toEqual([a]);
    expect(plan.relevantDueCount).toBe(1);
    expect(plan.unrelatedDueCount).toBe(1);
  });

  it("caps a long-gap backlog and reports relevant work deferred", () => {
    const prerequisites = Array.from({ length: 12 }, (_, index) => target(`item_${index}`));
    const plan = planOpeningReview({
      state: dueState(prerequisites),
      prerequisites,
      now: NOW,
      limit: 5,
    });

    expect(plan.targets).toHaveLength(5);
    expect(plan.relevantDueCount).toBe(12);
    expect(plan.deferredRelevantCount).toBe(7);
  });

  it("prioritizes lapsed targets, then the oldest due date", () => {
    const fragile = target("fragile");
    const mature = target("mature");
    let state = dueState([fragile, mature]);
    state = recordReviewAttempt(
      state,
      mature,
      { correct: true, source: "checkpoint" },
      new Date("2026-07-20T12:00:00Z"),
    );

    const plan = planOpeningReview({
      state,
      prerequisites: [mature, fragile],
      now: NOW,
      limit: 1,
    });
    expect(plan.targets).toEqual([fragile]);
  });

  it("returns no opening review when no relevant target is due", () => {
    const a = target("hira_a");
    let state = dueState([a]);
    state = recordReviewAttempt(
      state,
      a,
      { correct: true, source: "checkpoint" },
      NOW,
    );

    expect(planOpeningReview({ state, prerequisites: [a], now: NOW })).toMatchObject({
      kind: "none",
      targets: [],
    });
  });
});

describe("planRecovery", () => {
  it("deduplicates misses and creates one finite recovery pass", () => {
    const a = target("hira_a");
    const i = target("hira_i");
    expect(planRecovery({ misses: [a, i, a] })).toEqual({
      kind: "recovery",
      targets: [a, i],
      deferredCount: 0,
    });
  });

  it("caps recovery and defers overflow instead of creating an endless session", () => {
    const misses = Array.from({ length: 12 }, (_, index) => target(`item_${index}`));
    const plan = planRecovery({ misses, limit: 10 });
    expect(plan.targets).toHaveLength(10);
    expect(plan.deferredCount).toBe(2);
  });
});

describe("BoundedReviewProgress", () => {
  it("adds one recovery pass for misses and never requeues recovery misses", () => {
    const a = target("hira_a");
    const i = target("hira_i");
    const progress = new BoundedReviewProgress([a, i]);

    expect(progress.current).toMatchObject({ itemId: "hira_a", recovery: false });
    progress.mark(false);
    progress.mark(true);
    expect(progress.current).toMatchObject({ itemId: "hira_a", recovery: true });
    expect(progress.promptCount).toBe(3);
    expect(progress.recoveryCount).toBe(1);
    expect(progress.hadRecovery).toBe(true);
    progress.mark(false);

    expect(progress.done).toBe(true);
    expect(progress.completedCount).toBe(3);
    expect(progress.recoveryHadMiss).toBe(true);
  });

  it("finishes after the opening pass when nothing was missed", () => {
    const progress = new BoundedReviewProgress([target("hira_a")]);
    progress.mark(true);
    expect(progress.done).toBe(true);
    expect(progress.promptCount).toBe(1);
  });
});
