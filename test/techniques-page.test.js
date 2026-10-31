import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { techniqueGroups } from '../src/data/techniques.js';

const page = readFileSync(new URL('../src/pages/tecnicas/index.astro', import.meta.url), 'utf8');
const header = readFileSync(new URL('../src/components/SiteHeader.astro', import.meta.url), 'utf8');

test('techniques are organized into linked, populated categories without duplicate names', () => {
  assert.equal(techniqueGroups.length, 3);
  const techniques = techniqueGroups.flatMap((group) => {
    assert.ok(group.id && group.title && group.description);
    assert.ok(group.techniques.length >= 8);
    return group.techniques;
  });
  assert.equal(new Set(techniques.map(([name]) => name)).size, techniques.length);
  for (const technique of techniques) assert.ok(technique.length === 3 && technique.every(Boolean));
  for (const name of ['Kamehameha', 'Genkidama', 'Mafuba', 'Hakai', 'Ultra Instinto']) {
    assert.ok(techniques.some(([technique]) => technique === name));
  }
  assert.match(page, /href=\{`#\$\{group\.id\}`\}/);
  assert.match(page, /id=\{group\.id\}/);
  assert.match(page, /no exhaustiva/);
});

test('techniques page uses the Spanish accessible shell and base-aware navigation', () => {
  assert.match(page, /<html lang="es">/);
  assert.match(page, /<SiteHeader currentPage="techniques"/);
  assert.match(page, /aria-label="Categorías de técnicas"/);
  assert.match(page, /import '\.\.\/\.\.\/scripts\/navigation\.js'/);
  assert.match(header, /\$\{siteBase\}tecnicas\//);
  assert.match(header, /currentPage === 'techniques' \? 'page' : undefined/);
});
