/* Exploded-view plates, one per service (art: GPT line drawings processed by scripts/plates/make_plate.py).
   Hotspots are [x, y] as fractions of the square plate, in the same order as that service's `parts` in the
   i18n files. A service without an entry shows "plate in preparation". */
export const plates: Record<string, { pts: [number, number][] }> = {
  'print-stationery': { pts: [[0.44, 0.18], [0.76, 0.2], [0.45, 0.37], [0.54, 0.5], [0.57, 0.69], [0.2, 0.66]] },
  signage: { pts: [[0.11, 0.43], [0.27, 0.27], [0.41, 0.42], [0.36, 0.21], [0.66, 0.27], [0.92, 0.34]] },
  graphics: { pts: [[0.16, 0.23], [0.09, 0.37], [0.16, 0.62], [0.33, 0.63], [0.84, 0.52], [0.84, 0.23]] },
  'flags-banners': { pts: [[0.27, 0.48], [0.43, 0.36], [0.47, 0.06], [0.42, 0.74], [0.36, 0.86], [0.75, 0.5]] },
  'exhibitions-events': { pts: [[0.52, 0.11], [0.42, 0.33], [0.2, 0.48], [0.36, 0.71], [0.72, 0.68], [0.71, 0.47]] },
};
