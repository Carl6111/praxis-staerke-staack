// Inhalte des Warteraum-Bildschirms.
//
// Einzige Quelle für alles Feste auf dem TV. Wer Texte ändern will, ändert sie
// hier — sonst nirgends. Neuigkeiten kommen live aus /api/posts.

export const PREISSTAND = 'September 2026';

export const PRAXIS = {
  name: 'Stärke & Staack',
  untertitel: 'Hausarztpraxis',
  website: 'praxis-staerke-staack.de',
  strasse: 'Gr. Diesdorfer Str. 186',
  ort: '39110 Magdeburg',
  telefon: '0391 7348410',
  email: 'praxis-staerke@t-online.de',
  notdienst: '116 117',
};

export const TV_TEXTE = {
  empfangBild: 'images/tresenv6-2000.jpg',
  akutRubrik: 'Ohne Termin',
  akutTitel: 'Akutsprechstunde',
  akutZeit: '8 – 9 Uhr',
  akutHinweis: 'Montag bis Freitag, ohne Voranmeldung',
  zeitenRubrik: 'Sprechzeiten',
  zeitenTitel: 'Wann wir für Sie da sind',
  aerzteRubrik: 'Praxisinhaber',
  teamRubrik: 'Praxisteam',
  teamTitel: 'Unser Team',
  leistungenRubrik: 'Leistungen · Kassenleistung',
  kontaktRubrik: 'Weitere Informationen',
  kontaktTitel: 'Unsere Website',
  kontaktQr: 'Scannen Sie einen der QR-Codes in der Praxis.',
  kontaktInfo: 'Dort finden Sie Öffnungszeiten, Leistungen und Kontakt.',
  beitragRubrik: 'Aus der Praxis',
  beitragTitel: 'Aktuelles aus der Praxis',
};

export const OEFFNUNGSZEITEN = [
  { tag: 'Montag', zeit: '08:00 – 12:00 · 16:00 – 18:00' },
  { tag: 'Dienstag – Freitag', zeit: '08:00 – 12:00' },
  { tag: 'Samstag & Sonntag', zeit: 'Geschlossen' },
];

export const AKUTSPRECHSTUNDE = 'Montag bis Freitag 08:00 – 09:00 Uhr ohne Voranmeldung.';

export const AERZTE = [
  {
    name: 'Franka Stärke',
    rolle: 'Praxisinhaberin seit Januar 2021',
    fach: 'Fachärztin für Allgemeinmedizin, Sportmedizin & Ernährungsmedizin',
    bild: 'images/team-2.jpg',
  },
  {
    name: 'Thorsten Staack',
    rolle: 'Praxisinhaber seit April 2025',
    fach: 'Facharzt für Allgemeinmedizin & Notfallmedizin',
    bild: 'images/team-3.jpg',
  },
];

export const FACHKRAEFTE = [
  { name: 'Schwester Manuela', rolle: 'Medizinische Fachangestellte', bild: 'images/team-4.jpg' },
  { name: 'Schwester Franziska', rolle: 'Medizinische Fachangestellte', bild: 'images/team-foto-gruppe.jpg' },
  { name: 'Schwester Claudia', rolle: 'Medizinische Fachangestellte', bild: 'images/team-5.jpg' },
];

