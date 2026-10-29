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
let SignatureField;
let App;
let featuredProjects;
let allProjects;
let profileData;

// Compile the actual TSX modules in memory; React itself is the normal Node
// dependency. This also works when a checkout shares its parent's node_modules.
const sourceModules = new Map();

function loadSourceModule(filename) {
  if (sourceModules.has(filename)) return sourceModules.get(filename).exports;
  const loaded = { exports: {} };
  sourceModules.set(filename, loaded);
  const nodeRequire = createRequire(filename);
  const sourceRequire = (specifier) => {
    // Component-owned styles are built by Vite, not executed by the SSR test.
    if (specifier.endsWith(".css")) return {};
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
  ({ SignatureField } = loadSourceModule(
    fileURLToPath(new URL("../src/components/SignatureField.tsx", import.meta.url)),
  ));
  ({ default: App } = loadSourceModule(fileURLToPath(new URL("../src/App.tsx", import.meta.url))));
  profileData = loadSourceModule(
    fileURLToPath(new URL("../src/data/profile.ts", import.meta.url)),
  );
  allProjects = profileData.projects;
  featuredProjects = allProjects.filter((project) => project.featured).slice(0, 3);
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
      decodeText(value),
    ]),
  );
}

function decodeText(value) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function plainText(html) {
  return decodeText(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function elements(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "g"))]
    .map(([markup]) => ({
      ...attributes(markup.slice(0, markup.indexOf(">") + 1)),
      markup,
      text: plainText(markup),
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
        label: attrs["aria-label"] || plainText(markup),
      };
    })
    .filter((button) => "aria-pressed" in button);
}

