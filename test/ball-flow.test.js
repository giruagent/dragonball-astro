import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync(new URL('../src/components/DragonBallTrigger.astro', import.meta.url), 'utf8');
const site = readFileSync(new URL('../src/scripts/site.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');

test('ball triggers occupy dedicated in-flow slots without script reparenting', () => {
  assert.match(component, /class="ball-slot"/);
  assert.match(css, /\.ball-slot\s*\{[^}]*display:\s*flex/s);
  assert.match(css, /\.ball-slot\s+\.dragon-ball-trigger\s*\{[^}]*position:\s*static/s);
  assert.doesNotMatch(site, /appendChild\(ball\)|scatterBalls|placeBalls/);
});
