import { text } from './validate.js';
import { gueltigesDatum, gueltigeUhrzeit, berlinNachUtc, utcNachBerlin, zeitraumText } from './zeit.js';

export const POST_TYPES = ['neuigkeit', 'urlaub', 'info'];
export const PRIORITAETEN = ['normal', 'dringend'];
export const POST_SPALTEN = 'id, type, title, content, date, prioritaet, von, bis, mit_uhrzeit';

const stripTags = (s) => s.replace(/<[^>]*>/g, '').trim();

// Prüft den Body aus dem Admin und baut daraus die Tabellenzeile.
// Rückgabe: { row } oder { error }.
//
// Datum ist optional. Ohne Datum bleibt die Meldung stehen, bis sie jemand
// löscht. Mit Enddatum verschwindet sie danach von selbst (siehe
// abgelaufeneLoeschen). Ohne Uhrzeit gilt der ganze Tag in Berliner Zeit.
export function postAusBody(body, jetzt = Date.now()) {
  const type = text(body?.type);
  const title = stripTags(text(body?.title));
  const content = stripTags(text(body?.content));
  const prioritaet = text(body?.prioritaet) || 'normal';
  const mitUhrzeit = body?.mit_uhrzeit === true;
  const vonDatum = text(body?.von_datum);
  let bisDatum = text(body?.bis_datum);
  const vonUhrzeit = text(body?.von_uhrzeit);
  const bisUhrzeit = text(body?.bis_uhrzeit);

  if (!type || !title || !content) return { error: 'Typ, Titel und Text sind Pflicht.' };
  if (!POST_TYPES.includes(type)) return { error: `Typ muss einer von ${POST_TYPES.join(', ')} sein.` };
  if (!PRIORITAETEN.includes(prioritaet)) return { error: 'Priorität muss normal oder dringend sein.' };
  if (title.length > 200) return { error: 'Titel höchstens 200 Zeichen.' };
  if (content.length > 5000) return { error: 'Text höchstens 5000 Zeichen.' };

  if (vonDatum && !gueltigesDatum(vonDatum)) return { error: 'Startdatum ist ungültig.' };
  if (bisDatum && !gueltigesDatum(bisDatum)) return { error: 'Enddatum ist ungültig.' };

  let von = null;
  let bis = null;
  if (mitUhrzeit) {
    if (!vonDatum) return { error: 'Mit Uhrzeit braucht die Meldung ein Startdatum.' };
    if (!bisDatum) bisDatum = vonDatum;
    if (!gueltigeUhrzeit(vonUhrzeit) || !gueltigeUhrzeit(bisUhrzeit)) {
      return { error: 'Bitte Start- und Enduhrzeit angeben (HH:MM).' };
    }
    von = berlinNachUtc(vonDatum, vonUhrzeit);
    bis = berlinNachUtc(bisDatum, bisUhrzeit);
  } else {
    if (vonDatum) von = berlinNachUtc(vonDatum, '00:00');
    if (bisDatum) bis = berlinNachUtc(bisDatum, '23:59', 59);
  }

  if (von && bis && Date.parse(bis) < Date.parse(von)) return { error: 'Das Ende liegt vor dem Start.' };
  if (bis && Date.parse(bis) < jetzt) return { error: 'Das Enddatum liegt in der Vergangenheit.' };

  return { row: { type, title, content, prioritaet, von, bis, mit_uhrzeit: mitUhrzeit && Boolean(von) } };
}

// Was Website, TV und Admin bekommen: die Zeile plus fertig formatierter
// Zeitraum und die Berliner Werte fürs Bearbeiten-Formular.
export function postNachAussen(p) {
  const von = p.von ? utcNachBerlin(p.von) : null;
  const bis = p.bis ? utcNachBerlin(p.bis) : null;
  return {
    ...p,
    prioritaet: p.prioritaet || 'normal',
    zeitraum: zeitraumText(p.von, p.bis, p.mit_uhrzeit),
    formular: {
      von_datum: von?.datum || '', bis_datum: bis?.datum || '',
      von_uhrzeit: p.mit_uhrzeit ? von?.uhrzeit || '' : '',
      bis_uhrzeit: p.mit_uhrzeit ? bis?.uhrzeit || '' : '',
    },
  };
}

// Dringendes zuerst. Danach Meldungen mit Zeitraum, der nächste Termin oben,
// dann alles ohne Datum, das Neueste oben.
export function sortieren(posts) {
  return [...posts].sort((a, b) => {
    const pa = a.prioritaet === 'dringend' ? 0 : 1;
    const pb = b.prioritaet === 'dringend' ? 0 : 1;
    if (pa !== pb) return pa - pb;
    const za = a.von || a.bis;
    const zb = b.von || b.bis;
    if (za && zb) return Date.parse(za) - Date.parse(zb);
    if (za) return -1;
    if (zb) return 1;
    return Date.parse(b.date) - Date.parse(a.date);
  });
}

// Abgelaufene Meldungen löschen. Läuft bei jedem öffentlichen Abruf (TV fragt
// alle 10 Minuten) und im täglichen Cron, braucht also keinen eigenen Job.
export async function abgelaufeneLoeschen(supabase) {
  const { error, count } = await supabase
    .from('posts')
    .delete({ count: 'exact' })
    .lt('bis', new Date().toISOString());
  if (error) console.error('expired posts delete:', error.message);
  return count ?? 0;
}
