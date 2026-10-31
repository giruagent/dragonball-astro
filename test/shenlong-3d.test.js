import test from 'node:test';
import assert from 'node:assert/strict';

async function controller() {
  try { return await import('../src/scripts/shenlong-controller.js'); }
  catch (error) { if (error.code === 'ERR_MODULE_NOT_FOUND') return {}; throw error; }
}

test('opens the scene lazily and cleans it up on close', async () => {
  const { createShenlongController } = await controller();
  assert.equal(typeof createShenlongController, 'function', 'scene controller must exist');
  let imports = 0, disposals = 0;
  const scene = createShenlongController(async () => { imports++; return { mountShenlong: async () => () => disposals++ }; });
  assert.equal(imports, 0);
  await scene.open({});
  assert.equal(imports, 1);
  scene.close();
  assert.equal(disposals, 1);
});


test('opening a replacement disposes the previous scene', async () => {
  const { createShenlongController } = await controller();
  const disposed = [];
  let id = 0;
  const scene = createShenlongController(async () => ({ mountShenlong: () => {
    const current = ++id;
    return () => disposed.push(current);
  } }));
  await scene.open({});
  await scene.open({});
  assert.deepEqual(disposed, [1]);
  scene.close();
  assert.deepEqual(disposed, [1, 2]);
});

test('model URL respects Astro base paths', async () => {
  let module;
  try { module = await import('../src/scripts/shenlong-scene.js'); }
  catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; module = {}; }
  assert.equal(typeof module.modelUrl, 'function', 'scene must expose its model URL');
  assert.equal(module.modelUrl('/dragonball-astro/'), '/dragonball-astro/models/shenlong.glb');
  assert.equal(module.modelUrl('/'), '/models/shenlong.glb');
});


test('mounting without WebGL keeps the existing illustration visible', async () => {
  const { mountShenlong } = await import('../src/scripts/shenlong-scene.js');
  assert.equal(typeof mountShenlong, 'function', 'scene must be mountable');
  const classes = new Set();
  const stage = { classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) } };
  const cleanup = await mountShenlong(stage, '/');
  assert.equal(classes.has('has-3d-dragon'), false);
  cleanup();
});


test('wish dialog opens and closes the lazy scene without changing its controls', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/scripts/site.js', import.meta.url), 'utf8');
  assert.match(source, /import\(['"]\.\/shenlong-scene\.js['"]\)/);
  assert.match(source, /shenlongController\.open\(/);
  assert.match(source, /shenlongController\.close\(/);
});


test('ships the credited original Shenlong GLB', async () => {
  const { readFile } = await import('node:fs/promises');
  const glb = await readFile(new URL('../public/models/shenlong.glb', import.meta.url));
  assert.equal(glb.toString('ascii', 0, 4), 'glTF');
  const json = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)));
  assert.equal(json.asset.extras.author, 'placebo_vscure (https://sketchfab.com/placebo_vscure)');
  assert.equal(json.asset.extras.license, 'CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)');
  const attribution = await readFile(new URL('../public/models/ATTRIBUTION.md', import.meta.url), 'utf8');
  for (const required of ['placebo_vscure', 'CC BY 4.0', 'ee561e95bd9642f193fd09e8058f6c2f']) assert.ok(attribution.includes(required));
});


test("camera fit accounts for depth without shrinking a flat-facing dragon", async () => {
  const THREE = await import("three");
  const { fitCameraDistance } = await import("../src/scripts/shenlong-scene.js");
  assert.equal(typeof fitCameraDistance, "function");
  const bounds = new THREE.Box3(new THREE.Vector3(-2, -1, -4), new THREE.Vector3(2, 1, 4));
  const distance = fitCameraDistance(bounds, 35, 1);
  assert.ok(distance > 4 + 2 / Math.tan(THREE.MathUtils.degToRad(17.5)));
  assert.ok(distance < 12);
});


test("wish dialog visibly credits the model and its license", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../src/components/WishSection.astro", import.meta.url), "utf8");
  for (const required of ["placebo_vscure", "CC BY 4.0", "ee561e95bd9642f193fd09e8058f6c2f", "creativecommons.org/licenses/by/4.0/"]) assert.ok(source.includes(required), required);
});


test('fulfillment departs the visible canvas without animating the hidden fallback', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  assert.match(css, /\.shenron-scene\.is-fulfilling\s+\.shenron-stage\.has-3d-dragon\s+\.shenron-canvas\s*\{[^}]*animation:\s*dragon-depart/s);
  assert.match(css, /\.shenron-scene\.is-fulfilling\s+\.shenron-stage:not\(\.has-3d-dragon\)\s+\.shenron-dragon\s*\{[^}]*animation:\s*dragon-depart/s);
});


test('first gesture preload shares work with opening and retries failures', async () => {
  const { createShenlongController } = await controller();
  let imports = 0, preloads = 0, mounts = 0;
  const scene = createShenlongController(async () => {
    imports++;
    return { preloadShenlong: async () => { preloads++; if (preloads === 1) throw Error('offline'); }, mountShenlong: () => { mounts++; return () => {}; } };
  });
  assert.equal(imports, 0);
  await scene.preload();
  await Promise.all([scene.preload(), scene.preload(), scene.open({})]);
  assert.equal(imports, 1);
  assert.equal(preloads, 2);
  assert.equal(mounts, 1);
});

test('GLB preload downloads once and retries a failed response', async () => {
  const { preloadShenlong } = await import('../src/scripts/shenlong-scene.js');
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    if (requests === 1) return new Response('', { status: 503 });
    return new Response(new Uint8Array([1, 2, 3]));
  };
  try {
    await assert.rejects(preloadShenlong('/test-retry/'));
    const [a, b] = await Promise.all([preloadShenlong('/test-retry/'), preloadShenlong('/test-retry/')]);
    assert.equal(requests, 2);
    assert.strictEqual(a, b);
  } finally { globalThis.fetch = originalFetch; }
});


