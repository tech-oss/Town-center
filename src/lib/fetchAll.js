// Reads every row of a query, a page at a time.
//
// Supabase answers any single request with at most 1,000 rows and says
// nothing when it cuts the rest off. That was harmless while the platform had
// a few hundred businesses; with the directory imported (well over 1,000) a
// plain `select()` quietly returned the first 1,000 and the rest — whole
// sections — vanished from the site and the admin lists.
//
// `build` returns a fresh query each call, WITHOUT a range, and should carry
// an ORDER BY that is unique (end it with the id) so pages never overlap or
// skip rows. Gives back the same { data, error } a plain query would.
const PAGE = 1000;

export async function fetchAll(build, pageSize = PAGE) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return { data: rows, error: null };
}
