import { scoreAnswers } from './quiz-logic.js';
import { collectDragonBall, fulfillWish, getShenronMenuAction } from './dragon-quest-logic.js';
import { createShenlongController } from './shenlong-controller.js';
import { createShenlongSound } from './shenlong-sound.js';

const quizForm = document.querySelector('#quiz-form');
quizForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!quizForm.reportValidity()) return;

  const questions = [...quizForm.querySelectorAll('.quiz-question')];
  const correctAnswers = questions.map((question) => question.dataset.answer);
  const selectedAnswers = questions.map((question) => question.querySelector('input:checked')?.value ?? null);
  const result = scoreAnswers(correctAnswers, selectedAnswers);
  const resultElement = quizForm.querySelector('#quiz-result');

  if (!result.complete) {
    resultElement.textContent = 'Responde todas las preguntas para ver tu resultado.';
    return;
  }

  questions.forEach((question) => {
    const selected = question.querySelector('input:checked');
    question.classList.toggle('is-correct', selected?.value === question.dataset.answer);
    question.classList.toggle('is-incorrect', selected?.value !== question.dataset.answer);
  });
  resultElement.textContent = `Tu nivel de poder: ${result.score} / ${result.total}`;
});

const dragonBallTriggers = [...document.querySelectorAll('[data-dragon-ball]')];
const originalBallLabels = dragonBallTriggers.map((trigger) => trigger.getAttribute('aria-label'));
const dragonBallToast = document.querySelector('#dragon-ball-toast');
const shenronDialog = document.querySelector('#shenron-scene');
const shenlongController = createShenlongController(() => import('./shenlong-scene.js'));
const shenronEntry = document.querySelector('[data-shenron-entry]');
const wishForm = document.querySelector('#wish-form');
const wishInput = document.querySelector('#wish-text');
const wishResult = document.querySelector('#wish-result');
const sound = createShenlongSound();
const soundButton = shenronDialog?.querySelector('[data-shenlong-sound]');
const shenronStage = shenronDialog?.querySelector('.shenron-stage');
let muted = false, soundActive = false, soundGeneration = 0, startingSound;
function updateSoundButton() {
  soundButton?.setAttribute('aria-pressed', String(soundActive));
  if (soundButton) soundButton.textContent = soundActive ? 'Silenciar sonido' : 'Activar sonido';
}
function stopSound() {
  soundGeneration++;
  startingSound = undefined;
  soundActive = false;
  try { sound.stop(); } catch { /* Audio devices can disappear while closing. */ }
  updateSoundButton();
}
function enableSound() {
  if (muted) return Promise.resolve(false);
  if (soundActive) return Promise.resolve(true);
  if (startingSound) return startingSound;
  const generation = soundGeneration;
  const pending = sound.start().then((started) => {
    if (generation !== soundGeneration) return false;
    soundActive = started;
    updateSoundButton();
    return started;
  }).catch(() => false).finally(() => { if (startingSound === pending) startingSound = undefined; });
  startingSound = pending;
  return pending;
}
soundButton?.addEventListener('click', () => {
  if (soundActive || startingSound) { muted = true; stopSound(); }
  else { muted = false; enableSound(); }
});
shenronStage?.addEventListener('shenlong-ready', () => {
  const generation = soundGeneration;
  Promise.resolve(startingSound || soundActive).then((started) => {
    if (started && generation === soundGeneration && shenronDialog.open) sound.play('arrival');
  }).catch(() => {});
});
let foundBalls = [];
let wishFulfilled = false;
let toastTimer;
let openTimer;

function cancelPendingOpen() {
  window.clearTimeout(openTimer);
  openTimer = undefined;
}

function announceHunt(message) {
  if (!dragonBallToast) return;
  window.clearTimeout(toastTimer);
  dragonBallToast.textContent = '';
  dragonBallToast.classList.add('is-visible');
  window.setTimeout(() => {
    dragonBallToast.textContent = message;
  }, 0);
  toastTimer = window.setTimeout(() => {
    dragonBallToast.classList.remove('is-visible');
  }, 3600);
}

function openShenronDialog() {
  cancelPendingOpen();
  if (!shenronDialog || shenronDialog.open || wishFulfilled) return;
  shenronDialog.showModal();
  const stage = shenronDialog.querySelector('.shenron-stage');
  if (stage) shenlongController.open(stage);
  window.requestAnimationFrame(() => wishInput?.focus({ preventScroll: true }));
}