// Kassenleistungen, inhaltlich identisch zu leistungen.html.
//
// In benannte Gruppen geteilt statt in gleich große Blöcke: jede Seite muss für
// sich allein verständlich sein. Wer genau während Seite zwei hereinkommt, soll
// an der Überschrift erkennen, worum es geht.
export const LEISTUNGEN = [
  {
    gruppe: 'Versorgung und Vorsorge',
    posten: [
      {
        titel: 'Hausärztliche Grundversorgung',
        text: 'Behandlung akuter Beschwerden, medizinische Beratung, Krankschreibungen, Überweisungen und langfristige Begleitung.',
      },
      {
        titel: 'Vorsorge & Check-up',
        text: 'Gesundheits-Check-up ab 35, Hautkrebsvorsorge, Krebsfrüherkennung und Jugendgesundheitsuntersuchung.',
      },
      {
        titel: 'Disease-Management-Programme',
        text: 'Strukturierte Begleitung bei chronischer Erkrankung, etwa Diabetes mellitus Typ 2 und koronare Herzkrankheit.',
      },
      {
        titel: 'Impfungen',
        text: 'Alle von der STIKO empfohlenen Impfungen: Grippe, COVID, Tetanus, Pneumokokken, Gürtelrose und weitere.',
      },
    ],
  },
  {
    gruppe: 'Diagnostik in der Praxis',
    posten: [
      {
        titel: 'EKG & Langzeit-EKG',
        text: 'Ruhe-EKG und 24-Stunden-EKG zur Abklärung von Herzrhythmusstörungen, dazu Langzeit-Blutdruckmessung.',
      },
      {
        titel: 'Ultraschall',
        text: 'Bauchraum, Schilddrüse und Bauchaorta. Schnell, strahlungsfrei, direkt in der Praxis.',
      },
      {
        titel: 'Lungenfunktion',
        text: 'Spirometrie bei Verdacht auf Asthma oder COPD, Pulsoximetrie und ABI-Messung zur Durchblutungsprüfung.',
      },
      {
        titel: 'Bioimpedanzanalyse',
        text: 'Messung von Muskelmasse, Körperfett und Wasserhaushalt — für Gewichtsmanagement und Ernährungstherapie.',
      },
    ],
  },
  {
    gruppe: 'Unsere Schwerpunkte',
    posten: [
      {
        titel: 'Ernährungsmedizin',
        text: 'Beratung und Therapie nach §43 SGB V. Schwerpunkt Mikronährstoffmedizin und individuelle Labordiagnostik.',
      },
      {
        titel: 'Sportmedizin',
        text: 'Sportmedizinische Untersuchung, Tauglichkeitsprüfung und Belastungstests für Freizeit- und Leistungssport.',
      },
      {
        titel: 'Psychosomatische Grundversorgung',
        text: 'Begleitung bei psychosomatischen Beschwerden, Erschöpfung und leichten Depressionen — ohne lange Wartezeit.',
      },
    ],
  },
];

// Selbstzahlerpreise. Stand 15.09.2026 bewusst NICHT im Loop: der Bildschirm
// nennt die Leistungen, die Beträge stehen auf der Liste am Tresen und auf der
// Website. Die Daten bleiben hier, damit eine spätere Preisseite nichts neu
// erheben muss. `preis` in Euro, `zusatz` erscheint kleiner darunter.
export const SELBSTZAHLER = [
  {
    gruppe: 'Diagnostik',
    hinweis: 'Alle Untersuchungen einschließlich Auswertung.',
    posten: [
      { leistung: 'Ruhe-EKG', preis: 26.54 },
      { leistung: 'Langzeit-EKG, 18 – 24 Stunden', preis: 53.95 },
      { leistung: 'Langzeit-Blutdruckmessung, 18 – 24 Stunden', preis: 26.46 },
      { leistung: 'ABI-Messung', detail: 'Ausschluss einer Durchblutungsstörung', preis: 12.59 },
      { leistung: 'Bioimpedanzanalyse', detail: 'Fett- und Muskelmasse, Wasserhaushalt', preis: 37.26 },
      { leistung: 'Spirometrie', detail: 'Lungenfunktionstest', preis: 40.08 },
      { leistung: 'Reisemedizinische Beratung', preis: 30.60, zusatz: 'zzgl. Impfungen, je 10,72 €' },
      { leistung: 'Ganzkörper-Hautcheck', preis: 24.80 },
      { leistung: 'Beratung zu Patientenverfügung und Vorsorgevollmacht', preis: 40.22 },
    ],
  },
  {
    gruppe: 'Blutchecks & Ernährungsmedizin',
    hinweis: 'Laborkosten werden gesondert berechnet.',
    posten: [
      {
        leistung: 'Kleiner Gesundheitscheck',
        detail: 'Blutbild, Leber, Niere, Fette, Zucker, mit Beratung',
        preis: 53.80,
        zusatz: 'zzgl. 63,67 € Labor',
      },
      {
        leistung: 'Kleiner Vitamin-Check',
        detail: 'Vitamin D, B12, Folsäure, Ferritin, mit Beratung',
        preis: 53.80,
        zusatz: 'zzgl. 71,73 € Labor',
      },
      {
        leistung: 'Mittlerer Vitamin-Check',
        detail: 'kleiner Vitamin-Check und zusätzlich Omega-3- und Omega-6-Fettsäuren, mit Beratung',
        preis: 74.78,
        zusatz: 'zzgl. 132,06 € Labor',
      },
      {
        leistung: 'Individuelle Vollblutanalyse',
        detail: 'Speziallabor',
        preis: 134.23,
        zusatz: 'zzgl. Laborkosten',
      },
      {
        leistung: 'Ernährungsberatung zur Gewichtsreduktion',
        detail: 'Kurs einschließlich vier Bioimpedanzmessungen, Zuschuss der Krankenkasse möglich',
        preis: 419.97,
        zusatz: 'ohne Laborleistung',
      },
    ],
  },
  {
    gruppe: 'Atteste & Bescheinigungen',
    posten: [
      { leistung: 'Osteopathie', preis: 2.50 },
      { leistung: 'Schule und Sportunterricht', preis: 2.50 },
      { leistung: 'Nachweis für Arbeitgeber, Impfnachweis, Kurzbescheinigung', preis: 5.36 },
      { leistung: 'LKW-Tauglichkeit', preis: 37.53, zusatz: 'zzgl. erforderlicher weiterer Diagnostik' },
      { leistung: 'Bootsführerschein', preis: 37.53, zusatz: 'zzgl. erforderlicher weiterer Diagnostik' },
      { leistung: 'Sporttauglichkeit', detail: 'Status, Anamnese, Urin, EKG', preis: 95.28 },
    ],
  },
];

