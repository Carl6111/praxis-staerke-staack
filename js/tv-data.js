// Inhalte des Warteraum-Bildschirms.
//
// Einzige Quelle für alles Feste auf dem TV. Wer Preise oder Texte ändern will,
// ändert sie hier — sonst nirgends. Neuigkeiten kommen live aus /api/posts.
//
// Die Selbstzahlerpreise stammen aus der Praxis-Preisliste. Preisstand unten
// pflegen, er wird auf dem Bildschirm ausgewiesen.

export const PREISSTAND = 'September 2026';

export const PRAXIS = {
  name: 'Stärke & Staack',
  untertitel: 'Hausarztpraxis',
  strasse: 'Gr. Diesdorfer Str. 186',
  ort: '39110 Magdeburg',
  telefon: '0391 7348410',
  email: 'praxis-staerke@t-online.de',
  notdienst: '116 117',
};

export const TV_TEXTE = {
  empfangBild: 'images/tresenv6-2000.jpg',
  akutTitel: 'Akutsprechstunde',
  akutZeit: '8 – 9 Uhr',
  akutHinweis: 'Montag bis Freitag ohne Voranmeldung',
  teamTitel: 'Unser Praxisteam',
  preisTitel: 'Selbstzahlerleistungen',
  preisStand: 'Preisstand',
  zeitenTitel: 'Sprechzeiten',
  kontaktTitel: 'Termine und Rezepte',
  beitragTitel: 'Aus der Praxis',
};

export const OEFFNUNGSZEITEN = [
  { tag: 'Montag bis Freitag', zeit: '8 – 12 Uhr' },
  { tag: 'Montag zusätzlich', zeit: '16 – 18 Uhr' },
];

export const AKUTSPRECHSTUNDE = 'Montag bis Freitag 8 – 9 Uhr ohne Voranmeldung.';

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

// Auf dem TV stehen nur Leistungsnamen, höchstens drei je Bild.
export const LEISTUNGEN = [
  { posten: [
    { titel: 'Hausärztliche Grundversorgung' },
    { titel: 'Vorsorge & Check-up' },
    { titel: 'Impfungen' },
  ] },
  { posten: [
    { titel: 'EKG & Langzeit-EKG' },
    { titel: 'Ultraschall' },
    { titel: 'Lungenfunktion' },
  ] },
  { posten: [
    { titel: 'Ernährungsmedizin' },
    { titel: 'Sportmedizin' },
    { titel: 'Bioimpedanzanalyse' },
  ] },
  { posten: [
    { titel: 'Psychosomatische Grundversorgung' },
    { titel: 'Disease-Management-Programme' },
  ] },
];

// tv: Reihenfolge der acht ausgewählten Preise im Loop; Beträge bleiben unverändert.
// Selbstzahlerleistungen. `preis` in Euro, `zusatz` erscheint kleiner darunter.
export const SELBSTZAHLER = [
  {
    gruppe: 'Diagnostik',
    hinweis: 'Alle Untersuchungen einschließlich Auswertung.',
    posten: [
      { leistung: 'Ruhe-EKG', preis: 26.54 },
      { leistung: 'Langzeit-EKG, 18 – 24 Stunden', preis: 53.95 },
      { leistung: 'Langzeit-Blutdruckmessung, 18 – 24 Stunden', preis: 26.46 },
      { leistung: 'ABI-Messung', detail: 'Ausschluss einer Durchblutungsstörung', preis: 12.59 },
      { leistung: 'Bioimpedanzanalyse', tv: 3, detail: 'Fett- und Muskelmasse, Wasserhaushalt', preis: 37.26 },
      { leistung: 'Spirometrie', detail: 'Lungenfunktionstest', preis: 40.08 },
      { leistung: 'Reisemedizinische Beratung', tv: 1, preis: 30.60, zusatz: 'zzgl. Impfungen, je 10,72 €' },
      { leistung: 'Ganzkörper-Hautcheck', tv: 2, preis: 24.80 },
      { leistung: 'Beratung zu Patientenverfügung und Vorsorgevollmacht', preis: 40.22 },
      { leistung: 'Ultraschall der Schilddrüse', preis: 26.81 },
      { leistung: 'Ultraschall des Bauchraums', detail: 'vier Organe', preis: 58.97 },
      { leistung: 'Ultraschall der Bauchschlagader', detail: 'Ausschluss Aortenaneurysma', preis: 37.53 },
    ],
  },
  {
    gruppe: 'Blutuntersuchungen & Check-ups',
    hinweis: 'Angegeben ist das Honorar der Praxis. Die Laborkosten kommen hinzu.',
    posten: [
      {
        leistung: 'Kleiner Blutcheck', tv: 5,
        detail: 'Cholesterine und Blutzucker, mit Urin, EKG und Beratung',
        preis: 93.08,
        zusatz: 'zzgl. 10,72 € Labor',
      },
      {
        leistung: 'Großer Blutcheck',
        detail: 'Cholesterine, Niere, Elektrolyte, Leber, Blutbild, TSH, HbA1c, Blutzucker, mit Urin, EKG und Beratung',
        preis: 93.08,
        zusatz: 'zzgl. 63,67 € Labor',
      },
      {
        leistung: 'Kleiner Vitamin-Check', tv: 6,
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
      { leistung: 'Schule und Sportunterricht', tv: 7, preis: 2.50 },
      { leistung: 'Nachweis für Arbeitgeber, Impfnachweis, Kurzbescheinigung', preis: 5.36 },
      { leistung: 'LKW-Tauglichkeit', preis: 37.53, zusatz: 'zzgl. erforderlicher weiterer Diagnostik' },
      { leistung: 'Bootsführerschein', tv: 8, preis: 37.53, zusatz: 'zzgl. erforderlicher weiterer Diagnostik' },
      { leistung: 'Sporttauglichkeit', tv: 4, detail: 'Status, Anamnese, Urin, EKG', preis: 95.28 },
    ],
  },
];

// Drei Clips pro Runde, in der Folgerunde die anderen drei (84 bzw. 88 Sekunden).
// Alle lokal: 1920×1080, H.264, ohne Tonspur, 0,75-fache Geschwindigkeit.
// Kein Text über Landschaft. Kontext bleibt in der gemeinsamen Fußzeile.
// Herkunft: mixkit.co, Mixkit Stock Video Free License, geprüft 15.09.2026.
// Lizenz erlaubt kommerzielle Nutzung und öffentliche Wiedergabe:
// "publicly perform and broadcast", "Attribution is not required".
export const RUHEVIDEOS = [
  // mixkit.co/free-stock-video/forest-covered-by-mist-at-sunrise-from-the-heights-28339/
  { datei: 'videos/ruhe-1-waldnebel.mp4', sekunden: 40 },
  // mixkit.co/free-stock-video/turquoise-blue-water-bay-from-above-5008/
  { datei: 'videos/ruhe-2-bucht.mp4', sekunden: 20 },
  // mixkit.co/free-stock-video/river-passing-through-a-forest-full-of-trees-51447/
  { datei: 'videos/ruhe-6-waldfluss.mp4', sekunden: 24 },
  // mixkit.co/free-stock-video/huge-trees-in-a-large-green-forest-5040/
  { datei: 'videos/ruhe-3-baeume.mp4', sekunden: 34 },
  // mixkit.co/free-stock-video/aerial-view-of-waves-hitting-a-small-cliff-51455/
  { datei: 'videos/ruhe-4-kueste.mp4', sekunden: 34 },
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
