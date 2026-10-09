import { createClient } from '@supabase/supabase-js';

// Bis 10/2026 warf diese Datei beim Import, wenn eine Variable fehlte. Dann
// stürzte jede Function ab, bevor sie antworten konnte: Vercel lieferte eine
// nackte 500, der Admin-Login zeigte nur "Serverfehler (500)", und niemand sah,
// woran es lag. Jetzt wird der Fehler festgehalten und von requireDb() als
// lesbare 503 zurückgegeben. Die Antwort nennt nur Variablennamen, nie Werte.
const url = (process.env.SUPABASE_URL || '').trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

let client = null;
let problem = '';

const fehlend = [!url && 'SUPABASE_URL', !key && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean);
if (fehlend.length) {
  problem = `Umgebungsvariable fehlt: ${fehlend.join(', ')}`;
} else {
  try {
    client = createClient(url, key, { auth: { persistSession: false } });
  } catch (e) {
    // supabase-js >= 2.80 wirft hier unter Node < 22 (kein natives WebSocket).
    problem = `Supabase-Client konnte nicht starten: ${e?.message || e}`;
  }
}
if (problem) console.error('[config]', problem);

export const supabase = client;
export const dbProblem = problem;

export function requireDb(res) {
  if (client) return true;
  res.status(503).json({ success: false, code: 'config', error: `Server falsch eingerichtet. ${problem}` });
  return false;
}

export const ANFRAGEN_TABLE = process.env.SUPABASE_TABLE || 'anfragen';