function assertProjectPreview(html, project) {
  const imageKind = ["learn-to-race", "rumour-propagation"].includes(project.slug)
    ? "illustration" : "screenshot";
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
  assert.equal(screenshotTrigger?.["aria-label"], `Expand ${project.title} ${imageKind}`);
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
  assert.equal(originalLink["aria-label"], `Open ${project.title} original ${imageKind} in a new tab`);
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
      text: plainText(markup),
    }));
  for (const titleId of dialog["aria-labelledby"].split(/\s+/)) {
    const titles = headings.filter((heading) => heading.id === titleId);
    assert.equal(titles.length, 1, "the dialog title reference must resolve exactly once");
    assert.ok(titles[0].text.includes(project.title));
    assert.ok(titles[0].text.toLowerCase().includes(imageKind),
      "a research illustration must not be described as an implemented interface screenshot");
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

test("the isolated legacy workbench retains a useful server-rendered default", () => {
  assertSelectedProject(renderAt(HeroWorkbench), featuredProjects[0]);
});

test("the isolated legacy workbench still resolves its matching project, image, and entry", () => {
  for (const project of featuredProjects) {
    const address = `https://zhzhg-dev.github.io/?ref=profile&workbench=${project.slug}#top`;
    assertSelectedProject(renderAt(HeroWorkbench, {}, address), project);
  }
});

test("the isolated legacy workbench safely handles missing, empty, and unknown preview values", () => {
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

test("the personal signature has an accessible server-rendered default without browser globals", () => {
  const html = renderAt(SignatureField);
  const modes = selectionButtons(html);
  assert.deepEqual(modes.map((button) => button.label), ["Think", "Build", "Explain"]);
  assert.ok(modes.every((button) => button.type === "button"));
  assert.deepEqual(modes.filter((button) => button["aria-pressed"] === "true")
    .map((button) => button.label), ["Think"]);
  const groups = [...html.matchAll(/<[a-z][^>]*>/g)].map(([tag]) => attributes(tag));
  assert.ok(groups.some((group) => group.role === "group" && group["aria-label"] === "Ways I work"));
  const svg = html.match(/<svg\b[^>]*>/)?.[0];
  assert.ok(svg, "the two-dimensional signature must be present before browser effects run");
  assert.equal(attributes(svg).viewbox, "0 0 620 520");
  assert.equal(attributes(svg)["aria-hidden"], "true");
  const paths = [...html.matchAll(/<path\b[^>]*>/g)].map(([tag]) => attributes(tag))
    .filter((path) => "data-signature-line" in path);
  assert.equal(paths.length, 48, "the initial interference field should contain its complete line drawing");
  for (const path of paths) {
    assert.ok("data-signature-line" in path);
    assert.match(path.d, /^M[\d.+-]/);
    assert.match(path.d, /\bZ\s*$/, "each server-rendered line should already form a closed curve");
    assert.doesNotMatch(path.d, /NaN|Infinity|undefined/);
    assert.equal(path["vector-effect"], "non-scaling-stroke");
  }
  assert.doesNotMatch(html, /<canvas\b|<filter\b|<meshgradient\b/i);
  assert.ok(elements(html, "figcaption").some((caption) => caption.text.trim()),
    "the decorative line drawing needs an accompanying text explanation");
  const stage = elements(html, "button").find((button) =>
    button.type === "button" && button["aria-label"] === "Change signature, currently Think");
  assert.ok(stage, "the signature must offer a native button for keyboard and touch activation");
  assert.ok(stage["aria-describedby"]);
  assert.equal(elements(html, "p").filter((paragraph) =>
    paragraph.id === stage["aria-describedby"] && paragraph.text.trim()).length, 1);
});

test("Home introduces Grant and personal interests without project screenshots, selectors, or case lists", () => {
  const home = renderAt(App, { page: "home" });
  const text = plainText(home);
  const hero = sectionByClass(home, "personal-hero");
  const intro = plainText(sectionByClass(home, "personal-intro"));
  const focus = sectionByClass(home, "personal-focus");
  assert.ok(elements(hero, "h1").some((heading) => /Grant Zhang/.test(heading.text)));
  assert.match(intro, /mathematical/i);
  assert.match(intro, /Master of Information Technology/);
  assert.match(intro, /Graduate Teaching Assistant/);
  assert.match(text, /University of Auckland/);
  assert.match(text, /Auckland/);
  assert.match(text, /AI products/i);
  assert.match(text, /Game AI/i);
  assert.deepEqual(selectionButtons(focus).map((button) => button.label),
    ["AI products", "Game AI", "Making it clear"]);
  assert.equal(selectionButtons(focus).filter((button) => button["aria-pressed"] === "true").length, 1);
  assert.ok(selectionButtons(focus).every((button) => button.type === "button"));

  for (const project of allProjects) {
    assert.ok(!text.includes(project.title), `Home should not contain the ${project.title} case`);
    assert.ok(![...home.matchAll(/<img\b[^>]*>/g)]
      .some(([tag]) => attributes(tag).src === project.cover), "project images belong on Projects");
  }
  const classes = [...home.matchAll(/<[a-z][^>]*>/g)]
    .flatMap(([tag]) => attributes(tag).class?.split(/\s+/) ?? []);
  for (const obsoleteClass of ["selected-work", "project-showcase", "project-selector", "project-preview"]) {
    assert.ok(!classes.includes(obsoleteClass), "the home page must not reintroduce the project gallery");
  }
  assert.equal(elements(home, "dialog").length, 0);
  assert.ok(elements(home, "a").some((link) => link.href === profileData.profile.linkedin));
  assert.ok(elements(home, "a").some((link) => link.href === profileData.profile.github));
});

test("legacy workbench query parameters do not turn Home back into a project gallery", () => {
  const home = renderAt(App, { page: "home" }, "https://zhzhg-dev.github.io/?workbench=explainlab");
  assert.doesNotMatch(plainText(home), /Folio|ExplainLab|NZ Electricity/);
  assert.equal(elements(home, "dialog").length, 0);
  assert.ok(elements(home, "h1").some((heading) => /Grant Zhang/.test(heading.text)));
});

test("Projects owns three detailed cases and four archive entries with real destinations and native previews", () => {
  const projects = renderAt(App, { page: "projects" });
  const articles = elements(projects, "article");
  assert.equal(featuredProjects.length, 3);
  assert.equal(allProjects.length - featuredProjects.length, 4);
  assert.equal(articles.length, allProjects.length);
  assert.equal(elements(projects, "dialog").length, allProjects.length);
  for (const project of featuredProjects) {
    assertProjectPreview(projects, project);
    assertExplicitProjectLinks(projects, project);
    assert.ok(elements(projects, "article").some((article) => article.id === project.slug),
      "the case-study link must point to an existing project article");
  }
  for (const project of allProjects) {
    assert.ok(plainText(projects).includes(project.title), `Projects should include ${project.title}`);
    assertProjectPreview(projects, project);
    assertExplicitProjectLinks(projects, project);
  }
  const folioCase = articles.find((article) => article.id === "folio");
  assert.ok(folioCase);
  assert.doesNotMatch(folioCase.markup, />\s*(?:View |Open |Try )?(?:live )?demo\s*(?:<|$)/i);
  const ids = [...projects.matchAll(/<[a-z][^>]*>/g)]
    .map(([tag]) => attributes(tag).id).filter(Boolean);
  assert.equal(ids.length, new Set(ids).size, "project cases and preview dialogs must not share DOM ids");
});

test("Experience contains work, education, community, and skills instead of project cases", () => {
  const html = renderAt(App, { page: "experience" });
  const text = plainText(html);
  for (const item of profileData.experience) {
    assert.ok(text.includes(item.role));
    assert.ok(text.includes(item.organisation));
  }
  for (const item of profileData.education) {
    assert.ok(text.includes(item.degree));
    assert.ok(text.includes(item.institution));
  }
  assert.ok(text.includes(profileData.community.title));
  assert.ok(text.includes(profileData.community.distinction));
  for (const skill of profileData.skills) {
    assert.ok(text.includes(skill.category));
    for (const item of skill.items) assert.ok(text.includes(item));
  }
  assert.equal(elements(html, "dialog").length, 0);
  assert.doesNotMatch(text, /Folio|ExplainLab|NZ Electricity/);
});

test("all three pages retain actual route navigation, one primary heading, and accurate public claims", () => {
  const home = renderAt(App, { page: "home" });
  const experience = renderAt(App, { page: "experience" });
  const projects = renderAt(App, { page: "projects" });
  assert.equal(selectionButtons(experience).length, 0);
  assert.equal(selectionButtons(projects).length, 0);
  assert.match(experience, /Graduate Teaching Assistant/);
  assert.doesNotMatch(home, /IELTS Teaching Assistant/);
  assert.match(projects, /Rumour Propagation Simulation/);

  for (const html of [home, experience, projects]) {
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /href="#main-content"/);
    assert.match(html, /id="main-content"/);
    const navigation = elements(html, "nav");
    assert.ok(navigation.length > 0);
    for (const address of ["/", "/experience/", "/projects/"]) {
      assert.ok(navigation.some((nav) => elements(nav.markup, "a")
        .some((link) => link.href === address)), "primary navigation must use real page links");
    }
    assert.doesNotMatch(html, /Tencent|腾讯|Incoming|Open to internship|internship and graduate opportunities/i);
  }
});
