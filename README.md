# Grant Zhang — Portfolio

A personal, three-page website for Grant Zhang, a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland, with a mathematical background and an interest in practical AI products, simulation, and game AI.

Production: [zhzhg-dev.github.io](https://zhzhg-dev.github.io/)

## Page responsibilities

- **Home (`/`)** introduces Grant: his mathematical background, teaching, current interests, and ways to connect. It contains no project screenshots, project selector, or case-study list. Large text links lead to the separate Experience and Projects pages.
- **Experience (`/experience/`)** brings together work history, education, community involvement, and the working toolkit.
- **Projects (`/projects/`)** contains three main cases—Folio, ExplainLab, and NZ Electricity Intelligence—and four compact archive entries. Each published destination belongs to its project; cases without a public release remain honest summaries.

Folio is a working preview with public source code, not an advertised public live demo. ExplainLab is an educational systems simulator, not an AI application or a production benchmark. Electricity forecasting results describe historical holdout evaluation, not operational forecasts or market advice. Public copy does not present future employment as current experience or describe Grant as seeking a role.

## Visual and interaction system

The design uses a white background, deep navy-blue emphasis, generous spacing, and a large personal wordmark. Home is an introduction to a person, not a project dashboard. The supporting pages use a quieter layout so that detailed evidence and background remain easy to read.

`SignatureField` draws a two-dimensional interference field from 48 closed, parametric SVG curves. It is an abstract drawing rather than a letter or logo mask. Its **Think**, **Build**, and **Explain** buttons move between tightly rotated contours, aligned geometry, and more open curves; clicking or tapping the drawing cycles the same modes. The controls are native buttons with a single pressed state, keyboard support, and a linked text description. The decorative SVG is hidden from assistive technology. There is no Canvas renderer, mesh, perspective, or simulated three-dimensional lighting or shadow.

The complete signature is already present in the initial markup. Mounting synchronizes its paths once, without an entrance animation or idle frame loop. Mode changes interpolate the lines over 620 ms, then stop. Fine-pointer movement gently deforms the planar curves and returns them to rest; touch users retain the tap and mode-button controls without hover motion. Reduced-motion preferences update forms without animation, while off-screen and background states suspend updates. The SVG viewBox scales with its container; no raster pixel-ratio management is needed. Observers, event listeners, and pending frames are cleaned up when the component unmounts.

A separate personal-interest control switches between **AI products**, **Game AI**, and **Making it clear**. These are statements about Grant's current focus, not project filters. Neither control changes the site's three-page information architecture.

On Projects, the three main cases and four archive entries share `ProjectPreview`. Project covers keep their intrinsic dimensions and load lazily; the archive includes both interface screenshots and descriptive illustrations. Image buttons open native modal dialogs; demo and source links remain explicit, separate text actions. Dialogs support Escape, outside-click dismissal, focus restoration, and an **Open original image** link for full-resolution inspection. The archive stays compact, with implementation details available in native disclosure controls.

The responsive navigation supports Escape, focus return, and keyboard cycling on narrow screens. Each page retains one primary heading, a skip link, actual route addresses, and visible keyboard focus.

## Technology

- React and TypeScript
- Vite with three static page entry points
- Custom CSS and responsive inline SVG; no Canvas or 3D runtime dependency
- GitHub Actions and GitHub Pages

The deployed site has no backend, database, API key, or paid-service dependency.

## Local development

Use Node.js 20 or newer.

```bash
npm ci
npm run dev
```

## Checks

```bash
npm run lint
npm run test
npm run build
npm run check
```

`npm run check` runs linting, the production build, and the test suite. `npm run test` also builds before testing.

Production-output tests cover the three page entries, canonical addresses, light browser metadata, public assets, project URLs, accuracy-sensitive copy, and the official GitHub Pages deployment workflow. Component-rendering tests cover:

- Home's personal content and the absence of project screenshots, project selectors, and case lists.
- The SVG signature's complete server-rendered paths, accessible mode controls, and accompanying description.
- Separate page responsibilities, real navigation links, one primary heading, and skip navigation.
- Three main project cases, four archive entries, explicit demo/source destinations, and Folio's source-only publication state.
- Native screenshot-dialog structure, unique IDs, titles, expand/close controls, image dimensions, lazy loading, and original-image links.
- Experience's work, education, community, and skills content, and the boundaries on public employment claims.

Engine tests execute the actual SVG path builder and update logic in an isolated substitute environment. They check 48 finite, valid, closed two-dimensional curves; distinct modes and intermediate forms; zero entrance RAF; settled and interrupted mode transitions; reduced motion without replaying a completed form when preferences change; background/off-screen suspension; fine/coarse-pointer behavior; and complete observer/listener cleanup. The substitute path elements retain their real `d` updates, so these tests verify geometry changes and scheduling, not browser rendering fidelity. A regression guard prevents reintroducing a raster renderer or simulated 3D effects into the signature.

The old `HeroWorkbench` remains an isolated component with regression tests for its original selection and URL handling. It is not imported by the current App, and its `workbench` query parameter does not add a project gallery to Home.

The render tests do not substitute for browser QA. Before publishing, verify all three routes on desktop and mobile, the signature and interest controls, mouse/keyboard/touch interaction, reduced motion, and opening/closing screenshot dialogs with focus returning to the correct trigger.

## Updating content

Shared personal details, navigation, experience, projects, skills, education, and community information live in `src/data/profile.ts`. Homepage narrative and page composition live in `src/App.tsx`. Project covers live in `public/projects/`.

The `featured` project flag selects the main cases on Projects; it does not add content to Home. `shortDescription`, `decisionTitle`, and `decision` supply case-study context. `coverWidth` and `coverHeight` record intrinsic image dimensions, and `coverAlt` describes the screenshot or illustration. Folio and ExplainLab use real interface screenshots, including the landscape ExplainLab cover.

Keep personal-home content separate from the project catalogue. Only add a demo or source destination after verifying that it is public and belongs to the matching project. Do not add unsupported outcomes, future work as present employment, or a public demo for an authenticated workspace.

## Deployment

`.github/workflows/deploy.yml` installs dependencies, builds `dist/`, runs the test suite, and deploys with the official GitHub Pages actions on a push to `main` or a manual workflow run. The workflow uses the repository's GitHub Pages environment; no third-party deployment token is required.

Run the checks and inspect the finished pages before pushing the intended changes. Deployment is confirmed by the successful GitHub Actions run and a fresh inspection of the production URLs, not by a successful local build alone.
