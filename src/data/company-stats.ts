/* "Done so far" numbers (src/components/Numbers.tsx). One number per item, in the same order as
   numbers.items in src/i18n/*.json (which holds only the label). Only `years` is confirmed by the
   client; everything else is a PLACEHOLDER — the copy marks each with * until `confirmed` is true. */
export interface CompanyStat {
  value: number;
  confirmed: boolean;
}

export const companyStats: Record<'years' | 'projects' | 'vehicles' | 'signs' | 'events', CompanyStat> = {
  years: { value: 21, confirmed: true },
  projects: { value: 1200, confirmed: false },
  vehicles: { value: 350, confirmed: false },
  signs: { value: 480, confirmed: false },
  events: { value: 260, confirmed: false },
};
