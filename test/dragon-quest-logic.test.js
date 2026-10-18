import test from 'node:test';
import assert from 'node:assert/strict';
import { collectDragonBall, fulfillWish } from '../src/scripts/dragon-quest-logic.js';

test('collects each valid Dragon Ball only once', () => {
  const first = collectDragonBall([], 1);
  const duplicate = collectDragonBall(first.foundBalls, 1);

  assert.deepEqual(first.foundBalls, [1]);
  assert.equal(first.added, true);
  assert.equal(duplicate.added, false);
  assert.equal(duplicate.count, 1);
});

test('completes the hunt only after all seven unique Dragon Balls are found', () => {
  let state = collectDragonBall([], 1);
  for (let number = 2; number <= 6; number += 1) {
    state = collectDragonBall(state.foundBalls, number);
    assert.equal(state.completed, false);
  }

  state = collectDragonBall(state.foundBalls, 7);
  assert.equal(state.count, 7);
  assert.equal(state.completed, true);
});

test('ignores invalid Dragon Ball numbers without changing progress', () => {
  for (const invalid of [0, 8, 1.5, Number.NaN, null]) {
    const state = collectDragonBall([2, 4], invalid);
    assert.deepEqual(state.foundBalls, [2, 4]);
    assert.equal(state.added, false);
    assert.equal(state.completed, false);
  }
});

test('fulfills a non-empty wish after trimming whitespace', () => {
  assert.equal(
    fulfillWish('  Encontrar nuevas aventuras  '),
    'Shenlong escucha: «Encontrar nuevas aventuras». ¡Tu deseo se cumple! Las esferas salen disparadas...',
  );
});

test('rejects an empty wish and caps the spoken wish length', () => {
  assert.equal(fulfillWish('   '), null);
  assert.equal(fulfillWish('x'.repeat(140)).includes('x'.repeat(121)), false);
});
