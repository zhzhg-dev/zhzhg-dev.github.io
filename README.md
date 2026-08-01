# Grant Zhang — Portfolio

A responsive, single-page professional portfolio for Grant Zhang, focused on early-career AI, data, and software engineering opportunities in New Zealand.

## Technology

- Vite
- React
- TypeScript
- Custom CSS
- GitHub Actions and GitHub Pages

The site is fully static. It has no backend, database, remote image dependency, API key, or paid service.

## Local development

Use Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Vite will print the local address. Open it in a browser to view the site.

## Quality checks

```bash
npm run lint
npm run test
npm run build
```

The test command creates a production build, checks core metadata and required sections, and guards key accuracy-sensitive wording.

## Updating portfolio content

Personal details, experience, projects, skills, education, and community information are stored in one typed file:

`src/data/profile.ts`

To add a project, add another object to the `projects` array. Each project includes a title, short context label, description, technology list, and link. Only use a direct repository link after confirming that the public repository matches the project; otherwise retain the GitHub-profile fallback.

Optional fields such as an email address, LinkedIn profile, CV, or profile photo should be added to the `profile` object first and then rendered in `src/App.tsx`. Add only verified public details. A CV or photo can be placed in `public/` and referenced with a root-relative path such as `/grant-zhang-cv.pdf`.

## Deployment

The workflow at `.github/workflows/deploy.yml` builds and deploys the site on every push to `main` using the official GitHub Pages actions.

For the intended `zhzhg-dev/zhzhg-dev.github.io` repository, the production URL is:

<https://zhzhg-dev.github.io/>

In GitHub repository settings, Pages must use **GitHub Actions** as its source. The committed workflow then handles subsequent deployments automatically.
