import {
  cleanSourceText,
  joinFieldLines,
  normalizeFieldText,
  parseLabelledLine,
  parseNumberedLine,
  type FieldName,
} from './normalize';
import { PARSER_LIMITS, PARSER_LIMIT_MESSAGES } from './limits';
import type {
  ParsedQuestion,
  ParseConfidence,
  ParseFormat,
  ParseIssue,
  ParseResult,
} from './types';
import { splitList } from '@/domain/quiz/normalize';
import { dedupeText } from '@/domain/schemas/question';
import { validateItemFields, withDuplicateWarnings } from './validate';

interface ItemAccumulator {
  promptLines: string[];
  /** The first "A:" group is the answer; later groups are accepted variants. */
  answerGroups: string[][];
  wrongGroups: string[][];
  explanationLines: string[];
  tagLines: string[];
  current: FieldName | null;
  sawQuestionLabel: boolean;
  sawAnswerLabel: boolean;
  lineStart: number;
  lineEnd: number;
}

function createAccumulator(line: number): ItemAccumulator {
  return {
    promptLines: [],
    answerGroups: [],
    wrongGroups: [],
    explanationLines: [],
    tagLines: [],
    current: null,
    sawQuestionLabel: false,
    sawAnswerLabel: false,
    lineStart: line,
    lineEnd: line,
  };
}

function lastGroup(groups: string[][]): string[] {
  const group = groups[groups.length - 1];
  if (group) return group;
  const created: string[] = [];
  groups.push(created);
  return created;
}

function appendToCurrent(
  acc: ItemAccumulator,
  value: string,
  line: number,
): void {
  if (value !== '') acc.lineEnd = line;
  switch (acc.current) {
    case 'question':
      acc.promptLines.push(value);
      break;
    case 'answer':
      lastGroup(acc.answerGroups).push(value);
      break;
    case 'wrong':
      lastGroup(acc.wrongGroups).push(value);
      break;
    case 'explanation':
      acc.explanationLines.push(value);
      break;
    case 'tags':
      acc.tagLines.push(value);
      break;
    default:
      break;
  }
}

function applyLabel(
  acc: ItemAccumulator,
  field: FieldName,
  value: string,
  line: number,
): void {
  acc.current = field;
  acc.lineEnd = line;
  switch (field) {
    case 'question':
      acc.sawQuestionLabel = true;
      acc.promptLines.push(value);
      break;
    case 'answer':
      acc.sawAnswerLabel = true;
      // The first "A:" is the answer; later ones become accepted variants.
      acc.answerGroups.push([value]);
      break;
    case 'wrong':
      acc.wrongGroups.push([value]);
      break;
    case 'explanation':
      acc.explanationLines.push(value);
      break;
    case 'tags':
      acc.tagLines.push(value);
      break;
    default:
      break;
  }
}

function hasContent(acc: ItemAccumulator): boolean {
  return (
    acc.promptLines.length > 0 ||
    acc.answerGroups.length > 0 ||
    acc.wrongGroups.length > 0 ||
    acc.explanationLines.length > 0 ||
    acc.tagLines.length > 0
  );
}

/** Turns an accumulator into a ParsedQuestion, attaching issues. */
function finalizeItem(
  acc: ItemAccumulator,
  confidence: ParseConfidence,
): ParsedQuestion {
  const answerGroups = acc.answerGroups.map((group) => joinFieldLines(group));
  const rawWrongChoices = acc.wrongGroups
    .map((group) => joinFieldLines(group))
    .filter((value) => value.length > 0);
  const rawTags = acc.tagLines.flatMap((tagLine) => splitList(tagLine));

  const { fields, issues } = validateItemFields({
    prompt: joinFieldLines(acc.promptLines),
    answer: answerGroups[0] ?? '',
    acceptedAnswers: answerGroups.slice(1).filter((value) => value.length > 0),
    wrongChoices: rawWrongChoices,
    explanation: joinFieldLines(acc.explanationLines),
    tags: rawTags,
    line: acc.lineStart,
    sawQuestionLabel: acc.sawQuestionLabel,
    sawAnswerLabel: acc.sawAnswerLabel,
    rawWrongChoiceCount: rawWrongChoices.length,
    rawTagCount: rawTags.length,
  });

  return {
    prompt: normalizeFieldText(fields.prompt),
    answer: normalizeFieldText(fields.answer),
    acceptedAnswers: fields.acceptedAnswers,
    wrongChoices: fields.wrongChoices,
    ...(fields.explanation ? { explanation: fields.explanation } : {}),
    tags: fields.tags,
    lineStart: acc.lineStart,
    lineEnd: Math.max(acc.lineEnd, acc.lineStart),
    confidence,
    issues,
  };
}

