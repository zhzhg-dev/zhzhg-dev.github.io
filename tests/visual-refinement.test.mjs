import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { loadSource, repository, renderAt, plainText, attributes, elements, componentHarness, treeNodes, treeText, withGlobals } from "./support/source-harness.mjs";

const { default: App } = loadSource(resolve(repository, "src/App.tsx"));
const { StudioProjects } = loadSource(resolve(repository, "src/components/StudioProjects.tsx"));
const data = loadSource(resolve(repository, "src/data/profile.ts"));
const { projects, profile } = data;

function primaryNavigation(html) {
  return elements(html, "nav").find(nav => nav["aria-label"] === "Primary navigation");
}

function assertPersonalBackground(html) {
  const text = plainText(html);
  for (const role of data.experience) {
    for (const fact of [role.role, role.organisation, role.period, role.summary, ...role.points]) assert.ok(text.includes(fact), `preserve ${fact}`);
  }
  for (const item of data.education) {
    for (const fact of [item.degree, item.institution, item.period, item.detail]) assert.ok(text.includes(fact));
  }
  for (const fact of Object.values(data.community)) assert.ok(text.includes(fact));
  for (const group of data.skills) {
    assert.ok(text.includes(group.category));
    for (const skill of group.items) assert.ok(text.includes(skill));
  }
  for (const id of ["work-title", "education-title", "community-title", "toolkit-title"]) assert.ok(html.includes(`id="${id}"`));
}

test("all routes expose the same three real tabs, exactly one active tab and one primary heading", () => {
  for (const page of ["home", "projects", "contact", "experience"]) {
    const html = renderAt(App, { page });
    const nav = primaryNavigation(html);
    assert.ok(nav);
    const links = elements(nav.markup, "a");
    assert.deepEqual(links.map(link => [link.text, link.href]), [["About", "/"], ["Projects", "/projects/"], ["Contact", "/contact/"]]);
    const selected = links.filter(link => link["aria-current"] === "page");
    assert.equal(selected.length, 1);
    assert.equal(selected[0].text, page === "projects" ? "Projects" : page === "contact" ? "Contact" : "About");
    assert.equal(elements(html, "h1").length, 1);
    assert.match(html, /class="portfolio-shell studio-site"/);
    assert.match(html, /href="#main-content"/);
    assert.match(html, /id="main-content"/);
    assert.match(html, /id="top"/);
    assert.doesNotMatch(html, /Tencent|腾讯|Incoming|Open to internship|internship and graduate opportunities|Compare with the current website/i);
    assert.equal(elements(html, "form").length, 0, "no nonfunctional contact form should be advertised");
  }
});

test("About introduces Grant and owns personal background without turning into a project catalogue", () => {
  const html = renderAt(App, { page: "home" });
  const text = plainText(html);
  assertPersonalBackground(html);
  for (const fact of ["Grant", "Zhang", "Master of Information Technology", "Graduate Teaching Assistant", "University of Auckland", "Auckland", "AI product", "Mathematics"]) assert.ok(text.includes(fact));
  assert.match(text, /game AI/i);
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => attributes(tag));
  assert.equal(images.length, 1);
  assert.equal(images[0].src, "/studio/grant-daylight-studio-v1.png");
  for (const project of projects) {
    assert.ok(!images.some(image => image.src === project.cover), "project thumbnails belong on Projects");
    assert.ok(!text.includes(project.title), `${project.title} case stays on Projects`);
  }
  assert.equal(elements(html, "dialog").length, 0);
  assert.doesNotMatch(html, /<canvas\b|<iframe\b|<video\b/);
});

test("the compatible Experience address preserves the complete background and selects About", () => {
  const html = renderAt(App, { page: "experience" });
  assertPersonalBackground(html);
  assert.doesNotMatch(plainText(html), /Folio|ExplainLab|NZ Electricity Intelligence/);
  assert.equal(elements(html, "dialog").length, 0);
});

test("Contact has actual professional destinations and no invented address, form or project catalogue", () => {
  const html = renderAt(App, { page: "contact" });
  assert.ok(plainText(html).includes("Let’s talk."));
  assert.match(plainText(html), /Auckland, New Zealand/);
  const links = elements(html, "a");
  for (const target of [profile.linkedin, profile.github]) {
    const link = links.find(link => link.href === target);
    assert.ok(link?.text);
    assert.equal(link.target, "_blank");
    assert.ok(link.rel?.split(/\s+/).some(value => ["noopener", "noreferrer"].includes(value)));
  }
  assert.doesNotMatch(html, /<form\b|<input\b|<textarea\b|mailto:|@gmail\.com|studio-project-card/);
});

