import { supabase, ANFRAGEN_TABLE } from './_lib/supabase.js';
import { anfrageVerarbeiten } from './_lib/anfrage.js';
import { guardPublic } from './_lib/ratelimit.js';
import { text } from './_lib/validate.js';

// Kein Fallback mehr: fehlt eine Variable, schlägt der Mailweg laut fehl statt
// still an eine falsche Adresse zu gehen.
const env = n => (process.env[n] || '').trim();

async function sendAnfrageMail(a) {
  const apiKey = env('RESEND_API_KEY');
  const to = env('NOTIFY_EMAIL');
  const from = env('MAIL_FROM');
  const fehlt = [!apiKey && 'RESEND_API_KEY', !to && 'NOTIFY_EMAIL', !from && 'MAIL_FROM'].filter(Boolean);
  if (fehlt.length) throw new Error(`Umgebungsvariable fehlt: ${fehlt.join(', ')}`);

  const body =
    `Neue Kontaktanfrage über die Website\n\n` +
    `Name:     ${a.vorname} ${a.nachname}\n` +
    `E-Mail:   ${a.email}\n` +
    `Telefon:  ${a.telefon || '—'}\n` +
    `Anliegen: ${a.anliegen || '—'}\n\n` +
    `Nachricht:\n${a.nachricht}\n`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: a.email,
      subject: `Neue Anfrage: ${a.vorname} ${a.nachname}`,
      text: body,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

const stripTags = s => s.replace(/<[^>]*>/g, '').trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!(await guardPublic(req, res, 'contact'))) return;

  if (!req.body?.datenschutz) {
    return res.status(400).json({ error: 'Datenschutzzustimmung ist erforderlich.' });
  }

  const vorname = text(req.body.vorname);
  const nachname = text(req.body.nachname);
  const email = text(req.body.email);
  const telefon = text(req.body.telefon);
  const anliegen = text(req.body.anliegen);
  const nachricht = text(req.body.nachricht);

  if (!vorname || !nachname || !email || !nachricht) {
    return res.status(400).json({ error: 'Pflichtfelder fehlen: vorname, nachname, email, nachricht' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
  }
  if (vorname.length > 100 || nachname.length > 100) {
    return res.status(400).json({ error: 'Name zu lang (max. 100 Zeichen).' });
  }
  if (email.length > 254) {
    return res.status(400).json({ error: 'E-Mail-Adresse zu lang.' });
  }
  if (telefon.length > 30) {
    return res.status(400).json({ error: 'Telefonnummer zu lang (max. 30 Zeichen).' });
  }
  if (anliegen.length > 100) {
    return res.status(400).json({ error: 'Anliegen zu lang (max. 100 Zeichen).' });
  }
  if (nachricht.length > 2000) {
    return res.status(400).json({ error: 'Nachricht zu lang (max. 2000 Zeichen).' });
  }

  const row = {
    vorname: stripTags(vorname),
    nachname: stripTags(nachname),
    email: email.toLowerCase(),
    telefon: telefon ? stripTags(telefon) : null,
    anliegen: anliegen ? stripTags(anliegen) : null,
    nachricht: stripTags(nachricht),
    status: 'Neu',
  };

  // Beides muss awaited werden: Vercel friert die Function nach der Antwort ein.
  const { angekommen } = await anfrageVerarbeiten(row, {
    speichern: async r => {
      if (!supabase) throw new Error('Supabase nicht konfiguriert');
      const { error } = await supabase.from(ANFRAGEN_TABLE).insert([r]);
      if (error) throw new Error(error.message);
    },
    mailen: sendAnfrageMail,
  });
  if (!angekommen) {
    return res.status(500).json({ error: 'Interner Fehler. Bitte versuche es später erneut.' });
  }

  res.json({ success: true });
}
