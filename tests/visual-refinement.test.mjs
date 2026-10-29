import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { before, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

let HeroWorkbench;
let ProjectPreview;
let App;
let featuredProjects;

// Compile the actual TSX modules in memory; React itself is the normal Node
// dependency. This also works when a checkout shares its parent's node_modules.
const sourceModules = new Map();

function loadSourceModule(filename) {
  if (sourceModules.has(filename)) return sourceModules.get(filename).exports;
  const loaded = { exports: {} };
  sourceModules.set(filename, loaded);
  const nodeRequire = createRequire(filename);
  const sourceRequire = (specifier) => {
    if (specifier.startsWith(".")) {
      const base = resolve(dirname(filename), specifier);
      const source = [base, `${base}.tsx`, `${base}.ts`].find(existsSync);
      if (source) return loadSourceModule(source);
    }
    return nodeRequire(specifier);
  };
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const evaluate = new Function("require", "module", "exports", outputText);
  evaluate(sourceRequire, loaded, loaded.exports);
  return loaded.exports;
}

before(() => {
  ({ HeroWorkbench } = loadSourceModule(
    fileURLToPath(new URL("../src/components/HeroWorkbench.tsx", import.meta.url)),
  ));
  ({ ProjectPreview } = loadSourceModule(
    fileURLToPath(new URL("../src/components/ProjectPreview.tsx", import.meta.url)),
  ));
  ({ default: App } = loadSourceModule(fileURLToPath(new URL("../src/App.tsx", import.meta.url))));
  const { projects } = loadSourceModule(
    fileURLToPath(new URL("../src/data/profile.ts", import.meta.url)),
  );
  featuredProjects = projects.filter((project) => project.featured).slice(0, 3);
});

function renderAt(Component, props = {}, address) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

  if (address) {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: new URL(address) },
    });
  } else {
    delete globalThis.window;
  }

  try {
    return renderToStaticMarkup(createElement(Component, props));
  } finally {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      delete globalThis.window;
    }
  }
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, name, value]) => [
      name.toLowerCase(),
      value,
    ]),
  );
}

function elements(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "g"))]
    .map(([markup]) => ({
      ...attributes(markup.slice(0, markup.indexOf(">") + 1)),
      markup,
      text: markup.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    }));
}

function sectionByClass(html, className) {
  let start;
  let depth = 0;
  for (const match of html.matchAll(/<\/?section\b[^>]*>/g)) {
    const closing = match[0].startsWith("</");
    if (start === undefined) {
      if (closing || !attributes(match[0]).class?.split(/\s+/).includes(className)) continue;
      start = match.index;
      depth = 1;
    } else {
      depth += closing ? -1 : 1;
      if (depth === 0) return html.slice(start, match.index + match[0].length);
    }
  }
  assert.fail(`Expected a complete ${className} section`);
}

function selectionButtons(html) {
  return [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)]
    .map(([markup]) => {
      const attrs = attributes(markup.slice(0, markup.indexOf(">") + 1));
      return {
        ...attrs,
        label: attrs["aria-label"] || markup.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      };
    })
    .filter((button) => "aria-pressed" in button);
}

