import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const site = fileURLToPath(new URL('../', import.meta.url));

function harness() {
  const requests = [];
  const timers = [];
  const elements = new Map();
  const room = {
    children: [],
    set innerHTML(html) {
      this.children = [...html.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)].map(([section]) => {
        const classes = new Set(section.match(/class="([^"]+)"/)[1].split(/\s+/));
        const element = { html: section, get visible() { return classes.has('ist-sichtbar'); } };
        element.classList = {
          toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
          add: (...names) => names.forEach((name) => classes.add(name)),
          remove: (...names) => names.forEach((name) => classes.delete(name)),
          contains: (name) => classes.has(name),
        };
        const style = () => ({ setProperty(name, value) { this[name] = value; } });
        element.style = style();
        const blocks = [...section.matchAll(/<([a-z0-9]+)\b([^>]*\bdata-leseblock\b[^>]*)>([\s\S]*?)<\/\1>/g)].map(([, , attributes, html]) => ({
          textContent: html.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/g, ' '),
          hasAttribute: (name) => attributes.includes(name),
          style: style(),
        }));
        element.querySelectorAll = (selector) => selector === '[data-leseblock]' ? blocks : [];
        element.remove = () => { room.children = room.children.filter((child) => child !== element); };
        const source = section.match(/<video\b[^>]*src="([^"]+)"/);
        const video = source ? {
          src: source[1], preload: 'none', loads: 0, plays: 0,
          load() { this.loads += 1; },
          play() { this.plays += 1; return Promise.resolve(); },
          pause() {}, closest() { return element; },
        } : null;
        element.querySelector = (selector) => selector === 'video' ? video : null;
        return element;
      });
    },
    append(element) { this.children = this.children.filter((child) => child !== element); this.children.push(element); },
    querySelector(selector) { return selector === '.ist-sichtbar' ? this.children.find((element) => element.visible) ?? null : null; },
    querySelectorAll() { return this.children.map((el) => el.querySelector('video')).filter(Boolean); },
  };
  elements.set('szenen', room);
  const context = vm.createContext({
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, { style: {}, dataset: {}, hidden: true });
        return elements.get(id);
      },
      addEventListener() {}, removeEventListener() {},
    },
    window: { innerWidth: 1920, innerHeight: 1080, addEventListener() {}, location: { reload() {} } },
    fetch: async (url) => { requests.push(url); return { ok: true, json: async () => ({ posts: [] }) }; },
    setTimeout: (callback, delay) => { timers.push({ callback, delay }); return timers.length; },
    clearTimeout() {}, setInterval() {},
  });
  const data = readFileSync(join(site, 'js/tv-data.js'), 'utf8').replace(/^export /gm, '');
  const timing = readFileSync(join(site, 'js/tv-timing.js'), 'utf8').replace(/^export /gm, '');
  const script = readFileSync(join(site, 'js/tv.js'), 'utf8')
    .replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/tv-data\.js['"];?/, '')
    .replace("import { leseplan } from './tv-timing.js';", '')
    .replace(/^starten\(\);?\s*$/m, '');
  vm.runInContext(`${data}\n${timing}\n${script}`, context);
  return {
    room, requests, timers,
    run: (expression) => vm.runInContext(expression, context),
    settleTransitions: () => timers.filter((timer) => timer.delay <= 1600 && !timer.ran).forEach((timer) => { timer.ran = true; timer.callback(); }),
    scenes: () => JSON.parse(vm.runInContext('JSON.stringify(zustand.szenen)', context)),
  };
}

const isLandscape = (scene) => /<video\b/.test(scene.html);
const clips = (scenes) => scenes.filter(isLandscape).map((scene) => scene.html.match(/src="([^"]+)"/)[1]);

test('both rounds give every block its reading time and preserve clip durations', () => {
  const app = harness();
  const videos = JSON.parse(app.run('JSON.stringify(RUHEVIDEOS)'));
  for (let round = 0; round < 2; round += 1) {
    app.run('szenenNeuBauen()');
    for (const [i, scene] of app.scenes().entries()) {
      if (isLandscape(scene)) {
        const video = videos.find(v => scene.html.includes(v.datei));
        assert.equal(scene.dauer, video.sekunden * 1000, 'Clip length stays unchanged');
      }
      const blocks = app.room.children[i].querySelectorAll('[data-leseblock]');
      if (!blocks.length) { assert.ok(isLandscape(scene), 'Only a landscape can have no text'); continue; }
      const last = blocks.at(-1);
      const end = parseFloat(last.style['--lese-start']) + parseFloat(last.style['--lese-animation'])
        + app.run('lesedauer(' + JSON.stringify(last.textContent) + ')') + 8000;
      assert.ok(scene.dauer >= end, 'Last block must be readable before the scene ends');
    }
    const services = app.scenes().filter(s => s.html.includes('leistungsseite'));
    assert.ok(services.every(s => s.dauer > 17000), 'Dense service pages need more than their former 17 seconds');
  }
});

test('no prices appear anywhere in the loop', () => {
  const app = harness();
  for (let round = 0; round < 2; round += 1) {
    app.run('szenenNeuBauen()');
    const content = app.scenes().map((scene) => scene.html).join('');
    assert.doesNotMatch(content, /\d+,\d{2}\s*€/, 'Amounts belong on the printed list, not on the screen');
    assert.doesNotMatch(content, /preis__|Selbstzahler|Preisstand/);
  }
});

