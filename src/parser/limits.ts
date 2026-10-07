/** Limits that keep a paste from freezing the browser. */
export const PARSER_LIMITS = {
  /** Maximum characters accepted from one paste or file. */
  maxSourceChars: 500_000,
  /** Maximum questions parsed from one paste. */
  maxItems: 2000,
  /** Maximum characters kept per field (prompt/answer/choices/explanation). */
  maxFieldChars: 4000,
  /** Questions longer than this are flagged as suspicious. */
  suspiciousFieldChars: 600,
} as const;

export const PARSER_LIMIT_MESSAGES = {
  sourceTooLarge: `This paste is larger than ${(
    PARSER_LIMITS.maxSourceChars / 1000
  ).toLocaleString()} thousand characters. Split it into smaller imports.`,
  tooManyItems: `Only the first ${PARSER_LIMITS.maxItems.toLocaleString()} questions were read. Split the rest into another set.`,
} as const;
