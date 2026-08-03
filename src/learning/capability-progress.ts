import { isDue } from "../srs";
import type { ReviewRecord } from "../lib/learner-state";

export type CapabilityState = "not-introduced" | "learning" | "mastered" | "review-due";

export interface CapabilityProgress {
  state: CapabilityState;
  introduced: boolean;
  demonstratedRecall: boolean;
  due: boolean;
}

/**
 * Derive present capability from evidence; never store this label independently.
 * Two consecutive spaced successes (the second occurs in generated review) produce
 * the first six-day interval and are the minimum evidence for mastery.
 */
export function capabilityProgress(
  record: ReviewRecord | undefined,
  now: Date,
): CapabilityProgress {
  if (!record) {
    return {
      state: "not-introduced",
      introduced: false,
      demonstratedRecall: false,
      due: false,
    };
  }

  const demonstratedRecall = record.schedule.repetitions > 0;
  const due = demonstratedRecall && isDue(record.schedule, now);
  const hasSpacedMasteryEvidence =
    record.schedule.repetitions >= 2 && record.schedule.interval >= 6;

  return {
    state: hasSpacedMasteryEvidence ? (due ? "review-due" : "mastered") : "learning",
    introduced: true,
    demonstratedRecall,
    due,
  };
}

export interface CapabilitySummary {
  total: number;
  learning: number;
  mastered: number;
  reviewDue: number;
}

export function summarizeCapabilities(
  records: readonly ReviewRecord[],
  now: Date,
): CapabilitySummary {
  const summary: CapabilitySummary = {
    total: records.length,
    learning: 0,
    mastered: 0,
    reviewDue: 0,
  };
  for (const record of records) {
    const state = capabilityProgress(record, now).state;
    if (state === "mastered") summary.mastered += 1;
    else if (state === "review-due") summary.reviewDue += 1;
    else summary.learning += 1;
  }
  return summary;
}