test('a fulfilled wish resets all spheres and enables a second wish', async () => {
  class Element {
    constructor(number) { this.dataset = { dragonBall: String(number) }; this.attrs = { 'aria-label': `Esfera del Dragón oculta ${number} de 7`, 'aria-pressed': 'false' }; this.disabled = false; this.classes = new Set(); this.classList = { add: (...names) => names.forEach(n => this.classes.add(n)), remove: (...names) => names.forEach(n => this.classes.delete(n)) }; }
    closest() { return this; }
    setAttribute(name, value) { this.attrs[name] = value; }
    getAttribute(name) { return this.attrs[name]; }
  }
  const handlers = {}, dialogHandlers = {}, formHandlers = {}, timers = [];
  const entryHandlers = {}; const entry = { addEventListener: (event, fn) => entryHandlers[event] = fn };
  const balls = Array.from({ length: 7 }, (_, i) => new Element(i + 1));
  const input = { value: '', disabled: false, setCustomValidity() {}, focus() {} };
  const button = { disabled: false };
  const result = { textContent: '' };
  const form = { addEventListener: (event, fn) => formHandlers[event] = fn, reportValidity: () => true, querySelectorAll: () => [input, button], reset: () => { input.value = ''; } };
  const dialog = { open: false, classList: { add() {}, remove() {} }, querySelector: () => null, addEventListener: (event, fn) => dialogHandlers[event] = fn, showModal() { this.open = true; }, close() { this.open = false; dialogHandlers.close(); } };
  const previous = { document: globalThis.document, window: globalThis.window, Element: globalThis.Element };
  globalThis.Element = Element;
  globalThis.document = { querySelectorAll: () => balls, querySelector: (selector) => ({ '#shenron-scene': dialog, '#wish-form': form, '#wish-text': input, '#wish-result': result, '[data-shenron-entry]': entry }[selector] || null), addEventListener: (event, fn) => handlers[event] = fn };
  globalThis.window = { setTimeout: (fn, delay) => { const timer = { fn, delay }; timers.push(timer); return timer; }, clearTimeout: (timer) => { const index = timers.indexOf(timer); if (index >= 0) timers.splice(index, 1); }, matchMedia: () => ({ matches: true }), requestAnimationFrame() {} };
  const runTimers = (delay) => { for (const item of [...timers].filter(item => item.delay === delay)) { timers.splice(timers.indexOf(item), 1); item.fn(); } };
  try {
    await import(`../src/scripts/site.js?replay-test`);
    for (const ball of balls) handlers.click({ target: ball });
    entryHandlers.click({ preventDefault() {} });
    assert.equal(dialog.open, true);
    input.value = 'Paz';
    formHandlers.submit({ preventDefault() {} });
    runTimers(350);
    assert.equal(dialog.open, true, 'confirmation remains available with reduced motion');
    assert.match(result.textContent, /Paz/);
    dialogHandlers.cancel({ preventDefault() {} });
    assert.equal(dialog.open, false);
    runTimers(700);
    assert.equal(dialog.open, false, 'stale automatic open must not reopen after reset');
    assert.ok(balls.every(ball => !ball.disabled && !ball.classes.has('is-found') && !ball.classes.has('is-launched') && ball.attrs['aria-pressed'] === 'false'));
    assert.ok(!input.disabled && !button.disabled);
    assert.equal(input.value, '');
    assert.equal(result.textContent, '');
    for (const ball of balls) handlers.click({ target: ball });
    runTimers(700);
    assert.equal(dialog.open, true);
    input.value = 'Salud';
    formHandlers.submit({ preventDefault() {} });
    assert.match(result.textContent, /Salud/);
    dialogHandlers.cancel({ preventDefault() {} });
    assert.ok(balls.every(ball => !ball.disabled && !ball.classes.has('is-launched')));
  } finally { Object.assign(globalThis, previous); }
});


test('entrance progresses for 4.8 seconds from model readiness and settles', async () => {
  const { entrancePose } = await import('../src/scripts/shenlong-scene.js');
  const start = entrancePose(0), middle = entrancePose(2400), end = entrancePose(4800);
  assert.ok(start.scale < middle.scale && middle.scale < end.scale);
  assert.ok(start.y < middle.y && middle.y < end.y);
  assert.deepEqual(end, { scale: 1, y: 0, rotation: 0, done: true });
  assert.deepEqual(entrancePose(9000), end);
});


test('site connects sound to collection, model readiness, wish and closure', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/scripts/site.js', import.meta.url), 'utf8');
  assert.match(source, /createShenlongSound/);
  for (const event of ['collect', 'arrival', 'wish']) assert.ok(source.includes(`play('${event}')`));
  assert.match(source, /shenlong-ready/);
  assert.match(source, /sound\.stop\(\)/);
});


test('oversized declared model aborts the fetch before reading', async () => {
  const { preloadShenlong } = await import('../src/scripts/shenlong-scene.js');
  const original = globalThis.fetch;
  let signal, read = false;
  globalThis.fetch = async (_url, options) => {
    signal = options.signal;
    return { ok: true, headers: new Headers({ 'Content-Length': String(16 * 1024 * 1024 + 1) }), body: { getReader() { read = true; } } };
  };
  try {
    await assert.rejects(preloadShenlong('/oversized/'));
    assert.equal(signal.aborted, true);
    assert.equal(read, false);
  } finally { globalThis.fetch = original; }
});
