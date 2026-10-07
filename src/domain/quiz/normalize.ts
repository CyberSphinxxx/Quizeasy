/**
 * Answer comparison rules.
 *
 * Identification matching is forgiving about whitespace and casing but stays
 * strict about meaningful punctuation so clearly wrong answers do not pass.
 */

/** Collapses runs of whitespace and trims the result. */
export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Key used for "is this the same answer" checks: Unicode-normalized,
 * whitespace-collapsed, lowercased, and stripped of surrounding punctuation
 * that carries no meaning (trailing periods, surrounding quotes).
 */
export function answerKey(value: string): string {
  let key = collapseWhitespace(value).normalize('NFKC').toLowerCase();
  // Strip in two passes so `"Answer".` is treated like `answer`.
  for (let pass = 0; pass < 2; pass += 1) {
    key = key
      .replace(/^["'`“”‘’]+/, '')
      .replace(/["'`“”‘’]+$/, '')
      .replace(/[.。]+$/, '');
  }
  return key.replace(/\s*([,;:])\s*/g, '$1').trim();
}

/** Key used to detect likely duplicate prompts (punctuation-insensitive). */
export function promptKey(value: string): string {
  return collapseWhitespace(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[?!.。]+$/g, '');
}

/** User-facing comparison for identification answers. */
export function isEquivalentAnswer(
  response: string,
  expected: string,
): boolean {
  const a = answerKey(response);
  const b = answerKey(expected);
  return a.length > 0 && a === b;
}

/** True when a response matches any of the expected answers. */
export function matchesAnyAnswer(
  response: string,
  expected: readonly string[],
): boolean {
  return expected.some((candidate) => isEquivalentAnswer(response, candidate));
}

/** True when the text is plausible free-response material. */
export function isFreeResponseFriendly(
  answer: string,
  options: { maxLength: number; maxWords: number },
): boolean {
  const collapsed = collapseWhitespace(answer);
  if (collapsed.length === 0) return false;
  if (collapsed.length > options.maxLength) return false;
  if (/\n/.test(answer)) return false;
  const words = collapsed.split(' ').filter(Boolean);
  if (words.length > options.maxWords) return false;
  return true;
}

/** Shortens long text for compact UI (choice lists, previews). */
export function truncate(value: string, maxLength: number): string {
  const collapsed = collapseWhitespace(value);
  if (collapsed.length <= maxLength) return collapsed;
  return `${collapsed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

/** Splits a comma or semicolon separated string into trimmed values. */
export function splitList(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
