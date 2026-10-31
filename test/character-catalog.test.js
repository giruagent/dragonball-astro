import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/pages/personajes/index.astro', import.meta.url), 'utf8');

test('the characters page renders the local catalog as a usable baseline', () => {
  assert.match(page, /import catalog from ['"]\.\.\/\.\.\/data\/character-catalog\.json['"]/);
  assert.match(page, /catalog\.map/);
  assert.match(page, /character\.name/);
  assert.match(page, /character\.series/);
  assert.match(page, /character\.affiliation/);
  assert.match(page, /character\.description/);
});

test('search and series filtering are accent-insensitive and composable', async () => {
  const { filterCharacters } = await import('../src/scripts/character-catalog-logic.js');
  const characters = [
    { name: 'Ten Shinhan', series: 'Dragon Ball', affiliation: 'Tierra', description: 'Maestro de artes marciales' },
    { name: 'Gokú', series: 'Dragon Ball Z', affiliation: 'Guerreros Z', description: 'Saiyano' },
  ];
  assert.deepEqual(filterCharacters(characters, 'goku', 'Dragon Ball Z'), [characters[1]]);
  assert.deepEqual(filterCharacters(characters, 'maestro', 'Dragon Ball Z'), []);
  assert.deepEqual(filterCharacters(characters, 'tierra', ''), [characters[0]]);
});
