// Ablauf des Warteraum-Bildschirms. Feste Inhalte kommen aus tv-data.js.
//
// Der Bildschirm läuft ohne Bedienung: Seiten wechseln nach berechneter Lesezeit, neue
// Beiträge aus dem Praxis-Admin erscheinen von allein. Preise stehen bewusst
// nicht im Loop — der Bildschirm nennt die Leistungen, die Beträge die Liste
// am Tresen.
import {
  PRAXIS, TV_TEXTE, OEFFNUNGSZEITEN, AKUTSPRECHSTUNDE,
  AERZTE, FACHKRAEFTE, LEISTUNGEN, RUHEVIDEOS, MUSIK,
} from './tv-data.js';
import { leseplan } from './tv-timing.js';

const POSTS_INTERVALL_MS = 10 * 60 * 1000;
const NEUBAU_NACH_MS = 6 * 60 * 60 * 1000;
const WECHSEL_MS = 1600;

const buehne = document.getElementById('buehne');
const szenenRaum = document.getElementById('szenen');
const balken = document.getElementById('fortschritt-balken');
const uhrFeld = document.getElementById('fuss-zeit');
const datumFeld = document.getElementById('fuss-datum');

const zustand = {
  beitraege: [], szenen: [], index: 0, ruheVersatz: 0, beitragVersatz: 0,
  timer: null, gestartet: Date.now(),
};

starten();

function starten() {
  buehneSkalieren();
  window.addEventListener('resize', buehneSkalieren);
  document.getElementById('fuss-praxis').textContent = PRAXIS.untertitel + ' ' + PRAXIS.name;
  uhrStarten();
  tonVorbereiten();
  // Die Praxis erscheint sofort, auch wenn das WLAN gerade ausfällt.
  szeneZeigen(0);
  beitraegeLaden();
  setInterval(beitraegeLaden, POSTS_INTERVALL_MS);
}

// Feste Bühne von 1920 × 1080, auf den Bildschirm gerechnet. Ein Fernseher
// schneidet je nach Overscan Ränder ab; so bleibt das Layout überall gleich.
function buehneSkalieren() {
  const faktor = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  buehne.style.transform = `translate(-50%, -50%) scale(${faktor})`;
}

function uhrStarten() {
  uhrStellen();
  setInterval(uhrStellen, 1000);
}

