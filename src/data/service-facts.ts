/* PLACEHOLDER commercial facts per service (price "from", turnaround in working days).
   Replace with the client's real figures; the copy marks them with * until then. */
export interface ServiceFacts {
  from: number;
  days: [number, number];
}

export const serviceFacts: Record<string, ServiceFacts> = {
  'print-stationery': { from: 5, days: [1, 3] },
  signage: { from: 60, days: [3, 7] },
  graphics: { from: 25, days: [2, 5] },
  'flags-banners': { from: 15, days: [2, 4] },
  'exhibitions-events': { from: 250, days: [5, 10] },
  'led-screens': { from: 400, days: [7, 14] },
  'gifts-apparel': { from: 3, days: [2, 6] },
  'acrylic-awards': { from: 12, days: [2, 5] },
};
