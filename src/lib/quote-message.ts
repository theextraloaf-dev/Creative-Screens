export interface QuoteRequest {
  service: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  contactVia: string;
  /* the project answers, already labelled, in the order they were asked (see quote-fields.ts) */
  answers: [string, string][];
  details: string;
}

export interface QuoteLabels {
  hello: string;
  sections: { contact: string; project: string; brief: string };
  name: string;
  company: string;
  phone: string;
  email: string;
  contactVia: string;
  service: string;
}

const MIN_PHONE_DIGITS = 6;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* An empty email is fine; a given one must look like an address. */
export const isEmailValid = (email: string): boolean => email.trim() === '' || EMAIL.test(email.trim());

/* A request needs a service, a name and a contact number; everything else is optional. */
export function isQuoteReady({ service, name, phone, email }: Pick<QuoteRequest, 'service' | 'name' | 'phone'> & { email?: string }): boolean {
  return service.trim() !== '' && name.trim() !== '' && phone.replace(/\D/g, '').length >= MIN_PHONE_DIGITS && isEmailValid(email ?? '');
}

/* The same plain-text message goes to WhatsApp and to the email body: answers grouped under contact, project and brief,
   with empty optional fields (and empty groups) left out. */
export function buildQuoteMessage(req: QuoteRequest, labels: QuoteLabels): string {
  const groups: [string, [string, string][]][] = [
    [labels.sections.contact, [[labels.name, req.name], [labels.company, req.company], [labels.phone, req.phone], [labels.email, req.email], [labels.contactVia, req.contactVia]]],
    [labels.sections.project, [[labels.service, req.service], ...req.answers]],
  ];
  const blocks = groups
    .map(([title, rows]) => [title, ...rows.filter(([, v]) => v.trim() !== '').map(([l, v]) => `${l}: ${v.trim()}`)])
    .filter((lines) => lines.length > 1)
    .map((lines) => lines.join('\n'));
  if (req.details.trim() !== '') blocks.push(`${labels.sections.brief}\n${req.details.trim()}`);
  return [labels.hello, '', blocks.join('\n\n')].join('\n');
}

export const mailtoHref = (email: string, subject: string, body: string): string =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** The first line of a WhatsApp chat started from a page: a job page names the job, a service page the service,
    anywhere else the general greeting (copy in messages.wa: general, about {name}, job {title}). */
export function waGreeting(wa: { general: string; about: string; job: string }, page: { service?: string; job?: string } = {}): string {
  if (page.job) return wa.job.replace('{title}', page.job);
  if (page.service) return wa.about.replace('{name}', page.service);
  return wa.general;
}
