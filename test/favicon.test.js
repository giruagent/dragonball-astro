import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('all pages link to the base-aware SVG favicon', () => {
  for (const page of ['src/pages/index.astro', 'src/pages/akira-toriyama.astro', 'src/pages/personajes/index.astro', 'src/pages/tecnicas/index.astro']) {
    const source = read(page);
    assert.match(source, /import\.meta\.env\.BASE_URL/, page);
    assert.match(source, /<link rel="icon" type="image\/svg\+xml" href=\{`\$\{base\}favicon\.svg`\}/, page);
  }
});

test('favicon depicts a ball with exactly four stars', () => {
  const svg = read('public/favicon.svg');
  assert.match(svg, /<svg\b[^>]*viewBox=/);
  assert.match(svg, /<circle\b/);
  assert.equal((svg.match(/<polygon\b/g) || []).length, 4);
});
