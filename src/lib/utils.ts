/** Small shared utilities (IDs, dates, collections). */

/** Creates a stable unique ID (UUID v4 when the platform supports it). */
export function createId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  // Fallback for very old browsers and some test environments.
  const bytes = new Uint8Array(16);
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

/** Current time as an ISO 8601 string. */
export function nowIso(): string {
  return new Date().toISOString();
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatRelativeDate(iso: string | undefined): string {
  if (!iso) return 'Never studied';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never studied';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

export function uniqueBy<T, K>(
  values: readonly T[],
  key: (value: T) => K,
): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const value of values) {
    const valueKey = key(value);
    if (seen.has(valueKey)) continue;
    seen.add(valueKey);
    result.push(value);
  }
  return result;
}

export function groupBy<T, K extends string>(
  values: readonly T[],
  key: (value: T) => K,
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const value of values) {
    const valueKey = key(value);
    (result[valueKey] ??= []).push(value);
  }
  return result;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
