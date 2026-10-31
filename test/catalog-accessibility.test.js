import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/pages/personajes/index.astro', import.meta.url), 'utf8');

test('catalog describes editorial groups without implying an exhaustive list of appearances', () => {
  assert.match(page, /Grupo de personajes/);
  assert.match(page, /categoría editorial/i);
  assert.match(page, /no indica todas sus apariciones/i);
  assert.match(page, /selección no exhaustiva/i);
});

test('showing the last page keeps the focused control available and communicates completion', async () => {
  const elements = Object.fromEntries(['search', 'series', 'clear', 'count', 'empty', 'more', 'controls'].map((name) => [name, {
    value: '', hidden: false, disabled: false, textContent: '', listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; }, setAttribute(name, value) { this[name] = value; }, getAttribute(name) { return this[name]; }, focus() { document.activeElement = this; },
  }]));
  const cards = Array.from({ length: 25 }, (_, index) => ({ dataset: { series: 'Dragon Ball', search: `Personaje ${index}` } }));
  const grid = { querySelectorAll: () => cards, replaceChildren(...nodes) { this.children = nodes; } };
  const selectors = { '[data-grid]': grid, '#character-search': elements.search, '#character-series': elements.series, '[data-clear]': elements.clear, '[data-count]': elements.count, '[data-empty]': elements.empty, '[data-more]': elements.more, '[data-controls]': elements.controls };
  globalThis.document = { querySelector: () => ({ querySelector: (selector) => selectors[selector] }) };
  try {
    await import('../src/scripts/character-catalog.js');
    elements.more.focus();
    elements.more.listeners.click();
    assert.equal(grid.children.length, 25);
    assert.equal(document.activeElement, elements.more);
    assert.equal(elements.more.hidden, false);
    assert.equal(elements.more.disabled, false);
    assert.match(elements.more.textContent, /todos los personajes mostrados/i);
  } finally { delete globalThis.document; }
});
