import test from 'node:test';
import assert from 'node:assert/strict';

const soundModule = async () => {
  try { return await import('../src/scripts/shenlong-sound.js'); }
  catch (error) { if (error.code === 'ERR_MODULE_NOT_FOUND') return {}; throw error; }
};

test('sound stays silent until explicitly enabled and handles unavailable audio', async () => {
  const { createShenlongSound } = await soundModule();
  assert.equal(typeof createShenlongSound, 'function');
  let calls = 0;
  const sound = createShenlongSound(() => { calls++; return null; });
  assert.equal(sound.play('arrival'), false);
  assert.equal(calls, 0);
  assert.equal(await sound.start(), false);
  assert.equal(calls, 1);
  assert.equal(sound.play('wish'), false);
  sound.stop();
});


test('enabled sounds create voices for known events and stop them cleanly', async () => {
  const { createShenlongSound } = await soundModule();
  let stopped = 0, closed = 0, created = 0;
  const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  const ctx = { state: 'running', currentTime: 0, destination: {},
    createOscillator() { created++; return { frequency: param, connect() {}, disconnect() {}, start() {}, stop() { stopped++; } }; },
    createGain() { return { gain: param, connect() {}, disconnect() {} }; },
    close() { closed++; return Promise.resolve(); },
  };
  const sound = createShenlongSound(() => ctx);
  assert.equal(await sound.start(), true);
  for (const event of ['arrival', 'wish', 'collect']) assert.equal(sound.play(event), true);
  assert.equal(sound.play('invalid'), false);
  assert.equal(created, 3);
  sound.stop();
  assert.equal(stopped, 6);
  assert.equal(closed, 1);
  assert.equal(sound.play('wish'), false);
});


test('a rejected stale start cannot stop a newer sound session', async () => {
  const { createShenlongSound } = await soundModule();
  let rejectResume;
  const old = { state: 'suspended', resume: () => new Promise((_, reject) => { rejectResume = reject; }), close: () => Promise.resolve() };
  let closed = 0;
  const fresh = { state: 'running', close: () => { closed++; return Promise.resolve(); } };
  let count = 0;
  const sound = createShenlongSound(() => count++ ? fresh : old);
  const pending = sound.start();
  sound.stop();
  assert.equal(await sound.start(), true);
  rejectResume(new Error('interrupted'));
  assert.equal(await pending, false);
  assert.equal(closed, 0);
});
