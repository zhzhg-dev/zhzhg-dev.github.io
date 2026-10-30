import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { attributes, elements, loadSource, renderAt, repository } from "./support/source-harness.mjs";

const { default: App } = loadSource(resolve(repository, "src/App.tsx"));
const { StudioBackground } = loadSource(resolve(repository, "src/components/StudioBackground.tsx"));
const { experience, education, community, skills, projects } = loadSource(resolve(repository, "src/data/profile.ts"));

function openingTag(markup) { return markup.slice(0, markup.indexOf(">") + 1); }
function isOpen(markup) { return /\sopen(?:\s|=|>)/.test(openingTag(markup)); }
function section(html, id) { return elements(html, "section").find(item => item["aria-labelledby"] === id); }

test("the personal display keeps one lazy decorative still life rather than a project catalogue", () => {
  const html = renderAt(App, { page: "home" });
  const introduction = elements(html, "section").find(item => item.id === "studio-about");
  assert.ok(introduction);
  const image = attributes(introduction.markup.match(/<img\b[^>]*>/)?.[0] ?? "");
  assert.equal(image.src, "/studio/study-notebook-v1.webp");
  assert.equal(image.loading, "lazy");
  assert.equal(image.alt, "");
  assert.equal(Number(image.width), 760);
  assert.equal(Number(image.height), 507);
  assert.match(introduction.markup, /aria-hidden="true"/);
  const asset = readFileSync(resolve(repository, "public", image.src.replace(/^\//, "")));
  assert.equal(asset.toString("ascii", 0, 4), "RIFF");
  assert.equal(asset.toString("ascii", 8, 12), "WEBP");
  assert.ok(asset.length < 200 * 1024);
  for (const project of projects) assert.ok(!html.includes(`src="${project.cover}"`), "project evidence images stay on their case page");
  assert.doesNotMatch(html, /studio-projects__grid|studio-project-card__cover/);
  for (const page of ["experience", "contact"]) {
    assert.doesNotMatch(renderAt(App, { page }), /studio-about-title|studio-now-title|study-notebook|l2r-training-diversity/);
  }
});

test("compact Home records lead to the complete Experience record without repeating the full duties", () => {
  const html = renderAt(App, { page: "home" });
  const work = section(html, "work-title");
  assert.ok(work);
  assert.equal(elements(work.markup, "article").length, experience.length);
  assert.equal(elements(work.markup, "details").length, 0);
  for (const role of experience) {
    for (const fact of [role.role, role.organisation, role.period, role.summary]) assert.ok(work.text.includes(fact));
  }
  const highlights = elements(work.markup, "ul")[0];
  assert.ok(highlights);
  assert.deepEqual(elements(highlights.markup, "li").map(item => item.text), experience[0].points.slice(0, 2));
  for (const point of [...experience[0].points.slice(2), ...experience[1].points]) assert.ok(!work.text.includes(point), "the complete duty list is not repeated on Home");
  assert.ok(elements(work.markup, "a").some(link => link.href === "/experience/#work-title"));
  const completeWork = section(renderAt(App, { page: "experience" }), "work-title");
  assert.ok(completeWork);
  for (const role of experience) {
    const entry = elements(completeWork.markup, "article").find(item => item.text.includes(role.role));
    assert.ok(entry);
    assert.ok(completeWork.text.includes(role.period));
    for (const fact of [role.organisation, role.summary, ...role.points, ...role.tags]) assert.ok(entry.text.includes(fact));
  }
});

test("the complete background retains native responsibility details and real education and community facts", () => {
  const html = renderAt(StudioBackground);
  const work = section(html, "work-title");
  assert.ok(work);
  const roles = elements(work.markup, "article");
  for (const [index, role] of experience.entries()) {
    const entry = roles.find(item => item.text.includes(role.role));
    assert.ok(entry);
    const disclosures = elements(entry.markup, "details");
    assert.equal(disclosures.length, 1);
    assert.equal(isOpen(disclosures[0].markup), index === 0);
    assert.match(elements(disclosures[0].markup, "summary")[0]?.text ?? "", /Responsibilities/);
  }
  const qualifications = section(html, "education-title");
  assert.ok(qualifications);
  for (const qualification of education) for (const fact of Object.values(qualification)) assert.ok(qualifications.text.includes(fact));
  const note = elements(html, "aside").find(item => item["aria-labelledby"] === "community-title");
  assert.ok(note);
  for (const fact of Object.values(community)) assert.ok(note.text.includes(fact));
});

test("all five toolkit groups are directly readable with no fabricated proficiency scores or persistence", () => {
  for (const compact of [false, true]) {
    const html = renderAt(StudioBackground, { compact });
    const toolkit = section(html, "toolkit-title");
    assert.ok(toolkit);
    assert.equal(elements(toolkit.markup, "details").length, 0, "reading skills does not require opening drawers");
    const groups = elements(toolkit.markup, "article");
    assert.equal(groups.length, skills.length);
    for (const group of skills) {
      const entry = groups.find(item => elements(item.markup, "h3")[0]?.text === group.category);
      assert.ok(entry);
      assert.deepEqual(elements(entry.markup, "li").map(item => item.text), group.items);
    }
    assert.doesNotMatch(toolkit.markup, /<progress\b|role="(?:progressbar|slider)"|\b\d{1,3}%/);
  }
  const source = readFileSync(resolve(repository, "src/components/StudioBackground.tsx"), "utf8");
  assert.doesNotMatch(source, /localStorage|sessionStorage|\bfetch\s*\(/);
});
