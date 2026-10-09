import { supabase, requireDb } from './_lib/supabase.js';
import { abgelaufeneLoeschen } from './_lib/posts.js';

// Täglicher Cron (vercel.json). Drei Aufgaben:
// 1. Supabase Free pausiert Projekte nach 7 Tagen ohne Zugriff und löscht sie
//    danach — genau so ist die erste Datenbank verschwunden.
// 2. Abgelaufene Rate-Limit-Zeilen wegräumen, sonst wächst die Tabelle ewig.
// 3. Abgelaufene Praxismeldungen löschen, auch wenn niemand die Seite aufruft.
//
// Ist CRON_SECRET in Vercel gesetzt, schickt Vercel ihn als Bearer-Token mit,
// und fremde Aufrufe werden abgewiesen.
export default async function handler(req, res) {
  const secret = (process.env.CRON_SECRET || '').trim();
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false });
  }
  if (!requireDb(res)) return;

  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });
  if (error) {
    console.error('ping failed:', error.message);
    return res.status(500).json({ ok: false });
  }

  const { data: pruned, error: pruneError } = await supabase.rpc('prune_rate_limits');
  if (pruneError) console.error('prune failed:', pruneError.message);
  const abgelaufen = await abgelaufeneLoeschen(supabase);

  res.json({ ok: true, posts: count ?? 0, pruned: pruned ?? null, abgelaufen });
}
