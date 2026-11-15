// Speichern und Mailen laufen unabhängig. Die Anfrage gilt als angekommen, wenn
// mindestens einer der beiden Wege klappt; nur wenn beide scheitern, bekommt der
// Patient einen Fehler. Jeder Fehlschlag wird laut geloggt, nie verschluckt.
export async function anfrageVerarbeiten(row, { speichern, mailen }) {
  const lauf = async (name, fn) => {
    try {
      await fn(row);
      return true;
    } catch (e) {
      console.error(`[anfrage] ${name} fehlgeschlagen:`, e?.message || e);
      return false;
    }
  };
  const [gespeichert, gemailt] = await Promise.all([lauf('speichern', speichern), lauf('mailen', mailen)]);
  return { gespeichert, gemailt, angekommen: gespeichert || gemailt };
}
