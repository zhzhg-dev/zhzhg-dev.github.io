import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { elements, loadSource, renderAt, repository } from "./support/source-harness.mjs";

const { default: App } = loadSource(resolve(repository, "src/App.tsx"));
const { StudioBackground } = loadSource(resolve(repository, "src/components/StudioBackground.tsx"));
const { experience, education, community, skills, projects } = loadSource(resolve(repository, "src/data/profile.ts"));

function openingTag(markup) { return markup.slice(0, markup.indexOf(">") + 1); }
function isOpen(markup) { return /\sopen(?:\s|=|>)/.test(openingTag(markup)); }
function section(html, id) { return elements(html, "section").find(item => item["aria-labelledby"] === id); }

test("the personal display uses readable personal context without a second decorative image or project catalogue", () => {
  const html = renderAt(App, { page: "home" });
  const introduction = elements(html, "section").find(item => item.id === "studio-about");
  assert.ok(introduction);
  assert.equal(elements(introduction.markup, "h2").length, 1);
  assert.doesNotMatch(introduction.markup, /<img\b|study-notebook|<canvas\b|<iframe\b/);
  for (const fact of ["Grant", "Master of Information Technology", "Graduate Teaching Assistant", "University of Auckland"]) assert.ok(introduction.text.includes(fact));
  assert.match(introduction.text, /mathematics/i);
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
  const current = experience.find(role => role.status === "current");
  assert.equal(current?.role, "Graduate Teaching Assistant");
  assert.deepEqual(elements(highlights.markup, "li").map(item => item.text), current.points.slice(0, 2));
  const omittedPoints = experience.flatMap(role => role === current ? role.points.slice(2) : role.points);
  for (const point of omittedPoints) assert.ok(!work.text.includes(point), "the complete duty list is not repeated on Home");
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

test("the complete background retains native responsibility details and real education and volunteering facts", () => {
  const html = renderAt(StudioBackground);
  const work = section(html, "work-title");
  assert.ok(work);
  const roles = elements(work.markup, "article");
  for (const role of experience) {
    const entry = roles.find(item => item.text.includes(role.role));
    assert.ok(entry);
    const disclosures = elements(entry.markup, "details");
    assert.equal(disclosures.length, role.points.length ? 1 : 0);
    if (role.points.length) {
      assert.equal(isOpen(disclosures[0].markup), role.status === "current");
      assert.match(elements(disclosures[0].markup, "summary")[0]?.text ?? "", /Responsibilities/);
    }
  }
  const qualifications = section(html, "education-title");
  assert.ok(qualifications);
  for (const qualification of education) for (const fact of Object.values(qualification)) assert.ok(qualifications.text.includes(fact));
  const note = elements(html, "aside").find(item => item["aria-labelledby"] === "community-title");
  assert.ok(note);
  assert.deepEqual(elements(note.markup, "h2").map(heading => heading.text), [community.distinction]);
  assert.ok(note.text.includes("Volunteering"));
  assert.ok(note.text.includes(community.recognition));
  assert.match(community.recognition, /2022/);
  assert.doesNotMatch(community.recognition, /2021/);
  const reports = elements(note.markup, "article");
  assert.equal(reports.length, 2);
  assert.equal(community.entries.length, reports.length);
  for (const [index, entry] of community.entries.entries()) {
    const report = reports[index];
    assert.equal(elements(report.markup, "h3")[0]?.text, entry.title);
    for (const fact of [entry.organisation, entry.period, entry.description, entry.contribution].filter(Boolean)) assert.ok(report.text.includes(fact));
    const links = elements(report.markup, "a");
    assert.equal(links.length, 1);
    assert.equal(links[0].href, entry.reportUrl);
    assert.equal(links[0].target, "_blank");
    assert.match(links[0].rel, /\b(?:noopener|noreferrer)\b/);
  }
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
