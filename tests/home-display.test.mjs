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

test("compact Home records lead to the complete Experience record without repeating the STAR details", () => {
  const html = renderAt(App, { page: "home" });
  const work = section(html, "work-title");
  assert.ok(work);
  assert.equal(elements(work.markup, "article").length, experience.length);
  assert.equal(elements(work.markup, "details").length, 0);
  for (const role of experience) {
    for (const fact of [role.role, role.organisation, role.period, role.summary]) assert.ok(work.text.includes(fact));
  }
  assert.equal(elements(work.markup, "dl").length, 0);
  assert.doesNotMatch(work.text, /235 likes|155 shares|5 comments/);
  for (const role of experience) {
    for (const fact of [role.scope, role.story?.situation, role.story?.task, role.story?.action, role.story?.result].filter(Boolean)) {
      assert.ok(!work.text.includes(fact), "full role details are not repeated on Home");
    }
  }
  assert.ok(elements(work.markup, "a").some(link => link.href === "/experience/#work-title"));
  const completeWork = section(renderAt(App, { page: "experience" }), "work-title");
  assert.ok(completeWork);
  for (const role of experience) {
    const entry = elements(completeWork.markup, "article").find(item => item.text.includes(role.role));
    assert.ok(entry);
    assert.ok(completeWork.text.includes(role.period));
    for (const fact of [role.organisation, role.summary, role.scope, ...Object.values(role.story ?? {})].filter(Boolean)) assert.ok(entry.text.includes(fact));
  }
});

test("the complete background presents four STAR rows for completed or ongoing work, plus education and volunteering", () => {
  const html = renderAt(StudioBackground);
  const work = section(html, "work-title");
  assert.ok(work);
  const roles = elements(work.markup, "article");
  for (const role of experience) {
    const entry = roles.find(item => item.text.includes(role.role));
    assert.ok(entry);
    const disclosures = elements(entry.markup, "details");
    assert.equal(disclosures.length, role.story ? 1 : 0);
    if (role.story) {
      assert.equal(isOpen(disclosures[0].markup), true);
      assert.match(elements(disclosures[0].markup, "summary")[0]?.text ?? "", /Details & outcomes/);
      const [story] = elements(disclosures[0].markup, "dl");
      assert.ok(story);
      assert.deepEqual(elements(story.markup, "dt").map(item => item.text), ["Context", "Task", "What I did", "Outcome"]);
      assert.deepEqual(elements(story.markup, "dd").map(item => item.text), [
        role.story.situation, role.story.task, role.story.action, [role.story.result, role.story.evidenceNote].filter(Boolean).join(" "),
      ]);
    }
  }
  const qualifications = section(html, "education-title");
  assert.ok(qualifications);
  const degrees = elements(qualifications.markup, "article");
  assert.equal(degrees.length, education.length);
  for (const [index, qualification] of education.entries()) {
    const degree = degrees[index];
    for (const fact of [qualification.degree, qualification.institution, qualification.period, qualification.detail].filter(Boolean)) {
      assert.ok(degree.text.includes(fact), "degree preserves " + fact);
    }
    const groups = elements(degree.markup, "div").filter(group => group.class === "background-education__group");
    const expected = [...qualification.courseGroups, ...(qualification.honours ? [{ label: "Honours", courses: qualification.honours }] : [])];
    assert.deepEqual(groups.map(group => [elements(group.markup, "h4")[0]?.text, elements(group.markup, "li").map(item => item.text)]),
      expected.map(group => [group.label, group.courses]));
  }
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

test("all five toolkit groups are directly readable on Projects with no fabricated proficiency scores or persistence", () => {
  const html = renderAt(App, { page: "projects" });
  const toolkit = section(html, "toolkit-title");
  assert.ok(toolkit);
  assert.equal(elements(toolkit.markup, "details").length, 0, "reading skills does not require opening drawers");
  const groups = elements(toolkit.markup, "div").filter(group => group.class === "studio-toolkit__group");
  assert.equal(groups.length, skills.length);
  for (const group of skills) {
    const entry = groups.find(item => elements(item.markup, "h3")[0]?.text === group.category);
    assert.ok(entry);
    assert.deepEqual(elements(entry.markup, "li").map(item => item.text), group.items);
  }
  assert.doesNotMatch(toolkit.markup, /<progress\b|role="(?:progressbar|slider)"|\b\d{1,3}%/);
  const source = readFileSync(resolve(repository, "src/components/StudioToolkit.tsx"), "utf8");
  assert.doesNotMatch(source, /localStorage|sessionStorage|\bfetch\s*\(/);
});
