// Ablauf des Warteraum-Bildschirms. Feste Inhalte kommen aus tv-data.js.
import {
  PRAXIS, TV_TEXTE, PREISSTAND, OEFFNUNGSZEITEN, AKUTSPRECHSTUNDE,
  AERZTE, FACHKRAEFTE, LEISTUNGEN, SELBSTZAHLER, RUHEVIDEOS, MUSIK,
} from './tv-data.js';

const POSTS_INTERVALL_MS = 10 * 60 * 1000;
const NEUBAU_NACH_MS = 6 * 60 * 60 * 1000;
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

/* ---------- Folge: Preise und Landschaft über die Runde verteilen ---------- */

function szenenNeuBauen() {
  const preise = SELBSTZAHLER.flatMap((g) => g.posten).filter((p) => p.tv).sort((a, b) => a.tv - b.tv);
  const paare = preisSeiten(preise);
  const szene = (dauer, ton, wechsel, bau) => ({ dauer: dauer * 1000, ton, wechsel, bau });
  const preis = (i, dauer) => szene(dauer, i % 2 ? 'tinte' : 'papier', 'schnitt',
    () => szenePreise(paare[i], i));

  // Ein fester Zeitrahmen für Kontakt und Beiträge hält den Loop kurz.
  // Fortsetzungen und weitere Beiträge kommen in folgenden Runden vollständig dran.
  const meldungen = zustand.beitraege.flatMap((b) =>
    textSeiten(b.content).map((text) => ({ ...b, content: text })));
  const meldung = meldungen.length
    ? meldungen[zustand.beitragVersatz++ % meldungen.length] : null;

  const bloecke = [
    [
      szene(10, 'bild', 'blende', szeneAkut),
      szene(10, 'papier', 'seitlich', () => szeneArzt(AERZTE[0], false)),
      preis(0, 11),
    ],
    [
      szene(9, 'tinte', 'hoch', () => szeneLeistungen(LEISTUNGEN[0], 0)),
      szene(10, 'papier', 'seitlich', () => szeneArzt(AERZTE[1], true)),
      preis(1, 11),
      szene(9, 'papier', 'hoch', () => szeneLeistungen(LEISTUNGEN[1], 1)),
    ],
    [
      szene(11, 'papier', 'seitlich', szeneTeam),
      szene(9, 'tinte', 'hoch', () => szeneLeistungen(LEISTUNGEN[2], 2)),
      preis(2, 13),
      szene(11, 'papier', 'hoch', szeneZeiten),
    ],
    [
      szene(9, 'papier', 'hoch', () => szeneLeistungen(LEISTUNGEN[3], 3)),
      preis(3, 11),
      szene(meldung ? 8 : 18, 'tinte', 'blende', szeneKontakt),
      ...(meldung ? [szene(10, 'tinte', 'hoch', () => szeneBeitrag(meldung))] : []),
    ],
  ];

  const folge = [];
  bloecke.forEach((block, i) => {
    folge.push(...block);
    if (i < 3 && RUHEVIDEOS.length) {
      const platz = (zustand.ruheVersatz + i) % RUHEVIDEOS.length;
      folge.push(szene(RUHEVIDEOS[platz].sekunden, 'bild', 'blende', () => szeneRuhe(platz)));
    }
  });
  zustand.ruheVersatz = (zustand.ruheVersatz + 3) % RUHEVIDEOS.length;
  zustand.szenen = folge.map((s) => ({
    ...s,
    html: s.bau().replace('<section ', `<section data-wechsel="${s.wechsel}" style="--dauer:${s.dauer}ms" `),
  }));
  szenenRaum.innerHTML = zustand.szenen.map((s) => s.html).join('');
}

