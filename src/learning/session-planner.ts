import type { ReviewTarget } from "../content/station-spec";
import { reviewTargetKey } from "../content/station-spec";
import { dueReviewRecords, type LearnerState, type ReviewRecord } from "../lib/learner-state";

export const DEFAULT_OPENING_REVIEW_LIMIT = 5;
export const DEFAULT_RECOVERY_LIMIT = 10;

export interface OpeningReviewPlan {
  kind: "none" | "review";
  targets: readonly ReviewTarget[];
  relevantDueCount: number;
  deferredRelevantCount: number;
  unrelatedDueCount: number;
}

export interface RecoveryPlan {
  kind: "none" | "recovery";
  targets: readonly ReviewTarget[];
  deferredCount: number;
}

export interface PlannedReviewPrompt extends ReviewTarget {
  recovery: boolean;
}

function assertLimit(limit: number, label: string): void {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }
}

function uniqueTargets(targets: readonly ReviewTarget[]): ReviewTarget[] {
  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = reviewTargetKey(target);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function byNeedThenAge(a: ReviewRecord, b: ReviewRecord): number {
  // A lapsed target (zero successful repetitions) gets priority. Within the same
  // state, review the oldest due target first and use the key for deterministic ties.
  const repetitions = a.schedule.repetitions - b.schedule.repetitions;
  if (repetitions !== 0) return repetitions;
  const due = a.schedule.dueDate.getTime() - b.schedule.dueDate.getTime();
  if (due !== 0) return due;
  return reviewTargetKey(a.target).localeCompare(reviewTargetKey(b.target));
}

/**
 * Select a bounded opening review from the station's declared prerequisites.
 * Unrelated and overflow due knowledge remains scheduled; it never blocks the station.
 */
export function planOpeningReview({
  state,
  prerequisites,
  now,
  limit = DEFAULT_OPENING_REVIEW_LIMIT,
}: {
  state: LearnerState;
  prerequisites: readonly ReviewTarget[];
  now: Date;
  limit?: number;
}): OpeningReviewPlan {
  assertLimit(limit, "Opening review limit");
  const prerequisiteKeys = new Set(uniqueTargets(prerequisites).map(reviewTargetKey));
  const allDue = dueReviewRecords(state, now);
  const relevant = allDue
    .filter((record) => prerequisiteKeys.has(reviewTargetKey(record.target)))
    .sort(byNeedThenAge);
  const targets = relevant.slice(0, limit).map((record) => record.target);

  return {
    kind: targets.length === 0 ? "none" : "review",
    targets,
    relevantDueCount: relevant.length,
    deferredRelevantCount: Math.max(0, relevant.length - targets.length),
    unrelatedDueCount: allDue.length - relevant.length,
  };
}

/**
 * Build one finite recovery pass from targets missed in the opening review. A target
 * appears at most once; anything beyond the cap keeps its SRS due date for later.
 */
export function planRecovery({
  misses,
  limit = DEFAULT_RECOVERY_LIMIT,
}: {
  misses: readonly ReviewTarget[];
  limit?: number;
}): RecoveryPlan {
  assertLimit(limit, "Recovery limit");
  const unique = uniqueTargets(misses);
  const targets = unique.slice(0, limit);
  return {
    kind: targets.length === 0 ? "none" : "recovery",
    targets,
    deferredCount: Math.max(0, unique.length - targets.length),
  };
}

/** Runtime progress for one bounded opening plan plus at most one recovery pass. */
export class BoundedReviewProgress {
  private pending: PlannedReviewPrompt[];
  private readonly misses: ReviewTarget[] = [];
  private recoveryStarted = false;
  private recoveryMissed = false;
  private recoveryPlanned = 0;
  private completed = 0;
  private total: number;

  constructor(
    openingTargets: readonly ReviewTarget[],
    private readonly recoveryLimit = DEFAULT_RECOVERY_LIMIT,
  ) {
    this.pending = openingTargets.map((target) => ({ ...target, recovery: false }));
    this.total = this.pending.length;
  }

  get current(): PlannedReviewPrompt {
    const prompt = this.pending[0];
    if (!prompt) throw new Error("Bounded review is already complete.");
    return prompt;
  }

  mark(wasCorrect: boolean): void {
    const prompt = this.pending.shift();
    if (!prompt) return;
    this.completed += 1;
    if (!prompt.recovery && !wasCorrect) {
      this.misses.push({ itemId: prompt.itemId, capability: prompt.capability });
    }
    if (prompt.recovery && !wasCorrect) this.recoveryMissed = true;

    if (this.pending.length === 0 && !this.recoveryStarted) {
      this.recoveryStarted = true;
      const recovery = planRecovery({ misses: this.misses, limit: this.recoveryLimit });
      this.pending = recovery.targets.map((target) => ({ ...target, recovery: true }));
      this.recoveryPlanned = this.pending.length;
      this.total += this.pending.length;
    }
  }

  get done(): boolean {
    return this.recoveryStarted && this.pending.length === 0;
  }

  get completedCount(): number {
    return this.completed;
  }

  get promptCount(): number {
    return this.total;
  }

  get recoveryCount(): number {
    return this.recoveryPlanned;
  }

  get hadRecovery(): boolean {
    return this.recoveryStarted && this.misses.length > 0;
  }

  get recoveryHadMiss(): boolean {
    return this.recoveryMissed;
  }
}