test("Projects owns all seven covers with accessible case triggers and explicit external actions", () => {
  const html = renderAt(App, { page: "projects" });
  const cards = elements(html, "article");
  assert.equal(projects.length, 7);
  assert.equal(cards.length, projects.length);
  assert.equal(elements(html, "dialog").length, 1, "one native dialog hosts the selected case");
  const dialog = elements(html, "dialog")[0];
  assert.ok(dialog.id);
  assert.ok(dialog["aria-labelledby"]);
  assert.doesNotMatch(dialog.markup.slice(0, dialog.markup.indexOf(">") + 1), /\sopen(?:\s|=|>)/);
  for (const [index, project] of projects.entries()) {
    const card = cards.find(card => card.id === project.slug);
    assert.ok(card, `${project.title} retains its deep-link identifier`);
    assert.ok(card.text.includes(project.title));
    const button = elements(card.markup, "button")[0];
    assert.equal(button.type, "button");
    assert.equal(button["aria-label"], `Explore ${project.title} case study`);
    assert.equal(button["aria-haspopup"], "dialog");
    assert.equal(button["aria-controls"], dialog.id);
    assert.doesNotMatch(button.markup, /<a\b/);
    const image = attributes(button.markup.match(/<img\b[^>]*>/)?.[0] ?? "");
    assert.equal(image.src, project.cover);
    assert.equal(image.alt, project.coverAlt);
    assert.equal(Number(image.width), project.coverWidth);
    assert.equal(Number(image.height), project.coverHeight);
    assert.equal(image.loading, index < 3 ? "eager" : "lazy");
    for (const target of [project.liveUrl, project.sourceUrl].filter(Boolean)) {
      const link = elements(card.markup, "a").find(link => link.href === target);
      assert.ok(link?.text, "the demo/source remains a separately named text link");
      assert.equal(link.target, "_blank");
      assert.ok(link.rel?.includes("noreferrer"));
    }
  }
  const folio = cards.find(card => card.id === "folio");
  assert.ok(elements(folio.markup, "a").some(link => link.href === "https://github.com/zhzhg-dev/folio"));
  assert.doesNotMatch(folio.markup, /Live demo/);
  assert.ok(elements(html, "a").some(link => link.href === "/contact/" && link.text.includes("Have an idea?")));
  const ids = [...html.matchAll(/<[a-z][^>]*>/g)].map(([tag]) => attributes(tag).id).filter(Boolean);
  assert.equal(ids.length, new Set(ids).size);
});

test("valid case hashes render the matching full evidence and malformed hashes leave an empty dialog", () => {
  for (const project of projects) {
    const html = renderAt(StudioProjects, { projects }, `https://zhzhg-dev.github.io/projects/?ref=profile#${project.slug}`);
    const dialog = elements(html, "dialog")[0];
    assert.ok(dialog.text.includes(project.title));
    assert.ok(dialog.text.includes(project.description));
    if (project.decision) assert.ok(dialog.text.includes(project.decision));
    for (const technology of project.technologies) assert.ok(dialog.text.includes(technology));
    const title = elements(dialog.markup, "h2").find(title => title.id === dialog["aria-labelledby"]);
    assert.equal(title?.text, project.title);
    assert.ok(dialog["aria-describedby"]);
    assert.ok(elements(dialog.markup, "p").some(p => p.id === dialog["aria-describedby"]));
    if (project.slug === "folio") {
      assert.ok(dialog.text.includes("Working preview"));
      assert.doesNotMatch(dialog.markup, /Live demo/);
    }
  }
  for (const hash of ["", "#not-a-project", "#constructor", "#%E0%A4%A"]) {
    const html = renderAt(StudioProjects, { projects }, `https://zhzhg-dev.github.io/projects/${hash}`);
    const dialog = elements(html, "dialog")[0];
    assert.ok(dialog.text.includes("Project details"));
    assert.equal(dialog["aria-describedby"], undefined);
  }
});

function withGalleryBrowser(callback) {
  const listeners = new Map();
  const classes = new Set();
  const writes = [];
  const browser = {
    location: new URL("https://zhzhg-dev.github.io/projects/?ref=profile"),
    history: {
      state: { retainedState: "keep me" },
      pushState(state, _unused, address) { this.state = state; browser.location = new URL(address, browser.location); writes.push("push"); },
      replaceState(state, _unused, address) { this.state = state; browser.location = new URL(address, browser.location); writes.push("replace"); },
    },
    addEventListener(type, listener) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(listener); },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    emit(type) { for (const listener of listeners.get(type) ?? []) listener(); },
  };
  const document = { body: { classList: { add: value => classes.add(value), remove: value => classes.delete(value) } } };
  return withGlobals({ window: browser, document }, () => callback({ browser, classes, writes, listeners }));
}

