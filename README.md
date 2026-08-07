# Grant Zhang — Portfolio

A responsive, multi-page professional portfolio for Grant Zhang, focused on early-career AI, data, and software engineering opportunities in New Zealand.

## Pages

- Home — positioning, profile, core capabilities, and selected work
- Experience — work history, academic foundation, leadership, and technical toolkit
- Projects — four project case studies with verified live demos and public source links where available

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
```

The test suite verifies all three page outputs, public project links, cover assets, metadata, accuracy-sensitive wording, and the GitHub Pages workflow.

## Updating content

Personal details, experience, projects, skills, education, and community information are stored in `src/data/profile.ts`. Project cover images are stored in `public/projects/`.

Only add a live demo or source link after confirming that it is public and belongs to the matching project. Research work without a public release should remain an honest summary rather than linking to a generic profile page.

## Deployment

The workflow at `.github/workflows/deploy.yml` builds and deploys the site on every push to `main` using the official GitHub Pages actions.

Production: <https://zhzhg-dev.github.io/>
