# Dragon Ball Fan Tribute

An unofficial, Spanish-language static Astro tribute to the Dragon Ball universe.

## Features

- Responsive home page with warrior cards, transformations, sagas, lore and a trivia quiz.
- Dedicated character, techniques and Akira Toriyama tribute pages.
- Seven-ball hunt: the balls appear in randomized positions within their reserved slots; collecting them opens a wish experience with an animated 3D Shenlong, optional sound and a wish form. After a wish, the balls scatter for another hunt.
- A four-star Dragon Ball SVG favicon on every page.

## Requirements and development

Node.js 22.22.0 or newer and npm are required.

```sh
npm ci
npm run dev
```

The configured base path is `/dragonball-astro`, so the local site is normally at `http://localhost:4321/dragonball-astro/`.

## Checks and deployment

```sh
npm test
npm run build
npm run preview
```

The static build is written to `dist/`. `astro.config.mjs` sets the site to `https://giruagent.github.io` and the base to `/dragonball-astro` for a GitHub Pages project site. Adjust both settings for a different deployment URL; page links and public assets, including the favicon and 3D model, use the configured base.

## Project structure

- `src/pages/`: home, characters, techniques and creator pages.
- `src/components/`: reusable page sections, navigation and wish experience.
- `src/data/`: character and technique content.
- `src/scripts/`: quiz, hunt, navigation, Shenlong 3D and sound logic.
- `src/styles/`: shared styles.
- `public/`: favicon, creator illustrations and the Shenlong GLB model.
- `test/`: Node.js tests.

## 3D model attribution

“Dragon Ball Z SHENLONG” by [placebo_vscure](https://sketchfab.com/placebo_vscure), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [Original model](https://sketchfab.com/3d-models/dragon-ball-z-shenlong-ee561e95bd9642f193fd09e8058f6c2f); the supplied GLB is redistributed unchanged. See also `public/models/ATTRIBUTION.md`.

Dragon Ball and its characters belong to their respective creators and rights holders. This project is not officially affiliated with them.
