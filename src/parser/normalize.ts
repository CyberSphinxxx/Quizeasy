import { PARSER_LIMITS } from './limits';

/** Field names the parser understands. */
export type FieldName =
  'question' | 'answer' | 'wrong' | 'explanation' | 'tags';

export interface LabelledLine {
  field: FieldName;
  value: string;
}

/**
 * Aliases are matched case-insensitively and only when a separator follows,
 * so ordinary prose is not accidentally parsed as a question.
 */
const FIELD_ALIASES: Record<FieldName, readonly string[]> = {
  question: ['question', 'questions', 'prompt', 'ques', 'q'],
  answer: ['correct answer', 'answer key', 'answer', 'correct', 'ans', 'a'],
  wrong: [
    'wrong answers',
    'wrong answer',
    'wrong choices',
    'wrong choice',
    'distractors',
    'distractor',
    'incorrect',
    'choices',
    'choice',
    'wrong',
    'other',
    'w',
  ],
  explanation: [
    'explanation',
    'explain',
    'rationale',
    'reason',
    'why',
    'note',
    'expl',
    'e',
  ],
  tags: ['topics', 'tags', 'topic', 'tag', 't'],
};

const ALIAS_LOOKUP = new Map<string, FieldName>();
for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
  for (const alias of aliases) {
    ALIAS_LOOKUP.set(alias, field as FieldName);
  }
}

/** Characters allowed to decorate a label: **Q:**, `A:`, __W:__, |T:|. */
const DECORATION = /[*_`|]/g;
/** Characters that may follow a label. */
const SEPARATORS = ':\uFF1A=)]|.\u2013\u2014';
const LETTER_HEAD = /^[A-Za-z][A-Za-z ]*$/;
const LEADING_DECORATION = /^[\s*_`|~]+/;
const TRAILING_DECORATION = /[\s*_`|~]+$/;

function firstSeparatorIndex(text: string): number {
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index] ?? '';
    if (SEPARATORS.includes(char)) return index;
  }
  return -1;
}

/** Removes blockquote markers, bullets, numbering, and heading markers. */
export function stripLinePrefixes(line: string): string {
  let text = line.trim();
  if (!text) return '';
  text = text.replace(/^>+\s*/, '');
  text = text.replace(/^[-*+\u2022\u00b7]\s+/, '');
  // Tolerate up to two levels of numbering: "1. Q:", "1. 2. Q:".
  text = text.replace(/^(?:\(\d{1,4}\)|\d{1,4}[.)\]])\s*/, '');
  text = text.replace(/^(?:\(\d{1,4}\)|\d{1,4}[.)\]])\s*/, '');
  text = text.replace(/^#{1,6}\s*/, '');
  return text.replace(/^\s+/, '');
}

/**
 * Parses a line into a labelled field, tolerating Markdown decoration,
 * bullets, numbering, and "Question:"/"Answer:" style names.
 */
export function parseLabelledLine(line: string): LabelledLine | null {
  const text = stripLinePrefixes(line);
  if (!text) return null;

  const separatorIndex = firstSeparatorIndex(text);
  if (separatorIndex <= 0) return null;

  const head = text.slice(0, separatorIndex).replace(TRAILING_DECORATION, '');
  if (!head || head.length > 24) return null;
  const cleanedHead = head.replace(DECORATION, '').trim();
  if (!cleanedHead || !LETTER_HEAD.test(cleanedHead)) return null;

  const field = ALIAS_LOOKUP.get(cleanedHead.toLowerCase());
  if (!field) return null;

  let value = text.slice(separatorIndex + 1);
  // Tolerate a duplicated separator such as "Q:: text" or "A: = text".
  value = value.replace(/^[\s:\uFF1A=]+/, '');
  value = value.replace(LEADING_DECORATION, '');
  // Tolerate closing decoration such as a backtick around the whole label.
  value = value.replace(/[\s*_`~]+$/, '');
  return { field, value: value.trim() };
}

/** A numbered line that looks like "1. Something" (used by the pair parser). */
const NUMBERED_LINE_PATTERN = /^(?:\((\d{1,4})\)|(\d{1,4})[.)\]])\s*(\S.*)$/;

/** Parses a line as "1. text" / "1) text" / "(1) text". */
export function parseNumberedLine(line: string): { text: string } | null {
  const match = NUMBERED_LINE_PATTERN.exec(line.trim());
  if (!match) return null;
  const text = (match[3] ?? '').trim();
  if (!text) return null;
  return { text };
}

/**
 * Normalizes line endings, removes a surrounding code fence, and replaces
 * non-breaking spaces.
 */
export function cleanSourceText(raw: string): {
  text: string;
  hadUnclosedFence: boolean;
} {
  let text = raw.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const trimmed = text.trim();
  const fenceMatch = /^```[a-zA-Z0-9_+-]*[ \t]*\n([\s\S]*?)\n?```$/.exec(
    trimmed,
  );
  if (fenceMatch) {
    return {
      text: (fenceMatch[1] ?? '').replace(/\r\n?/g, '\n'),
      hadUnclosedFence: false,
    };
  }

  // Strip a fence that was pasted without its closing marker.
  const openFence = /^```[a-zA-Z0-9_+-]*[ \t]*\n([\s\S]*)$/.exec(trimmed);
  if (openFence && !/\n```/.test(openFence[1] ?? '')) {
    return {
      text: (openFence[1] ?? '').replace(/\r\n?/g, '\n'),
      hadUnclosedFence: true,
    };
  }

  return { text, hadUnclosedFence: false };
}

/**
 * Joins accumulated field lines. Blank lines inside a field become paragraph
 * breaks; ordinary continuation lines are joined with a space.
 */
export function joinFieldLines(lines: readonly string[]): string {
  let out = '';
  for (const line of lines) {
    if (line === '') {
      if (out && !out.endsWith('\n')) out += '\n';
      continue;
    }
    if (!out) {
      out = line;
    } else if (out.endsWith('\n')) {
      out += line;
    } else {
      out += ` ${line}`;
    }
  }
  return normalizeFieldText(out);
}

/** Collapses whitespace while keeping intentional paragraph breaks. */
export function normalizeFieldText(value: string): string {
  return value
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Truncates a field to the configured limit. */
export function clampField(value: string): {
  value: string;
  truncated: boolean;
} {
  if (value.length <= PARSER_LIMITS.maxFieldChars) {
    return { value, truncated: false };
  }
  return {
    value: value.slice(0, PARSER_LIMITS.maxFieldChars),
    truncated: true,
  };
}
