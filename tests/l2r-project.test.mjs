import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { attributes, elements, loadSource, plainText, renderAt, repository } from "./support/source-harness.mjs";

const { projects } = loadSource(resolve(repository, "src/data/profile.ts"));
const { StudioProjects } = loadSource(resolve(repository, "src/components/StudioProjects.tsx"));
const { default: App } = loadSource(resolve(repository, "src/App.tsx"));
const sourceUrl = "https://github.com/TipperChristopher/Group-4-COMPSCI760";

function l2r() {
  const matching = projects.filter(project => project.slug === "learn-to-race");
  assert.equal(matching.length, 1, "update the existing research experience, do not duplicate it");
  return matching[0];
}

test("L2R updates its existing project and deep link with a completed research milestone and team source", () => {
  const project = l2r();
  assert.equal(projects.length, 7);
  assert.match(project.title, /L2R/);
  assert.equal(project.status, "Research milestone complete");
  assert.equal(project.sourceUrl, sourceUrl);
  assert.equal(project.liveUrl, undefined, "a team repository is not a public live racing demo");
  assert.ok(project.caseStudy && project.cardSummary);
  assert.notEqual(project.featured, true, "the first three editorial screenshot covers remain a separate design choice");
  assert.ok(existsSync(resolve(repository, "public", project.cover.replace(/^\//, ""))));
  const text = JSON.stringify(project);
  assert.doesNotMatch(text, /Research in progress|Model Predictive Control|Imitation learning|warm-start|"MPC"/i);
  for (const technology of ["Python", "PPO", "SAC", "F1TENTH", "Stable-Baselines3"]) {
    assert.ok(project.technologies.some(item => item.includes(technology)), `use the completed study's ${technology} stack`);
  }
});

test("L2R separates Grant's verified personal contribution from the 48-run team simulation result", () => {
  const project = l2r();
  const text = JSON.stringify(project);
  const contribution = project.caseStudy?.contribution ?? "";
  assert.match(text, /COMPSCI 760/);
  assert.match(text, /five.person|5.person|five.member/i);
  assert.match(text, /48(?:[- ]run| (?:formal )?training runs)/i);
  assert.match(contribution, /10(?: (?:formal|SAC|training)){1,3} runs/i);
  assert.match(contribution, /20 million|20M/i);
  assert.match(contribution, /Related Work/);
  assert.match(contribution, /presentation|slide/i);
  for (const fact of ["1, 5, 20", "100", "Grid A", "0.11", "0.68"]) assert.ok(text.includes(fact), `retain the ${fact} result context`);
  assert.match(text, /simulation/i);
  assert.match(text, /fractional[- ]lap/i);
  assert.match(text, /not[^.]*full[- ]lap[^.]*(?:success|completion)|not[^.]*success rate/i);
  assert.match(text, /configuration/i);
  assert.match(text, /seed/i);
});

test("the L2R milestone and bounded evidence render through the retained case link while About stays personal", () => {
  const project = l2r();
  const html = renderAt(StudioProjects, { projects }, "https://zhzhg-dev.github.io/projects/?ref=l2r#learn-to-race");
  const dialog = elements(html, "dialog")[0];
  assert.ok(dialog.text.includes(project.title));
  assert.ok(dialog.text.includes(project.status));
  assert.ok(dialog.text.includes(project.caseStudy.contribution));
  assert.match(dialog.text, /fractional[- ]lap/i);
  assert.ok(elements(dialog.markup, "a").some(link => link.href === sourceUrl && link.text.includes("Source")));
  assert.doesNotMatch(dialog.markup, /Live demo/);
  const about = renderAt(App, { page: "home" });
  const aboutText = plainText(about);
  assert.ok(elements(about, "a").some(link => link.href === "/projects/#learn-to-race"));
  assert.doesNotMatch(aboutText, /Learning from demonstrations|MPC|Research in progress/);
  assert.ok(!aboutText.includes(project.description), "the full course-research case belongs on Projects");
});

test("the L2R cover is the real, uncropped simulation comparison with a bounded replay caption", () => {
  const project = l2r();
  assert.equal(project.cover, "/projects/l2r-training-diversity.png");
  assert.equal(project.coverFit, "contain", "both tracks in the comparison remain visible in the 16:9 gallery slot");
  assert.equal(project.coverWidth, 1600);
  assert.equal(project.coverHeight, 746);
  const asset = readFileSync(resolve(repository, "public", project.cover.replace(/^\//, "")));
  assert.deepEqual([...asset.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(asset.readUInt32BE(16), project.coverWidth);
  assert.equal(asset.readUInt32BE(20), project.coverHeight);
  assert.ok(asset.length < 200 * 1024, "the real replay still remains a lightweight local asset");
  assert.deepEqual(readFileSync(resolve(repository, "dist", project.cover.replace(/^\//, ""))), asset);
  const gallery = renderAt(StudioProjects, { projects });
  const card = elements(gallery, "article").find(card => card.id === project.slug);
  const image = attributes(card.markup.match(/<img\b[^>]*>/)?.[0] ?? "");
  assert.equal(image.src, project.cover);
  assert.match(image.style, /object-fit:contain/);
  const caseHtml = renderAt(StudioProjects, { projects }, "https://zhzhg-dev.github.io/projects/#learn-to-race");
  const figure = elements(caseHtml, "figure")[0];
  assert.ok(project.coverCaption && figure.text.includes(project.coverCaption));
  assert.match(figure.text, /Grid A.*seed 1/i);
  assert.match(figure.text, /simulation, not physical driving/i);
  assert.match(figure.text, /one replay is not an aggregate success rate/i);
  assert.doesNotMatch(figure.text, /Actual interface screenshot|Project illustration/);
});
