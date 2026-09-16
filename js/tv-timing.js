// Ruhiger TV-Ausgangswert, kein gemessenes Lesetempo einzelner Zuschauer.
// Forschung zum stillen Lesen: https://biblio.ugent.be/publication/8647789
// Der Forschungswert (238 Wörter/min für englische Sachtexte) ist nicht direkt
// auf einen deutschen Wartezimmer-TV übertragbar. 200 dient nur als Lesebasis;
// der Aufbau läuft auf Wunsch schneller, gelesen werden kann im längeren Endbild.
export const LESEN = Object.freeze({
  woerterProMinute: 200,
  minBlockMs: 1800,
  orientierungMs: 600,
  animationMs: 900,
  titelAnimationMs: 1300,
  blickwechselMs: 450,
  aufbaufaktor: 0.45,
  abschlussMs: 8000,
});

export function lesedauer(text) {
  const woerter = String(text).match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}@.:/–-]*/gu) || [];
  // Lange deutsche Wörter, E-Mail-Adressen und Zahlen brauchen mehr Zeit als
  // kurze Alltagswörter. Das ist ein Gestaltungszuschlag, kein Forschungswert.
  const gewicht = woerter.reduce((summe, wort) => summe + Math.max(1, wort.length / 10), 0);
  const zahlen = (String(text).match(/\d[\d:.,]*/g) || []).length;
  return Math.max(LESEN.minBlockMs, Math.ceil(gewicht * 60000 / LESEN.woerterProMinute + zahlen * 350));
}

export function leseplan(bloecke, mindestdauer = 0) {
  let start = LESEN.orientierungMs * LESEN.aufbaufaktor;
  const schritte = bloecke.map(({ text, titel }) => {
    const animation = (titel ? LESEN.titelAnimationMs : LESEN.animationMs) * LESEN.aufbaufaktor;
    const lesezeit = lesedauer(text) * LESEN.aufbaufaktor;
    const schritt = { start, animation, lesezeit };
    start += animation + lesezeit + LESEN.blickwechselMs * LESEN.aufbaufaktor;
    return schritt;
  });
  const letzter = schritte.at(-1);
  const ende = letzter ? letzter.start + letzter.animation + lesedauer(bloecke.at(-1).text) + LESEN.abschlussMs : 0;
  return { schritte, dauer: Math.max(mindestdauer, ende) };
}
