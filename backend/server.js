const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Airtable = require('airtable');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5500',
  methods: ['POST'],
  allowedHeaders: ['Content-Type'],
}));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Zu viele Anfragen. Bitte versuche es in 15 Minuten erneut.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { vorname, nachname, email, telefon, anliegen, nachricht } = req.body;

  if (!vorname || !nachname || !email || !nachricht) {
    return res.status(400).json({ error: 'Pflichtfelder fehlen: vorname, nachname, email, nachricht' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
  }

  try {
    await base(process.env.AIRTABLE_TABLE_NAME || 'Anfragen').create([
      {
        fields: {
          Vorname: vorname.trim(),
          Nachname: nachname.trim(),
          Email: email.trim(),
          Telefon: telefon ? telefon.trim() : '',
          Anliegen: anliegen ? anliegen.trim() : '',
          Nachricht: nachricht.trim(),
          Datum: new Date().toISOString(),
          Status: 'Neu',
        },
      },
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Airtable error:', err.message);
    res.status(500).json({ error: 'Interner Fehler. Bitte versuche es später erneut.' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
