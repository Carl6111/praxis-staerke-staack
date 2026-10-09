// Zeiträume der Praxismeldungen. Die Praxis denkt in Magdeburger Ortszeit,
// Postgres speichert UTC. Umgerechnet wird nur hier, formatiert auch nur hier:
// Website, TV und Admin zeigen denselben fertigen Text (zeitraum), statt dreimal
// eigene Datumslogik zu pflegen.
const TZ = 'Europe/Berlin';

const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const UHRZEIT = /^([01]\d|2[0-3]):[0-5]\d$/;

export function gueltigesDatum(s) {
  if (!DATUM.test(s)) return false;
  const [j, m, t] = s.split('-').map(Number);
  const d = new Date(Date.UTC(j, m - 1, t));
  return d.getUTCFullYear() === j && d.getUTCMonth() === m - 1 && d.getUTCDate() === t;
}

export function gueltigeUhrzeit(s) {
  return UHRZEIT.test(s);
}

// Versatz von Berlin gegenüber UTC zu einem Zeitpunkt, in Minuten (60 oder 120).
function versatz(utcMs) {
  const teile = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
  const alsUtc = Date.UTC(+teile.year, +teile.month - 1, +teile.day, +teile.hour, +teile.minute, +teile.second);
  return Math.round((alsUtc - utcMs) / 60000);
}

// "2026-10-20" + "14:30" (Berliner Wandzeit) -> ISO-String in UTC.
export function berlinNachUtc(datum, uhrzeit = '00:00', sekunden = 0) {
  const [j, m, t] = datum.split('-').map(Number);
  const [h, min] = uhrzeit.split(':').map(Number);
  const naiv = Date.UTC(j, m - 1, t, h, min, sekunden);
  // Zweimal, damit auch Zeitpunkte direkt an der Umstellung stimmen.
  let ms = naiv - versatz(naiv) * 60000;
  ms = naiv - versatz(ms) * 60000;
  return new Date(ms).toISOString();
}

function teile(iso) {
  return Object.fromEntries(new Intl.DateTimeFormat('de-DE', {
    timeZone: TZ, weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
}

// Für das Admin-Formular beim Bearbeiten: UTC -> { datum, uhrzeit } in Berlin.
export function utcNachBerlin(iso) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { datum: `${p.year}-${p.month}-${p.day}`, uhrzeit: `${p.hour}:${p.minute}` };
}

// Lesbarer Zeitraum, z. B.
//   "Mo., 20. Oktober 2026"
//   "20. – 24. Oktober 2026"
//   "28. Oktober – 3. November 2026"
//   "Mi., 21. Oktober 2026, 14:00 – 17:00 Uhr"
//   "ab 20. Oktober 2026" / "bis 24. Oktober 2026"
export function zeitraumText(von, bis, mitUhrzeit) {
  if (!von && !bis) return '';
  const a = von ? teile(von) : null;
  const b = bis ? teile(bis) : null;
  const tag = (p, mitJahr = true) => `${p.day}. ${p.month}${mitJahr ? ' ' + p.year : ''}`;
  const zeit = (p) => `${p.hour}:${p.minute}`;

  if (a && !b) return mitUhrzeit ? `ab ${tag(a)}, ${zeit(a)} Uhr` : `ab ${tag(a)}`;
  if (!a && b) return mitUhrzeit ? `bis ${tag(b)}, ${zeit(b)} Uhr` : `bis ${tag(b)}`;

  const gleicherTag = a.day === b.day && a.month === b.month && a.year === b.year;
  if (gleicherTag) {
    const basis = `${a.weekday}, ${tag(a)}`;
    return mitUhrzeit ? `${basis}, ${zeit(a)} – ${zeit(b)} Uhr` : basis;
  }
  if (mitUhrzeit) return `${tag(a)}, ${zeit(a)} Uhr – ${tag(b)}, ${zeit(b)} Uhr`;
  if (a.month === b.month && a.year === b.year) return `${a.day}. – ${tag(b)}`;
  if (a.year === b.year) return `${tag(a, false)} – ${tag(b)}`;
  return `${tag(a)} – ${tag(b)}`;
}
