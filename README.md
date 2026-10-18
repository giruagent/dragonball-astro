# Dragon Ball Fan Tribute

A static Astro landing page celebrating the Dragon Ball universe. It includes responsive character cards, the seven Dragon Balls, an accessible trivia quiz, and an interactive Shenron wish picker.

## Requirements

- Node.js 22.22 or newer
- npm

## Local development

```sh
npm ci
npm run dev
```

Astro serves the site at `http://localhost:4321` by default.

## Checks

```sh
npm test
npm run build
```

## Project structure

```text
src/
├── components/
│   ├── DragonBalls.astro
│   ├── LoreSections.astro
│   ├── QuizSection.astro
│   ├── SiteHeader.astro
│   ├── WarriorCard.astro
│   └── WishSection.astro
├── pages/index.astro
├── scripts/
│   ├── quiz-logic.js
│   ├── site.js
│   └── wish-logic.js
└── styles/global.css
test/
├── quiz-logic.test.js
└── wish-logic.test.js
```

This is a fan-made, unofficial tribute. Dragon Ball and its characters belong to their respective creators and rights holders.
