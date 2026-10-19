import { scoreAnswers } from './quiz-logic.js';
import { collectDragonBall, fulfillWish, getShenronMenuAction } from './dragon-quest-logic.js';

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
const dragonBallToast = document.querySelector('#dragon-ball-toast');
const shenronDialog = document.querySelector('#shenron-scene');
const shenronEntry = document.querySelector('[data-shenron-entry]');
const wishForm = document.querySelector('#wish-form');
const wishInput = document.querySelector('#wish-text');
const wishResult = document.querySelector('#wish-result');
let foundBalls = [];
let wishFulfilled = false;
let toastTimer;

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
  if (!shenronDialog || shenronDialog.open || wishFulfilled) return;
  shenronDialog.showModal();
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

  const result = collectDragonBall(foundBalls, Number(trigger.dataset.dragonBall));
  foundBalls = result.foundBalls;
  if (!result.added) {
    if (result.completed) openShenronDialog();
    return;
  }

  trigger.classList.add('is-found');
  trigger.setAttribute('aria-pressed', 'true');
  trigger.setAttribute('aria-label', `Esfera del Dragón encontrada: ${result.count} de 7`);
  announceHunt(`¡Encontraste una esfera! ${result.count} de 7.`);

  if (result.completed) {
    announceHunt('¡Reuniste las siete! Shenlong está por aparecer...');
    window.setTimeout(openShenronDialog, 700);
  }
});

shenronDialog?.querySelector('[data-close-wish]')?.addEventListener('click', () => {
  shenronDialog.close();
});

shenronDialog?.addEventListener('close', () => {
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

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.setTimeout(() => {
    if (shenronDialog.open) shenronDialog.close();
    shenronDialog.classList.remove('is-fulfilling');
    announceHunt('¡Deseo concedido! Las esferas se han dispersado por el universo.');
  }, reducedMotion ? 350 : 3100);
});
