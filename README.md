# Grant — Personal website

A personal website for Grant Zhang, a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland, with a mathematical background and an interest in practical AI products, simulation, and game AI.

Production: [zhzhg-dev.github.io](https://zhzhg-dev.github.io/)

## Chinese and English

The entry page defaults to English. The shared 中文 / EN switch is available in the header and inside the project and whiteboard dialogs. Grant is the displayed name in both languages; project identities and technical stacks stay in English. All navigation, background copy, seven project descriptions, four complete case studies, controls, accessible labels and image descriptions are localised—not only the menu labels.

An explicit `?lang=zh` opens the Chinese version after a visitor chooses 中文. Internal page links carry that choice, and refreshing the current Chinese URL keeps it. A fresh address without a valid language query always opens in English, even if an earlier version saved a Chinese preference in localStorage. Language selection no longer reads or writes browser storage. Project hashes and unrelated query parameters are retained. Language switching does not remount the interactive scene, reset whiteboard data, or close an open project case. Case history ownership ignores only the language parameter.

`src/i18n.tsx` contains language selection, context and internal-link helpers. Component copy uses `t(english, chinese)`; the larger Chinese content overlays are `src/data/projects.zh.ts` and `src/data/background.zh.ts`, with original factual records retained in `profile.ts`. `bilingual.css` tunes Chinese type scale, line height and the mobile two-row header. Selected Chinese section titles use a self-hosted Resource Han Rounded CN Medium subset with softly rounded strokes; body text and smaller headings use Noto Sans SC with genuine variable weights 400–600. English project names and Grant keep the original Latin typography. Chinese headings do not inherit the English bold weights or negative tracking. The compact CJK-only WOFF2 files use `font-display: swap` and are not preloaded on the English entrance. System fonts remain fallbacks. See `public/fonts/chinese/README.md` for pinned official sources, original open licences and subset reproduction; normal builds need no font tooling. The static HTML and crawler/social metadata default to English. Browser document language, title and description switch at runtime; the query variants do not advertise separate static-language SEO pages.

Rollback baseline for this typography and background update: `5e0de73d6de3b1ec72c742cd0edd7634f0cbab17`.

## Pages and navigation

The three visible tabs are **About**, **Projects**, and **Contact**. They are real page links rather than controls that hide a single stacked page. The selected tab has `aria-current="page"` and a sage pill treatment; all three remain available on mobile.

- **About (`/`)** opens with an original cozy studio illustration and Grant’s name. A short personal introduction leads into current interests, a compact work and education timeline, and volunteering. The complete background remains available at `/experience/`.
- **Projects (`/projects/`)** leads with Folio’s full workspace screenshot and a brief explanation of how it handles evidence. Six more projects follow in a cover gallery that adapts from three columns to two and then one. A bilingual paper label identifies the technical type on each cover, the card gives a one-line purpose, and the case retains the full type and focus. ExplainLab and NZ Electricity Intelligence retain editorial covers built around real screenshots. The five toolkit groups follow the gallery. Every cover has a visible “View details” action that opens a native dialog; demo and source destinations remain separate, explicit text links.
- **Contact (`/contact/`)** provides Grant’s actual LinkedIn and GitHub destinations. It does not include a fictitious email address or a form without a working delivery mechanism.
- **Experience (`/experience/`)** remains a compatible address for existing links. It presents the complete background and selects the About navigation tab. An in-page index leads directly to work, education and volunteering.

Folio is a working preview with public source code, not an advertised live public demo. ExplainLab is an educational systems simulator, not an AI application or production benchmark. Electricity forecasting results describe historical holdout evaluation, not operational forecasts or market advice. L2R is a completed course-research milestone, not physical racing-car deployment. Public copy does not list future employment as present experience or describe Grant as seeking a role.

The work timeline lists the teaching assistantship through its scheduled 16 November 2026 end. The Tencent / LIGHTSPEED STUDIOS internship is shown as scheduled to start that day; its description gives the posted focus, not claimed experience or outcomes. The teaching and Luoyang TV records use a situation/task/action/result format. The TV engagement numbers describe one credited WeChat Channels post at the time of capture, not personal performance. Education lists selected coursework and undergraduate honours without showing GPA. Volunteering highlights the National Outstanding Team recognition for the 2022 Hongyuan trip and records the separate 2021 Xiangcheng trip. The two entries link to the School of Mathematics’ [Hongyuan report](https://sxxy.swun.edu.cn/info/1052/1327.htm) and [Xiangcheng report](https://sxxy.swun.edu.cn/info/1052/1413.htm). Grant’s authorship is attributed to the Hongyuan report only.

## Visual and interaction system

Cream, woodland ink, sage and honey orange form a shared visual system. The original rounded studio illustration shares the page background instead of being boxed into a card. It is an AI-generated raster asset with genuine alpha transparency, not a live 3D scene or a photograph of Grant. Headings, navigation, personal copy and interaction controls remain real HTML. See `docs/cozy-studio-design.md` for this release's direction and rollback baseline.

Bricolage Grotesque provides display typography and Onest provides body and navigation text. Both variable fonts use self-hosted WOFF2 Latin subsets from the official Google Fonts distribution, with the original TTF files as secondary fallbacks and their Open Font License files in `public/fonts/`; no external font request is needed. Font preloads match the WOFF2 resources actually used by the CSS.

The hero uses a responsive `<picture>` with transparent 480, 768, 1200 and 1448px WebP variants, layout-aware `sizes`, intrinsic dimensions and a high-priority PNG fallback. A matching home-only preload lets browsers discover the image before React renders. Smaller screens need not download the original full-size PNG. This illustration belongs only on About. Social previews use `public/og-studio.png`, a 1200×630 composition based on the same workspace artwork.

The lower About page uses the same light visual language as the studio hero, with soft paper tones and a compact work/education journey. The real L2R replay and its bounded caption stay on Projects. Home links to the complete background, where work details can be read or collapsed. All five toolkit groups are directly readable on Projects rather than hidden in separate drawers. Education and community keep their deep-link anchors. These presentation changes add no account, data collection or runtime dependency.

The screen, mathematical board and Auckland window have native button hotspots. The screen and window open personal notes with real related destinations, a polite live region, a selected state and a close control. The window note shows Auckland’s local date and time using the browser’s `Pacific/Auckland` time zone, including daylight saving. Its minute timer runs only while open; it makes no network requests and does not store preferences. The board and the visible “Try the whiteboard” button open the same interactive curve-fitting experiment. Escape and closing return focus to the originating button. Fine-pointer movement is limited to 6px horizontally and 4px vertically; touch and reduced-motion settings do not receive that effect. There is no continuous autoplay animation.

Daylight and Golden hour are explicit, mutually exclusive colour controls for the illustration, not a simulated live weather feed. They do not close a workspace note or store a preference. Unsupported cross-document View Transitions were removed after browser verification exposed transition-abort errors; normal page navigation and the actual user-triggered scene interactions remain intact.

### Whiteboard experiment

The whiteboard explores the difference between fitting samples and generalising to unseen examples. Visitors can move the heights of seven illustrative training points and compare a straight line, a cubic curve and a more flexible degree-six polynomial. Curves and root-mean-squared errors are computed from the actual current points, not drawn from preset animation paths. Separate check points are never passed to the fitting function. The default example shows why the closest sample fit need not give the best result on those checks; a more flexible model is not claimed to be universally worse.

The data is deterministic and synthetic. The separate check points illustrate evaluation, not a formal benchmark or evidence of real-world AI accuracy. All fitting runs locally in the browser without a remote model, API request, account or new runtime dependency. The native dialog keeps the experiment out of the default page layout; dragging has a labelled native-slider alternative, and the controls can be operated without hover or pointer gestures. Reset restores the example rather than changing the website’s personal content or project data.

### Project cases

Project cases support direct links such as `/projects/#explainlab`, safe handling of malformed hashes, and browser history. Opening a cover adds a case entry; closing returns to the existing gallery entry, so repeated visits do not accumulate duplicate gallery pages. Back and Forward restore the selected case. A first-visit or refreshed deep link closes in place rather than navigating away. Query parameters and unrelated history state are preserved; repeated close events and cover clicks during a pending traversal are guarded.

The native dialog has a visible title, descriptive copy, Escape and backdrop dismissal, keyboard focus wrapping and focus restoration. The four expanded cases separate the problem, Grant’s contribution, key decisions, evidence and limitations, and a next iteration. The remaining three projects pair a short card description with their original case overview. Screenshots are presented separately from editorial cover framing; abstract illustrations are not described as real interfaces. All seven image assets retain meaningful descriptions and intrinsic dimensions; the case-trigger button provides the accessible name for its decorative composition. Folio’s lead screenshot loads at high priority; the six gallery covers use native lazy loading.

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
- Chinese and English rendering across all four routes, Grant-only displayed identity, complete project translations, language persistence without storage, and language changes preserving project/whiteboard state.
- Responsive hero candidates and PNG fallback, real WebP dimensions and smaller file sizes, valid WOFF2 files and production preloads, and matching 1200×630 social-preview metadata.
- Three real navigation tabs, the active-tab mapping, one primary heading, and skip links.
- About’s personal facts and compact background, the complete compatible Experience record, Contact’s actual destinations, and the absence of unsupported employment or publication claims.
- One responsive illustrated hero, user-triggered colour choices, compact teaching records and complete responsibility details, directly readable toolkit groups, unique identifiers and retained section-link destinations.
- All seven project covers, meaningful labels and dimensions, separate demo/source links, and Folio’s source-only publication state.
- Complete structured cases for Folio, ExplainLab, NZ Electricity Intelligence and L2R, evidence/limitation boundaries and original-summary fallbacks for the remaining three.
- L2R’s milestone status, retained deep link, team-versus-personal contribution boundaries, simulation-only evaluation, fractional-lap interpretation and source-only publication state.
- Case selection, native-dialog state, query/history preservation, Escape/close behavior, focus restoration, keyboard wrapping, backdrop handling and listener cleanup. History fixtures include an actual entry stack with queued traversal, repeated opens/closes, Back/Forward, first-visit and refreshed deep links, and rapid interactions while closing.
- Actual studio hotspot callbacks, content and selected state, close/Escape focus restoration, bounded pointer movement and reduced-motion safeguards.
- Actual polynomial fitting, deterministic and separate training/check data, unchanged inputs, finite results across endpoint and degenerate cases, and interactive whiteboard controls and dialog lifecycle.

State tests execute production component callbacks in isolated hook fixtures. They do not emulate browser rendering, the browser’s native focus system or layout, and file-size comparisons are not a measured performance score. Before publishing, inspect all primary pages on desktop and mobile, ensure the gallery and tab bar do not overflow, and verify modal, keyboard, Back/Forward, reduced-motion, touch and hotspot interactions in a real browser.

## Content and source

Shared personal details, navigation, experience, projects, skills, education and community information live in `src/data/profile.ts`. `StudioHome.tsx` owns the illustrated introduction, colour choices and hotspots; `StudioAbout.tsx` owns the personal introduction and current interests; `StudioBackground.tsx` presents compact background information on Home and the complete record on the compatible Experience route through its optional `compact` prop. `cozy-studio.css` unifies the palette and primary page presentation. `WhiteboardExperiment.tsx` owns the whiteboard dialog and controls, backed by the pure fitting functions in `src/lib/whiteboard-model.ts`; `ProjectCover.tsx` owns the gallery covers; `StudioProjects.tsx` owns the Folio feature, gallery and case-dialog history; `App.tsx` composes the pages and navigation. Original covers live in `public/projects/` and responsive studio assets live in `public/studio/`.

`cardSummary` provides the one-line gallery description. Optional `caseStudy` data contains `problem`, `contribution`, `decisions`, `evidence` and `next`; decision/evidence items each have a `title` and `body`. `shortDescription`, `decisionTitle` and `decision` remain available for compact or older cases. `coverWidth` and `coverHeight` record intrinsic image dimensions; `coverAlt` describes the actual screenshot or illustration. Optional `coverCaption` supplies precise figure context and `coverFit` preserves comparison assets that must not be cropped. Keep evaluation results tied to their horizon, holdout period and baseline. Do not add a public demo for an authenticated or unpublished workspace. Only add destinations after verifying that they are public and belong to the corresponding project.

## Deployment

The user authorised this cozy-studio revision and direct publication on 3 November 2026. Background-browser verification covers the desktop layout, 390px and 320px mobile layouts, scene notes and focus restoration, colour choices, whiteboard fitting and slider controls, project-case history, cover loading and contact destinations. Automated checks remain separate from visual-quality assessment. The previous production baseline is `aaa5e7e0c101994cf29a6b243817488edf1396d0`; history is preserved for a later user-requested rollback.

`.github/workflows/deploy.yml` installs dependencies, builds `dist/`, runs the test suite and deploys through the official GitHub Pages actions on pushes to `main` or a manual workflow run. Deployment is confirmed by a successful GitHub Actions run and fresh inspection of the production pages, not by a successful local build alone.