function uhrStellen() {
  const jetzt = new Date();
  uhrFeld.textContent = jetzt.toLocaleTimeString('de-DE', {
    timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  datumFeld.textContent = jetzt.toLocaleDateString('de-DE', {
    timeZone: 'Europe/Berlin', weekday: 'long', day: 'numeric', month: 'long',
  });
}

async function beitraegeLaden() {
  try {
    const antwort = await fetch('/api/posts');
    if (!antwort.ok) return;
    const daten = await antwort.json();
    zustand.beitraege = (daten.posts || []).slice(0, 3);
  } catch {
    // Ohne Netz bleiben die zuletzt geladenen Beiträge für die nächste Runde erhalten.
  }
}

/* ---------- Ton ----------
   Die Tonfrage ist mit der Praxis nicht entschieden. Solange in tv-data.js keine
   Musikdatei steht, läuft der Bildschirm stumm und es erscheint kein Hinweis. */

function tonVorbereiten() {
  const schild = document.getElementById('tonstart');
  if (!MUSIK) { schild.hidden = true; return; }
  const musik = new Audio(MUSIK.datei);
  musik.loop = true;
  musik.volume = MUSIK.lautstaerke ?? 0.25;
  const freigeben = () => {
    musik.play().then(() => {
      schild.hidden = true;
      document.removeEventListener('keydown', freigeben);
      document.removeEventListener('click', freigeben);
    }).catch(() => {});
  };
  schild.hidden = false;
  document.addEventListener('keydown', freigeben);
  document.addEventListener('click', freigeben);
}

/* ---------- Folge: Information und Landschaft über die Runde verteilen ---------- */

function szenenNeuBauen() {
  const szene = (dauer, ton, wechsel, bau) => ({ dauer: dauer * 1000, ton, wechsel, bau });

  // Eine Meldungsseite pro Runde. Weitere Beiträge und Fortsetzungen kommen in
  // den folgenden Runden dran, statt eine Seite zu überfüllen.
  const seiten = beitragsSeiten();
  const meldungen = seiten.length
    ? seiten[zustand.beitragVersatz++ % seiten.length] : null;

  // Reihenfolge nach dem, was Wartende zuerst brauchen: erst die Akutsprechstunde,
  // dann die Sprechzeiten, dann Menschen und Leistungen im Wechsel.
  const bloecke = [
    [
      szene(13, 'bild', 'blende', szeneEmpfang),
      szene(16, 'papier', 'hoch', szeneZeiten),
      szene(17, 'tinte', 'hoch', () => szeneLeistungen(LEISTUNGEN[0])),
    ],
    [
      szene(14, 'papier', 'seitlich', () => szeneArzt(AERZTE[0], false)),
      szene(14, 'papier', 'seitlich', () => szeneArzt(AERZTE[1], true)),
      szene(17, 'tinte', 'hoch', () => szeneLeistungen(LEISTUNGEN[1])),
    ],
    [
      szene(15, 'papier', 'hoch', szeneTeam),
      szene(15, 'tinte', 'hoch', () => szeneLeistungen(LEISTUNGEN[2])),
      szene(14, 'tinte', 'blende', szeneKontakt),
      ...(meldungen ? [szene(14, 'papier', 'hoch', () => szeneBeitraege(meldungen))] : []),
    ],
  ];

  // Nach jedem Block eine Landschaftspause. Der Startversatz wandert pro Runde
  // weiter, sonst liefen immer dieselben drei Clips und die hinteren nie.
  const folge = [];
  bloecke.forEach((block, i) => {
    folge.push(...block);
    if (RUHEVIDEOS.length) {
      const platz = (zustand.ruheVersatz + i) % RUHEVIDEOS.length;
      // Die Szene ist so lang wie der Clip: eine ruhige Kamerafahrt lässt sich
      // nicht unsichtbar schleifen.
      folge.push(szene(RUHEVIDEOS[platz].sekunden, 'bild', 'blende', () => szeneRuhe(platz)));
    }
  });
  zustand.ruheVersatz = (zustand.ruheVersatz + bloecke.length) % RUHEVIDEOS.length;

  zustand.szenen = folge.map((s) => ({
    ...s,
    html: s.bau().replace('<section ', `<section data-wechsel="${s.wechsel}" style="--dauer:${s.dauer}ms" `),
  }));
  szenenRaum.innerHTML = zustand.szenen.map((s) => s.html).join('');
  [...szenenRaum.children].forEach((element, i) => {
    const bloecke = [...element.querySelectorAll('[data-leseblock]')];
    const plan = leseplan(bloecke.map((block) => ({
      text: block.textContent,
      titel: block.hasAttribute('data-lese-titel'),
    })), zustand.szenen[i].dauer);
    bloecke.forEach((block, index) => {
      block.style.setProperty('--lese-start', plan.schritte[index].start + 'ms');
      block.style.setProperty('--lese-animation', plan.schritte[index].animation + 'ms');
    });
    // Filmclips behalten ihre Länge. Ihre kurzen Hinweise passen in diese Zeit.
    if (!element.querySelector('video')) zustand.szenen[i].dauer = plan.dauer;
    element.style.setProperty('--dauer', zustand.szenen[i].dauer + 'ms');
  });
}

function szeneZeigen(index) {
  clearTimeout(zustand.timer);
  const vorher = szenenRaum.querySelector('.ist-sichtbar');
  // Auch am echten Rundenende neu bauen; index wächst bis zur Szenenzahl.
  if (index >= zustand.szenen.length || index === 0) {
    szenenNeuBauen();
    index = 0;
    // Die letzte Szene überbrückt den DOM-Neubau ohne leeren Zwischenframe.
    if (vorher) { szenenRaum.append(vorher); setTimeout(() => vorher.remove(), WECHSEL_MS); }
  }
  const szenen = [...szenenRaum.children].slice(0, zustand.szenen.length);
  if (!szenen.length) return;
  zustand.index = index;
  const aktiv = szenen[index];
  if (vorher && vorher !== aktiv) {
    vorher.classList.add('ist-abgehend');
    setTimeout(() => {
      vorher.classList.remove('ist-sichtbar', 'ist-abgehend');
      vorher.querySelector('video')?.pause();
    }, WECHSEL_MS);
  }
  aktiv.classList.add('ist-sichtbar');
  const szene = zustand.szenen[index];
  buehne.dataset.ton = szene.ton;
  videoSteuern(aktiv);
  naechstesVideoVorladen(szenen, index);
  fortschrittStarten(szene.dauer);
  zustand.timer = setTimeout(() => {
    // Nach einem halben Tag Dauerbetrieb einmal neu laden: das räumt Speicherreste
    // auf und zieht nebenbei eine neu veröffentlichte Version der Seite.
    if (Date.now() - zustand.gestartet > NEUBAU_NACH_MS && index === szenen.length - 1) {
      window.location.reload();
      return;
    }
    szeneZeigen(index + 1);
  }, szene.dauer);
}

// Nur der unmittelbar folgende Clip darf vorladen; kein WLAN-Ansturm beim Start.
function naechstesVideoVorladen(szenen, aktuell) {
  const video = szenen[(aktuell + 1) % szenen.length]?.querySelector('video');
  if (video && video.preload !== 'auto') { video.preload = 'auto'; video.load(); }
}

function videoSteuern(element) {
  szenenRaum.querySelectorAll('video').forEach((v) => {
    if (v.closest('.szene') !== element) {
      if (!v.closest('.szene').classList.contains('ist-abgehend')) v.pause();
      return;
    }
    v.muted = true;
    v.currentTime = 0;
    v.play().catch(() => {
      // Der Ablauf läuft auch bei abgelehntem Autoplay weiter.
    });
  });
}

function fortschrittStarten(dauer) {
  balken.style.transition = 'none';
  balken.style.transform = 'scaleX(0)';
  // Erzwingt ein Neuzeichnen, sonst fasst der Browser Zurücksetzen und Animation
  // zusammen und der Balken springt ohne Bewegung auf 100 %.
  void balken.offsetWidth;
  balken.style.transition = `transform ${dauer}ms linear`;
  balken.style.transform = 'scaleX(1)';
}

/* ---------- Szenen ----------
   Jede Seite trägt Rubrik und Titel wie die Praxiswebsite. Die Kompositionen
   darunter unterscheiden sich: Foto, Porträt, Raster, Liste. */

function kopf(rubrik, titel) {
  return `<header class="szene__kopf">
      <p data-leseblock class="szene__rubrik">${esc(rubrik)}</p>
      <h2 data-leseblock data-lese-titel class="szene__titel">${esc(titel)}</h2>
    </header>`;
}

function szeneEmpfang() {
  return `<section class="szene szene--bild empfang">
    <img class="raumfoto" src="${esc(TV_TEXTE.empfangBild)}" alt="">
    <div class="empfang__text">
      <p data-leseblock class="szene__rubrik">${esc(TV_TEXTE.akutRubrik)}</p>
      <h2 data-leseblock data-lese-titel class="empfang__titel">${esc(TV_TEXTE.akutTitel)}</h2>
      <p data-leseblock class="empfang__zeit ziffern">${esc(TV_TEXTE.akutZeit)}</p>
      <p data-leseblock class="empfang__satz">${esc(TV_TEXTE.akutHinweis)}</p>
    </div>
  </section>`;
}

function szeneZeiten() {
  const reihen = OEFFNUNGSZEITEN.map((z) => {
    const zu = z.zeit === 'Geschlossen';
    return `<div data-leseblock class="zeiten__reihe${zu ? ' zeiten__reihe--zu' : ''}">
        <span class="zeiten__tag">${esc(z.tag)}</span>
        <span class="zeiten__zeit ziffern">${esc(z.zeit)}</span>
      </div>`;
  }).join('');

  return `<section class="szene szene--papier sprechzeiten">
    ${kopf(TV_TEXTE.zeitenRubrik, TV_TEXTE.zeitenTitel)}
    <div class="szene__inhalt">
      <div class="zeiten">${reihen}</div>
      <div data-leseblock class="akut">
        <p class="akut__titel">${esc(TV_TEXTE.akutTitel)}</p>
        <p class="akut__text ziffern">${esc(AKUTSPRECHSTUNDE)}</p>
      </div>
    </div>
  </section>`;
}

function szeneArzt(p, gespiegelt) {
  return `<section class="szene szene--papier portrait${gespiegelt ? ' portrait--rechts' : ''}">
    <div class="portrait__foto"><img src="${esc(p.bild)}" alt="${esc(p.name)}"></div>
    <div class="portrait__text">
      <p data-leseblock class="szene__rubrik">${esc(TV_TEXTE.aerzteRubrik)}</p>
      <h2 data-leseblock data-lese-titel class="portrait__name">${esc(p.name)}</h2>
      <p data-leseblock class="portrait__fach">${esc(p.fach)}</p>
      <p data-leseblock class="portrait__rolle ziffern">${esc(p.rolle)}</p>
    </div>
  </section>`;
}

function szeneTeam() {
  return `<section class="szene szene--papier team">
    ${kopf(TV_TEXTE.teamRubrik, TV_TEXTE.teamTitel)}
    <div class="szene__inhalt">
      <div class="koepfe">${FACHKRAEFTE.map((p) => `
        <figure data-leseblock class="kopf">
          <div class="kopf__bild"><img src="${esc(p.bild)}" alt="${esc(p.name)}"></div>
          <figcaption>
            <h3 class="kopf__name">${esc(p.name)}</h3>
            <p class="kopf__rolle">${esc(p.rolle)}</p>
          </figcaption>
        </figure>`).join('')}</div>
    </div>
  </section>`;
}

function szeneLeistungen(gruppe) {
  return `<section class="szene szene--tinte leistungsseite">
    ${kopf(TV_TEXTE.leistungenRubrik, gruppe.gruppe)}
    <div class="szene__inhalt">
      <div class="leistungen">${gruppe.posten.map((l) => `
        <article data-leseblock class="leistung">
          <h3 class="leistung__titel">${esc(l.titel)}</h3>
          <p class="leistung__text">${esc(l.text)}</p>
        </article>`).join('')}</div>
    </div>
  </section>`;
}

function szeneKontakt() {
  return `<section class="szene szene--tinte kontakt">
    ${kopf(TV_TEXTE.kontaktRubrik, TV_TEXTE.kontaktTitel)}
    <div class="szene__inhalt">
      <p data-leseblock data-lese-titel class="kontakt__website">${esc(PRAXIS.website)}</p>
      <p data-leseblock class="kontakt__qr">${esc(TV_TEXTE.kontaktQr)}</p>
      <p data-leseblock class="kontakt__info">${esc(TV_TEXTE.kontaktInfo)}</p>
    </div>
  </section>`;
}

function szeneBeitraege(meldungen) {
  const lang = meldungen.some((b) => /\S{40}/.test(b.content) || b.titel.length > 80);
  return `<section class="szene szene--papier nachrichten${lang ? ' nachrichten--lang' : ''}">
    ${kopf(TV_TEXTE.beitragRubrik, TV_TEXTE.beitragTitel)}
    <div class="szene__inhalt">
      <div class="meldungen">${meldungen.map((b) => `
        <article data-leseblock class="meldung">
          <p class="meldung__marke">${esc(beitragsart(b.type))}</p>
          <h3 class="meldung__titel">${esc(b.titel)}</h3>
          <p class="meldung__text">${esc(b.content)}</p>
        </article>`).join('')}</div>
    </div>
  </section>`;
}

function szeneRuhe(index) {
  const video = RUHEVIDEOS[index % RUHEVIDEOS.length];
  const leitsatz = video.leitsatz;
  if (!leitsatz) {
    return `<section class="szene szene--bild ruhe">
    <video class="ruhe__video" src="${esc(video.datei)}" muted playsinline preload="none"></video>
  </section>`;
  }
  return `<section class="szene szene--bild ruhe">
    <video class="ruhe__video" src="${esc(video.datei)}" muted playsinline preload="none"></video>
    <div class="ruhe__schleier"></div>
    <div class="ruhe__text">
      <p data-leseblock data-lese-titel class="ruhe__satz">${esc(leitsatz.text)}</p>
    </div>
  </section>`;
}

/* ---------- Helfer ---------- */

function beitragsart(type) {
  if (type === 'urlaub') return 'Urlaub';
  if (type === 'info') return 'Hinweis';
  return 'Neuigkeit';
}

// Beiträge auf Seiten verteilen: kurze Meldungen stehen zu mehreren zusammen,
// ein langer Beitrag bekommt so viele Seiten, wie sein Text braucht. Nichts wird
// abgeschnitten — die Praxis schreibt hier Urlaubszeiten und Vertretungen hinein.
const SEITEN_BUDGET = 430;

function beitragsSeiten() {
  const seiten = [];
  let aktuell = [];
  let summe = 0;
  for (const beitrag of zustand.beitraege) {
    textSeiten(beitrag.content, SEITEN_BUDGET).forEach((text, teil) => {
      const laenge = text.length + String(beitrag.title || '').length;
      if (aktuell.length && summe + laenge > SEITEN_BUDGET) {
        seiten.push(aktuell); aktuell = []; summe = 0;
      }
      aktuell.push({
        ...beitrag,
        content: text,
        titel: teil === 0 ? beitrag.title : `${beitrag.title} — Fortsetzung`,
      });
      summe += laenge;
    });
  }
  if (aktuell.length) seiten.push(aktuell);
  return seiten;
}

function textSeiten(text, budget = SEITEN_BUDGET) {
  const seiten = [];
  let zeile = '';
  for (const wort of String(text || '').split(/\s+/)) {
    if (wort.length > budget) {
      if (zeile) { seiten.push(zeile); zeile = ''; }
      for (let i = 0; i < wort.length; i += budget) seiten.push(wort.slice(i, i + budget));
      continue;
    }
    if (zeile && zeile.length + wort.length + 1 > budget) { seiten.push(zeile); zeile = ''; }
    zeile += (zeile ? ' ' : '') + wort;
  }
  if (zeile || !seiten.length) seiten.push(zeile);
  return seiten;
}

// Beitragstitel kommen aus dem Admin. Der Server entfernt bereits Markup, hier
// wird zusätzlich escaped: zwei unabhängige Schritte ins DOM.
function esc(wert) {
  return String(wert ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
