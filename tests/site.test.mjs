import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const homeHtml = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const experienceHtml = await readFile(
  new URL("../dist/experience/index.html", import.meta.url),
  "utf8",
);
const projectsHtml = await readFile(
  new URL("../dist/projects/index.html", import.meta.url),
  "utf8",
);
const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const dataSource = await readFile(
  new URL("../src/data/profile.ts", import.meta.url),
  "utf8",
);
const workflow = await readFile(
  new URL("../.github/workflows/deploy.yml", import.meta.url),
  "utf8",
);

test("production emits three distinct portfolio pages", () => {
  assert.match(homeHtml, /Grant Zhang \| AI, Data & Software Portfolio/);
  assert.match(experienceHtml, /Experience \| Grant Zhang/);
  assert.match(projectsHtml, /Projects \| Grant Zhang/);
  assert.match(homeHtml, /data-page="home"/);
  assert.match(experienceHtml, /data-page="experience"/);
  assert.match(projectsHtml, /data-page="projects"/);
});

test("primary navigation links to standalone page addresses", () => {
  for (const target of ['href: "/"', 'href: "/experience/"', 'href: "/projects/"']) {
    assert.match(dataSource, new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(dataSource, /href: "#(skills|education|community)"/);
});

test("projects include real cover assets and verified public links", () => {
  for (const expected of [
    "https://zhzhg-dev.github.io/course-review-system/",
    "https://github.com/zhzhg-dev/course-review-system",
    "https://zhzhg-dev.github.io/svelte-study-planner/",
    "https://github.com/zhzhg-dev/svelte-study-planner",
  ]) {
    assert.match(dataSource, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const cover of [
    "autonomous-racing.webp",
    "course-review.webp",
    "study-planner.webp",
    "rumour-simulation.webp",
  ]) {
    assert.match(dataSource, new RegExp(cover));
  }
});

test("research claims remain accurate and unpublished work has no fake links", () => {
  assert.match(dataSource, /Research in progress/);
  assert.match(dataSource, /Undergraduate thesis/);
  assert.doesNotMatch(dataSource, /improved performance|production-ready AI/);
  assert.doesNotMatch(dataSource, /@gmail\.com|linkedin\.com/);
});

test("experience, education, community, and skills are merged into the experience page", () => {
  for (const label of [
    "Academic foundation",
    "Leadership & impact",
    "Working toolkit",
  ]) {
    assert.match(appSource, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("GitHub Pages workflow uses official deployment actions", () => {
  for (const expected of [
    "actions/checkout@v4",
    "actions/setup-node@v4",
    "actions/configure-pages@v5",
    "actions/upload-pages-artifact@v3",
    "actions/deploy-pages@v4",
    "pages: write",
    "id-token: write",
    "npm ci",
    "npm run build",
  ]) {
    assert.match(workflow, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("production public assets are emitted", async () => {
  for (const asset of [
    "favicon.svg",
    "og.png",
    "robots.txt",
    "sitemap.xml",
    ".nojekyll",
    "projects/autonomous-racing.webp",
    "projects/course-review.webp",
    "projects/study-planner.webp",
    "projects/rumour-simulation.webp",
  ]) {
    await access(new URL(`../dist/${asset}`, import.meta.url));
  }
});
