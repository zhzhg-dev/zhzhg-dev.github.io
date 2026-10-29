import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const pages = await Promise.all(["", "experience/", "projects/", "contact/"].map(async path => ({
  path: `/${path}`,
  html: await readFile(new URL(`../dist/${path}index.html`, import.meta.url), "utf8"),
})));
const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const homeSource = await readFile(new URL("../src/components/StudioHome.tsx", import.meta.url), "utf8");
const projectSource = await readFile(new URL("../src/components/StudioProjects.tsx", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../src/data/profile.ts", import.meta.url), "utf8");
const workflow = await readFile(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");

test("production emits About, Projects and Contact plus the compatible Experience address", () => {
  for (const { path, html } of pages) {
    const page = path === "/" ? "home" : path.split("/")[1];
    assert.match(html, new RegExp(`data-page="${page}"`));
    assert.match(html, /<title>[^<]*Grant Zhang[^<]*<\/title>/);
    if (page !== "home") {
      const title = page[0].toUpperCase() + page.slice(1);
      assert.match(html, new RegExp(`${title} \\| Grant Zhang`));
      assert.match(html, new RegExp(`name="twitter:title" content="${title} \\| Grant Zhang"`));
    }
  }
  assert.match(pages.find(page => page.path === "/projects/").html, /property="og:description" content="Explore Folio, ExplainLab/);
});

test("the three primary tabs use real standalone page addresses", () => {
  for (const [label, href] of [["About", "/"], ["Projects", "/projects/"], ["Contact", "/contact/"]]) {
    assert.ok(dataSource.includes(`label: "${label}"`));
    assert.ok(dataSource.includes(`href: "${href}"`));
  }
  const navigation = dataSource.slice(dataSource.indexOf("export const navigation"), dataSource.indexOf("export const experience"));
  assert.equal((navigation.match(/label:/g) || []).length, 3);
  assert.doesNotMatch(navigation, /label: "Experience"|href: "#(?:skills|education|community)"/);
});

test("projects retain real cover assets and verified public destinations", () => {
  for (const expected of [
    "https://zhzhg-dev.github.io/course-review-system/", "https://github.com/zhzhg-dev/course-review-system",
    "https://zhzhg-dev.github.io/svelte-study-planner/", "https://github.com/zhzhg-dev/svelte-study-planner",
    "https://nz-electricity-forecasting.streamlit.app/", "https://github.com/zhzhg-dev/nz-electricity-forecasting",
    "https://github.com/zhzhg-dev/folio", "https://zhzhg-dev.github.io/explainlab/", "https://github.com/zhzhg-dev/explainlab",
  ]) assert.ok(dataSource.includes(expected));
  for (const cover of ["autonomous-racing.webp", "course-review.webp", "study-planner.webp", "rumour-simulation.webp", "nz-electricity-forecast.png", "folio.png", "explainlab-landscape.jpg"]) assert.ok(dataSource.includes(cover));
});

test("public profile and publication claims stay accurate", () => {
  assert.match(dataSource, /Research in progress/);
  assert.match(dataSource, /Undergraduate thesis/);
  assert.match(dataSource, /https:\/\/www\.linkedin\.com\/in\/grant-zhang-zahz\//);
  assert.match(dataSource, /game AI/i);
  assert.match(dataSource, /built on a dataset of 52,608/);
  assert.doesNotMatch(dataSource, /improved performance|production-ready AI|@gmail\.com/);
  assert.doesNotMatch(dataSource + appSource + homeSource + projectSource,
    /Tencent|腾讯|Incoming|Open to internship|internship and graduate opportunities/i);
  const folio = dataSource.slice(dataSource.indexOf('slug: "folio"'), dataSource.indexOf('slug: "explainlab"'));
  assert.match(folio, /Working preview/);
  assert.doesNotMatch(folio, /liveUrl:/);
});

test("all page outputs retain canonical URLs and light browser metadata", () => {
  for (const { path, html } of pages) {
    assert.match(html, /<html\b[^>]*\blang="en"/);
    assert.match(html, /name="color-scheme"\s+content="light"/);
    assert.equal(html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1], `https://zhzhg-dev.github.io${path}`);
  }
});

test("GitHub Pages builds, checks and deploys with official actions", () => {
  for (const expected of ["actions/checkout@v4", "actions/setup-node@v4", "actions/configure-pages@v5", "actions/upload-pages-artifact@v3", "actions/deploy-pages@v4", "pages: write", "id-token: write", "npm ci", "npm run build", "node --test tests/*.test.mjs"]) assert.ok(workflow.includes(expected));
});

test("production includes every required local image, font and license", async () => {
  for (const asset of [
    "favicon.svg", "og.png", "robots.txt", "sitemap.xml", ".nojekyll",
    "projects/autonomous-racing.webp", "projects/course-review.webp", "projects/study-planner.webp", "projects/rumour-simulation.webp",
    "projects/nz-electricity-forecast.png", "projects/folio.png", "projects/explainlab-landscape.jpg",
    "studio/grant-daylight-studio-v1.png", "fonts/Onest-variable.ttf", "fonts/OFL.txt",
    "fonts/bricolage/BricolageGrotesque-variable.ttf", "fonts/bricolage/OFL.txt",
  ]) await access(new URL(`../dist/${asset}`, import.meta.url));
});
