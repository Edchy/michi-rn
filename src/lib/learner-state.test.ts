import { describe, expect, it } from "vitest";
import {
  LEARNER_STATE_KEY,
  dueReviewRecords,
  emptyLearnerState,
  introduceReviewTarget,
  loadLearnerState,
  persistIntroducedReviewTarget,
  persistReviewAttempt,
  recordReviewAttempt,
  saveLearnerState,
} from "./learner-state";
import type { ReviewTarget } from "../content/station-spec";

const NOW = new Date("2026-07-29T10:00:00Z");
const A_SOUND_TO_SYMBOL: ReviewTarget = {
  itemId: "hira_a",
  capability: "sound-to-symbol",
};

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("one-target learner-state lifecycle", () => {
  it("introduces あ, records success, schedules tomorrow, and restores after reload", () => {
    const storage = new MemoryStorage();
    let state = introduceReviewTarget(emptyLearnerState(), A_SOUND_TO_SYMBOL, NOW);
    expect(dueReviewRecords(state, NOW)).toHaveLength(1);

    state = recordReviewAttempt(
      state,
      A_SOUND_TO_SYMBOL,
      { correct: true, source: "checkpoint" },
      NOW,
    );
    const beforeReload = state.reviewRecords["hira_a:sound-to-symbol"]!;
    expect(beforeReload.attemptCount).toBe(1);
    expect(beforeReload.correctCount).toBe(1);
    expect(beforeReload.schedule.dueDate).toEqual(new Date("2026-07-30T10:00:00Z"));
    expect(dueReviewRecords(state, NOW)).toEqual([]);

    saveLearnerState(state, storage);
    const restored = loadLearnerState(storage);
    const afterReload = restored.reviewRecords["hira_a:sound-to-symbol"]!;
    expect(afterReload).toEqual(beforeReload);
    expect(afterReload.schedule.dueDate).toBeInstanceOf(Date);
    expect(afterReload.lastAttempt?.answeredAt).toBeInstanceOf(Date);
    expect(dueReviewRecords(restored, new Date("2026-07-30T10:00:00Z"))).toHaveLength(1);
  });

  it("keeps a miss as evidence and schedules a short relearn", () => {
    let state = introduceReviewTarget(emptyLearnerState(), A_SOUND_TO_SYMBOL, NOW);
    state = recordReviewAttempt(
      state,
      A_SOUND_TO_SYMBOL,
      { correct: false, source: "checkpoint" },
      NOW,
    );

    const record = state.reviewRecords["hira_a:sound-to-symbol"]!;
    expect(record.attemptCount).toBe(1);
    expect(record.correctCount).toBe(0);
    expect(record.lastAttempt?.correct).toBe(false);
    expect(record.schedule.dueDate).toEqual(new Date("2026-07-29T10:05:00Z"));
  });

  it("does not let an immediate recovery answer cancel the review created by a miss", () => {
    let state = introduceReviewTarget(emptyLearnerState(), A_SOUND_TO_SYMBOL, NOW);
    state = recordReviewAttempt(
      state,
      A_SOUND_TO_SYMBOL,
      { correct: false, source: "checkpoint" },
      NOW,
    );
    const relearnAt = state.reviewRecords["hira_a:sound-to-symbol"]!.schedule.dueDate;

    state = recordReviewAttempt(
      state,
      A_SOUND_TO_SYMBOL,
      { correct: true, source: "recovery" },
      new Date(NOW.getTime() + 60_000),
    );

    const record = state.reviewRecords["hira_a:sound-to-symbol"]!;
    expect(record.lastAttempt?.source).toBe("recovery");
    expect(record.correctCount).toBe(1);
    expect(record.schedule.dueDate).toEqual(relearnAt);
  });

  it("does not reset an existing target when it is introduced again", () => {
    let state = introduceReviewTarget(emptyLearnerState(), A_SOUND_TO_SYMBOL, NOW);
    state = recordReviewAttempt(
      state,
      A_SOUND_TO_SYMBOL,
      { correct: true, source: "review" },
      NOW,
    );

    expect(introduceReviewTarget(state, A_SOUND_TO_SYMBOL, NOW)).toBe(state);
  });

  it("records an immediate station replay without advancing the SRS schedule", () => {
    let state = introduceReviewTarget(emptyLearnerState(), A_SOUND_TO_SYMBOL, NOW);
    state = recordReviewAttempt(
      state,
      A_SOUND_TO_SYMBOL,
      { correct: true, source: "checkpoint" },
      NOW,
    );
    const scheduled = state.reviewRecords["hira_a:sound-to-symbol"]!.schedule;

    state = recordReviewAttempt(
      state,
      A_SOUND_TO_SYMBOL,
      { correct: true, source: "checkpoint" },
      new Date(NOW.getTime() + 60_000),
    );
    const replayed = state.reviewRecords["hira_a:sound-to-symbol"]!;

    expect(replayed.lastAttempt?.source).toBe("replay");
    expect(replayed.schedule).toEqual(scheduled);
  });

  it("treats a missed station replay as real evidence of forgetting", () => {
    let state = introduceReviewTarget(emptyLearnerState(), A_SOUND_TO_SYMBOL, NOW);
    state = recordReviewAttempt(
      state,
      A_SOUND_TO_SYMBOL,
      { correct: true, source: "checkpoint" },
      NOW,
    );
    state = recordReviewAttempt(
      state,
      A_SOUND_TO_SYMBOL,
      { correct: false, source: "checkpoint" },
      new Date(NOW.getTime() + 60_000),
    );

    const missed = state.reviewRecords["hira_a:sound-to-symbol"]!;
    expect(missed.lastAttempt?.source).toBe("checkpoint");
    expect(missed.schedule.repetitions).toBe(0);
    expect(missed.schedule.dueDate).toEqual(new Date(NOW.getTime() + 6 * 60_000));
  });

  it("refuses evidence for a target that was never introduced", () => {
    expect(() =>
      recordReviewAttempt(
        emptyLearnerState(),
        A_SOUND_TO_SYMBOL,
        { correct: true, source: "checkpoint" },
        NOW,
      ),
    ).toThrow("Cannot record hira_a:sound-to-symbol before it is introduced.");
  });

  it("falls back safely when persisted data is corrupt", () => {
    const storage = new MemoryStorage();
    storage.setItem(LEARNER_STATE_KEY, "not json");
    expect(loadLearnerState(storage)).toEqual(emptyLearnerState());
  });

  it("persists the same introduce-then-answer boundary used by the live station", () => {
    const storage = new MemoryStorage();
    persistIntroducedReviewTarget(A_SOUND_TO_SYMBOL, NOW, storage);
    const saved = persistReviewAttempt(
      A_SOUND_TO_SYMBOL,
      { correct: true, source: "checkpoint" },
      NOW,
      storage,
    );

    expect(saved?.attemptCount).toBe(1);
    expect(loadLearnerState(storage).reviewRecords["hira_a:sound-to-symbol"]).toEqual(saved);
  });

  // A consolidation station records evidence against targets earlier stations introduced,
  // so it calls the introduce boundary to backfill any missing record. That backfill must
  // never reset a schedule the learner has already earned.
  it("keeps an earned schedule when a consolidation station reintroduces its pool", () => {
    const storage = new MemoryStorage();
    persistIntroducedReviewTarget(A_SOUND_TO_SYMBOL, NOW, storage);
    const earned = persistReviewAttempt(
      A_SOUND_TO_SYMBOL,
      { correct: true, source: "checkpoint" },
      NOW,
      storage,
    );

    const later = new Date("2026-08-02T10:00:00Z");
    persistIntroducedReviewTarget(A_SOUND_TO_SYMBOL, later, storage);
    const afterBackfill = loadLearnerState(storage).reviewRecords["hira_a:sound-to-symbol"];

    expect(afterBackfill).toEqual(earned);
    expect(afterBackfill?.attemptCount).toBe(1);

    // The consolidation answer itself is honest evidence and still moves the schedule.
    const consolidated = persistReviewAttempt(
      A_SOUND_TO_SYMBOL,
      { correct: true, source: "review" },
      later,
      storage,
    );
    expect(consolidated?.attemptCount).toBe(2);
    expect(consolidated?.schedule.dueDate.getTime()).toBeGreaterThan(
      earned!.schedule.dueDate.getTime(),
    );
  });
});
