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
//
// Pages are requested a few at a time rather than strictly one after the
// other, so a directory of a couple of thousand rows costs one round trip
// instead of two or three.
const PAGE = 1000;
const PARALLEL = 3;

export async function fetchAll(build, pageSize = PAGE) {
  const rows = [];
  for (let from = 0; ; from += pageSize * PARALLEL) {
    const batch = await Promise.all(
      Array.from({ length: PARALLEL }, (_, i) => {
        const start = from + i * pageSize;
        return build().range(start, start + pageSize - 1);
      })
    );
    let done = false;
    for (const { data, error } of batch) {
      if (error) return { data: null, error };
      rows.push(...(data ?? []));
      if (!data || data.length < pageSize) { done = true; break; }
    }
    if (done) break;
  }
  return { data: rows, error: null };
}
