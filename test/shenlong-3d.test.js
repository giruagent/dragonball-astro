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
