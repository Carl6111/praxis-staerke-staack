import { supabase, requireDb } from '../_lib/supabase.js';
import { guardAdmin } from '../_lib/ratelimit.js';
import { serverError } from '../_lib/validate.js';
import { POST_SPALTEN, postAusBody, postNachAussen, sortieren, abgelaufeneLoeschen } from '../_lib/posts.js';

export default async function handler(req, res) {
  if (req.method === 'GET') return listPosts(res);
  if (req.method === 'POST') return createPost(req, res);
  res.status(405).json({ success: false, error: 'Method not allowed' });
}

// Öffentlich: aktuelles.html, tv.html und admin.html lesen von hier.
async function listPosts(res) {
  if (!requireDb(res)) return;
  await abgelaufeneLoeschen(supabase);
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SPALTEN)
    // Doppelt gesichert: selbst wenn das Löschen oben scheitert, erscheint
    // nichts Abgelaufenes.
    .or(`bis.is.null,bis.gte.${new Date().toISOString()}`);
  if (error) return serverError(res, 'posts list:', error);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, posts: sortieren(data).map(postNachAussen) });
}

async function createPost(req, res) {
  if (!(await guardAdmin(req, res))) return;
  const { row, error: fehler } = postAusBody(req.body);
  if (fehler) return res.status(400).json({ success: false, error: fehler });

  const { data, error } = await supabase.from('posts').insert(row).select(POST_SPALTEN).single();
  if (error) return serverError(res, 'post insert:', error);
  res.json({ success: true, post: postNachAussen(data) });
}
