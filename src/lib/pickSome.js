// A few items chosen at random — the "More Stories" row at the foot of an
// article, so each visit suggests something different rather than the same
// first three every time.
export function pickSome(list, count = 3) {
  const pool = [...(list ?? [])];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
