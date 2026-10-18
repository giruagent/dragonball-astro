import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreAnswers } from '../src/scripts/quiz-logic.js';

test('scores only the selected correct answer once per question', () => {
  const result = scoreAnswers(['a', 'c', 'b'], ['a', 'b', 'b']);
  assert.deepEqual(result, { score: 2, answered: 3, total: 3, complete: true });
});

test('requires every question to be answered before marking the quiz complete', () => {
  const result = scoreAnswers(['a', 'c', 'b'], ['a', null, 'b']);
  assert.deepEqual(result, { score: 2, answered: 2, total: 3, complete: false });
});

test('returns an empty result for a quiz with no questions', () => {
  assert.deepEqual(scoreAnswers([], []), { score: 0, answered: 0, total: 0, complete: true });
});