test("case controls synchronize native dialog state, preserve query/history, restore focus and clean listeners", () => {
  withGalleryBrowser(({ browser, classes, writes, listeners }) => {
    const fixture = componentHarness("StudioProjects", { projects });
    const focus = [];
    const triggers = new Map(projects.map(project => [project.slug, { isConnected: true, focus() { focus.push(project.slug); } }]));
    const dialog = { open: false, showModal() { this.open = true; }, close() { this.open = false; } };
    function render() {
      const nodes = treeNodes(fixture.render());
      for (const node of nodes) {
        if (node.type === "dialog") node.props.ref.current = dialog;
        else if (node.type === "button" && node.props.className === "studio-case__close") node.props.ref.current = { focus() { focus.push("close"); } };
        else if (node.type === "button" && node.props["aria-haspopup"] === "dialog") {
          const project = projects.find(project => node.props["aria-label"] === `Explore ${project.title} case study`);
          node.props.ref(triggers.get(project.slug));
        }
      }
      fixture.flushEffects();
      return nodes;
    }
    function open(project) {
      const button = render().find(node => node.type === "button" && node.props["aria-label"] === `Explore ${project.title} case study`);
      button.props.onClick({ currentTarget: triggers.get(project.slug) });
      return render();
    }
    try {
      render();
      assert.equal(dialog.open, false);
      assert.equal([...listeners.values()].reduce((sum, set) => sum + set.size, 0), 2);
      const selected = projects[1];
      let nodes = open(selected);
      assert.equal(dialog.open, true);
      assert.ok(classes.has("studio-case-open"));
      assert.ok(treeText(nodes.find(node => node.type === "dialog")).includes(selected.title));
      assert.equal(browser.location.search, "?ref=profile");
      assert.equal(browser.location.hash, `#${selected.slug}`);
      assert.equal(browser.history.state.retainedState, "keep me");
      assert.equal(browser.history.state.studioProject, selected.slug);
      assert.equal(writes.at(-1), "push");
      nodes.find(node => node.type === "button" && node.props.className === "studio-case__close").props.onClick();
      render();
      assert.equal(dialog.open, false);
      assert.equal(browser.location.hash, "");
      assert.equal(writes.at(-1), "replace");
      assert.equal(focus.at(-1), selected.slug);
      assert.ok(!classes.has("studio-case-open"));
      browser.location.hash = projects[2].slug;
      browser.emit("popstate");
      nodes = render();
      assert.equal(dialog.open, true);
      assert.ok(treeText(nodes.find(node => node.type === "dialog")).includes(projects[2].title));
      let prevented = false;
      nodes.find(node => node.type === "dialog").props.onCancel({ preventDefault() { prevented = true; } });
      render();
      assert.equal(prevented, true);
      assert.equal(dialog.open, false);
      assert.equal(focus.at(-1), projects[2].slug);
      browser.location.hash = "%E0%A4%A";
      browser.emit("hashchange");
      render();
      assert.equal(dialog.open, false);
    } finally { fixture.dispose(); }
    assert.equal([...listeners.values()].reduce((sum, set) => sum + set.size, 0), 0);
    assert.ok(!classes.has("studio-case-open"));
  });
});

test("dialog keyboard wrapping and backdrop dismissal use the real source handlers", () => {
  withGalleryBrowser(() => {
    const fixture = componentHarness("StudioProjects", { projects });
    let nodes = treeNodes(fixture.render());
    nodes.find(node => node.type === "button" && node.props["aria-haspopup"] === "dialog").props.onClick({ currentTarget: { isConnected: true, focus() {} } });
    nodes = treeNodes(fixture.render());
    const dialog = nodes.find(node => node.type === "dialog");
    const focused = [];
    const first = { focus() { focused.push("first"); } };
    const last = { focus() { focused.push("last"); } };
    for (const [target, shiftKey, expected] of [[last, false, "first"], [first, true, "last"]]) {
      let prevented = false;
      dialog.props.onKeyDown({ key: "Tab", target, shiftKey, currentTarget: { querySelectorAll: () => [first, last] }, preventDefault() { prevented = true; } });
      assert.equal(prevented, true);
      assert.equal(focused.at(-1), expected);
    }
    const target = { getBoundingClientRect: () => ({ left: 10, top: 10, right: 100, bottom: 100 }) };
    dialog.props.onClick({ target, currentTarget: target, clientX: 50, clientY: 50 });
    assert.ok(treeText(treeNodes(fixture.render()).find(node => node.type === "dialog")).includes(projects[0].title), "inside padding must not dismiss the case");
    dialog.props.onClick({ target, currentTarget: target, clientX: 5, clientY: 5 });
    assert.ok(treeText(treeNodes(fixture.render()).find(node => node.type === "dialog")).includes("Project details"));
    fixture.dispose();
  });
});

test("project layout defines three, two and one column modes with reduced-motion and focus support", () => {
  const css = readFileSync(resolve(repository, "src/components/studio-projects.css"), "utf8");
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /@media\s*\(max-width:\s*600px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /min-height:\s*44px/);
});
