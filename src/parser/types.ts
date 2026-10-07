/** Public types for the import parser. Contains no UI or storage concerns. */

export type ParseFormat = 'labelled' | 'numbered-pair' | 'pipe' | 'unknown';

export const PARSE_FORMAT_LABELS: Record<ParseFormat, string> = {
  labelled: 'Q:/A: labelled format',
  'numbered-pair': 'Numbered question/answer pairs',
  pipe: 'Pipe-delimited format',
  unknown: 'Unrecognized format',
};

export type ParseIssueCode =
  | 'unrecognized-format'
  | 'source-too-large'
  | 'too-many-items'
  | 'missing-question'
  | 'missing-answer'
  | 'empty-question'
  | 'empty-answer'
  | 'unclosed-code-fence'
  | 'skipped-line'
  | 'duplicate-wrong-choice'
  | 'wrong-choice-equals-answer'
  | 'duplicate-accepted-answer'
  | 'duplicate-tag'
  | 'long-field'
  | 'duplicate-question'
  | 'insufficient-choices'
  | 'ambiguous-numbered-pair'
  | 'empty-item';

export type ParseIssueSeverity = 'error' | 'warning';

export interface ParseIssue {
  code: ParseIssueCode;
  severity: ParseIssueSeverity;
  /** Plain-language message shown to the user. */
  message: string;
  /** Index of the item in `ParseResult.items`, when applicable. */
  itemIndex?: number;
  /** 1-based line number in the cleaned source text, when applicable. */
  line?: number;
}

export type ParseConfidence = 'high' | 'medium' | 'low';

/** A single parsed (but not yet saved) question. */
export interface ParsedQuestion {
  prompt: string;
  answer: string;
  acceptedAnswers: string[];
  wrongChoices: string[];
  explanation?: string;
  tags: string[];
  /** 1-based inclusive line range in the cleaned source text. */
  lineStart: number;
  lineEnd: number;
  confidence: ParseConfidence;
  /** Issues attached to this item (errors block saving, warnings do not). */
  issues: ParseIssue[];
}

export interface ParseResult {
  items: ParsedQuestion[];
  warnings: ParseIssue[];
  errors: ParseIssue[];
  detectedFormat: ParseFormat;
  /** The cleaned source text (code fences removed, line endings normalized). */
  sourceText: string;
  /** True when parsing stopped early because of a configured limit. */
  truncated: boolean;
  stats: {
    lines: number;
    itemsFound: number;
  };
}

/** Item status shown in the import preview. */
export type ParsedItemStatus = 'valid' | 'warning' | 'invalid';

export function itemStatus(issues: readonly ParseIssue[]): ParsedItemStatus {
  let status: ParsedItemStatus = 'valid';
  for (const issue of issues) {
    if (issue.severity === 'error') return 'invalid';
    status = 'warning';
  }
  return status;
}
