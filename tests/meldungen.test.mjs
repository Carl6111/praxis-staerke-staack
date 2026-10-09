import assert from 'node:assert/strict';
import test from 'node:test';
import { berlinNachUtc, utcNachBerlin, zeitraumText, gueltigesDatum } from '../api/_lib/zeit.js';
import { postAusBody, postNachAussen, sortieren } from '../api/_lib/posts.js';

const JETZT = Date.parse('2026-10-09T10:00:00Z');
const basis = { type: 'urlaub', title: 'Praxisurlaub', content: 'Vertretung: Dr. X' };

test('Berliner Wandzeit wird über die Zeitumstellung korrekt nach UTC gerechnet', () => {
  assert.equal(berlinNachUtc('2026-10-20', '00:00'), '2026-10-19T22:00:00.000Z'); // Sommerzeit
  assert.equal(berlinNachUtc('2026-11-02', '00:00'), '2026-11-01T23:00:00.000Z'); // Winterzeit
  assert.deepEqual(utcNachBerlin('2026-10-19T22:00:00.000Z'), { datum: '2026-10-20', uhrzeit: '00:00' });
  assert.equal(gueltigesDatum('2026-02-30'), false);
});

test('ohne Uhrzeit gilt der ganze Tag, mit Uhrzeit genau die Zeitspanne', () => {
  const ganz = postAusBody({ ...basis, von_datum: '2026-10-20', bis_datum: '2026-10-24' }, JETZT).row;
  assert.equal(ganz.von, '2026-10-19T22:00:00.000Z');
  assert.equal(ganz.bis, '2026-10-24T21:59:59.000Z');
  assert.equal(ganz.mit_uhrzeit, false);

  const zeit = postAusBody({ ...basis, von_datum: '2026-10-21', mit_uhrzeit: true, von_uhrzeit: '14:00', bis_uhrzeit: '17:00' }, JETZT).row;
  assert.equal(zeit.von, '2026-10-21T12:00:00.000Z');
  assert.equal(zeit.bis, '2026-10-21T15:00:00.000Z', 'Ohne Bis-Datum gilt derselbe Tag');
});

test('ohne Datum bleibt die Meldung unbefristet', () => {
  const { row } = postAusBody(basis, JETZT);
  assert.equal(row.von, null);
  assert.equal(row.bis, null);
  assert.equal(row.prioritaet, 'normal');
});

test('ungültige Eingaben werden abgewiesen', () => {
  assert.ok(postAusBody({ ...basis, bis_datum: '2026-10-01' }, JETZT).error, 'Ende in der Vergangenheit');
  assert.ok(postAusBody({ ...basis, von_datum: '2026-10-24', bis_datum: '2026-10-20' }, JETZT).error, 'Ende vor Start');
  assert.ok(postAusBody({ ...basis, mit_uhrzeit: true, von_datum: '2026-10-21', von_uhrzeit: '25:00', bis_uhrzeit: '17:00' }, JETZT).error);
  assert.ok(postAusBody({ ...basis, prioritaet: 'super' }, JETZT).error);
  assert.ok(postAusBody({ ...basis, type: 'x' }, JETZT).error);
  assert.ok(postAusBody({ ...basis, title: 42 }, JETZT).error);
  assert.equal(postAusBody({ ...basis, title: '<b>Urlaub</b>' }, JETZT).row.title, 'Urlaub', 'Markup wird entfernt');
});

test('der Zeitraum ist fertig formatiert für Website und TV', () => {
  const z = (von, bis, u) => zeitraumText(von, bis, u);
  assert.equal(z(berlinNachUtc('2026-10-20'), berlinNachUtc('2026-10-24', '23:59', 59), false), '20. – 24. Oktober 2026');
  assert.equal(z(berlinNachUtc('2026-10-28'), berlinNachUtc('2026-11-03', '23:59', 59), false), '28. Oktober – 3. November 2026');
  assert.equal(z(berlinNachUtc('2026-10-21', '14:00'), berlinNachUtc('2026-10-21', '17:00'), true), 'Mi., 21. Oktober 2026, 14:00 – 17:00 Uhr');
  assert.equal(z(berlinNachUtc('2026-10-21'), berlinNachUtc('2026-10-21', '23:59', 59), false), 'Mi., 21. Oktober 2026');
  assert.equal(z(null, null, false), '');
  const p = postNachAussen({ id: '1', ...basis, date: '2026-10-01T00:00:00Z', von: '2026-10-21T12:00:00.000Z', bis: '2026-10-21T15:00:00.000Z', mit_uhrzeit: true });
  assert.deepEqual(p.formular, { von_datum: '2026-10-21', bis_datum: '2026-10-21', von_uhrzeit: '14:00', bis_uhrzeit: '17:00' });
});

test('dringende Meldungen stehen zuerst, dann der nächste Termin, dann Unbefristetes', () => {
  const posts = [
    { id: 'alt', date: '2026-09-01T00:00:00Z' },
    { id: 'spaeter', date: '2026-10-01T00:00:00Z', von: '2026-11-01T00:00:00Z' },
    { id: 'bald', date: '2026-10-05T00:00:00Z', von: '2026-10-12T00:00:00Z' },
    { id: 'dringend', date: '2026-09-01T00:00:00Z', prioritaet: 'dringend' },
    { id: 'neu', date: '2026-10-08T00:00:00Z' },
  ];
  assert.deepEqual(sortieren(posts).map((p) => p.id), ['dringend', 'bald', 'spaeter', 'neu', 'alt']);
});