interface FormatDetection {
  format: ParseFormat;
  questionLabelCount: number;
  pipeLineCount: number;
  numberedLineCount: number;
  nonEmptyLineCount: number;
}

function detectFormat(lines: readonly string[]): FormatDetection {
  let questionLabelCount = 0;
  let answerLabelCount = 0;
  let otherLabelCount = 0;
  let pipeLineCount = 0;
  let numberedLineCount = 0;
  let nonEmptyLineCount = 0;

  for (const line of lines) {
    if (line.trim().length === 0) continue;
    nonEmptyLineCount += 1;
    const labelled = parseLabelledLine(line);
    if (labelled) {
      if (labelled.field === 'question') questionLabelCount += 1;
      else if (labelled.field === 'answer') answerLabelCount += 1;
      else otherLabelCount += 1;
      continue;
    }
    if (line.includes('|')) pipeLineCount += 1;
    if (parseNumberedLine(line)) numberedLineCount += 1;
  }

  if (questionLabelCount > 0) {
    return {
      format: 'labelled',
      questionLabelCount,
      pipeLineCount,
      numberedLineCount,
      nonEmptyLineCount,
    };
  }

  if (
    answerLabelCount > 0 &&
    otherLabelCount === 0 &&
    pipeLineCount === 0 &&
    numberedLineCount === 0
  ) {
    // Only "A:" lines were found: still a labelled import, it will report
    // missing questions so the user can see what went wrong.
    return {
      format: 'labelled',
      questionLabelCount,
      pipeLineCount,
      numberedLineCount,
      nonEmptyLineCount,
    };
  }

  if (pipeLineCount > 0 && pipeLineCount >= nonEmptyLineCount - pipeLineCount) {
    return {
      format: 'pipe',
      questionLabelCount,
      pipeLineCount,
      numberedLineCount,
      nonEmptyLineCount,
    };
  }

  if (numberedLineCount > 0) {
    return {
      format: 'numbered-pair',
      questionLabelCount,
      pipeLineCount,
      numberedLineCount,
      nonEmptyLineCount,
    };
  }

  return {
    format: 'unknown',
    questionLabelCount,
    pipeLineCount,
    numberedLineCount,
    nonEmptyLineCount,
  };
}

function parseLabelled(lines: readonly string[]): {
  items: ParsedQuestion[];
  issues: ParseIssue[];
  truncated: boolean;
} {
  const items: ParsedQuestion[] = [];
  const issues: ParseIssue[] = [];
  let acc: ItemAccumulator | null = null;
  let truncated = false;

  const flush = () => {
    if (!acc) return;
    if (!hasContent(acc)) {
      acc = null;
      return;
    }
    if (items.length >= PARSER_LIMITS.maxItems) {
      truncated = true;
      acc = null;
      return;
    }
    items.push(finalizeItem(acc, 'high'));
    acc = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const rawLine = lines[index] ?? '';
    const isBlank = rawLine.trim().length === 0;

    if (isBlank) {
      if (acc && acc.current) appendToCurrent(acc, '', lineNumber);
      continue;
    }

    const labelled = parseLabelledLine(rawLine);
    if (labelled) {
      if (labelled.field === 'question') {
        flush();
      }
      acc ??= createAccumulator(lineNumber);
      applyLabel(acc, labelled.field, labelled.value, lineNumber);
      continue;
    }

    if (!acc || !acc.current) {
      issues.push({
        code: 'skipped-line',
        severity: 'warning',
        message: `Line ${lineNumber} was ignored because it is not part of a question or answer.`,
        line: lineNumber,
      });
      continue;
    }

    appendToCurrent(acc, rawLine.trim(), lineNumber);
  }

  flush();
  return { items, issues, truncated };
}