test('every service is shown with its name and an explanation', () => {
  const app = harness();
  app.run('szenenNeuBauen()');
  const scenes = app.scenes().filter((scene) => scene.html.includes('leistungsseite'));
  const groups = JSON.parse(app.run('JSON.stringify(LEISTUNGEN)'));
  assert.equal(scenes.length, groups.length);
  for (const [index, scene] of scenes.entries()) {
    const titles = [...scene.html.matchAll(/class="leistung__titel">([^<]+)</g)].map((match) => match[1]);
    const texts = [...scene.html.matchAll(/class="leistung__text">([^<]+)</g)].map((match) => match[1]);
    assert.deepEqual(titles, groups[index].posten.map((posten) => posten.titel.replace(/&/g, '&amp;')));
    assert.equal(texts.length, titles.length, 'Each service keeps its explanation');
    assert.ok(titles.length >= 3 && titles.length <= 4, `Service count on page ${index + 1}: ${titles.length}`);
    assert.ok(scene.html.includes(groups[index].gruppe), 'The page says which group it shows');
  }
});

test('landscape clips play once without routine overlays or eager preload', () => {
  const app = harness();
  app.run('szenenNeuBauen()');
  const scenes = app.scenes().filter(isLandscape);
  assert.ok(scenes.length > 0);
  for (const scene of scenes) {
    assert.doesNotMatch(scene.html, /\bloop(?:\s|=|>)/);
    assert.doesNotMatch(scene.html, /ruhe__text|ruhe__schleier|data-leseblock/);
    assert.match(scene.html, /preload="none"/);
  }
});

test('crossing the last scene rebuilds the next round, rotates clips and shows index zero', () => {
  const app = harness();
  app.run('szeneZeigen(0)');
  const first = clips(app.scenes());
  app.run('szeneZeigen(zustand.szenen.length)');
  assert.notDeepEqual(clips(app.scenes()), first, 'Next round must use the next landscape clips');
  assert.equal(app.run('zustand.index'), 0);
  app.settleTransitions();
  assert.equal(app.room.children.filter((element) => element.visible).length, 1);
  assert.equal(app.room.children[0].visible, true);
  assert.equal(app.timers.at(-1).delay, app.scenes()[0].dauer);
});

test('only the immediately upcoming video is preloaded', () => {
  const app = harness();
  app.run('szeneZeigen(0)');
  const firstVideo = app.room.children.findIndex((element) => element.querySelector('video'));
  assert.ok(firstVideo > 0);
  assert.equal(app.room.querySelectorAll().reduce((sum, video) => sum + video.loads, 0), firstVideo === 1 ? 1 : 0);
  app.run(`szeneZeigen(${firstVideo - 1})`);
  const videos = app.room.querySelectorAll();
  assert.equal(videos[0].loads, 1);
  assert.ok(videos.slice(1).every((video) => video.loads === 0));
  app.run(`szeneZeigen(${firstVideo - 1})`);
  assert.equal(videos[0].loads, 1, 'Repeated display must not reload a buffered clip');
});

test('startup fetches practice posts without requesting weather', async () => {
  const app = harness();
  await app.run('starten()');
  assert.ok(app.requests.includes('/api/posts'));
  assert.ok(!app.requests.some((url) => /wetter|weather|tv-feed/.test(url)), `Unexpected requests: ${app.requests}`);
});

test('website and existing QR codes replace direct contact details in every round', () => {
  const app = harness();
  app.run("zustand.beitraege = [{ title: 'Praxisurlaub', content: 'Ab Montag wieder geöffnet.' }]");
  for (let round = 0; round < 2; round += 1) {
    app.run('szenenNeuBauen()');
    const scenes = app.scenes();
    const content = scenes.map((scene) => scene.html).join('');
    assert.ok(content.includes('praxis-staerke-staack.de'), 'Show the verified practice website');
    assert.ok(content.includes('QR-Codes in der Praxis'), 'Refer to existing printed QR codes');
    assert.ok(!content.includes(app.run('PRAXIS.telefon')), 'Do not show the phone number');
    assert.ok(!content.includes(app.run('PRAXIS.email')), 'Do not show the email address');
    assert.ok(content.includes('Praxisurlaub'), 'The post must also be shown');
    const news = scenes.find(scene => scene.html.includes('nachrichten'));
    assert.ok(news.dauer >= 14000, 'The post keeps at least its original dwell time');
  }
});

test('a 5000-character token is paginated without overflowing or losing content', () => {
  const app = harness();
  const pages = JSON.parse(app.run("JSON.stringify(textSeiten('a'.repeat(5000)))"));
  assert.ok(pages.length > 1);
  assert.ok(pages.every((page) => page.length > 0 && page.length <= 430), `Page lengths: ${pages.map((page) => page.length)}`);
  assert.equal(pages.join(''), 'a'.repeat(5000));
});

test('only an explicitly important landscape hint is shown', () => {
  const app = harness();
  app.run("RUHEVIDEOS[0].hinweis = { wichtig: true, titel: 'Wichtiger Hinweis', text: 'Bitte beachten.' }");
  const html = app.run('szeneRuhe(0)');
  assert.match(html, /Wichtiger Hinweis/);
  assert.match(html, /ruhe__text/);
  app.run('RUHEVIDEOS[0].hinweis.wichtig = false');
  assert.doesNotMatch(app.run('szeneRuhe(0)'), /ruhe__text|ruhe__schleier/);
});
