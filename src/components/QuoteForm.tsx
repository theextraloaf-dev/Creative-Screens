'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { answerRows, sizeKeys, type FieldDef } from '@/lib/quote-fields';
import { buildQuoteMessage, isEmailValid, isQuoteReady, mailtoHref } from '@/lib/quote-message';
import { whatsappHref, type Messages } from '@/i18n';
import './QuoteForm.css';

export const SERVICE_EVENT = 'cs:service';
/** detail: { service?, brief? } (see the listener below) */
export const QUOTE_EVENT = 'cs:quote';

interface Props {
  copy: Messages['quote'];
  services: { slug: string; name: string }[];
  whatsapp: string;
  email: string;
  /** a service page or a job page opens the form already set to its service, with a first line of brief */
  preset?: string;
  brief?: string;
}

/* What each service asks, as data in the dictionaries (quote.tailored). */
interface Tailored {
  hint: string;
  detailsPh: string;
  where: 'site' | 'delivery' | 'none';
  fields: FieldDef[];
}

/* The quote request: who you are, what you need, the brief. The middle section follows the service chosen, so a
   print job is asked about paper and finish, a sign about lighting and installation, an LED wall about viewing
   distance, and nobody is asked what does not apply. The answers go to WhatsApp or the visitor's email app as one
   tidy message. Nothing is stored (static site). A service card can preset the service through the cs:service event.
   Only service, name and a phone number are required. */
