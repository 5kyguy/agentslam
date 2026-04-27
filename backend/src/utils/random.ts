export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  nextInRange(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  pick<T>(items: readonly T[]): T {
    const index = Math.floor(this.next() * items.length);
    return items[index]!;
  }
}
