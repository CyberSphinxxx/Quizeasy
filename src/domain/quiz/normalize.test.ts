import { describe, expect, it } from 'vitest';
import {
  answerKey,
  collapseWhitespace,
  isEquivalentAnswer,
  isFreeResponseFriendly,
  matchesAnyAnswer,
  promptKey,
  splitList,
  truncate,
} from './normalize';

describe('answerKey', () => {
  it('ignores casing and repeated whitespace', () => {
    expect(answerKey('  Central   Processing ')).toBe('central processing');
  });

  it('ignores surrounding punctuation and quotes', () => {
    expect(answerKey('"Random Access Memory".')).toBe('random access memory');
    expect(answerKey('“Read Only Memory”')).toBe('read only memory');
  });

  it('normalizes unicode forms', () => {
    expect(answerKey('café')).toBe(answerKey('cafe\u0301'));
  });

  it('keeps meaningful internal punctuation', () => {
    expect(answerKey('2 + 2')).not.toBe(answerKey('2 2'));
    expect(answerKey('semi;colon')).toBe('semi;colon');
  });
});

describe('isEquivalentAnswer', () => {
  it('accepts case and whitespace differences', () => {
    expect(
      isEquivalentAnswer(
        'central   processing unit',
        'Central Processing Unit',
      ),
    ).toBe(true);
  });

  it('accepts a trailing period', () => {
    expect(
      isEquivalentAnswer('Central Processing Unit.', 'Central Processing Unit'),
    ).toBe(true);
  });

  it('rejects clearly wrong answers', () => {
    expect(
      isEquivalentAnswer('Central Program Unit', 'Central Processing Unit'),
    ).toBe(false);
    expect(isEquivalentAnswer('', 'Central Processing Unit')).toBe(false);
    expect(isEquivalentAnswer('random access', 'Random Access Memory')).toBe(
      false,
    );
  });

  it('rejects answers that only share a prefix', () => {
    expect(isEquivalentAnswer('Random', 'Random Access Memory')).toBe(false);
  });

  it('matches numbers exactly', () => {
    expect(isEquivalentAnswer(' 4 ', '4')).toBe(true);
    expect(isEquivalentAnswer('4.0', '4')).toBe(false);
    expect(isEquivalentAnswer('forty', '4')).toBe(false);
  });

  it('handles symbols inside answers', () => {
    expect(isEquivalentAnswer('H2O', 'H2O')).toBe(true);
    expect(isEquivalentAnswer('h2o', 'H2O')).toBe(true);
    expect(isEquivalentAnswer('H2O2', 'H2O')).toBe(false);
  });
});

describe('matchesAnyAnswer', () => {
  it('matches an accepted variant', () => {
    expect(
      matchesAnyAnswer('Shakespeare', ['William Shakespeare', 'Shakespeare']),
    ).toBe(true);
  });

  it('does not match when nothing matches', () => {
    expect(matchesAnyAnswer('Marlowe', ['William Shakespeare'])).toBe(false);
  });
});

describe('isFreeResponseFriendly', () => {
  const limits = { maxLength: 80, maxWords: 8 };

  it('accepts short answers', () => {
    expect(isFreeResponseFriendly('Central Processing Unit', limits)).toBe(
      true,
    );
  });

  it('rejects long answers and multiline answers', () => {
    expect(isFreeResponseFriendly('x'.repeat(81), limits)).toBe(false);
    expect(
      isFreeResponseFriendly(
        'one two three four five six seven eight nine',
        limits,
      ),
    ).toBe(false);
    expect(isFreeResponseFriendly('first line\nsecond line', limits)).toBe(
      false,
    );
    expect(isFreeResponseFriendly('   ', limits)).toBe(false);
  });
});

describe('helpers', () => {
  it('collapses whitespace', () => {
    expect(collapseWhitespace('  a \n b\t c ')).toBe('a b c');
  });

  it('builds a prompt key that ignores trailing punctuation', () => {
    expect(promptKey('What is RAM?')).toBe(promptKey('what is ram'));
    expect(promptKey('What is RAM?')).not.toBe(promptKey('What is ROM?'));
  });

  it('splits comma and semicolon lists', () => {
    expect(splitList('a, b; c ,, d')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('truncates long text with an ellipsis', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcd…');
    expect(truncate('abc', 5)).toBe('abc');
  });
});
