import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/pages/personajes/index.astro', import.meta.url), 'utf8');
const header = readFileSync(new URL('../src/components/SiteHeader.astro', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

test('characters page reuses the shared warrior roster and card under the Spanish site shell', () => {
  assert.match(page, /import WarriorCard from '\.\.\/\.\.\/components\/WarriorCard\.astro';/);
  assert.match(page, /import \{ warriors \} from '\.\.\/\.\.\/data\/warriors\.js';/);
  assert.match(page, /<html lang="es">/);
  assert.match(page, /<SiteHeader currentPage="characters"\s*\/>/);
  assert.match(page, /warriors\.map/);
  assert.match(home, /import \{ warriors \} from '\.\.\/data\/warriors\.js';/);
});

test('characters navigation and page assets use Astro base path', () => {
  assert.match(header, /BASE_URL/);
  assert.match(header, /personajes\//);
  assert.match(header, /currentPage === 'characters' \? 'page' : undefined/);
  assert.match(page, /const base = `\$\{import\.meta\.env\.BASE_URL/);
  assert.match(page, /href=\{`\$\{base\}favicon\.svg`\}/);
  assert.match(page, /href=\{`\$\{base\}#sagas`\}/);
});
