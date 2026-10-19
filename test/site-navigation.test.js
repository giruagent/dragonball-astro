import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const header = readFileSync(new URL('../src/components/SiteHeader.astro', import.meta.url), 'utf8');
const tributePage = readFileSync(new URL('../src/pages/akira-toriyama.astro', import.meta.url), 'utf8');

test('main navigation links to the Akira Toriyama page under Astro base path', () => {
  assert.match(header, /Akira Toriyama/);
  assert.match(header, /akira-toriyama\//);
  assert.match(header, /import\.meta\.env\.BASE_URL/);
});

test('shared header routes section links home from the Toriyama page and marks it current', () => {
  assert.match(header, /currentPage/);
  assert.match(header, /aria-current=\{currentPage === 'toriyama' \? 'page' : undefined\}/);
  assert.match(header, /#warriors/);
  assert.match(header, /#transformations/);
  assert.match(header, /#sagas/);
  assert.match(header, /#quiz/);
  assert.match(header, /data-shenron-entry/);
  assert.match(tributePage, /<SiteHeader currentPage="toriyama"\s*\/>/);
});

test('both pages load the shared navigation behavior without loading home-only scripts on tribute', () => {
  const home = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  const tribute = readFileSync(new URL('../src/pages/akira-toriyama.astro', import.meta.url), 'utf8');
  assert.match(home, /navigation\.js/);
  assert.match(tribute, /navigation\.js/);
  assert.doesNotMatch(tribute, /scripts\/site\.js/);
});

test('the Toriyama page labels its CTA as a home link, not a wish action', () => {
  assert.match(header, /currentPage === 'home' \? 'Pide un deseo' : 'Volver al inicio'/);
});
