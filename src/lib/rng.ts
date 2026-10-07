/**
 * Seeded random number generator.
 *
 * The study engine takes an RNG so sessions can be deterministic in tests
 * while still feeling random for users.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max]. */
  int(min: number, max: number): number;
  /** New array with the input shuffled (Fisher-Yates). */
  shuffle<T>(values: readonly T[]): T[];
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32: tiny, fast, good enough for shuffling study material. */
export function createRng(seed: string): Rng {
  let state = hashSeed(seed) || 1;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number) => {
    if (max <= min) return min;
    return min + Math.floor(next() * (max - min + 1));
  };

  const shuffle = <T>(values: readonly T[]): T[] => {
    const copy = values.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = int(0, i);
      const a = copy[i] as T;
      const b = copy[j] as T;
      copy[i] = b;
      copy[j] = a;
    }
    return copy;
  };

  return { next, int, shuffle };
}

/** Used when the caller did not provide a seed (real study sessions). */
export function createSessionSeed(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `seed-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