// Drei Clips pro Runde, in der Folgerunde die anderen drei.
// Alle lokal: 1920×1080, H.264, ohne Tonspur, 0,75-fache Geschwindigkeit.
//
// Nur zwei der sechs Clips tragen einen Satz, je einer pro Runde. Sechs
// Aussagen nacheinander entwerten sich gegenseitig; zwei mit stummen
// Landschaften dazwischen bleiben hängen. Beide Sätze stehen wörtlich so auf
// der Startseite der Praxis (index.html, Hero) — sie sind nicht erfunden,
// sonst sagt der Bildschirm etwas anderes als die Website.
//
// Öffnungszeiten, Telefon und Adresse gehören ausdrücklich nicht hierher:
// dafür gibt es eigene Seiten im Loop.
//
// Herkunft der Clips: mixkit.co, Mixkit Stock Video Free License, geprüft
// 15.09.2026. Lizenz erlaubt kommerzielle Nutzung und öffentliche Wiedergabe:
// "publicly perform and broadcast", "Attribution is not required".
export const RUHEVIDEOS = [
  // mixkit.co/free-stock-video/forest-covered-by-mist-at-sunrise-from-the-heights-28339/
  {
    datei: 'videos/ruhe-1-waldnebel.mp4',
    sekunden: 40,
    leitsatz: { text: 'Ihre Gesundheit. Unser Auftrag.' },
  },
  // mixkit.co/free-stock-video/turquoise-blue-water-bay-from-above-5008/
  { datei: 'videos/ruhe-2-bucht.mp4', sekunden: 20 },
  // mixkit.co/free-stock-video/river-passing-through-a-forest-full-of-trees-51447/
  { datei: 'videos/ruhe-6-waldfluss.mp4', sekunden: 24 },
  // mixkit.co/free-stock-video/huge-trees-in-a-large-green-forest-5040/
  { datei: 'videos/ruhe-3-baeume.mp4', sekunden: 34 },
  // mixkit.co/free-stock-video/aerial-view-of-waves-hitting-a-small-cliff-51455/
  {
    datei: 'videos/ruhe-4-kueste.mp4',
    sekunden: 34,
    leitsatz: { text: 'Hier nimmt man sich Zeit für Sie.' },
  },
  // mixkit.co/free-stock-video/slow-aerial-tour-through-a-mist-covered-forest-28342/
  { datei: 'videos/ruhe-5-nebelwald.mp4', sekunden: 20 },
];

// Hintergrundmusik. Solange hier `null` steht, läuft der Bildschirm stumm —
// die Tonfrage ist mit der Praxis noch nicht entschieden. Zum Einschalten eine
// Datei nach audio/ legen und hier eintragen:
//   export const MUSIK = { datei: 'audio/kaffeemusik.mp3', lautstaerke: 0.22 };
// Wichtig: nur Musik mit geklärter Lizenz für öffentliche Wiedergabe. In einem
// Wartezimmer ist das eine öffentliche Wiedergabe im Sinne der GEMA.
export const MUSIK = null;
