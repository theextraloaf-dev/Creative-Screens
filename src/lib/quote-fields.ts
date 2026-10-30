/* The questions a quote asks depend on the service chosen. A field is described as data (see quote.tailored in the
   dictionaries); this turns the visitor's answers into the labelled rows of the message. */
export type FieldKind = 'chips' | 'select' | 'text' | 'size' | 'date';

export interface FieldDef {
  key: string;
  kind: FieldKind;
  label: string;
  short?: string;   // the label used in the message when the question itself reads long
  options?: readonly string[];
  placeholder?: string;
}

export interface SizeLabels { width: string; height: string }

/* A size field keeps three values: key_w, key_h and key_u (the unit). */
export const sizeKeys = (key: string) => ({ w: `${key}_w`, h: `${key}_h`, u: `${key}_u` });

/* "3 × 1.2 m", or "Width 300 cm" when only one side is given. */
export function formatSize(width: string, height: string, unit: string, labels: SizeLabels): string {
  const w = width.trim(), h = height.trim();
  if (w && h) return `${w} × ${h} ${unit}`;
  if (w) return `${labels.width} ${w} ${unit}`;
  if (h) return `${labels.height} ${h} ${unit}`;
  return '';
}

/* One row per answered field, in the order the questions were asked. Choices that are not among the field's
   options (left over from another service) are dropped, and empty answers are left out. */
export function answerRows(fields: readonly FieldDef[], values: Readonly<Record<string, string>>, labels: SizeLabels): [string, string][] {
  const rows: [string, string][] = [];
  for (const f of fields) {
    let value: string;
    if (f.kind === 'size') {
      const k = sizeKeys(f.key);
      value = formatSize(values[k.w] ?? '', values[k.h] ?? '', values[k.u] ?? '', labels);
    } else {
      value = (values[f.key] ?? '').trim();
      if ((f.kind === 'chips' || f.kind === 'select') && !(f.options ?? []).includes(value)) value = '';
    }
    if (value !== '') rows.push([f.short ?? f.label, value]);
  }
  return rows;
}