function assertProjectPreview(html, project) {
  const previews = elements(html, "figure").filter((figure) =>
    figure.class?.split(/\s+/).includes("project-preview")
      && [...figure.markup.matchAll(/<img\b[^>]*>/g)]
        .some(([tag]) => attributes(tag).src === project.cover),
  );
  assert.equal(previews.length, 1, `${project.title} should have one shared screenshot preview`);
  const preview = previews[0].markup;
  const images = [...preview.matchAll(/<img\b[^>]*>/g)].map(([tag]) => attributes(tag));
  assert.equal(images.length, 2, "the thumbnail and enlarged view should both render on the server");
  for (const image of images) {
    assert.equal(image.src, project.cover);
    assert.equal(image.alt, project.coverAlt);
    assert.ok(image.alt?.trim(), "both screenshot sizes need meaningful alternative text");
    assert.ok(Number(image.width) > 0 && Number(image.height) > 0);
    assert.equal(Number(image.width), project.coverWidth ?? 1440);
    assert.equal(Number(image.height), project.coverHeight ?? 1000);
    assert.equal(image.loading, "lazy", "below-fold and initially hidden screenshots should be lazy-loaded");
    assert.notEqual(image.fetchpriority, "high");
  }

  const buttons = elements(preview, "button");
  const triggers = buttons.filter((button) => button["aria-haspopup"] === "dialog");
  assert.equal(triggers.length, 2, "the screenshot and the visible Expand preview action should both open the dialog");
  assert.ok(buttons.every((button) => button.type === "button"));
  const screenshotTrigger = triggers.find((button) => /<img\b/.test(button.markup));
  assert.equal(screenshotTrigger?.["aria-label"], `Expand ${project.title} screenshot`);
  const textTrigger = triggers.find((button) => !/<img\b/.test(button.markup));
  assert.equal(textTrigger?.["aria-label"], `Expand ${project.title} preview`);
  assert.equal(textTrigger?.text, "Expand preview");
  for (const trigger of triggers) {
    assert.equal(trigger.href, undefined);
    assert.doesNotMatch(trigger.markup, /<a\b/, "Expand actions must be buttons, not navigation links");
  }

  const dialogs = elements(preview, "dialog");
  assert.equal(dialogs.length, 1, "each preview needs its own native dialog");
  const dialog = dialogs[0];
  const previewLinks = elements(preview, "a");
  const originalLinks = elements(dialog.markup, "a");
  assert.equal(previewLinks.length, 1, "the preview may only link to its original screenshot");
  assert.equal(originalLinks.length, 1, "the original screenshot link must be inside the dialog");
  assert.doesNotMatch(preview.replace(dialog.markup, ""), /<a\b/,
    "the thumbnail and Expand actions must not navigate away");
  const originalLink = originalLinks[0];
  assert.equal(originalLink.href, project.cover);
  assert.equal(originalLink.target, "_blank");
  assert.equal(originalLink["aria-label"], `Open ${project.title} original screenshot in a new tab`);
  assert.match(originalLink.text, /^Open original image(?:\s|$)/);
  assert.ok(originalLink.rel?.split(/\s+/).some((value) => ["noopener", "noreferrer"].includes(value)));
  for (const target of [project.liveUrl, project.sourceUrl].filter(Boolean)) {
    assert.ok(previewLinks.every((link) => link.href !== target),
      "demo and source navigation belong outside the screenshot preview");
  }
  const dialogTag = dialog.markup.slice(0, dialog.markup.indexOf(">") + 1);
  assert.doesNotMatch(dialogTag, /\sopen(?:\s|=|>)/, "the initial render must leave the modal closed");
  assert.ok(dialog["aria-labelledby"], "the dialog must reference its visible title");
  const headings = [...preview.matchAll(/<h([1-6])\b[^>]*>[\s\S]*?<\/h\1>/g)]
    .map(([markup]) => ({
      ...attributes(markup.slice(0, markup.indexOf(">") + 1)),
      text: markup.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    }));
  for (const titleId of dialog["aria-labelledby"].split(/\s+/)) {
    const titles = headings.filter((heading) => heading.id === titleId);
    assert.equal(titles.length, 1, "the dialog title reference must resolve exactly once");
    assert.ok(titles[0].text.includes(project.title));
  }
  assert.ok(elements(dialog.markup, "button").some((button) =>
    (button["aria-label"] || button.text).includes("Close preview"),
  ));
  assert.ok(dialog.id, "each preview dialog needs an id for its triggers");
  for (const trigger of triggers) {
    assert.equal(trigger["aria-controls"], dialog.id);
  }
  assert.doesNotMatch(preview, /<h1\b/, "a hidden preview must not add another page heading");
}

function assertExplicitProjectLinks(html, project) {
  const links = elements(html, "a");
  for (const target of [project.liveUrl, project.sourceUrl].filter(Boolean)) {
    const entries = links.filter((link) => link.href === target);
    assert.ok(entries.length > 0, "each real demo/source must remain an explicit navigation action");
    assert.ok(entries.every((link) => link.text && !/<img\b/.test(link.markup)),
      "demo/source links should have visible text rather than use the screenshot as the link");
  }
}

function assertSelectedProject(html, project) {
  const buttons = selectionButtons(html);
  assert.equal(buttons.length, featuredProjects.length);
  const selected = buttons.filter((button) => button["aria-pressed"] === "true");
  assert.equal(selected.length, 1, "the preview must expose exactly one selected project");
  assert.ok(selected[0].label.includes(project.title));
  assert.ok(buttons.every((button) => button.type === "button"));

  assertProjectPreview(html, project);
  assertExplicitProjectLinks(html, project);
  assert.ok(elements(html, "a").some((link) =>
    link.href === `/projects/#${project.slug}` && link.text === "Read case study",
  ), "the selected project should link to its corresponding full case study");
}

test("screenshot previews render accessible closed dialogs without browser globals or a public demo", () => {
  for (const project of featuredProjects) {
    assertProjectPreview(renderAt(ProjectPreview, { project }), project);
  }
  const localOnlyProject = { ...featuredProjects[0], liveUrl: undefined, sourceUrl: undefined };
  assertProjectPreview(renderAt(ProjectPreview, { project: localOnlyProject }), localOnlyProject);
});

