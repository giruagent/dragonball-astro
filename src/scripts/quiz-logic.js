export function scoreAnswers(correctAnswers, selectedAnswers) {
  const total = correctAnswers.length;
  const answers = Array.from({ length: total }, (_, index) => selectedAnswers[index] ?? null);
  const answered = answers.filter((answer) => answer !== null).length;
  const score = answers.reduce(
    (sum, answer, index) => sum + Number(answer !== null && answer === correctAnswers[index]),
    0,
  );

  return { score, answered, total, complete: answered === total };
}
