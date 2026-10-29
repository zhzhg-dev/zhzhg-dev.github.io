import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { before, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

let PersonalHome;
let FeaturedWork;
let ProjectPreview;
let App;
let featuredProjects;
let allProjects;
let profileData;

// Compile the actual TSX modules in memory; React itself is the normal Node
// dependency. This also works when a checkout shares its parent's node_modules.
const sourceModules = new Map();

function loadSourceModule(filename, { modules = sourceModules, reactHooks } = {}) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = { exports: {} };
  modules.set(filename, loaded);
  const nodeRequire = createRequire(filename);
  const sourceRequire = (specifier) => {
    if (specifier === "react" && reactHooks) return { ...nodeRequire(specifier), ...reactHooks };
    // Component-owned styles are built by Vite, not executed by the SSR test.
    if (specifier.endsWith(".css")) return {};
    if (specifier.startsWith(".")) {
      const base = resolve(dirname(filename), specifier);
      const source = [base, `${base}.tsx`, `${base}.ts`].find(existsSync);
      if (source) return loadSourceModule(source, { modules, reactHooks });
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
  ({ PersonalHome } = loadSourceModule(
    fileURLToPath(new URL("../src/components/PersonalHome.tsx", import.meta.url)),
  ));
  ({ FeaturedWork } = loadSourceModule(
    fileURLToPath(new URL("../src/components/FeaturedWork.tsx", import.meta.url)),
  ));
  ({ ProjectPreview } = loadSourceModule(
    fileURLToPath(new URL("../src/components/ProjectPreview.tsx", import.meta.url)),
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
      value: { location: new URL(address), history: { state: null } },
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

function disclosures(html) {
  const stack = [];
  const entries = [];
  for (const match of html.matchAll(/<\/?details\b[^>]*>/g)) {
    if (!match[0].startsWith("</")) {
      stack.push({ start: match.index, ...attributes(match[0]) });
    } else {
      const opening = stack.pop();
      assert.ok(opening, "every closing disclosure needs an opening element");
      entries.push({ ...opening, markup: html.slice(opening.start, match.index + match[0].length) });
    }
  }
  assert.equal(stack.length, 0, "native disclosures must have balanced markup");
  return entries.sort((a, b) => a.start - b.start);
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

// Exercise the production component's event handlers with isolated hook state.
// This is not a browser substitute: native focus, layout, and dialog behavior
// remain part of browser QA, while these tests check actual state transitions.
function componentHarness(name, props = {}) {
  const slots = [];
  const pendingEffects = new Set();
  let cursor = 0;
  const reactHooks = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, (next) => {
        slots[index].value = typeof next === "function" ? next(slots[index].value) : next;
      }];
    },
    useId() {
      const index = cursor++;
      return `test-${name}-${index}`;
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(callback, dependencies) {
      const index = cursor++;
      const previous = slots[index];
      const changed = !previous || !dependencies || dependencies.length !== previous.dependencies?.length
        || dependencies.some((value, position) => !Object.is(value, previous.dependencies[position]));
      if (changed) {
        slots[index] = { dependencies, callback, cleanup: previous?.cleanup };
        pendingEffects.add(index);
      }
    },
  };
  const component = loadSourceModule(
    fileURLToPath(new URL(`../src/components/${name}.tsx`, import.meta.url)),
    { modules: new Map(), reactHooks },
  )[name];
  return {
    render() { cursor = 0; return component(props); },
    flushEffects() {
      for (const index of pendingEffects) {
        slots[index].cleanup?.();
        slots[index].cleanup = slots[index].callback();
      }
      pendingEffects.clear();
    },
    dispose() {
      for (const slot of slots) slot?.cleanup?.();
      pendingEffects.clear();
    },
  };
}

function treeNodes(node) {
  if (Array.isArray(node)) return node.flatMap(treeNodes);
  if (!node || typeof node !== "object" || !node.props) return [];
  return [node, ...treeNodes(node.props.children)];
}

function treeText(node) {
  if (Array.isArray(node)) return node.map(treeText).join(" ").replace(/\s+/g, " ").trim();
  if (typeof node === "string" || typeof node === "number") return String(node);
  return node?.props ? treeText(node.props.children) : "";
}

function withBrowser(address, callback) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const listeners = new Map();
  const browser = {
    location: new URL(address),
    history: {
      state: { retainedState: "keep me" },
      pushState(state, _unused, address) {
        this.state = state;
        browser.location = new URL(address, browser.location);
      },
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    emit(type) { for (const listener of listeners.get(type) ?? []) listener(); },
    listenerCount() { return [...listeners.values()].reduce((count, entries) => count + entries.size, 0); },
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  try { return callback(browser); }
  finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else delete globalThis.window;
  }
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

test("Folio's working preview links to source rather than inventing a public demo", () => {
  const folio = featuredProjects.find((project) => project.slug === "folio");
  assert.ok(folio?.sourceUrl);
  assert.equal(folio.liveUrl, undefined);
  const html = renderAt(App, { page: "projects" });
  const article = elements(html, "article").find((item) => item.id === folio.slug);
  assert.ok(article);
  assertProjectPreview(article.markup, folio);
  assertExplicitProjectLinks(article.markup, folio);
  assert.doesNotMatch(article.markup, />\s*(?:Open |View |Try )?(?:Live )?demo\s*(?:<|$)/i);
});

test("the text-only introduction has three accessible narrative controls without browser globals", () => {
  const html = renderAt(PersonalHome);
  const modes = selectionButtons(html);
  assert.deepEqual(modes.map((button) => button.label), ["I build.", "I think.", "I explain."]);
  assert.ok(modes.every((button) => button.type === "button"));
  assert.deepEqual(modes.filter((button) => button["aria-pressed"] === "true")
    .map((button) => button.label), ["I build."]);
  const nodes = [...html.matchAll(/<[a-z][^>]*>/g)].map(([tag]) => attributes(tag));
  assert.ok(nodes.some((node) => node.role === "group" && node["aria-label"] === "Ways I work"));
  const regions = nodes.filter((node) => node.role === "region" && node["aria-label"] === "Personal perspective");
  assert.equal(regions.length, 1);
  const panel = regions[0];
  assert.ok(panel.id);
  assert.equal(panel["aria-live"], "polite");
  assert.equal(panel["aria-atomic"], "true");
  assert.ok(modes.every((button) => button["aria-controls"] === panel.id));
  assert.doesNotMatch(html, /<(?:svg|canvas|img|video|iframe)\b/i,
    "Home's personal introduction must remain typographic, without a decorative graphic");
  assert.equal(elements(html, "h1").length, 1);
  assert.match(elements(html, "h1")[0].text, /^Grant Zhang\.?$/);
});

test("the personal narrative buttons switch real text and preserve one selected state", (t) => {
  const harness = componentHarness("PersonalHome");
  t.after(() => harness.dispose());
  const narratives = new Set();
  for (const label of ["I build.", "I think.", "I explain.", "I build."]) {
    const before = treeNodes(harness.render());
    const button = before.find((node) => node.type === "button" && treeText(node) === label);
    assert.ok(button);
    assert.equal(button.props.type, "button");
    assert.equal(typeof button.props.onClick, "function");
    button.props.onClick();
    const nodes = treeNodes(harness.render());
    const selected = nodes.filter((node) => node.type === "button" && node.props["aria-pressed"] === true);
    assert.deepEqual(selected.map(treeText), [label]);
    const panel = nodes.find((node) => node.props.id === selected[0].props["aria-controls"]);
    assert.ok(panel);
    const narrative = treeText(panel);
    assert.ok(narrative.length > 40, "every mode needs a real personal explanation");
    assert.doesNotMatch(narrative, /Tencent|腾讯|Incoming|seeking|looking for (?:a|an) (?:role|internship)/i);
    narratives.add(narrative);
  }
  assert.equal(narratives.size, 3, "the three controls must expose distinct personal narratives");
});

test("Home introduces Grant and personal interests without project screenshots, selectors, or case lists", () => {
  const home = renderAt(App, { page: "home" });
  const text = plainText(home);
  assert.equal(elements(home, "h1").length, 1);
  assert.match(elements(home, "h1")[0].text, /^Grant Zhang\.?$/);
  assert.match(text, /mathematics|mathematical/i);
  assert.match(text, /Master of Information Technology/);
  assert.match(text, /Graduate Teaching Assistant/);
  assert.match(text, /University of Auckland/);
  assert.match(text, /Auckland/);
  assert.match(text, /AI product/i);
  assert.match(text, /Game AI/i);
  assert.deepEqual(selectionButtons(home).map((button) => button.label),
    ["I build.", "I think.", "I explain."]);
  assert.equal(selectionButtons(home).filter((button) => button["aria-pressed"] === "true").length, 1);
  assert.ok(selectionButtons(home).every((button) => button.type === "button"));

  for (const project of allProjects) {
    assert.ok(!text.includes(project.title), `Home should not contain the ${project.title} case`);
    assert.ok(![...home.matchAll(/<img\b[^>]*>/g)]
      .some(([tag]) => attributes(tag).src === project.cover), "project images belong on Projects");
  }
  const classes = [...home.matchAll(/<[a-z][^>]*>/g)]
    .flatMap(([tag]) => attributes(tag).class?.split(/\s+/) ?? []);
  for (const obsoleteClass of ["selected-work", "project-showcase", "project-selector", "project-preview", "signature-field", "personal-hero__art"]) {
    assert.ok(!classes.includes(obsoleteClass), "the home page must not reintroduce the project gallery");
  }
  assert.equal(elements(home, "dialog").length, 0);
  assert.doesNotMatch(renderAt(PersonalHome), /<(?:svg|canvas|img|video|iframe)\b/i);
  for (const address of ["/experience/", "/projects/"]) {
    assert.ok(elements(renderAt(PersonalHome), "a").some((link) => link.href === address));
  }
  assert.ok(elements(home, "a").some((link) => link.href === profileData.profile.linkedin));
  assert.ok(elements(home, "a").some((link) => link.href === profileData.profile.github));
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

test("the featured project index uses native disclosures with only the first case open by default", () => {
  const html = renderAt(FeaturedWork, { projects: featuredProjects, detailed: true });
  const cases = disclosures(html).filter((item) => item.class?.split(/\s+/).includes("feature-case__disclosure"));
  assert.equal(cases.length, featuredProjects.length);
  assert.deepEqual(cases.filter((item) => "open" in item).map((item) => item.id),
    [`${featuredProjects[0].slug}-case`]);
  for (const project of featuredProjects) {
    const article = elements(html, "article").find((item) => item.id === project.slug);
    const disclosure = cases.find((item) => item.id === `${project.slug}-case`);
    assert.ok(article && disclosure);
    const summary = elements(disclosure.markup, "summary")[0];
    assert.ok(summary?.text.includes(project.title));
    assert.ok(summary.text.includes(project.status));
    assert.doesNotMatch(summary.markup, /<(?:a|button|input|select|textarea|img)\b/,
      "a case summary must remain one native click/keyboard target, not a nested set of actions");
    assertProjectPreview(disclosure.markup, project);
    assertExplicitProjectLinks(article.markup.replace(disclosure.markup, ""), project);
  }
});

test("project hash links open the requested case and malformed links safely fall back", () => {
  for (const project of featuredProjects) {
    const html = renderAt(FeaturedWork, { projects: featuredProjects, detailed: true },
      `https://zhzhg-dev.github.io/projects/?ref=profile#${project.slug}`);
    assert.deepEqual(disclosures(html).filter((item) => item.id && "open" in item).map((item) => item.id),
      [`${project.slug}-case`]);
  }
  for (const hash of ["", "#not-a-project", "#constructor", "#%E0%A4%A"]) {
    const html = renderAt(FeaturedWork, { projects: featuredProjects, detailed: true },
      `https://zhzhg-dev.github.io/projects/${hash}`);
    assert.deepEqual(disclosures(html).filter((item) => item.id && "open" in item).map((item) => item.id),
      [`${featuredProjects[0].slug}-case`]);
  }
});

test("project disclosure clicks and history navigation preserve the URL and restore open or closed state", () => {
  withBrowser("https://zhzhg-dev.github.io/projects/?ref=profile", (browser) => {
    const harness = componentHarness("FeaturedWork", { projects: featuredProjects, detailed: true });
    const openCases = () => treeNodes(harness.render())
      .filter((node) => node.type === "details" && node.props.id && node.props.open)
      .map((node) => node.props.id);
    const clickCase = (project) => {
      const summary = treeNodes(harness.render()).find((node) =>
        node.type === "summary" && treeText(node).includes(project.title));
      assert.ok(summary);
      let prevented = false;
      summary.props.onClick({ preventDefault() { prevented = true; } });
      assert.ok(prevented, "the controlled disclosure must avoid a second native toggle");
    };
    try {
      assert.deepEqual(openCases(), [`${featuredProjects[0].slug}-case`]);
      harness.flushEffects();
      assert.equal(browser.listenerCount(), 2);
      clickCase(featuredProjects[1]);
      assert.deepEqual(openCases(), [`${featuredProjects[1].slug}-case`]);
      assert.equal(browser.location.pathname, "/projects/");
      assert.equal(browser.location.search, "?ref=profile");
      assert.equal(browser.location.hash, `#${featuredProjects[1].slug}`);
      assert.equal(browser.history.state.retainedState, "keep me");
      assert.equal(browser.history.state.portfolioProject, featuredProjects[1].slug);

      clickCase(featuredProjects[1]);
      assert.deepEqual(openCases(), []);
      assert.equal(browser.location.hash, "");
      assert.equal(browser.history.state.portfolioProject, "");
      browser.emit("popstate");
      assert.deepEqual(openCases(), [], "history must preserve an intentionally collapsed index");

      browser.location.hash = featuredProjects[2].slug;
      browser.emit("hashchange");
      assert.deepEqual(openCases(), [`${featuredProjects[2].slug}-case`]);
      browser.location.hash = featuredProjects[0].slug;
      browser.emit("popstate");
      assert.deepEqual(openCases(), [`${featuredProjects[0].slug}-case`]);
    } finally {
      harness.dispose();
    }
    assert.equal(browser.listenerCount(), 0, "unmount must remove both history listeners");
  });
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
