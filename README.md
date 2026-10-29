# Grant Zhang — Personal website

A personal website for Grant Zhang, a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland, with a mathematical background and an interest in practical AI products, simulation, and game AI.

Production: [zhzhg-dev.github.io](https://zhzhg-dev.github.io/)

## Pages and navigation

The three visible tabs are **About**, **Projects**, and **Contact**. They are real page links rather than controls that hide a single stacked page. The selected tab has `aria-current="page"` and an orange pill treatment; all three remain available on mobile.

- **About (`/`)** opens with the warm, illustrated studio scene and Grant’s name. Personal background, work and teaching experience, education, community involvement, and skills follow below. It is not a project catalogue.
- **Projects (`/projects/`)** contains all seven projects in a three-column cover gallery, adapting to two and then one column. Clicking a cover opens its full case in a native dialog. Demo and source destinations are separate, explicit text links.
- **Contact (`/contact/`)** provides Grant’s actual LinkedIn and GitHub destinations. It does not include a fictitious email address or a form without a working delivery mechanism.
- **Experience (`/experience/`)** remains a compatible address for existing links. It presents the complete background and selects the About navigation tab.

Folio is a working preview with public source code, not an advertised live public demo. ExplainLab is an educational systems simulator, not an AI application or production benchmark. Electricity forecasting results describe historical holdout evaluation, not operational forecasts or market advice. Public copy does not list future employment as present experience or describe Grant as seeking a role.

## Visual and interaction system

Warm ivory, charcoal, deep blue, honey and orange accents form a shared visual system. The studio illustration shares the page background and extends across the hero instead of being boxed into a card. The illustration is a generated raster asset with genuine alpha transparency, not a live 3D scene. Headings, navigation, personal copy and interaction controls remain real HTML.

Bricolage Grotesque provides display typography and Onest provides body and navigation text. Both variable fonts are self-hosted with their Open Font License files in `public/fonts/`; no external font request is needed.

The screen, mathematical board and Auckland window have native button hotspots. Each opens distinct personal content with a real related destination, a polite live region, a selected state, and a close control. Escape and closing return focus to the originating button. Fine-pointer movement is limited to 6px horizontally and 4px vertically; touch and reduced-motion settings do not receive that effect. There is no continuous autoplay animation.

Project cases support direct links such as `/projects/#explainlab`, safe handling of malformed hashes, and browser history. Opening a cover adds its case to history; closing clears the current case URL without adding a redundant history entry. The native dialog has a visible title, descriptive copy, Escape and backdrop dismissal, keyboard focus wrapping and focus restoration. All seven covers retain meaningful alternative text and intrinsic dimensions. The first row loads eagerly and later covers load lazily.

Each route retains one primary heading, skip navigation, canonical metadata, actual page addresses and visible keyboard focus.

## Technology and development

- React, TypeScript and Vite
- Custom CSS and local fonts; no Canvas or 3D runtime dependency
- Static About, Projects, Contact and compatible Experience outputs
- GitHub Actions and GitHub Pages; no backend, API key or paid-service dependency

Use Node.js 20 or newer:

```bash
npm ci
npm run dev
```

## Checks

```bash
npm run test
npm run build
npm run lint
npm run check
```

`npm run test` builds before running tests. `npm run check` also includes linting. Automated checks cover:

- All four static outputs, canonical URLs, browser metadata, local assets and font licenses.
- Three real navigation tabs, the active-tab mapping, one primary heading, and skip links.
- About’s personal facts and complete background, Contact’s actual destinations, and the absence of unsupported employment or publication claims.
- All seven project covers, meaningful labels and dimensions, separate demo/source links, and Folio’s source-only publication state.
- Case selection, native-dialog state, hash/history preservation, Escape/close behavior, focus restoration, keyboard wrapping, backdrop handling and listener cleanup.
- Actual studio hotspot callbacks, content and selected state, close/Escape focus restoration, bounded pointer movement and reduced-motion safeguards.

State tests execute production component callbacks in isolated hook fixtures. They do not emulate browser rendering, the browser’s native focus system or layout. Before publishing, inspect all primary pages on desktop and mobile, ensure the gallery and tab bar do not overflow, and verify modal, keyboard, Back/Forward and hotspot interactions in a real browser.

## Content and source

Shared personal details, navigation, experience, projects, skills, education and community information live in `src/data/profile.ts`. `StudioHome.tsx` owns the illustrated introduction; `StudioProjects.tsx` owns the gallery and case-dialog history; `App.tsx` composes the pages and navigation. Covers live in `public/projects/` and the studio illustration lives in `public/studio/`.

`shortDescription`, `decisionTitle` and `decision` provide case-study context. `coverWidth` and `coverHeight` record intrinsic image dimensions; `coverAlt` describes the screenshot or illustration. Do not add a public demo for an authenticated or unpublished workspace. Only add destinations after verifying that they are public and belong to the corresponding project.

## Deployment

`.github/workflows/deploy.yml` installs dependencies, builds `dist/`, runs the test suite and deploys through the official GitHub Pages actions on pushes to `main` or a manual workflow run. Deployment is confirmed by a successful GitHub Actions run and fresh inspection of the production pages, not by a successful local build alone.
