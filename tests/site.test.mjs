import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const dataSource = await readFile(
  new URL("../src/data/profile.ts", import.meta.url),
  "utf8",
);
const workflow = await readFile(
  new URL("../.github/workflows/deploy.yml", import.meta.url),
  "utf8",
);

test("production page contains core metadata and app entry", () => {
  assert.match(html, /Grant Zhang \| AI, Data & Software Portfolio/);
  assert.match(html, /rel="canonical" href="https:\/\/zhzhg-dev\.github\.io\/"/);
  assert.match(html, /id="root"/);
  assert.match(html, /type="module" crossorigin src="\/assets\/index-/);
});

test("all required portfolio sections are represented", () => {
  for (const section of [
    "about",
    "experience",
    "projects",
    "skills",
    "education",
    "community",
    "contact",
  ]) {
    assert.match(appSource, new RegExp(`id="${section}"`));
  }
});

test("internal navigation targets existing sections", () => {
  const targets = [...appSource.matchAll(/href="#([a-z-]+)"/g)].map(
    (match) => match[1],
  );
  assert.ok(targets.length > 0);
  for (const target of new Set(targets)) {
    assert.match(appSource, new RegExp(`id="${target}"`));
  }
});

test("verified contact and ongoing project wording remain accurate", () => {
  assert.match(dataSource, /https:\/\/github\.com\/zhzhg-dev/);
  assert.match(dataSource, /Experimental work is ongoing/);
  assert.doesNotMatch(dataSource, /@gmail\.com|linkedin\.com|improved performance/);
});

test("GitHub Pages workflow uses the official deployment actions", () => {
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
  for (const asset of ["favicon.svg", "og.png", "robots.txt", "sitemap.xml", ".nojekyll"]) {
    await access(new URL(`../dist/${asset}`, import.meta.url));
  }
});