test("repeated previews of the same project have independent dialog labels", () => {
  const project = featuredProjects[0];
  const MultiplePreviews = () => createElement("div", null,
    createElement(ProjectPreview, { project }),
    createElement(ProjectPreview, { project }),
  );
  const html = renderAt(MultiplePreviews);
  const dialogs = elements(html, "dialog");
  assert.equal(dialogs.length, 2);
  assert.equal(new Set(dialogs.map((dialog) => dialog["aria-labelledby"])).size, 2);
  const ids = [...html.matchAll(/<[a-z][^>]*>/g)]
    .map(([tag]) => attributes(tag).id).filter(Boolean);
  assert.equal(ids.length, new Set(ids).size, "multiple preview instances must never duplicate DOM ids");
});

test("the workbench has a useful server-rendered default without browser globals", () => {
  assertSelectedProject(renderAt(HeroWorkbench), featuredProjects[0]);
});

test("shareable workbench URLs select the matching project, image, and entry", () => {
  for (const project of featuredProjects) {
    const address = `https://zhzhg-dev.github.io/?ref=profile&workbench=${project.slug}#top`;
    assertSelectedProject(renderAt(HeroWorkbench, {}, address), project);
  }
});

test("missing, empty, and unknown preview values safely fall back to the first project", () => {
  for (const query of ["", "?workbench=", "?workbench=does-not-exist", "?workbench=constructor"]) {
    const html = renderAt(HeroWorkbench, {}, `https://zhzhg-dev.github.io/${query}`);
    assertSelectedProject(html, featuredProjects[0]);
  }
});

test("Folio's working preview links to source rather than inventing a public demo", () => {
  const folio = featuredProjects.find((project) => project.slug === "folio");
  assert.ok(folio?.sourceUrl);
  assert.equal(folio.liveUrl, undefined);
  const html = renderAt(HeroWorkbench, {}, "https://zhzhg-dev.github.io/?workbench=folio");
  assertSelectedProject(html, folio);
  assert.doesNotMatch(html, />\s*(?:Open |View |Try )?Live demo\s*(?:<|$)/i);
});

test("Home keeps the GZ identity visual first and puts the screenshot showcase in selected work", () => {
  const home = renderAt(App, { page: "home" });
  const hero = sectionByClass(home, "hero");
  const selectedWork = sectionByClass(home, "selected-work");
  const hasShowcase = [...selectedWork.matchAll(/<[a-z][^>]*>/g)].some(([tag]) =>
    attributes(tag).class?.split(/\s+/).includes("project-showcase"),
  );

  assert.match(hero, />\s*GZ\s*</, "the hero must retain its own visible identity mark");
  assert.doesNotMatch(hero, /<img\b/, "project screenshots belong in selected work, not the identity hero");
  assert.equal(selectionButtons(hero).length, 0);
  assert.ok(home.indexOf(hero) < home.indexOf(selectedWork));
  assert.ok(hasShowcase, "selected work must contain the interactive project showcase");
  assertSelectedProject(selectedWork, featuredProjects[0]);
});

test("Home and Projects share screenshot previews while retaining separate demo and source links", () => {
  const home = renderAt(App, { page: "home" });
  const projects = renderAt(App, { page: "projects" });
  assertProjectPreview(sectionByClass(home, "selected-work"), featuredProjects[0]);
  for (const project of featuredProjects) {
    assertProjectPreview(projects, project);
    assertExplicitProjectLinks(projects, project);
    assert.ok(elements(projects, "article").some((article) => article.id === project.slug),
      "the case-study link must point to an existing project article");
  }
  const ids = [...projects.matchAll(/<[a-z][^>]*>/g)]
    .map(([tag]) => attributes(tag).id).filter(Boolean);
  assert.equal(ids.length, new Set(ids).size, "project cases and preview dialogs must not share DOM ids");
});

test("the three routes remain distinct and only Home owns the project selector", () => {
  const home = renderAt(App, { page: "home" });
  const experience = renderAt(App, { page: "experience" });
  const projects = renderAt(App, { page: "projects" });
  assert.equal(selectionButtons(home).length, featuredProjects.length);
  assert.equal(selectionButtons(experience).length, 0);
  assert.equal(selectionButtons(projects).length, 0);
  assert.match(experience, /Graduate Teaching Assistant/);
  assert.doesNotMatch(home, /IELTS Teaching Assistant/);
  assert.match(projects, /Rumour Propagation Simulation/);

  for (const html of [home, experience, projects]) {
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /href="#main-content"/);
    assert.match(html, /id="main-content"/);
    assert.doesNotMatch(html, /Tencent|腾讯|Incoming|Open to internship|internship and graduate opportunities/i);
  }
});
