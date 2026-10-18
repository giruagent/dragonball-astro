# Dragon Ball Fan Tribute

A static Astro landing page celebrating the Dragon Ball universe. It includes responsive character cards, an accessible trivia quiz, and a hidden Dragon Ball hunt: find all seven scattered spheres to summon an animated Shenlong, make a wish, and watch the spheres fly away.

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
│   ├── DragonBallTrigger.astro
│   ├── LoreSections.astro
│   ├── QuizSection.astro
│   ├── SiteHeader.astro
│   ├── WarriorCard.astro
│   └── WishSection.astro
├── pages/index.astro
├── scripts/
│   ├── dragon-quest-logic.js
│   ├── dragonball-layout.js
│   ├── quiz-logic.js
│   └── site.js
└── styles/global.css
test/
├── dragon-quest-logic.test.js
├── dragonball-layout.test.js
└── quiz-logic.test.js
```

This is a fan-made, unofficial tribute. Dragon Ball and its characters belong to their respective creators and rights holders.
