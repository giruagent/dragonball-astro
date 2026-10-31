const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();

export function filterCharacters(characters, query, series) {
  const term = normalize(query);
  return characters.filter((character) => (!series || character.series === series) && normalize([character.name, character.series, character.affiliation, character.description].join(' ')).includes(term));
}
