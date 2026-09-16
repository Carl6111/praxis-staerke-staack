import assert from 'node:assert/strict';
import test from 'node:test';
import { LESEN, lesedauer, leseplan } from '../js/tv-timing.js';

test('reading time grows with text and allows time for numbers and long words', () => {
  assert.equal(LESEN.woerterProMinute, 200);
  assert.ok(lesedauer('Wort '.repeat(100)) >= 30000);
  assert.ok(lesedauer('Wort '.repeat(100)) > lesedauer('Wort '.repeat(20)));
  assert.ok(lesedauer('Montag 08:00 – 12:00 · 16:00 – 18:00') > lesedauer('Montag geöffnet'));
  assert.ok(lesedauer('a'.repeat(430)) > lesedauer('kurz'));
  assert.ok(lesedauer('Hallo') >= 1800);
});

test('each block starts only after the preceding animation and reading interval', () => {
  const plan = leseplan([
    { text: 'Unsere Sprechzeiten', titel: true },
    { text: 'Montag 08:00 – 12:00 · 16:00 – 18:00' },
    { text: 'Dienstag 08:00 – 12:00' },
    { text: 'Hinweis '.repeat(50) },
  ]);
  for (let i = 1; i < plan.schritte.length; i++) {
    const vorher = plan.schritte[i - 1];
    assert.ok(plan.schritte[i].start >= vorher.start + vorher.animation + vorher.lesezeit + LESEN.blickwechselMs);
  }
  const ende = plan.schritte.at(-1);
  assert.ok(plan.dauer >= ende.start + ende.animation + ende.lesezeit + LESEN.abschlussMs);
});

test('long pages extend beyond the old duration rather than truncating the final block', () => {
  const kurz = leseplan([{ text: 'Kurzer Hinweis' }], 17000);
  const lang = leseplan(Array.from({ length: 4 }, () => ({ text: 'Erklärung '.repeat(30) })), 17000);
  assert.equal(kurz.dauer, 17000);
  assert.ok(lang.dauer > 40000);
  assert.equal(leseplan([], 20000).dauer, 20000);
});
