import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildQuoteMessage, isEmailValid, isQuoteReady, mailtoHref, type QuoteLabels, type QuoteRequest } from './quote-message.ts';

const labels: QuoteLabels = {
  hello: 'Hello',
  sections: { contact: 'Contact', project: 'Project', brief: 'Brief' },
  name: 'Name', company: 'Company', phone: 'Phone', email: 'Email', contactVia: 'Prefers', service: 'Service',
};
const empty: QuoteRequest = { service: '', name: '', company: '', phone: '', email: '', contactVia: '', answers: [], details: '' };
const base: QuoteRequest = { ...empty, service: 'Signage', name: 'Sara', phone: '+968 9123 4567' };

test('a request needs a service, a name and a real-looking number', () => {
  assert.equal(isQuoteReady(base), true);
  assert.equal(isQuoteReady({ ...base, service: '  ' }), false);
  assert.equal(isQuoteReady({ ...base, name: ' ' }), false);
  assert.equal(isQuoteReady({ ...base, phone: '12' }), false);
  assert.equal(isQuoteReady({ ...base, phone: 'abc' }), false);
});

test('a given email must look like one, an empty one is fine', () => {
  assert.equal(isEmailValid(''), true);
  assert.equal(isEmailValid('sara@example.com'), true);
  assert.equal(isEmailValid('sara@'), false);
  assert.equal(isEmailValid('sara example.com'), false);
  assert.equal(isQuoteReady({ ...base, email: 'nope' }), false);
});

test('the message groups answers under contact, project and brief and leaves out empty ones', () => {
  const text = buildQuoteMessage({ ...base, answers: [['Needed', 'This week'], ['Area', ' ']] }, labels);
  assert.equal(text, ['Hello', '', 'Contact', 'Name: Sara', 'Phone: +968 9123 4567', '', 'Project', 'Service: Signage', 'Needed: This week'].join('\n'));
});

test('the message carries every contact detail and the brief, trimmed', () => {
  const text = buildQuoteMessage(
    { ...base, company: ' Al Noor LLC ', email: 'sara@example.com', contactVia: 'WhatsApp', answers: [['Size', '4 × 1 m'], ['Where', 'Muscat']], details: '  Shopfront sign, lit  ' },
    labels,
  );
  assert.match(text, /Company: Al Noor LLC\n/);
  assert.match(text, /Email: sara@example.com\n/);
  assert.match(text, /Prefers: WhatsApp\n/);
  assert.match(text, /Size: 4 × 1 m\nWhere: Muscat\n/);
  assert.match(text, /\nBrief\nShopfront sign, lit$/);
});

test('the mailto link encodes subject and body', () => {
  const href = mailtoHref('hello@example.com', 'Quote request', 'Line 1\nLine 2 & more');
  assert.equal(href, 'mailto:hello@example.com?subject=Quote%20request&body=Line%201%0ALine%202%20%26%20more');
});

// the WhatsApp greeting follows the page: a service page names the service, a job page the job
import { waGreeting } from './quote-message.ts';
const wa = { general: 'Hello, a question.', about: 'Hello, about {name}.', job: 'Hello, a job like "{title}".' };
test('waGreeting is the general line by default', () => {
  assert.equal(waGreeting(wa), 'Hello, a question.');
});
test('waGreeting names the service on a service page', () => {
  assert.equal(waGreeting(wa, { service: 'Signage' }), 'Hello, about Signage.');
});
test('waGreeting names the job on a job page (a job wins over its service)', () => {
  assert.equal(waGreeting(wa, { service: 'Signage', job: 'A lit shopfront sign' }), 'Hello, a job like "A lit shopfront sign".');
});
