/* PLACEHOLDER turnaround per service, in working days. The site shows no prices.
   Replace with the client's real figures; the copy marks them with * until then. */
export interface ServiceFacts {
  days: [number, number];
}

export const serviceFacts: Record<string, ServiceFacts> = {
  'print-stationery': { days: [1, 3] },
  signage: { days: [3, 7] },
  graphics: { days: [2, 5] },
  'flags-banners': { days: [2, 4] },
  'exhibitions-events': { days: [5, 10] },
  'led-screens': { days: [7, 14] },
  'gifts-apparel': { days: [2, 6] },
  'acrylic-awards': { days: [2, 5] },
};
