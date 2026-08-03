/**
 * A shuffle bag: draws every item once (in random order) before any repeats,
 * reshuffling when empty. This guarantees even coverage — in the drill it means
 * all five vowels get tested rather than randomness repeating a few and skipping
 * others. Avoids handing back `avoidId` on a fresh reshuffle so the same item
 * doesn't straddle a bag boundary back-to-back.
 */
export class ShuffleBag<T extends { id: string }> {
  private remaining: T[] = [];

  constructor(private readonly items: T[]) {}

  private refill(avoidFirstId?: string): void {
    const shuffled = [...this.items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    // next() pops from the END, so keep `avoidFirstId` off the last slot to
    // avoid drawing the same item twice across the reshuffle boundary.
    const last = shuffled.length - 1;
    if (avoidFirstId && shuffled.length > 1 && shuffled[last]!.id === avoidFirstId) {
      [shuffled[last], shuffled[0]] = [shuffled[0]!, shuffled[last]!];
    }
    this.remaining = shuffled;
  }

  /** Draw the next item, refilling (reshuffling) when the bag is empty. */
  next(avoidId?: string): T {
    if (this.remaining.length === 0) this.refill(avoidId);
    return this.remaining.pop()!;
  }
}