function szeneZeigen(index) {
  clearTimeout(zustand.timer);
  const vorher = szenenRaum.querySelector('.ist-sichtbar');
  // Auch am echten Rundenende neu bauen; index wächst bis zur Szenenzahl.
  if (index >= zustand.szenen.length || index === 0) {
    szenenNeuBauen();
    index = 0;
    // Die letzte Szene überbrückt den DOM-Neubau ohne leeren Zwischenframe.
    if (vorher) { szenenRaum.append(vorher); setTimeout(() => vorher.remove(), 1600); }
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
    }, 1600);
  }
  aktiv.classList.add('ist-sichtbar');
  const szene = zustand.szenen[index];
  buehne.dataset.ton = szene.ton;
  videoSteuern(aktiv);
  naechstesVideoVorladen(szenen, index);
  fortschrittStarten(szene.dauer);
  zustand.timer = setTimeout(() => {
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
  void balken.offsetWidth;
  balken.style.transition = `transform ${dauer}ms linear`;
  balken.style.transform = 'scaleX(1)';
}

/* ---------- Unterschiedliche Bildkompositionen ---------- */

function szeneAkut() {
  return `<section class="szene szene--bild empfang">
    <img class="raumfoto" src="${esc(TV_TEXTE.empfangBild)}" alt="">
    <div class="empfang__text">
      <h2>${esc(TV_TEXTE.akutTitel)}</h2>
      <p class="empfang__zeit ziffern">${esc(TV_TEXTE.akutZeit)}</p>
      <p>${esc(TV_TEXTE.akutHinweis)}</p>
    </div>
  </section>`;
}

function szeneArzt(p, gespiegelt) {
  return `<section class="szene szene--papier portrait${gespiegelt ? ' portrait--rechts' : ''}">
    <div class="portrait__foto"><img src="${esc(p.bild)}" alt="${esc(p.name)}"></div>
    <div class="portrait__text">
      <h2>${esc(p.name)}</h2>
      <p class="portrait__fach">${esc(p.fach)}</p>
      <p class="portrait__rolle ziffern">${esc(p.rolle)}</p>
    </div>
  </section>`;
}

function szeneTeam() {
  return `<section class="szene szene--papier team">
    <h2>${esc(TV_TEXTE.teamTitel)}</h2>
    <div class="team__reihe">${FACHKRAEFTE.map((p) => `
      <figure class="kopf">
        <div class="kopf__bild"><img src="${esc(p.bild)}" alt="${esc(p.name)}"></div>
        <figcaption class="kopf__name">${esc(p.name)}</figcaption>
      </figure>`).join('')}</div>
  </section>`;
}

function szeneLeistungen(gruppe, i) {
  return `<section class="szene szene--${i % 2 ? 'papier' : 'tinte'} leistungen leistungen--${i}">
    <div class="leistungen__namen">${gruppe.posten.map((p) => `
      <h2 class="leistung">${esc(p.titel)}</h2>`).join('')}</div>
  </section>`;
}

function szenePreise(posten, i) {
  return `<section class="szene szene--${i % 2 ? 'tinte' : 'papier'} preisseite ${i % 2 ? 'preisseite--zeilen' : 'preisseite--paar'}">
    <h2 class="preisseite__titel">${esc(TV_TEXTE.preisTitel)}</h2>
    <div class="preise">${posten.map((p) => `
      <article class="preis">
        <div><h3 class="preis__leistung">${esc(p.leistung)}</h3>
          ${p.detail && p.detail.length <= 80 ? `<p class="preis__detail">${esc(p.detail)}</p>` : ''}</div>
        <div class="preis__betrag"><p class="preis__wert ziffern">${euro(p.preis)}</p>
          ${p.zusatz ? `<p class="preis__zusatz ziffern">${esc(p.zusatz)}</p>` : ''}</div>
      </article>`).join('')}</div>
    <p class="preisstand">${esc(TV_TEXTE.preisStand)} ${esc(PREISSTAND)}</p>
  </section>`;
}

function szeneZeiten() {
  return `<section class="szene szene--papier sprechzeiten">
    <h2>${esc(TV_TEXTE.zeitenTitel)}</h2>
    <div class="zeiten">${OEFFNUNGSZEITEN.map((z) => `
      <div class="zeiten__block"><p>${esc(z.tag)}</p><p class="zeiten__zeit ziffern">${esc(z.zeit)}</p></div>`).join('')}</div>
    <div class="akut"><p>${esc(TV_TEXTE.akutTitel)}</p><p class="ziffern">${esc(AKUTSPRECHSTUNDE)}</p></div>
  </section>`;
}

function szeneKontakt() {
  return `<section class="szene szene--tinte kontakt">
    <h2>${esc(TV_TEXTE.kontaktTitel)}</h2>
    <p class="kontakt__telefon ziffern">${esc(PRAXIS.telefon)}</p>
    <p class="kontakt__email">${esc(PRAXIS.email)}</p>
  </section>`;
}

function szeneBeitrag(b) {
  const lang = b.title.length > 80 || /\S{40}/.test(b.content);
  return `<section class="szene szene--tinte nachricht${lang ? ' nachricht--lang' : ''}">
    <p class="nachricht__rubrik">${esc(TV_TEXTE.beitragTitel)}</p>
    <h2>${esc(b.title)}</h2>
    <p class="nachricht__text">${esc(b.content)}</p>
  </section>`;
}

function szeneRuhe(index) {
  const video = RUHEVIDEOS[index % RUHEVIDEOS.length];
  return `<section class="szene szene--bild ruhe">
    <video class="ruhe__video" src="${esc(video.datei)}" muted playsinline preload="none"></video>
  </section>`;
}

function euro(betrag) { return `${betrag.toFixed(2).replace('.', ',')} €`; }

// Höchstens zwei Preise: zusammen mit dem Preisstand drei Informationsgruppen.
// Zeilen mit Zusatzkosten behalten ihren Platz; nichts wird abgeschnitten.
function preisSeiten(posten) {
  const seiten = [];
  for (let i = 0; i < posten.length; i += 2) seiten.push(posten.slice(i, i + 2));
  return seiten;
}

function textSeiten(text, budget = 220) {
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

function esc(wert) {
  return String(wert ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