function parseNumberedPairs(lines: readonly string[]): {
  items: ParsedQuestion[];
  issues: ParseIssue[];
  truncated: boolean;
} {
  const items: ParsedQuestion[] = [];
  const issues: ParseIssue[] = [];
  let promptLines: string[] = [];
  let answerLines: string[] = [];
  let lineStart = 0;
  let lineEnd = 0;
  let active = false;
  let truncated = false;

  const flush = () => {
    if (!active) return;
    const prompt = joinFieldLines(promptLines);
    const answer = joinFieldLines(answerLines);
    if (!prompt && !answer) {
      active = false;
      return;
    }
    if (items.length >= PARSER_LIMITS.maxItems) {
      truncated = true;
      active = false;
      return;
    }
    const item: ParsedQuestion = {
      prompt,
      answer,
      acceptedAnswers: [],
      wrongChoices: [],
      tags: [],
      lineStart,
      lineEnd: Math.max(lineEnd, lineStart),
      confidence: 'medium',
      issues: [],
    };
    if (!prompt) {
      item.issues.push({
        code: 'missing-question',
        severity: 'error',
        message: 'No question found for this answer.',
        line: lineStart,
      });
    }
    if (!answer) {
      item.issues.push({
        code: 'missing-answer',
        severity: 'error',
        message:
          'No answer found. Put the answer on the line below the numbered question.',
        line: lineStart,
      });
    }
    if (prompt.endsWith('?') && answer.endsWith('?')) {
      item.issues.push({
        code: 'ambiguous-numbered-pair',
        severity: 'warning',
        message:
          'Both lines look like questions. Check that the answer is on the line below.',
        line: lineStart,
      });
    }
    items.push(item);
    active = false;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const rawLine = lines[index] ?? '';
    const numbered = parseNumberedLine(rawLine);
    if (numbered) {
      flush();
      active = true;
      promptLines = [numbered.text];
      answerLines = [];
      lineStart = lineNumber;
      lineEnd = lineNumber;
      continue;
    }
    if (rawLine.trim().length === 0) {
      // Blank lines act as separators inside answers, not as entry boundaries.
      continue;
    }
    if (!active) {
      issues.push({
        code: 'skipped-line',
        severity: 'warning',
        message: `Line ${lineNumber} was ignored because it does not look like a numbered question.`,
        line: lineNumber,
      });
      continue;
    }
    answerLines.push(rawLine.trim());
    lineEnd = lineNumber;
  }

  flush();
  return { items, issues, truncated };
}

function parsePipeLines(lines: readonly string[]): {
  items: ParsedQuestion[];
  issues: ParseIssue[];
  truncated: boolean;
} {
  const items: ParsedQuestion[] = [];
  const issues: ParseIssue[] = [];
  let truncated = false;

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const rawLine = lines[index] ?? '';
    if (rawLine.trim().length === 0) continue;
    if (!rawLine.includes('|')) {
      issues.push({
        code: 'skipped-line',
        severity: 'warning',
        message: `Line ${lineNumber} has no "|" separator, so it was ignored.`,
        line: lineNumber,
      });
      continue;
    }

    const fields = rawLine.split('|').map((field) => field.trim());
    const prompt = fields[0] ?? '';
    const answer = fields[1] ?? '';
    if (!prompt || !answer) {
      issues.push({
        code: 'skipped-line',
        severity: 'warning',
        message: `Line ${lineNumber} is missing a question or an answer before the "|".`,
        line: lineNumber,
      });
      continue;
    }

    if (items.length >= PARSER_LIMITS.maxItems) {
      truncated = true;
      break;
    }

    items.push({
      prompt,
      answer,
      acceptedAnswers: [],
      wrongChoices: dedupeText(fields.slice(2)),
      tags: [],
      lineStart: lineNumber,
      lineEnd: lineNumber,
      confidence: 'medium',
      issues: [],
    });
  }

  return { items, issues, truncated };
}

