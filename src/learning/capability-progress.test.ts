import { describe, expect, it } from "vitest";
import type { ReviewTarget } from "../content/station-spec";
import {
  emptyLearnerState,
  introduceReviewTarget,
  recordReviewAttempt,
  type ReviewRecord,
} from "../lib/learner-state";
import { capabilityProgress, summarizeCapabilities } from "./capability-progress";

const NOW = new Date("2026-07-29T12:00:00Z");
const TARGET: ReviewTarget = { itemId: "hira_a", capability: "sound-to-symbol" };

function introduced(): ReviewRecord {
  return introduceReviewTarget(emptyLearnerState(), TARGET, NOW).reviewRecords[
    "hira_a:sound-to-symbol"
  ]!;
}

function afterFirstRecall(): ReviewRecord {
  let state = introduceReviewTarget(emptyLearnerState(), TARGET, NOW);
  state = recordReviewAttempt(state, TARGET, { correct: true, source: "checkpoint" }, NOW);
  return state.reviewRecords["hira_a:sound-to-symbol"]!;
}

function afterSpacedRecall(): ReviewRecord {
  let state = introduceReviewTarget(emptyLearnerState(), TARGET, NOW);
  state = recordReviewAttempt(state, TARGET, { correct: true, source: "checkpoint" }, NOW);
  const firstDue = state.reviewRecords["hira_a:sound-to-symbol"]!.schedule.dueDate;
  state = recordReviewAttempt(state, TARGET, { correct: true, source: "review" }, firstDue);
  return state.reviewRecords["hira_a:sound-to-symbol"]!;
}

describe("capabilityProgress", () => {
  it("distinguishes material that was never introduced", () => {
    expect(capabilityProgress(undefined, NOW)).toEqual({
      state: "not-introduced",
      introduced: false,
      demonstratedRecall: false,
      due: false,
    });
  });

  it("keeps a newly introduced target in learning before demonstrated recall", () => {
    expect(capabilityProgress(introduced(), NOW)).toMatchObject({
      state: "learning",
      demonstratedRecall: false,
    });
  });

  it("does not call one successful checkpoint permanent mastery", () => {
    expect(capabilityProgress(afterFirstRecall(), NOW)).toMatchObject({
      state: "learning",
      demonstratedRecall: true,
    });
  });

  it("requires a second success at the spaced review before mastery", () => {
    const record = afterSpacedRecall();
    expect(capabilityProgress(record, record.schedule.lastReviewed!)).toMatchObject({
      state: "mastered",
      demonstratedRecall: true,
      due: false,
    });
  });

  it("weakens present status to review-due without erasing earlier mastery evidence", () => {
    const record = afterSpacedRecall();
    expect(capabilityProgress(record, record.schedule.dueDate)).toMatchObject({
      state: "review-due",
      introduced: true,
      demonstratedRecall: true,
      due: true,
    });
  });

  it("returns to learning after a failed scheduled review", () => {
    let state = introduceReviewTarget(emptyLearnerState(), TARGET, NOW);
    state = recordReviewAttempt(state, TARGET, { correct: true, source: "checkpoint" }, NOW);
    const due = state.reviewRecords["hira_a:sound-to-symbol"]!.schedule.dueDate;
    state = recordReviewAttempt(state, TARGET, { correct: false, source: "review" }, due);
    expect(capabilityProgress(state.reviewRecords["hira_a:sound-to-symbol"], due).state).toBe(
      "learning",
    );
  });
});

describe("summarizeCapabilities", () => {
  it("summarizes current learning without referencing map position", () => {
    const learning = afterFirstRecall();
    const mastered = afterSpacedRecall();
    expect(summarizeCapabilities([learning, mastered], mastered.schedule.lastReviewed!)).toEqual({
      total: 2,
      learning: 1,
      mastered: 1,
      reviewDue: 0,
    });
  });
});
