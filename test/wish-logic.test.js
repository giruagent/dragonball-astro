import test from 'node:test';
import assert from 'node:assert/strict';
import { grantWish } from '../src/scripts/wish-logic.js';

test('returns a response for a known Shenron wish', () => {
  assert.match(grantWish('strength'), /entrena/i);
});

test('returns a safe fallback for an unknown wish', () => {
  assert.match(grantWish('unknown'), /deseo/i);
});
