import { supabase, requireDb } from './supabase.js';
import { clientIp, isValidAdminKey, adminKeyConfigured } from './auth.js';

// Login streng (Brute-Force-Schutz), alles Authentifizierte großzügig —
// sonst sperrt sich die Praxis beim normalen Arbeiten selbst aus.
const LIMITS = {
  auth: { max: 10, window: 15 * 60 },
  admin: { max: 200, window: 15 * 60 },
  contact: { max: 5, window: 15 * 60 },
};

// Zählt nur Fehlversuche, also kostet "im Zweifel sperren" hier nichts: wer den
// richtigen Schlüssel hat, landet nie in diesem Zähler. Vorher ließ ein kaputter
// Zähler Fehlversuche unbegrenzt durch.
const FAIL_CLOSED = new Set(['auth']);

// Serverless-Instanzen teilen keinen Speicher, deshalb zählt Postgres.
// check_rate_limit() ist atomar (INSERT ... ON CONFLICT DO UPDATE RETURNING).
async function allow(req, bucket) {
  const { max, window } = LIMITS[bucket];
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: `${bucket}:${clientIp(req)}`,
    p_max: max,
    p_window_seconds: window,
  });
  if (error) {
    console.error('rate limit check failed:', bucket, error.message);
    // Ein kaputter Zähler darf die Praxis nicht aussperren — außer beim
    // Zähler für falsche Schlüssel, siehe oben.
    return !FAIL_CLOSED.has(bucket);
  }
  return data === true;
}

function tooMany(res) {
  res.status(429).json({ success: false, error: 'Zu viele Anfragen. Bitte in 15 Minuten erneut versuchen.' });
  return false;
}

// Ein einziger Türsteher für alle Admin-Routen. Fehlversuche zählen gegen den
// strengen auth-Zähler — sonst könnte man den Schlüssel über /api/posts oder
// /api/anfragen unbegrenzt durchprobieren und /api/auth einfach umgehen.
export async function guardAdmin(req, res) {
  if (!requireDb(res)) return false;
  if (!adminKeyConfigured()) {
    // Ohne ADMIN_KEY kann niemand rein. Früher erschien das als "Falscher
    // Schlüssel" und schickte die Fehlersuche in die falsche Richtung.
    res.status(503).json({ success: false, code: 'config', error: 'Server falsch eingerichtet. Umgebungsvariable fehlt: ADMIN_KEY' });
    return false;
  }
  if (!isValidAdminKey(req.headers['x-admin-key'])) {
    if (!(await allow(req, 'auth'))) return tooMany(res);
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  if (!(await allow(req, 'admin'))) return tooMany(res);
  return true;
}

// Für offene Routen (Kontaktformular).
export async function guardPublic(req, res, bucket) {
  if (!requireDb(res)) return false;
  if (!(await allow(req, bucket))) return tooMany(res);
  return true;
}
