import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const header = readFileSync(new URL('../src/components/SiteHeader.astro', import.meta.url), 'utf8');

test('main navigation links to the Akira Toriyama page under Astro base path', () => {
  assert.match(header, /Akira Toriyama/);
  assert.match(header, /akira-toriyama\//);
  assert.match(header, /import\.meta\.env\.BASE_URL/);
});
