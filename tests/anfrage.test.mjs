import assert from 'node:assert/strict';
import test from 'node:test';
import { anfrageVerarbeiten } from '../api/_lib/anfrage.js';

const ok = async () => {};
const kaputt = async () => { throw new Error('boom'); };

test('beide klappen', async () => {
  const r = await anfrageVerarbeiten({}, { speichern: ok, mailen: ok });
  assert.deepEqual(r, { gespeichert: true, gemailt: true, angekommen: true });
});
test('DB tot, Mail klappt -> angekommen', async () => {
  const r = await anfrageVerarbeiten({}, { speichern: kaputt, mailen: ok });
  assert.equal(r.angekommen, true);
  assert.equal(r.gespeichert, false);
});
test('Mail tot, DB klappt -> angekommen', async () => {
  const r = await anfrageVerarbeiten({}, { speichern: ok, mailen: kaputt });
  assert.equal(r.angekommen, true);
  assert.equal(r.gemailt, false);
});
test('beide tot -> nicht angekommen', async () => {
  const r = await anfrageVerarbeiten({}, { speichern: kaputt, mailen: kaputt });
  assert.equal(r.angekommen, false);
});
