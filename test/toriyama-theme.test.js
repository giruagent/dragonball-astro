import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const toriyamaPage = readFileSync(new URL('../src/pages/akira-toriyama.astro', import.meta.url), 'utf8');

test('Akira Toriyama page uses the shared Dragon Ball shell and theme', () => {
  assert.match(toriyamaPage, /import SiteHeader from '\.\.\/components\/SiteHeader\.astro';/);
  assert.match(toriyamaPage, /import '\.\.\/styles\/global\.css';/);
  assert.match(toriyamaPage, /<SiteHeader currentPage="toriyama"\s*\/>/);
});

test('Akira tribute copy uses the site language, Spanish', () => {
  assert.match(toriyamaPage, /<html lang="es">/);
  assert.match(toriyamaPage, /Conoce al creador de Dragon Ball/);
});
