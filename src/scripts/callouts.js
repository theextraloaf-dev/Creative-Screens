/* Keep callout labels from sitting on top of each other: labels that are close in x are pushed apart in y.
   items: [{ x, y }] in screen pixels (mutated). */
export function declutter(items, gap = 28, reach = 200) {
  items.sort((a, b) => a.y - b.y);
  for (let i = 1; i < items.length; i++) {
    for (let j = 0; j < i; j++) {
      if (Math.abs(items[i].x - items[j].x) < reach && Math.abs(items[i].y - items[j].y) < gap) items[i].y = items[j].y + gap;
    }
  }
}
