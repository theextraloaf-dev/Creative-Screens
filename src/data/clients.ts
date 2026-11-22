/* The main clients we have worked with, for the rolling logo row on the homepage (src/components/light/Clients.tsx).
   Placeholders (sample: true) until the client sends the real list. For each real client: its name in both languages
   and its logo in public/clients/ (an SVG, or a transparent PNG/WebP about 400 px wide, on no background). The row
   shows the logos in sepia ink, in their own colours on hover. */
export interface Client {
  slug: string;
  name: { en: string; ar: string };
  /** path under public/, e.g. '/clients/omantel.svg'; without it the row shows the name */
  logo?: string;
  sample?: true;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const clients: Client[] = Array.from({ length: 10 }, (_, i) => ({
  slug: `client-${pad(i + 1)}`,
  name: { en: `Client ${pad(i + 1)}`, ar: `عميل ${pad(i + 1)}` },
  sample: true as const,
}));
