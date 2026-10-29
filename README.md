# Grant Zhang — Portfolio

A personal, three-page website for Grant Zhang, a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland, with a mathematical background and an interest in practical AI products, simulation, and game AI.

Production: [zhzhg-dev.github.io](https://zhzhg-dev.github.io/)

## Page responsibilities

- **Home (`/`)** introduces Grant through typography and personal narrative: his mathematical background, teaching, current interests, and ways to connect. It contains no decorative illustration, project screenshots, project selector, or case-study list. Large text links lead to the separate Experience and Projects pages.
- **Experience (`/experience/`)** brings together work history, education, community involvement, and the working toolkit.
- **Projects (`/projects/`)** contains a three-case text index—Folio, ExplainLab, and NZ Electricity Intelligence—and four compact archive entries. Native disclosures reveal the main cases; each published destination belongs to its project, and cases without a public release remain honest summaries.

Folio is a working preview with public source code, not an advertised public live demo. ExplainLab is an educational systems simulator, not an AI application or a production benchmark. Electricity forecasting results describe historical holdout evaluation, not operational forecasts or market advice. Public copy does not present future employment as current experience or describe Grant as seeking a role.

## Visual and interaction system

The design uses a white background, deep navy-blue text, an oversized full-width name, and an asymmetric editorial layout. Bricolage Grotesque supplies the display typography, with Onest for body text and navigation. Both variable fonts are self-hosted with their Open Font License files in `public/fonts/`; no external font request is required. Home is an introduction to a person, not a project dashboard or a decorative graphic.

`PersonalHome` uses three large text controls: **I build.**, **I think.**, and **I explain.** They change the heading and paragraph in one shared reading region; **I build.** is selected initially. Native buttons support mouse, keyboard, and touch, expose one pressed state, and reference the region they control. The region announces changes politely. These are personal perspectives, not project filters, and there is no autoplay, Canvas, SVG sculpture, or logo illustration.

Short text and underline transitions support the interaction without continuous motion. Reduced-motion styles remove the animated transition and retain a visible selected state. The layout changes to a single-column reading order on narrow screens.

On Projects, the first main case is expanded by default. Each large title is a native disclosure summary, with no nested link or button. Choosing another case opens it and updates the URL hash; closing it records a collapsed state. Valid project hashes, hash changes, and browser history restore the matching case. Demo and source links remain visible outside the disclosure. Nested implementation details provide additional context without overwhelming the index.

On Projects, the three main cases and four archive entries share `ProjectPreview`. Project covers keep their intrinsic dimensions and load lazily; the archive includes both interface screenshots and descriptive illustrations. Image buttons open native modal dialogs; demo and source links remain explicit, separate text actions. Dialogs support Escape, outside-click dismissal, focus restoration, and an **Open original image** link for full-resolution inspection. The archive stays compact, with implementation details available in native disclosure controls.

The responsive navigation supports Escape, focus return, and keyboard cycling on narrow screens. Each page retains one primary heading, a skip link, actual route addresses, and visible keyboard focus.

## Technology

- React and TypeScript
- Vite with three static page entry points
- Custom CSS and self-hosted variable fonts; no Canvas or 3D runtime dependency
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

- Home's personal content and the absence of decorative graphics, project screenshots, project selectors, and case lists.
- The three narrative buttons, their selected state, shared reading region, and distinct personal explanations.
- Separate page responsibilities, real navigation links, one primary heading, and skip navigation.
- Three main project disclosures, the initially expanded case, safe hash-link handling, four archive entries, explicit demo/source destinations, and Folio's source-only publication state.
- Native screenshot-dialog structure, unique IDs, titles, expand/close controls, image dimensions, lazy loading, and original-image links.
- Experience's work, education, community, and skills content, and the boundaries on public employment claims.

Interaction tests execute the production components' actual event handlers in isolated hook-state fixtures. They verify that all three narrative controls change the text, and that project disclosures preserve query parameters and unrelated history state, reopen the requested case, retain an intentionally collapsed index, and clean up history listeners. The fixtures do not emulate browser layout, native focus behavior, or rendering fidelity.

The tests do not substitute for browser QA. Before publishing, verify all three routes on desktop and mobile, text-control mouse/keyboard/touch interaction, reduced motion, case-summary activation, direct project hashes, Back/Forward navigation, and opening/closing image dialogs with focus returning to the correct trigger.

## Updating content

Shared personal details, navigation, experience, projects, skills, education, and community information live in `src/data/profile.ts`. Homepage narrative and text interaction live in `src/components/PersonalHome.tsx`; shared navigation and page composition live in `src/App.tsx`. `FeaturedWork.tsx` owns the main case disclosures and history handling. Project covers live in `public/projects/`.

The `featured` project flag selects the main cases on Projects; it does not add content to Home. `shortDescription`, `decisionTitle`, and `decision` supply case-study context. `coverWidth` and `coverHeight` record intrinsic image dimensions, and `coverAlt` describes the screenshot or illustration. Folio and ExplainLab use real interface screenshots, including the landscape ExplainLab cover.

Keep personal-home content separate from the project catalogue. Only add a demo or source destination after verifying that it is public and belongs to the matching project. Do not add unsupported outcomes, future work as present employment, or a public demo for an authenticated workspace.

## Deployment

`.github/workflows/deploy.yml` installs dependencies, builds `dist/`, runs the test suite, and deploys with the official GitHub Pages actions on a push to `main` or a manual workflow run. The workflow uses the repository's GitHub Pages environment; no third-party deployment token is required.

Run the checks and inspect the finished pages before pushing the intended changes. Deployment is confirmed by the successful GitHub Actions run and a fresh inspection of the production URLs, not by a successful local build alone.
