const DRAGON_BALL_COUNT = 7;
const MAX_WISH_LENGTH = 120;

export function collectDragonBall(foundBalls, ballNumber) {
  const collection = new Set(
    Array.isArray(foundBalls)
      ? foundBalls.filter((number) => Number.isInteger(number) && number >= 1 && number <= DRAGON_BALL_COUNT)
      : [],
  );
  const isValidBall = Number.isInteger(ballNumber) && ballNumber >= 1 && ballNumber <= DRAGON_BALL_COUNT;
  const added = isValidBall && !collection.has(ballNumber);

  if (added) collection.add(ballNumber);

  const collected = [...collection].sort((first, second) => first - second);
  return {
    foundBalls: collected,
    count: collected.length,
    added,
    completed: collected.length === DRAGON_BALL_COUNT,
  };
}

export function fulfillWish(wish) {
  if (typeof wish !== 'string') return null;

  const normalizedWish = wish.trim().slice(0, MAX_WISH_LENGTH);
  if (!normalizedWish) return null;

  return `Shenlong escucha: «${normalizedWish}». ¡Tu deseo se cumple! Las esferas salen disparadas...`;
}
