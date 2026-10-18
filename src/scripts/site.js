import { scoreAnswers } from './quiz-logic.js';
import { grantWish } from './wish-logic.js';

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

menuToggle?.addEventListener('click', () => {
  const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isExpanded));
  menuToggle.setAttribute('aria-label', isExpanded ? 'Abrir navegación' : 'Cerrar navegación');
  navigation?.classList.toggle('is-open', !isExpanded);
});

navigation?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Abrir navegación');
    navigation.classList.remove('is-open');
  });
});

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

const wishForm = document.querySelector('#wish-form');
wishForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!wishForm.reportValidity()) return;
  const wish = new FormData(wishForm).get('wish');
  wishForm.querySelector('#wish-result').textContent = grantWish(wish);
});