export function QuoteForm({ copy, services, whatsapp, email, preset = '', brief: firstBrief = '' }: Props) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const f = copy.fields, o = copy.options;
  const defaultUnit = o.units[0];

  const [who, setWho] = useState({ name: '', company: '', phone: '', email: '', contactVia: '' });
  const [service, setService] = useState(preset);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [details, setDetails] = useState(firstBrief);
  const [showError, setShowError] = useState(false);
  const setWhoField = (field: keyof typeof who) => (value: string) => setWho((w) => ({ ...w, [field]: value }));
  const setVal = (key: string) => (value: string) => setVals((v) => ({ ...v, [key]: value }));

  // a "Get a quote" beside one thing we make (a range or a product on a service page) sets the service and the
  // brief's first line; what the visitor has typed is never overwritten, only an earlier first line is replaced
  const lastAuto = useRef(firstBrief);
  useEffect(() => {
    const onService = (e: Event) => setService((e as CustomEvent<string>).detail);
    const onQuote = (e: Event) => {
      const { service: s, brief: b } = (e as CustomEvent<{ service?: string; brief?: string }>).detail ?? {};
      if (s) setService(s);
      if (b) {
        setDetails((d) => (!d.trim() || d === lastAuto.current ? b : d.startsWith(lastAuto.current) ? b + d.slice(lastAuto.current.length) : `${b}\n${d}`));
        lastAuto.current = b;
      }
    };
    window.addEventListener(SERVICE_EVENT, onService);
    window.addEventListener(QUOTE_EVENT, onQuote);
    return () => { window.removeEventListener(SERVICE_EVENT, onService); window.removeEventListener(QUOTE_EVENT, onQuote); };
  }, []);

  const tailored = service ? (copy.tailored as unknown as Record<string, Tailored>)[service] : undefined;
  const serviceName = services.find((s) => s.slug === service)?.name ?? '';

  /* every question for this service, in the order asked: its own, then place, timing and artwork (no prices or budgets anywhere on the site) */
  const projectFields: FieldDef[] = tailored
    ? [
        ...tailored.fields,
        ...(tailored.where === 'none' ? [] : [
          { key: 'location', kind: 'select' as const, label: copy.where[tailored.where].label, short: copy.msg.location, options: o.locations },
          { key: 'area', kind: 'text' as const, label: copy.where[tailored.where].area, short: copy.msg.area, placeholder: f.areaPh },
        ]),
        { key: 'deadline', kind: 'select' as const, label: f.deadline, short: copy.msg.deadline, options: copy.deadlines },
        { key: 'artwork', kind: 'chips' as const, label: f.artwork, short: copy.msg.artwork, options: o.artworks },
      ]
    : [];

  const ready = isQuoteReady({ service, ...who });
  const phoneOk = isQuoteReady({ service: 'x', name: 'x', phone: who.phone });
  const message = () => {
    const merged = { ...vals };
    for (const fd of projectFields) if (fd.kind === 'size') merged[sizeKeys(fd.key).u] ??= defaultUnit;
    return buildQuoteMessage({ ...who, service: serviceName, answers: answerRows(projectFields, merged, f), details }, copy.msg);
  };

  const send = (channel: 'whatsapp' | 'email') => {
    if (!ready) { setShowError(true); return; }
    setShowError(false);
    if (channel === 'whatsapp') window.open(whatsappHref(whatsapp, message()), '_blank', 'noopener');
    else window.location.href = mailtoHref(email, `${copy.msg.subject}: ${serviceName}`, message());
  };

  const asks = (ok: boolean) => showError && !ok;

  const chips = (fd: FieldDef) => (
    <fieldset className="qf__chips" key={fd.key}>
      <legend>{fd.label}</legend>
      <div>
        {(fd.options ?? []).map((item) => (
          <label key={item} className="qf__chip">
            <input type="radio" name={id(fd.key)} value={item} checked={vals[fd.key] === item} onChange={() => setVal(fd.key)(item)} onClick={() => { if (vals[fd.key] === item) setVal(fd.key)(''); }} />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  const field = (fd: FieldDef) => {
    switch (fd.kind) {
      case 'chips':
        return chips(fd);
      case 'select':
        return (
          <div className="qf__row" key={fd.key}>
            <label htmlFor={id(fd.key)}>{fd.label}</label>
            <select id={id(fd.key)} value={vals[fd.key] ?? ''} onChange={(e) => setVal(fd.key)(e.target.value)}>
              <option value="">—</option>
              {(fd.options ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        );
      case 'size': {
        const k = sizeKeys(fd.key);
        return (
          <fieldset className="qf__size" key={fd.key}>
            <legend>{fd.label}</legend>
            <div>
              <input aria-label={f.width} placeholder={f.width} type="text" inputMode="decimal" value={vals[k.w] ?? ''} onChange={(e) => setVal(k.w)(e.target.value)} />
              <span aria-hidden="true">×</span>
              <input aria-label={f.height} placeholder={f.height} type="text" inputMode="decimal" value={vals[k.h] ?? ''} onChange={(e) => setVal(k.h)(e.target.value)} />
              <select aria-label={f.unit} value={vals[k.u] ?? defaultUnit} onChange={(e) => setVal(k.u)(e.target.value)}>
                {o.units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </fieldset>
        );
      }
      case 'date':
        return (
          <div className="qf__row" key={fd.key}>
            <label htmlFor={id(fd.key)}>{fd.label}</label>
            <input id={id(fd.key)} type="date" dir="ltr" className="ltr-field" value={vals[fd.key] ?? ''} onChange={(e) => setVal(fd.key)(e.target.value)} />
          </div>
        );
      default:
        return (
          <div className="qf__row" key={fd.key}>
            <label htmlFor={id(fd.key)}>{fd.label}</label>
            <input id={id(fd.key)} type="text" value={vals[fd.key] ?? ''} placeholder={fd.placeholder} onChange={(e) => setVal(fd.key)(e.target.value)} />
          </div>
        );
    }
  };

  /* chips and sizes take a full row; the short fields sit two to a row */
  const wide = (fd: FieldDef) => fd.kind === 'chips' || fd.kind === 'size';
  const brief = projectFields.find((fd) => fd.key === 'artwork');
  const middle = projectFields.filter((fd) => fd.key !== 'artwork');

  return (
    <form className="qf" noValidate onSubmit={(e) => { e.preventDefault(); send('whatsapp'); }} aria-describedby={showError ? id('error') : undefined}>
      <section className="qf__sec" aria-labelledby={id('s1')}>
        <h3 id={id('s1')} className="qf__h"><b className="ltr">01</b>{copy.sections.contact}</h3>
        <div className="qf__pair">
          <div className="qf__row">
            <label htmlFor={id('name')}>{f.name} <i aria-hidden="true">*</i></label>
            <input id={id('name')} type="text" autoComplete="name" value={who.name} onChange={(e) => setWhoField('name')(e.target.value)} required aria-invalid={asks(who.name.trim() !== '')} />
          </div>
          <div className="qf__row">
            <label htmlFor={id('company')}>{f.company}</label>
            <input id={id('company')} type="text" autoComplete="organization" value={who.company} onChange={(e) => setWhoField('company')(e.target.value)} />
          </div>
          <div className="qf__row">
            <label htmlFor={id('phone')}>{f.phone} <i aria-hidden="true">*</i></label>
            <input id={id('phone')} className="ltr-field" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={who.phone} placeholder={f.phonePh} onChange={(e) => setWhoField('phone')(e.target.value)} required aria-invalid={asks(phoneOk)} />
          </div>
          <div className="qf__row">
            <label htmlFor={id('email')}>{f.email}</label>
            <input id={id('email')} className="ltr-field" type="email" inputMode="email" autoComplete="email" dir="ltr" value={who.email} placeholder={f.emailPh} onChange={(e) => setWhoField('email')(e.target.value)} aria-invalid={asks(isEmailValid(who.email))} />
          </div>
        </div>
        <fieldset className="qf__chips">
          <legend>{f.contactVia}</legend>
          <div>
            {o.contactVia.map((item) => (
              <label key={item} className="qf__chip">
                <input type="radio" name={id('via')} value={item} checked={who.contactVia === item} onChange={() => setWhoField('contactVia')(item)} onClick={() => { if (who.contactVia === item) setWhoField('contactVia')(''); }} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="qf__sec" aria-labelledby={id('s2')}>
        <h3 id={id('s2')} className="qf__h"><b className="ltr">02</b>{copy.sections.project}</h3>
        <div className="qf__row">
          <label htmlFor={id('service')}>{f.service} <i aria-hidden="true">*</i></label>
          <select id={id('service')} value={service} onChange={(e) => setService(e.target.value)} required aria-invalid={asks(service !== '')}>
            <option value="">{f.servicePh}</option>
            {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>
        {tailored ? (
          <>
            <p className="qf__hint" key={service}>{tailored.hint}</p>
            <div className="qf__grid" key={`${service}-fields`}>
              {middle.map((fd) => <div key={fd.key} className={wide(fd) ? 'qf__cell qf__cell--wide' : 'qf__cell'}>{field(fd)}</div>)}
            </div>
          </>
        ) : (
          <p className="qf__hint qf__hint--idle">{copy.pick}</p>
        )}
      </section>

      {tailored && (
        <section className="qf__sec" aria-labelledby={id('s3')}>
          <h3 id={id('s3')} className="qf__h"><b className="ltr">03</b>{copy.sections.brief}</h3>
          {brief && field(brief)}
          <div className="qf__row">
            <label htmlFor={id('details')}>{f.details}</label>
            <textarea id={id('details')} rows={5} value={details} placeholder={tailored.detailsPh} onChange={(e) => setDetails(e.target.value)} />
          </div>
        </section>
      )}

      {showError && <p id={id('error')} className="qf__error" role="alert">{copy.required}</p>}

      <div className="qf__send">
        <button type="button" className="btn" onClick={() => send('whatsapp')}>{copy.send.whatsapp} <span className="arrow" aria-hidden="true">→</span></button>
        <button type="button" className="btn btn--ghost" onClick={() => send('email')}>{copy.send.email}</button>
      </div>
      <p className="qf__help">{copy.help}</p>
    </form>
  );
}