shenronEntry?.addEventListener('click', (event) => {
  event.preventDefault();
  const action = getShenronMenuAction(foundBalls, wishFulfilled);
  if (action === 'open') {
    openShenronDialog();
    return;
  }
  if (action === 'fulfilled') {
    announceHunt('Shenlong ya concedió tu deseo.');
    return;
  }

  announceHunt('Encuentra las siete esferas escondidas para pedir un deseo.');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelector('#top')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
});

document.addEventListener('click', (event) => {
  const trigger = event.target instanceof Element ? event.target.closest('[data-dragon-ball]') : null;
  if (!trigger || wishFulfilled) return;

  const soundAttempt = enableSound();
  const generation = soundGeneration;
  const result = collectDragonBall(foundBalls, Number(trigger.dataset.dragonBall));
  foundBalls = result.foundBalls;
  if (!result.added) {
    if (result.completed) openShenronDialog();
    return;
  }

  soundAttempt.then((started) => { if (started && generation === soundGeneration) sound.play('collect'); });
  if (result.count === 1) shenlongController.preload();
  trigger.classList.add('is-found');
  trigger.setAttribute('aria-pressed', 'true');
  trigger.setAttribute('aria-label', `Esfera del Dragón encontrada: ${result.count} de 7`);
  announceHunt(`¡Encontraste una esfera! ${result.count} de 7.`);

  if (result.completed) {
    announceHunt('¡Reuniste las siete! Shenlong está por aparecer...');
    cancelPendingOpen();
    openTimer = window.setTimeout(() => {
      openTimer = undefined;
      if (foundBalls.length === 7 && !wishFulfilled) openShenronDialog();
    }, 700);
  }
});

function resetWish() {
  cancelPendingOpen();
  if (!wishFulfilled) return;

  shenronDialog.classList.remove('is-fulfilling');
  foundBalls = [];
  wishFulfilled = false;
  wishForm.reset();
  wishInput.setCustomValidity('');
  wishResult.textContent = '';
  wishForm.querySelectorAll('input, button').forEach((control) => { control.disabled = false; });
  dragonBallTriggers.forEach((trigger, index) => {
    trigger.disabled = false;
    trigger.classList.remove('is-found', 'is-launched');
    trigger.setAttribute('aria-pressed', 'false');
    trigger.setAttribute('aria-label', originalBallLabels[index]);
  });
  announceHunt('¡Deseo concedido! Las esferas se han dispersado por el universo.');
}

function closeShenronDialog() {
  cancelPendingOpen();
  stopSound();
  shenlongController.close();
  if (shenronDialog?.open) shenronDialog.close();
  resetWish();
}

shenronDialog?.querySelector('[data-close-wish]')?.addEventListener('click', closeShenronDialog);
shenronDialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeShenronDialog();
});

shenronDialog?.addEventListener('close', () => {
  // A close event is queued and may arrive after the dialog was reopened.
  if (shenronDialog.open) return;
  cancelPendingOpen();
  stopSound();
  shenlongController.close();
  resetWish();
  if (foundBalls.length === 7 && !wishFulfilled) {
    announceHunt('Las siete esferas siguen reunidas. Toca una para volver a llamar a Shenlong.');
  }
});

wishForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!wishInput || !wishResult || !shenronDialog) return;
  wishInput.setCustomValidity('');
  if (!wishForm.reportValidity()) return;

  const wish = wishInput.value.trim();
  if (!wish) {
    wishInput.setCustomValidity('Escribe un deseo para Shenlong.');
    wishInput.reportValidity();
    return;
  }
  wishInput.setCustomValidity('');

  const response = fulfillWish(wish);
  if (!response) return;

  sound.play('wish');
  wishResult.textContent = response;
  wishForm.querySelectorAll('input, button').forEach((control) => {
    control.disabled = true;
  });
  shenronDialog.classList.add('is-fulfilling');
  wishFulfilled = true;
  dragonBallTriggers.forEach((trigger) => {
    trigger.disabled = true;
    trigger.classList.add('is-launched');
    trigger.setAttribute('aria-label', 'El deseo se cumplió y las esferas se dispersaron');
  });

  // Keep the confirmation and its live region available until the user closes it.
});
