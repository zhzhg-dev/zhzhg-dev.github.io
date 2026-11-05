import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { attributes, elements, loadSource, renderAt, repository } from "./support/source-harness.mjs";

const pages = await Promise.all(["", "experience/", "projects/", "contact/"].map(async path => ({
  path: `/${path}`,
  html: await readFile(new URL(`../dist/${path}index.html`, import.meta.url), "utf8"),
})));
const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const homeSource = await readFile(new URL("../src/components/StudioHome.tsx", import.meta.url), "utf8");
const projectSource = await readFile(new URL("../src/components/StudioProjects.tsx", import.meta.url), "utf8");
const componentSources = (await Promise.all((await readdir(new URL("../src/components/", import.meta.url)))
  .filter(name => name.endsWith(".tsx"))
  .map(name => readFile(new URL(`../src/components/${name}`, import.meta.url), "utf8")))).join("\n");
const dataSource = await readFile(new URL("../src/data/profile.ts", import.meta.url), "utf8");
const { experience } = loadSource(resolve(repository, "src/data/profile.ts"));
const { StudioHome } = loadSource(resolve(repository, "src/components/StudioHome.tsx"));
const workflow = await readFile(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");

test("production emits About, Projects and Contact plus the compatible Experience address", () => {
  for (const { path, html } of pages) {
    const page = path === "/" ? "home" : path.split("/")[1];
    assert.match(html, new RegExp(`data-page="${page}"`));
    assert.match(html, /<title>[^<]*Grant[^<]*<\/title>/);
    if (page !== "home") {
      const title = { experience: "Experience", projects: "Projects", contact: "Contact" }[page];
      assert.match(html, new RegExp(`${title} \\| Grant`));
      assert.match(html, new RegExp(`name="twitter:title" content="${title} \\| Grant"`));
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
    "https://github.com/TipperChristopher/Group-4-COMPSCI760",
  ]) assert.ok(dataSource.includes(expected));
  for (const cover of ["l2r-training-diversity.png", "course-review.webp", "study-planner.webp", "rumour-simulation.webp", "nz-electricity-forecast.png", "folio.png", "explainlab-landscape.jpg"]) assert.ok(dataSource.includes(cover));
});

test("public profile and publication claims stay accurate", () => {
  assert.match(dataSource, /Research milestone complete/);
  assert.match(dataSource, /Undergraduate thesis/);
  assert.match(dataSource, /https:\/\/www\.linkedin\.com\/in\/grant-zhang-zahz\//);
  assert.match(dataSource, /game AI/i);
  assert.match(dataSource, /built on a dataset of 52,608/);
  assert.doesNotMatch(dataSource, /improved performance|production-ready AI|@gmail\.com/);
  const experienceStart = dataSource.indexOf("export const experience");
  const experienceEnd = dataSource.indexOf("export const projects");
  assert.ok(experienceStart >= 0 && experienceEnd > experienceStart);
  const outsideExperience = dataSource.slice(0, experienceStart) + dataSource.slice(experienceEnd);
  assert.doesNotMatch(outsideExperience + appSource + homeSource + projectSource + componentSources,
    /Tencent|腾讯|Incoming|Open to internship|internship and graduate opportunities/i);
  const internship = experience.find(role => role.organisation === "Tencent / LIGHTSPEED STUDIOS");
  assert.ok(internship);
  assert.equal(internship.period, "Scheduled to start 16 Nov 2026");
  assert.equal(internship.summary, "Auckland, New Zealand.");
  assert.equal(internship.status, "upcoming");
  assert.match(internship.scope, /generative AI.*product requirements/);
  assert.equal(internship.story, undefined, "future work has scope, not outcomes");
  assert.deepEqual(experience.filter(role => role.status === "current").map(role => role.role), ["Graduate Teaching Assistant"]);
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

test("only About preloads the exact responsive hero candidate the browser will use", () => {
  const picture = elements(renderAt(StudioHome), "picture")[0];
  const source = attributes(picture.markup.match(/<source\b[^>]*>/)[0]);
  for (const { path, html } of pages) {
    const imagePreloads = [...html.matchAll(/<link\b[^>]*>/g)]
      .map(([tag]) => attributes(tag))
      .filter(link => link.rel === "preload" && link.as === "image");
    const heroPreloads = imagePreloads.filter(link => `${link.imagesrcset ?? ""} ${link.href ?? ""}`.includes("grant-cozy-studio-v2"));
    if (path !== "/") {
      assert.equal(heroPreloads.length, 0, `${path} does not fetch the unused home illustration`);
      continue;
    }
    assert.equal(heroPreloads.length, 1, "the image is discovered exactly once before the React bundle");
    const [preload] = heroPreloads;
    assert.equal(preload.type, source.type);
    assert.equal(preload.imagesrcset, source.srcset);
    assert.equal(preload.imagesizes, source.sizes);
    assert.equal(preload.fetchpriority, "high");
    assert.equal(preload.href, undefined, "no fallback URL that could force a duplicate image request");
    assert.ok(html.indexOf('data-home-only') < html.indexOf('<script type="module"'));
  }
});

test("GitHub Pages builds, checks and deploys with official actions", () => {
  for (const expected of ["actions/checkout@v4", "actions/setup-node@v4", "actions/configure-pages@v5", "actions/upload-pages-artifact@v3", "actions/deploy-pages@v4", "pages: write", "id-token: write", "npm ci", "npm run build", "node --test tests/*.test.mjs"]) assert.ok(workflow.includes(expected));
});

test("production includes every required local image, font and license", async () => {
  for (const asset of [
    "favicon.svg", "og.png", "robots.txt", "sitemap.xml", ".nojekyll",
    "projects/autonomous-racing.webp", "projects/l2r-training-diversity.png", "projects/course-review.webp", "projects/study-planner.webp", "projects/rumour-simulation.webp",
    "projects/nz-electricity-forecast.png", "projects/folio.png", "projects/explainlab-landscape.jpg",
    "studio/grant-cozy-studio-v2.png",
    ...[480, 768, 1200, 1448].map(width => `studio/grant-cozy-studio-v2-${width}.webp`),
    "fonts/Onest-variable.ttf", "fonts/OFL.txt",
    "fonts/bricolage/BricolageGrotesque-variable.ttf", "fonts/bricolage/OFL.txt",
  ]) await access(new URL(`../dist/${asset}`, import.meta.url));
});
