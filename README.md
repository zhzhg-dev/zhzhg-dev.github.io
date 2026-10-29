# Grant Zhang — Portfolio

A responsive, multi-page professional portfolio for Grant Zhang: an AI product builder connecting user needs, prototypes, and evaluation, with a foundation in mathematics and an interest in game AI.

## Pages

- Home — personal introduction with the GZ orbit, a full-width project showcase below the opening section, background, and contact
- Experience — work history, academic foundation, leadership, and technical toolkit
- Projects — three detailed cases and four compact archive projects, with verified live demos and public source links where available

The homepage features Folio, ExplainLab, and NZ Electricity Intelligence. Folio is an open-source working preview; its hosted workspace currently requires authentication, so the portfolio links to its source rather than presenting a public demo. ExplainLab is an educational systems simulator, not an AI application or production benchmark.

Profile and contact copy focus on building products, collaboration, and exchanging ideas. Current teaching and study remain in Experience. No future employment is represented as current experience.

## Technology

- Vite
- React
- TypeScript
- Custom CSS
- GitHub Actions and GitHub Pages

The site is fully static. It has no backend, database, API key, or paid service dependency.

## Local development

Use Node.js 20 or newer.

```bash
npm ci
npm run dev
```

## Quality checks

```bash
npm run lint
npm run test
npm run build
npm run check
```

The test suite verifies all three page outputs, public project links, cover assets, metadata, accuracy-sensitive wording, and the GitHub Pages workflow. Component-rendering tests cover the workbench's server-rendered default, deep links, invalid parameters, selected state, and real project destinations.

## Visual system

The original navy/cyan palette, outlined surname, grid, and GZ orbital composition remain the identity. The orbit is an inline vector drawing with calibrated ticks, elliptical paths, and restrained lighting; it has one short entrance instead of an endless loop. The display face keeps the original Segoe UI character, while Onest is self-hosted for readable supporting text in `public/fonts/`, with its SIL Open Font License included. The font source is the [Google Fonts Onest directory](https://github.com/google/fonts/tree/main/ofl/onest).

The homepage keeps the personal introduction and GZ orbit in the opening section. The next section contains a full-width project showcase: three selection buttons above project context on the left and a complete real screenshot on the right. Project context includes the full name, the problem, a specific design decision, technologies, and available demo/source links. Screenshots fit inside the media area without cropping and load lazily because the showcase sits below the first screen.

Selecting a project updates `?workbench=folio`, `?workbench=explainlab`, or `?workbench=nz-electricity-forecasting`; browser back/forward restores the selection. Selection buttons expose their pressed state. A polite live region announces the changed project context without repeating the screenshot, technology list, or links. The Projects page presents the cases in more detail. Motion respects reduced-motion preferences.

On narrow screens, the selected screenshot appears before the project explanation. A shared `ProjectPreview` component lets visitors expand real screenshots from Home and the three detailed project cases. It uses a native modal dialog, keeps background content inert, supports Escape and outside-click dismissal, and restores focus to the specific trigger. The close control remains visible on short screens; an original-image link is available for full-resolution inspection. Demo and source links remain separate from image actions. Home also links directly to each project case.

The inner-page headers echo the homepage's orbital geometry with static, low-contrast linework. In-page links lead to actual project cases or experience sections without expanding the primary navigation. Supporting marks use the same circular GZ geometry, and the chronological work history has a restrained vertical rail.

The mobile menu supports Escape, focus return, and keyboard cycling; its content can scroll on short landscape screens. All pages retain standalone addresses, skip navigation, explicit image dimensions, and visible keyboard focus.

## Updating content

Personal details, experience, projects, skills, education, and community information are stored in `src/data/profile.ts`. Project cover images are stored in `public/projects/`.

Project totals, live-demo counts, and public-repository counts are derived from project data. The `featured` field selects project-showcase entries and the main case studies. `shortDescription`, `decisionTitle`, and `decision` supply the concise case copy. Folio and ExplainLab covers are real project screenshots; `coverWidth` and `coverHeight` record their intrinsic dimensions. The homepage showcase preserves each complete screenshot, while `coverPosition` remains available for other image treatments.

Only add a live demo or source link after confirming that it is public and belongs to the matching project. Research work without a public release should remain an honest summary rather than linking to a generic profile page.

## Deployment

The workflow at `.github/workflows/deploy.yml` builds and deploys the site on every push to `main` using the official GitHub Pages actions.

Production: <https://zhzhg-dev.github.io/>
