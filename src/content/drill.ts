/**
 * Drill completion tracking (pure, minimal).
 *
 * Practice is blocked: each drill block runs until the learner is consistent,
 * then the session advances to the next block. Choice drills use a progressive
 * difficulty ladder; production drills require every item in the pool once.
 */

/** Adaptive choice difficulty. The first level takes three consecutive correct
 * answers; later levels take two. Two consecutive misses lower the option count. */
export class ChoiceProgress {
  private correctStreak = 0;
  private missStreak = 0;
  private complete = false;
  private currentOptions: number;
  private points = 0;
  readonly maxPoints: number;

  constructor(private readonly maxOptions: number) {
    this.currentOptions = Math.min(2, maxOptions);
    this.maxPoints = maxOptions <= 1 ? 1 : 3 + Math.max(0, maxOptions - 2) * 2;
  }

  mark(wasCorrect: boolean): void {
    if (this.complete) return;
    if (!wasCorrect) {
      this.points = Math.max(0, this.points - 1);
      this.correctStreak = 0;
      this.missStreak += 1;
      if (this.missStreak >= 2 && this.currentOptions > 2) {
        this.currentOptions -= 1;
        this.missStreak = 0;
      }
      return;
    }

    this.points = Math.min(this.maxPoints, this.points + 1);
    this.missStreak = 0;
    this.correctStreak += 1;
    const correctToAdvance = this.currentOptions === 2 ? 3 : 2;
    if (this.correctStreak < correctToAdvance) return;

    this.correctStreak = 0;
    if (this.currentOptions < this.maxOptions) this.currentOptions += 1;
    else {
      this.points = this.maxPoints;
      this.complete = true;
    }
  }

  get optionCount(): number {
    return this.currentOptions;
  }

  get done(): boolean {
    return this.complete;
  }

  get masteryPoints(): number {
    return this.points;
  }
}

/** Track which item ids have been answered correctly at least once. */
export class DrillProgress {
  private readonly correct = new Set<string>();

  constructor(private readonly poolIds: string[]) {}

  /** Record an answer for an item. */
  mark(itemId: string, wasCorrect: boolean): void {
    if (wasCorrect) this.correct.add(itemId);
  }

  /** True once every item in the pool has been answered correctly. */
  get done(): boolean {
    return this.poolIds.every((id) => this.correct.has(id));
  }

  get completedCount(): number {
    return this.correct.size;
  }

  get totalCount(): number {
    return this.poolIds.length;
  }
}

export interface CheckpointTarget {
  itemId: string;
  type: "hearPickChar" | "seePickSound";
  recovery?: boolean;
}

/** A finite shuffled checkpoint. Misses requeue without resetting correct targets. */
export class CheckpointProgress {
  private readonly total: number;
  private completed = 0;
  private pending: CheckpointTarget[];

  constructor(
    itemIds: readonly string[],
    types: readonly CheckpointTarget["type"][],
    random: () => number = Math.random,
  ) {
    this.pending = itemIds.flatMap((itemId) => types.map((type) => ({ itemId, type })));
    this.total = this.pending.length;
    for (let i = this.pending.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.pending[i], this.pending[j]] = [this.pending[j]!, this.pending[i]!];
    }
  }

  get current(): CheckpointTarget {
    const target = this.pending[0];
    if (!target) throw new Error("Checkpoint is already complete.");
    return target;
  }

  mark(wasCorrect: boolean): void {
    const target = this.pending.shift();
    if (!target) return;
    if (wasCorrect) {
      this.completed += 1;
      return;
    }
    this.pending.splice(Math.min(2, this.pending.length), 0, { ...target, recovery: true });
  }

  get done(): boolean {
    return this.pending.length === 0;
  }

  get completedCount(): number {
    return this.completed;
  }

  get targetCount(): number {
    return this.total;
  }
}

/**
 * One shuffled prompt per item with directions balanced across the set. This is shorter
 * than an acquisition checkpoint because both directions were already established.
 */
export class ConsolidationProgress {
  private readonly total: number;
  private completed = 0;
  private pending: CheckpointTarget[];

  constructor(itemIds: readonly string[], random: () => number = Math.random) {
    const shuffledItems = shuffleWith(itemIds, random);
    const directions = shuffledItems.map((_, index) =>
      index % 2 === 0 ? "hearPickChar" as const : "seePickSound" as const,
    );
    this.pending = shuffleWith(
      shuffledItems.map((itemId, index) => ({ itemId, type: directions[index]! })),
      random,
    );
    this.total = this.pending.length;
  }

  get current(): CheckpointTarget {
    const target = this.pending[0];
    if (!target) throw new Error("Consolidation is already complete.");
    return target;
  }

  mark(wasCorrect: boolean): void {
    const target = this.pending.shift();
    if (!target) return;
    if (wasCorrect) {
      this.completed += 1;
      return;
    }
    this.pending.splice(Math.min(2, this.pending.length), 0, { ...target, recovery: true });
  }

  get done(): boolean {
    return this.pending.length === 0;
  }

  get completedCount(): number {
    return this.completed;
  }

  get targetCount(): number {
    return this.total;
  }
}

function shuffleWith<T>(values: readonly T[], random: () => number): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap]!, shuffled[index]!];
  }
  return shuffled;
}
