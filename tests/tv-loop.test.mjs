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
  const script = readFileSync(join(site, 'js/tv.js'), 'utf8')
    .replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/tv-data\.js['"];?/, '')
    .replace(/^starten\(\);?\s*$/m, '');
  vm.runInContext(`${data}\n${script}`, context);
  return {
    room, requests, timers,
    run: (expression) => vm.runInContext(expression, context),
    settleTransitions: () => timers.filter((timer) => timer.delay <= 1600 && !timer.ran).forEach((timer) => { timer.ran = true; timer.callback(); }),
    scenes: () => JSON.parse(vm.runInContext('JSON.stringify(zustand.szenen)', context)),
  };
}

const isLandscape = (scene) => /<video\b/.test(scene.html);
const clips = (scenes) => scenes.filter(isLandscape).map((scene) => scene.html.match(/src="([^"]+)"/)[1]);

test('two rotating default rounds each last 3–4 minutes with 30–40% landscape', () => {
  const app = harness();
  for (let round = 0; round < 2; round += 1) {
    app.run('szenenNeuBauen()');
    const scenes = app.scenes();
    const duration = scenes.reduce((sum, scene) => sum + scene.dauer, 0);
    const landscape = scenes.filter(isLandscape).reduce((sum, scene) => sum + scene.dauer, 0);
    assert.ok(duration >= 180_000 && duration <= 240_000, `Round ${round + 1}: ${duration / 1000}s`);
    assert.ok(landscape / duration >= 0.30 && landscape / duration <= 0.40, `Landscape share: ${landscape / duration}`);
  }
});

test('eight distinct selected prices are separated by other content', () => {
  const app = harness();
  app.run('szenenNeuBauen()');
  const scenes = app.scenes();
  const names = scenes.flatMap((scene) => [...scene.html.matchAll(/class="preis__leistung">([^<]+)</g)].map((match) => match[1]));
  assert.equal(names.length, 8);
  assert.equal(new Set(names).size, 8);
  const expected = {
    'Reisemedizinische Beratung': '30,60 €',
    'Ganzkörper-Hautcheck': '24,80 €',
    'Bioimpedanzanalyse': '37,26 €',
    'Sporttauglichkeit': '95,28 €',
    'Kleiner Blutcheck': '93,08 €',
    'Kleiner Vitamin-Check': '53,80 €',
    'Schule und Sportunterricht': '2,50 €',
    'Bootsführerschein': '37,53 €',
  };
  assert.deepEqual(names.toSorted(), Object.keys(expected).toSorted());
  let pricedEntries = 0;
  for (const scene of scenes) {
    for (const [, name, amount] of scene.html.matchAll(/class="preis__leistung">([^<]+)<[\s\S]*?class="preis__wert(?: [^"]*)?">([^<]+)</g)) {
      pricedEntries += 1;
      assert.equal(amount, expected[name], `Price changed for ${name}`);
    }
  }
  assert.equal(pricedEntries, 8);
  assert.match(scenes.find((scene) => scene.html.includes('Kleiner Blutcheck')).html, /zzgl\. 10,72 € Labor/);
  assert.match(scenes.find((scene) => scene.html.includes('Kleiner Vitamin-Check')).html, /zzgl\. 71,73 € Labor/);
  for (let index = 0; index < scenes.length; index += 1) {
    assert.ok(!(scenes[index].html.includes('preis__leistung') && scenes[(index + 1) % scenes.length].html.includes('preis__leistung')), `Adjacent price scenes at ${index}`);
  }
});

test('each service scene contains at most three readable entries', () => {
  const app = harness();
  app.run('szenenNeuBauen()');
  const counts = app.scenes().map((scene) => [...scene.html.matchAll(/class="leistung"/g)].length).filter(Boolean);
  assert.ok(counts.length > 0);
  assert.ok(counts.every((count) => count <= 3), `Service counts: ${counts}`);
});

test('landscape clips play once without text overlays and without eager preload', () => {
  const app = harness();
  app.run('szenenNeuBauen()');
  const scenes = app.scenes().filter(isLandscape);
  assert.ok(scenes.length > 0);
  for (const scene of scenes) {
    assert.doesNotMatch(scene.html, /\bloop(?:\s|=|>)/);
    assert.doesNotMatch(scene.html, /ruhe__(?:text|marke|satz|schleier)/);
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

test('practice contact stays visible in each round when a post is present', () => {
  const app = harness();
  app.run("zustand.beitraege = [{ title: 'Praxisurlaub', content: 'Ab Montag wieder geöffnet.' }]");
  for (let round = 0; round < 2; round += 1) {
    app.run('szenenNeuBauen()');
    const scenes = app.scenes();
    const content = scenes.map((scene) => scene.html).join('');
    assert.ok(content.includes(app.run('PRAXIS.telefon')), 'Contact phone must remain available');
    assert.ok(content.includes(app.run('PRAXIS.email')), 'Contact email must remain available');
    assert.ok(content.includes('Praxisurlaub'), 'The post must also be shown');
    const duration = scenes.reduce((sum, scene) => sum + scene.dauer, 0);
    assert.ok(duration >= 180_000 && duration <= 240_000, `Round with post: ${duration / 1000}s`);
  }
});

test('a 5000-character token is paginated without overflowing or losing content', () => {
  const app = harness();
  const pages = JSON.parse(app.run("JSON.stringify(textSeiten('a'.repeat(5000)))"));
  assert.ok(pages.length > 1);
  assert.ok(pages.every((page) => page.length > 0 && page.length <= 220), `Page lengths: ${pages.map((page) => page.length)}`);
  assert.equal(pages.join(''), 'a'.repeat(5000));
});
