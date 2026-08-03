import { isDue, newItem, review } from "../srs";
import type { Grade, SrsItemState } from "../srs";
import { reviewTargetKey, type ReviewTarget } from "../content/station-spec";

export const LEARNER_STATE_KEY = "michi-learner-state-v1";

export type AttemptSource = "checkpoint" | "review" | "recovery" | "replay";

export interface AttemptEvidence {
  answeredAt: Date;
  correct: boolean;
  source: AttemptSource;
}

export interface ReviewRecord {
  target: ReviewTarget;
  introducedAt: Date;
  schedule: SrsItemState;
  attemptCount: number;
  correctCount: number;
  lastAttempt: AttemptEvidence | null;
}

export interface LearnerState {
  version: 1;
  reviewRecords: Record<string, ReviewRecord>;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function emptyLearnerState(): LearnerState {
  return { version: 1, reviewRecords: {} };
}

/** Introduce one item-capability target without resetting it if it already exists. */
export function introduceReviewTarget(
  state: LearnerState,
  target: ReviewTarget,
  now: Date,
): LearnerState {
  const key = reviewTargetKey(target);
  if (state.reviewRecords[key]) return state;

  return {
    ...state,
    reviewRecords: {
      ...state.reviewRecords,
      [key]: {
        target,
        introducedAt: now,
        schedule: newItem(now),
        attemptCount: 0,
        correctCount: 0,
        lastAttempt: null,
      },
    },
  };
}

/**
 * Record evidence from a checkpoint or scheduled review and update its SRS schedule.
 * Ordinary guided practice should not call this: only interactions that honestly test
 * the declared capability belong in persistent review evidence.
 */
export function recordReviewAttempt(
  state: LearnerState,
  target: ReviewTarget,
  result: { correct: boolean; source: AttemptSource },
  now: Date,
): LearnerState {
  const key = reviewTargetKey(target);
  const current = state.reviewRecords[key];
  if (!current) throw new Error(`Cannot record ${key} before it is introduced.`);

  const grade: Grade = result.correct ? "got_it" : "forgot";
  const isReplay =
    result.correct && result.source === "checkpoint" && current.schedule.lastReviewed !== null;
  const source: AttemptSource = isReplay ? "replay" : result.source;
  const next: ReviewRecord = {
    ...current,
    // An immediate retry helps finish today's checkpoint but must not masquerade as
    // spaced recall or cancel the future review created by the original miss. Replaying
    // a completed station is practice too: only the target's first checkpoint and later
    // generated reviews are allowed to move its SRS clock.
    schedule:
      source === "recovery" || source === "replay"
        ? current.schedule
        : review(current.schedule, grade, now),
    attemptCount: current.attemptCount + 1,
    correctCount: current.correctCount + (result.correct ? 1 : 0),
    lastAttempt: { answeredAt: now, correct: result.correct, source },
  };

  return {
    ...state,
    reviewRecords: { ...state.reviewRecords, [key]: next },
  };
}

export function dueReviewRecords(state: LearnerState, now: Date): ReviewRecord[] {
  return Object.values(state.reviewRecords).filter((record) => isDue(record.schedule, now));
}

/**
 * Device storage, in the same shape the web build got from `localStorage`.
 *
 * MMKV is synchronous, which is why it is here rather than AsyncStorage: every caller
 * below was written against a synchronous `getItem`/`setItem`, and going async would
 * change the shape of the whole learner-state boundary for no gain.
 *
 * Resolved lazily so importing this module stays safe under vitest, where the native
 * module does not exist. Tests inject their own `StorageLike` and never reach this.
 */
let deviceStorage: StorageLike | null = null;

function storageFromDevice(): StorageLike | null {
  if (deviceStorage) return deviceStorage;
  try {
    // Required lazily: a top-level import would pull the native module into Node too.
    // MMKV v4 builds instances through `createMMKV()`; `MMKV` itself is only a type.
    const { createMMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv");
    const store = createMMKV();
    deviceStorage = {
      getItem: (key) => store.getString(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    };
    return deviceStorage;
  } catch {
    return null;
  }
}

export function saveLearnerState(
  state: LearnerState,
  storage: StorageLike | null = storageFromDevice(),
): void {
  storage?.setItem(LEARNER_STATE_KEY, JSON.stringify(state));
}

/** Storage boundary used by a station when a review target first becomes active. */
export function persistIntroducedReviewTarget(
  target: ReviewTarget,
  now: Date,
  storage: StorageLike | null = storageFromDevice(),
): ReviewRecord | null {
  if (!storage) return null;
  const next = introduceReviewTarget(loadLearnerState(storage), target, now);
  saveLearnerState(next, storage);
  return next.reviewRecords[reviewTargetKey(target)] ?? null;
}

/** Storage boundary used after one honest checkpoint or review answer. */
export function persistReviewAttempt(
  target: ReviewTarget,
  result: { correct: boolean; source: AttemptSource },
  now: Date,
  storage: StorageLike | null = storageFromDevice(),
): ReviewRecord | null {
  if (!storage) return null;
  const next = recordReviewAttempt(loadLearnerState(storage), target, result, now);
  saveLearnerState(next, storage);
  return next.reviewRecords[reviewTargetKey(target)] ?? null;
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/** Restore Date objects and reject malformed records instead of breaking the course. */
export function loadLearnerState(
  storage: StorageLike | null = storageFromDevice(),
): LearnerState {
  const raw = storage?.getItem(LEARNER_STATE_KEY);
  if (!raw) return emptyLearnerState();

  try {
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return emptyLearnerState();
    const candidate = saved as { version?: unknown; reviewRecords?: unknown };
    if (candidate.version !== 1 || !candidate.reviewRecords || typeof candidate.reviewRecords !== "object") {
      return emptyLearnerState();
    }

    const reviewRecords: Record<string, ReviewRecord> = {};
    for (const [key, value] of Object.entries(candidate.reviewRecords)) {
      if (!value || typeof value !== "object") continue;
      const record = value as Record<string, unknown>;
      const target = record.target as Record<string, unknown> | undefined;
      const schedule = record.schedule as Record<string, unknown> | undefined;
      const lastAttempt = record.lastAttempt as Record<string, unknown> | null | undefined;
      if (
        !target ||
        typeof target.itemId !== "string" ||
        (target.capability !== "sound-to-symbol" && target.capability !== "symbol-to-sound") ||
        reviewTargetKey(target as unknown as ReviewTarget) !== key ||
        !validDate(record.introducedAt) ||
        !schedule ||
        typeof schedule.interval !== "number" ||
        typeof schedule.easeFactor !== "number" ||
        typeof schedule.repetitions !== "number" ||
        !validDate(schedule.dueDate) ||
        (schedule.lastReviewed !== null && !validDate(schedule.lastReviewed)) ||
        typeof record.attemptCount !== "number" ||
        typeof record.correctCount !== "number"
      ) {
        continue;
      }

      let restoredAttempt: AttemptEvidence | null = null;
      if (lastAttempt !== null && lastAttempt !== undefined) {
        if (
          !validDate(lastAttempt.answeredAt) ||
          typeof lastAttempt.correct !== "boolean" ||
          lastAttempt.source !== "checkpoint" &&
          lastAttempt.source !== "review" &&
          lastAttempt.source !== "recovery" &&
          lastAttempt.source !== "replay"
        ) {
          continue;
        }
        restoredAttempt = {
          answeredAt: new Date(lastAttempt.answeredAt),
          correct: lastAttempt.correct,
          source: lastAttempt.source,
        };
      }

      reviewRecords[key] = {
        target: target as unknown as ReviewTarget,
        introducedAt: new Date(record.introducedAt),
        schedule: {
          interval: schedule.interval,
          easeFactor: schedule.easeFactor,
          repetitions: schedule.repetitions,
          dueDate: new Date(schedule.dueDate),
          lastReviewed:
            schedule.lastReviewed === null ? null : new Date(schedule.lastReviewed as string),
        },
        attemptCount: record.attemptCount,
        correctCount: record.correctCount,
        lastAttempt: restoredAttempt,
      };
    }

    return { version: 1, reviewRecords };
  } catch {
    return emptyLearnerState();
  }
}
