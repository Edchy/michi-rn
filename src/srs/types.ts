/**
 * Learner-facing review grades, mapped to SM-2 behaviour in ADR-0003.
 * See docs/decisions/0003-sm2-srs-algorithm.md.
 */
export type Grade = "forgot" | "hard" | "got_it" | "easy";

/**
 * One learner's SM-2 scheduling state for one content item.
 * Field names follow docs/architecture/data-model.md (SrsItemState).
 * The engine only touches the SM-2 fields; itemId/itemKind travel with the
 * record but are the storage layer's concern.
 */
export interface SrsItemState {
  interval: number; // days until next review (SM-2 output)
  easeFactor: number; // SM-2 ease multiplier (starts ~2.5)
  repetitions: number; // count of consecutive successful reviews
  dueDate: Date; // when this item is next due
  lastReviewed: Date | null; // timestamp of last review (null until first)
}
