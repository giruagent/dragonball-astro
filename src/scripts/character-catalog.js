import { filterCharacters } from './character-catalog-logic.js';

const root = document.querySelector('[data-catalog]');
if (root) {
  const grid = root.querySelector('[data-grid]');
  const search = root.querySelector('#character-search');
  const series = root.querySelector('#character-series');
  const clear = root.querySelector('[data-clear]');
  const count = root.querySelector('[data-count]');
  const empty = root.querySelector('[data-empty]');
  const more = root.querySelector('[data-more]');
  const controls = root.querySelector('[data-controls]');
  const characters = [...grid.querySelectorAll('[data-character]')].map((node) => ({
    node, name: '', series: node.dataset.series, affiliation: '', description: node.dataset.search,
  }));
  const pageSize = 24;
  let limit = pageSize;

  function render() {
    const matches = filterCharacters(characters, search.value, series.value);
    const visible = matches.slice(0, limit);
    grid.replaceChildren(...visible.map((character) => character.node));
    count.textContent = `${matches.length} ${matches.length === 1 ? 'personaje' : 'personajes'}${matches.length > visible.length ? ` · mostrando ${visible.length}` : ''}`;
    empty.hidden = matches.length !== 0;
    more.hidden = matches.length <= pageSize;
    const complete = visible.length >= matches.length;
    more.setAttribute('aria-disabled', String(complete));
    more.textContent = complete ? 'Todos los personajes mostrados' : 'Mostrar más';
  }
  function applyFilters() { limit = pageSize; render(); }
  search.addEventListener('input', applyFilters);
  series.addEventListener('change', applyFilters);
  clear.addEventListener('click', () => { search.value = ''; series.value = ''; applyFilters(); search.focus(); });
  more.addEventListener('click', () => { if (more.getAttribute('aria-disabled') === 'true') return; limit += pageSize; render(); });
  render();
  controls.hidden = false;
}
