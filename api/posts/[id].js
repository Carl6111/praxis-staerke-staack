import { supabase } from '../_lib/supabase.js';
import { guardAdmin } from '../_lib/ratelimit.js';
import { serverError } from '../_lib/validate.js';
import { POST_SPALTEN, postAusBody, postNachAussen } from '../_lib/posts.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'DELETE' && req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  if (!(await guardAdmin(req, res))) return;
  const id = String(req.query.id || '');
  if (!UUID.test(id)) return res.status(400).json({ success: false, error: 'Ungültige ID' });

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) return serverError(res, 'post delete:', error);
    return res.json({ success: true });
  }

  const { row, error: fehler } = postAusBody(req.body);
  if (fehler) return res.status(400).json({ success: false, error: fehler });
  const { data, error } = await supabase.from('posts').update(row).eq('id', id).select(POST_SPALTEN).maybeSingle();
  if (error) return serverError(res, 'post update:', error);
  if (!data) return res.status(404).json({ success: false, error: 'Meldung nicht gefunden' });
  res.json({ success: true, post: postNachAussen(data) });
}