/** Formats that produced no items but also no explanation get one clear error. */
function unrecognizedFormatIssue(): ParseIssue {
  return {
    code: 'unrecognized-format',
    severity: 'error',
    message:
      'Quizeasy could not find any questions in that text. Use "Q:" and "A:" lines, "Question:" and "Answer:" labels, "1." numbered pairs, or "question | answer" lines.',
  };
}

/**
 * Parses pasted study material into canonical questions.
 *
 * The parser never invents content: it only interprets what the user pasted.
 * Malformed entries are reported as issues so the preview can recover them.
 */
export function parseQuizText(raw: string): ParseResult {
  if (raw.length > PARSER_LIMITS.maxSourceChars) {
    return {
      items: [],
      warnings: [],
      errors: [
        {
          code: 'source-too-large',
          severity: 'error',
          message: PARSER_LIMIT_MESSAGES.sourceTooLarge,
        },
      ],
      detectedFormat: 'unknown',
      sourceText: raw.slice(0, 1000),
      truncated: true,
      stats: { lines: 0, itemsFound: 0 },
    };
  }

  const { text, hadUnclosedFence } = cleanSourceText(raw);
  const lines = text.split('\n');
  const warnings: ParseIssue[] = [];
  const errors: ParseIssue[] = [];

  if (hadUnclosedFence) {
    warnings.push({
      code: 'unclosed-code-fence',
      severity: 'warning',
      message:
        'The pasted text started with a code fence that was never closed. The fence markers were removed automatically.',
    });
  }

  const detection = detectFormat(lines);
  let parsed: {
    items: ParsedQuestion[];
    issues: ParseIssue[];
    truncated: boolean;
  };

  switch (detection.format) {
    case 'labelled':
      parsed = parseLabelled(lines);
      break;
    case 'numbered-pair':
      parsed = parseNumberedPairs(lines);
      break;
    case 'pipe':
      parsed = parsePipeLines(lines);
      break;
    default:
      parsed = { items: [], issues: [], truncated: false };
      errors.push(unrecognizedFormatIssue());
      break;
  }

  parsed.items = withDuplicateWarnings(parsed.items);

  if (parsed.truncated) {
    errors.push({
      code: 'too-many-items',
      severity: 'error',
      message: PARSER_LIMIT_MESSAGES.tooManyItems,
    });
  }

  if (
    detection.format !== 'unknown' &&
    parsed.items.length === 0 &&
    parsed.issues.every((issue) => issue.severity !== 'error') &&
    errors.every((issue) => issue.code !== 'unrecognized-format')
  ) {
    errors.push(unrecognizedFormatIssue());
  }

  for (const issue of parsed.issues) {
    if (issue.severity === 'error') errors.push(issue);
    else warnings.push(issue);
  }

  for (let index = 0; index < parsed.items.length; index += 1) {
    const item = parsed.items[index];
    if (!item) continue;
    for (const issue of item.issues) {
      const withIndex: ParseIssue = { ...issue, itemIndex: index };
      if (issue.severity === 'error') errors.push(withIndex);
      else warnings.push(withIndex);
    }
  }

  return {
    items: parsed.items,
    warnings,
    errors,
    detectedFormat: detection.format,
    sourceText: text,
    truncated: parsed.truncated,
    stats: {
      lines: lines.length,
      itemsFound: parsed.items.length,
    },
  };
}
