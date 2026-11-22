/** One half of the rolling clients row: the clients, repeated until there are at least `min` of them so the row is
    wider than the screen. The second half of the belt is the same list again, which makes the loop seamless.
    Repeats are marked so the static (no motion) row can hide them. */
export function beltRow<T>(items: T[], min: number): { item: T; repeat: boolean; key: string }[] {
  if (!items.length) return [];
  const row: { item: T; repeat: boolean; key: string }[] = [];
  for (let round = 0; round === 0 || row.length < min; round++) {
    items.forEach((item, i) => row.push({ item, repeat: round > 0, key: `${round}-${i}` }));
  }
  return row;
}
