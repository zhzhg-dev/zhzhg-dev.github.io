# Grant Zhang — Portfolio

A responsive, multi-page professional portfolio for Grant Zhang: an AI product builder connecting user needs, prototypes, and evaluation, with a foundation in mathematics and an interest in game AI.

## Pages

- Home — positioning, profile, core capabilities, and selected work
- Experience — work history, academic foundation, leadership, and technical toolkit
- Projects — seven project case studies with verified live demos and public source links where available

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

The test suite verifies all three page outputs, public project links, cover assets, metadata, accuracy-sensitive wording, and the GitHub Pages workflow.

## Updating content

Personal details, experience, projects, skills, education, and community information are stored in `src/data/profile.ts`. Project cover images are stored in `public/projects/`.

Project totals, live-demo counts, and public-repository counts are derived from project data. The `featured` field selects homepage cards. Folio and ExplainLab covers are real project screenshots; `coverPosition` keeps the relevant interface visible within the existing card layout.

Only add a live demo or source link after confirming that it is public and belongs to the matching project. Research work without a public release should remain an honest summary rather than linking to a generic profile page.

## Deployment

The workflow at `.github/workflows/deploy.yml` builds and deploys the site on every push to `main` using the official GitHub Pages actions.

Production: <https://zhzhg-dev.github.io/>
