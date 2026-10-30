# Grant Zhang — Personal website

A personal website for Grant Zhang, a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland, with a mathematical background and an interest in practical AI products, simulation, and game AI.

Production: [zhzhg-dev.github.io](https://zhzhg-dev.github.io/)

## Pages and navigation

The three visible tabs are **About**, **Projects**, and **Contact**. They are real page links rather than controls that hide a single stacked page. The selected tab has `aria-current="page"` and an orange pill treatment; all three remain available on mobile.

- **About (`/`)** opens with the unchanged warm studio scene and Grant’s name. The lower page keeps the light studio palette, with a shorter personal introduction, current interests and one small decorative notebook illustration. Compact teaching records, aligned education entries, community work and a directly readable skills index introduce Grant without repeating the complete résumé. The full background remains available at `/experience/`. It is not a project catalogue.
- **Projects (`/projects/`)** contains all seven projects in a three-column cover gallery, adapting to two and then one column. Folio, ExplainLab and NZ Electricity Intelligence retain distinct editorial cover compositions built around actual screenshots. These three projects and L2R Autonomous Racing have structured cases. Clicking any cover opens a native dialog. Demo and source destinations are separate, explicit text links.
- **Contact (`/contact/`)** provides Grant’s actual LinkedIn and GitHub destinations. It does not include a fictitious email address or a form without a working delivery mechanism.
- **Experience (`/experience/`)** remains a compatible address for existing links. It presents the complete background and selects the About navigation tab.

Folio is a working preview with public source code, not an advertised live public demo. ExplainLab is an educational systems simulator, not an AI application or production benchmark. Electricity forecasting results describe historical holdout evaluation, not operational forecasts or market advice. L2R is a completed course-research milestone, not physical racing-car deployment. Public copy does not list future employment as present experience or describe Grant as seeking a role.

## Visual and interaction system

Warm ivory, charcoal, deep blue, honey and orange accents form a shared visual system. The studio illustration shares the page background and extends across the hero instead of being boxed into a card. The illustration is a generated raster asset with genuine alpha transparency, not a live 3D scene. Headings, navigation, personal copy and interaction controls remain real HTML.

Bricolage Grotesque provides display typography and Onest provides body and navigation text. Both variable fonts use self-hosted WOFF2 Latin subsets from the official Google Fonts distribution, with the original TTF files as secondary fallbacks and their Open Font License files in `public/fonts/`; no external font request is needed. Font preloads match the WOFF2 resources actually used by the CSS.

The hero uses a responsive `<picture>` with transparent 480, 768, 1200 and 1448px WebP variants, layout-aware `sizes`, intrinsic dimensions and a high-priority PNG fallback. Smaller screens need not download the original full-size PNG. This illustration belongs only on About. Social previews use `public/og-studio.png`, a 1200×630 composition based on the same workspace artwork.

The lower About page uses the same light visual language as the studio hero. Its small lazy-loaded notebook still life is an AI-generated decorative illustration, not a documentary photograph of Grant’s possessions or workspace. It has an empty alternative text and an assistive-technology-hidden wrapper; personal facts remain real text. The real L2R replay and its bounded caption stay on Projects. Home presents compact teaching information and links to the complete background, where responsibility details remain inspectable. All five toolkit groups are directly readable rather than hidden in separate drawers. Education and community material retain their existing facts and deep-link anchors. These presentation changes add no account, data collection or runtime dependency.

The screen, mathematical board and Auckland window have native button hotspots. The screen and window open personal notes with real related destinations, a polite live region, a selected state and a close control. The board opens the interactive curve-fitting experiment described below. Escape and closing return focus to the originating button. Fine-pointer movement is limited to 6px horizontally and 4px vertically; touch and reduced-motion settings do not receive that effect. There is no continuous autoplay animation.

### Whiteboard experiment

The whiteboard explores the difference between fitting samples and generalising to unseen examples. Visitors can move the heights of seven illustrative training points and compare a straight line, a cubic curve and a more flexible degree-six polynomial. Curves and root-mean-squared errors are computed from the actual current points, not drawn from preset animation paths. Separate check points are never passed to the fitting function. The default example shows why the closest sample fit need not give the best result on those checks; a more flexible model is not claimed to be universally worse.

The data is deterministic and synthetic. The separate check points illustrate evaluation, not a formal benchmark or evidence of real-world AI accuracy. All fitting runs locally in the browser without a remote model, API request, account or new runtime dependency. The native dialog keeps the experiment out of the default page layout; dragging has a labelled native-slider alternative, and the controls can be operated without hover or pointer gestures. Reset restores the example rather than changing the website’s personal content or project data.

### Project cases

Project cases support direct links such as `/projects/#explainlab`, safe handling of malformed hashes, and browser history. Opening a cover adds a case entry; closing returns to the existing gallery entry, so repeated visits do not accumulate duplicate gallery pages. Back and Forward restore the selected case. A first-visit or refreshed deep link closes in place rather than navigating away. Query parameters and unrelated history state are preserved; repeated close events and cover clicks during a pending traversal are guarded.

The native dialog has a visible title, descriptive copy, Escape and backdrop dismissal, keyboard focus wrapping and focus restoration. The four expanded cases separate the problem, Grant’s contribution, key decisions, evidence and limitations, and a next iteration. The remaining three projects retain their original summaries. Screenshots are presented separately from editorial cover framing; abstract illustrations are not described as real interfaces. All seven image assets retain meaningful descriptions and intrinsic dimensions; the case-trigger button provides the accessible name for its decorative composition. The first gallery row loads eagerly and later covers load lazily.

L2R keeps the existing `/projects/#learn-to-race` address rather than creating a duplicate project. The milestone covers the five-person COMPSCI 760 study “Training-Track Diversity for Zero-Shot Autonomous Racing: Comparing PPO and SAC”, with experiments, final report and presentation completed by 31 October 2026. Grant’s individual work was 10 SAC training runs (approximately 20 million environment steps), the final report’s Related Work section, and presentation narrative and slide organisation. The full 48-run study and its findings are team results. All evaluations, including the real-circuit maps, were F1TENTH simulations; mean fractional-lap progress is not full-lap success rate. Algorithm comparisons remain configuration- and seed-dependent. Final grades and an IEEE publication are not claimed. The team source repository is [Group-4-COMPSCI760](https://github.com/TipperChristopher/Group-4-COMPSCI760); no public live driving demo is advertised. Its real replay comparison cover preserves both tracks with `coverFit: "contain"`; the caption identifies Grid A, seed 1, simulation-only scope and the difference between a selected replay and aggregate performance.

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

### Optional artwork regeneration

Optimized artwork is checked in, so normal installation, builds and GitHub Pages CI do not require an image-processing dependency. To regenerate the WebP variants and social card, `scripts/prepare-studio-assets.mjs` needs the optional local package `sharp`. It is not a website/runtime dependency. The script can resolve a local installation normally, or use an existing tooling directory through `PORTFOLIO_ASSET_NODE_MODULES`:

```powershell
$env:PORTFOLIO_ASSET_NODE_MODULES = 'C:\path\to\asset-tools\node_modules'
node scripts/prepare-studio-assets.mjs
```

The directory must contain an installed `sharp` package and its native dependencies; replace the example with your actual path. The script reads the original transparent PNG and local TTF fonts, then recreates the four WebPs and `og-studio.png`. It does not download or regenerate the Google Fonts WOFF2 subsets. Any compression figures are comparisons of asset file bytes, not Lighthouse results or measured page-load improvements.

## Checks

```bash
npm run test
npm run build
npm run lint
npm run check
```

`npm run test` builds before running tests. `npm run check` also includes linting. Automated checks cover:

- All four static outputs, canonical URLs, browser metadata, local assets and font licenses.
- Responsive hero candidates and PNG fallback, real WebP dimensions and smaller file sizes, valid WOFF2 files and production preloads, and matching 1200×630 social-preview metadata.
- Three real navigation tabs, the active-tab mapping, one primary heading, and skip links.
- About’s personal facts and compact background, the complete compatible Experience record, Contact’s actual destinations, and the absence of unsupported employment or publication claims.
- The unchanged single-image hero, one lazy decorative notebook illustration, compact teaching records and complete responsibility details, directly readable toolkit groups, unique identifiers and retained section-link destinations.
- All seven project covers, meaningful labels and dimensions, separate demo/source links, and Folio’s source-only publication state.
- Complete structured cases for Folio, ExplainLab, NZ Electricity Intelligence and L2R, evidence/limitation boundaries and original-summary fallbacks for the remaining three.
- L2R’s milestone status, retained deep link, team-versus-personal contribution boundaries, simulation-only evaluation, fractional-lap interpretation and source-only publication state.
- Case selection, native-dialog state, query/history preservation, Escape/close behavior, focus restoration, keyboard wrapping, backdrop handling and listener cleanup. History fixtures include an actual entry stack with queued traversal, repeated opens/closes, Back/Forward, first-visit and refreshed deep links, and rapid interactions while closing.
- Actual studio hotspot callbacks, content and selected state, close/Escape focus restoration, bounded pointer movement and reduced-motion safeguards.
- Actual polynomial fitting, deterministic and separate training/check data, unchanged inputs, finite results across endpoint and degenerate cases, and interactive whiteboard controls and dialog lifecycle.

State tests execute production component callbacks in isolated hook fixtures. They do not emulate browser rendering, the browser’s native focus system or layout, and file-size comparisons are not a measured performance score. Before publishing, inspect all primary pages on desktop and mobile, ensure the gallery and tab bar do not overflow, and verify modal, keyboard, Back/Forward, reduced-motion, touch and hotspot interactions in a real browser.

## Content and source

Shared personal details, navigation, experience, projects, skills, education and community information live in `src/data/profile.ts`. `StudioHome.tsx` owns the illustrated introduction and hotspots; `StudioAbout.tsx` owns the lower personal introduction, current interests and decorative notebook still life; `StudioBackground.tsx` presents compact background information on Home and the complete record on the compatible Experience route through its optional `compact` prop. `WhiteboardExperiment.tsx` owns the whiteboard dialog and controls, backed by the pure fitting functions in `src/lib/whiteboard-model.ts`; `ProjectCover.tsx` owns the first three editorial screenshot compositions; `StudioProjects.tsx` owns the gallery and case-dialog history; `App.tsx` composes the pages and navigation. Original covers live in `public/projects/` and responsive studio assets live in `public/studio/`.

`cardSummary` provides the one-line gallery description. Optional `caseStudy` data contains `problem`, `contribution`, `decisions`, `evidence` and `next`; decision/evidence items each have a `title` and `body`. `shortDescription`, `decisionTitle` and `decision` remain available for compact or older cases. `coverWidth` and `coverHeight` record intrinsic image dimensions; `coverAlt` describes the actual screenshot or illustration. Optional `coverCaption` supplies precise figure context and `coverFit` preserves comparison assets that must not be cropped. Keep evaluation results tied to their horizon, holdout period and baseline. Do not add a public demo for an authenticated or unpublished workspace. Only add destinations after verifying that they are public and belong to the corresponding project.

## Deployment

The user requested publication of the current lower-About refinement on 31 October 2026. Browser interaction remains deferred at the user's request: verification for this revision covers the build, automated regressions and production resources, not a new desktop/mobile visual audit. Passing automated checks is not a visual-quality assessment.

`.github/workflows/deploy.yml` installs dependencies, builds `dist/`, runs the test suite and deploys through the official GitHub Pages actions on pushes to `main` or a manual workflow run. Deployment is confirmed by a successful GitHub Actions run and fresh inspection of the production pages, not by a successful local build alone.
