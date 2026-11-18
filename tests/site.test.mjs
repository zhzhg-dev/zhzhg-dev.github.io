import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { attributes, elements, loadSource, renderAt, repository } from "./support/source-harness.mjs";

const pages = await Promise.all(["", "experience/", "projects/", "contact/"].map(async path => ({
  path: `/${path}`,
  html: await readFile(new URL(`../dist/${path}index.html`, import.meta.url), "utf8"),
})));
const dataSource = await readFile(new URL("../src/data/profile.ts", import.meta.url), "utf8");
const { experience, projects } = loadSource(resolve(repository, "src/data/profile.ts"));
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
  assert.doesNotMatch(JSON.stringify(projects), /Tencent|腾讯|LIGHTSPEED STUDIOS|光子工作室群/i, "independent work does not imply an employer affiliation");
  const internship = experience.find(role => /Tencent/i.test(role.organisation));
  assert.ok(internship);
  assert.equal(internship.period, "16 Nov 2026 — Present");
  assert.equal(internship.role, "Game AI Product Management Intern");
  assert.deepEqual(experience.filter(role => role.status === "current"), [internship]);
  assert.equal(internship.story, undefined, "only role scope is public; no invented STAR outcome");
  assert.doesNotMatch(internship.summary + (internship.scope ?? ""), /\d+(?:\.\d+)?\s*(?:%|users|players)|launched|shipped|boosted|increased by/i);
  assert.doesNotMatch(JSON.stringify(experience), /scheduled to start|scheduled end|incoming|seeking (?:an? )?internship/i);
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

test("home previews introduce Grant’s field while Experience and structured data retain his role", () => {
  for (const { path, html } of pages.filter(page => ["/", "/experience/"].includes(page.path))) {
    const metadata = [...html.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => attributes(tag));
    for (const name of ["description", "og:description", "twitter:description"]) {
      const value = metadata.find(meta => (meta.name ?? meta.property) === name)?.content;
      if (path === "/") assert.doesNotMatch(value, /Tencent|LIGHTSPEED|\bintern(?:ship)?\b/i, name);
      else assert.match(value, /Tencent/i, name);
      assert.match(value, /game AI/i);
      assert.doesNotMatch(value, /incoming|scheduled|building and teaching in Auckland/i);
    }
  }
  const fallback = elements(pages[0].html, "noscript")[0];
  assert.ok(fallback);
  assert.match(fallback.text, /game AI product management/i);
  assert.doesNotMatch(fallback.text, /Tencent|LIGHTSPEED|\bintern(?:ship)?\b/i);
  const schema = JSON.parse(pages[0].html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema["@type"], "Person");
  assert.equal(schema.jobTitle, experience.find(role => role.status === "current").role);
  assert.match(schema.worksFor.name, /LIGHTSPEED STUDIOS/i);
  assert.match(schema.worksFor.parentOrganization.name, /Tencent/i);
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
