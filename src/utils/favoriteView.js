const fold = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function favoriteView(cities, query = '', sort = 'saved') {
  const term = fold(query.trim());
  const result = cities.filter(city => fold([city.name, city.region, city.country].filter(Boolean).join(' ')).includes(term));
  if (sort === 'name-asc' || sort === 'name-desc') {
    const direction = sort === 'name-desc' ? -1 : 1;
    result.sort((a, b) => direction * a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || (a.country ?? '').localeCompare(b.country ?? '', 'en'));
  }
  return result;
}
