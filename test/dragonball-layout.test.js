import test from 'node:test';
import assert from 'node:assert/strict';
import { starLayouts } from '../src/scripts/dragonball-layout.js';

test('provides a distinct, centered star layout for each of the seven Dragon Balls', () => {
  assert.deepEqual(starLayouts.map((layout) => layout.length), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(starLayouts[0], [[50, 50]]);
});

test('keeps every star inside the orb and avoids overlapping positions', () => {
  for (const layout of starLayouts) {
    const positions = layout.map(([x, y]) => `${x},${y}`);
    assert.equal(new Set(positions).size, layout.length);
    if (layout.length >= 3) {
      let hasNonCollinearTriple = false;
      for (let first = 0; first < layout.length - 2; first += 1) {
        for (let second = first + 1; second < layout.length - 1; second += 1) {
          for (let third = second + 1; third < layout.length; third += 1) {
            const [x1, y1] = layout[first];
            const [x2, y2] = layout[second];
            const [x3, y3] = layout[third];
            if ((x2 - x1) * (y3 - y1) !== (y2 - y1) * (x3 - x1)) {
              hasNonCollinearTriple = true;
            }
          }
        }
      }
      assert.ok(hasNonCollinearTriple, 'stars should form a recognizable 2D pattern');
    }
    for (const [x, y] of layout) {
      assert.ok(x > 0 && x < 100);
      assert.ok(y > 0 && y < 100);
    }
  }
});
