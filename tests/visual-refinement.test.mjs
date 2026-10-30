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

function assertPersonalBackground(html, { complete = true } = {}) {
  const text = plainText(html);
  for (const role of data.experience) {
    const facts = [role.role, role.organisation, role.period, role.summary];
    if (complete) facts.push(...role.points, ...role.tags);
    for (const fact of facts) assert.ok(text.includes(fact), `preserve ${fact}`);
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
    const ids = [...html.matchAll(/<[a-z][^>]*>/g)].map(([tag]) => attributes(tag).id).filter(Boolean);
    assert.equal(ids.length, new Set(ids).size, `${page} has no duplicated section or control identifiers`);
    for (const link of elements(html, "a")) {
      const hash = link.href?.startsWith("#") ? link.href.slice(1)
        : page === "home" && link.href?.startsWith("/#") ? link.href.slice(2) : null;
      if (hash) assert.ok(ids.includes(decodeURIComponent(hash)), `${page} keeps the ${link.href} destination`);
    }
    assert.doesNotMatch(html, /Tencent|腾讯|Incoming|Open to internship|internship and graduate opportunities|Compare with the current website/i);
    assert.equal(elements(html, "form").length, 0, "no nonfunctional contact form should be advertised");
  }
});

test("About introduces Grant and owns personal background without turning into a project catalogue", () => {
  const html = renderAt(App, { page: "home" });
  const text = plainText(html);
  assertPersonalBackground(html, { complete: false });
  for (const fact of ["Grant", "Zhang", "Master of Information Technology", "Graduate Teaching Assistant", "University of Auckland", "Auckland", "AI product", "Mathematics"]) assert.ok(text.includes(fact));
  assert.match(text, /game AI/i);
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => attributes(tag));
  const hero = elements(html, "section").find(section => section.id === "top");
  assert.ok(hero);
  const heroImages = [...hero.markup.matchAll(/<img\b[^>]*>/g)].map(([tag]) => attributes(tag));
  assert.equal(heroImages.length, 1);
  assert.equal(heroImages[0].src, "/studio/grant-daylight-studio-v1.png");
  const contextualImages = images.filter(image => image.src !== heroImages[0].src);
  assert.equal(contextualImages.length, 1, "one quiet supporting illustration is not a second project gallery");
  assert.equal(contextualImages[0].src, "/studio/study-notebook-v1.webp");
  assert.equal(contextualImages[0].loading, "lazy");
  assert.equal(Number(contextualImages[0].width), 760);
  assert.equal(Number(contextualImages[0].height), 507);
  assert.equal(contextualImages[0].alt, "", "the still life does not pretend to be personal documentary evidence");
  for (const project of projects) {
    assert.ok(!images.some(image => image.src === project.cover), "the full project-cover gallery belongs on Projects");
    assert.ok(!text.includes(project.description), `${project.title} complete case stays on Projects`);
  }
  assert.doesNotMatch(html, /studio-projects__grid|studio-project-card__cover/);
  const whiteboards = elements(html, "dialog");
  assert.equal(whiteboards.length, 1, "About has its own closed whiteboard experiment, not a project-case catalogue");
  assert.match(whiteboards[0].markup, /Close whiteboard experiment/);
  assert.doesNotMatch(whiteboards[0].markup.slice(0, whiteboards[0].markup.indexOf(">") + 1), /\sopen(?:\s|=|>)/);
  assert.doesNotMatch(html, /<canvas\b|<iframe\b|<video\b/);
});

test("the compatible Experience address preserves the complete background and selects About", () => {
  const html = renderAt(App, { page: "experience" });
  assertPersonalBackground(html);
  assert.doesNotMatch(plainText(html), /Folio|ExplainLab|NZ Electricity Intelligence/);
  assert.equal(elements(html, "dialog").length, 0);
});

test("About keeps concise personal context and current interests without inventing employment or another navigation tab", () => {
  const html = renderAt(App, { page: "home" });
  const introduction = elements(html, "section").find(section => section.id === "studio-about");
  const now = elements(html, "section").find(section => section["aria-labelledby"] === "studio-now-title");
  assert.ok(introduction && now);
  const personalText = plainText(html).toLowerCase();
  for (const fact of ["cellular automata", "Folio", "ExplainLab", "COMPSCI 111", "Open Lab"]) assert.ok(personalText.includes(fact.toLowerCase()));
  assert.match(now.text, /AI tools people can inspect/);
  assert.match(now.text, /Game AI & simulation/);
  assert.ok(elements(now.markup, "a").some(link => link.href === "/projects/#folio"));
  assert.ok(elements(now.markup, "a").some(link => link.href === "/projects/#learn-to-race"));
  assert.equal(elements(primaryNavigation(html).markup, "a").length, 3);
  assert.doesNotMatch(introduction.markup + now.markup, /<dialog\b|<canvas\b|Tencent|腾讯|Incoming|seeking a role/i);
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
    if (project.cardSummary) assert.ok(card.text.includes(project.cardSummary), "the short card summary makes the project understandable before opening");
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
    if (index < 3) {
      assert.ok(button.markup.includes(`project-cover--${project.slug}`));
      assert.match(button.markup, /class="project-cover__frame"/);
      assert.match(button.markup, /aria-hidden="true"/);
      assert.doesNotMatch(button.markup, /<canvas\b|<video\b|<iframe\b|<input\b/);
    }
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
    if (project.decision && !project.caseStudy) assert.ok(dialog.text.includes(project.decision));
    for (const technology of project.technologies) assert.ok(dialog.text.includes(technology));
    const title = elements(dialog.markup, "h2").find(title => title.id === dialog["aria-labelledby"]);
    assert.equal(title?.text, project.title);
    assert.ok(dialog["aria-describedby"]);
    assert.ok(elements(dialog.markup, "p").some(p => p.id === dialog["aria-describedby"]));
    const figure = elements(dialog.markup, "figure")[0];
    assert.ok(figure, "the case shows the actual image separately from its editorial cover");
    if (/^Abstract\b/i.test(project.coverAlt)) {
      assert.doesNotMatch(figure.text, /Actual interface|this screenshot/);
    }
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

test("four structured cases expose complete, bounded evidence while three editorial covers and compact fallbacks stay distinct", () => {
  assert.deepEqual(projects.filter(project => project.caseStudy).map(project => project.slug), ["folio", "explainlab", "nz-electricity-forecasting", "learn-to-race"]);
  assert.deepEqual(projects.filter(project => project.featured).map(project => project.slug), ["folio", "explainlab", "nz-electricity-forecasting"]);
  for (const project of projects) {
    const html = renderAt(StudioProjects, { projects }, `https://zhzhg-dev.github.io/projects/#${project.slug}`);
    const dialog = elements(html, "dialog")[0];
    if (!project.caseStudy) {
      assert.ok(dialog.text.includes(project.description), "the compact fallback preserves original project facts");
      continue;
    }
    const study = project.caseStudy;
    assert.ok(project.cardSummary && project.cardSummary.length < 100);
    for (const key of ["problem", "contribution", "next"]) {
      assert.ok(study[key].length > 30);
      assert.ok(dialog.text.includes(study[key]), `${project.title} renders ${key}`);
    }
    for (const key of ["decisions", "evidence"]) {
      assert.ok(study[key].length >= 2);
      for (const point of study[key]) {
        assert.ok(point.title.length > 5 && point.body.length > 30);
        assert.ok(dialog.text.includes(point.title));
        assert.ok(dialog.text.includes(point.body));
      }
    }
    const headings = elements(dialog.markup, "h3");
    assert.ok(headings.length >= 5, "problem, contribution, decisions, evidence and next steps are real titled sections");
    assert.equal(new Set(headings.map(heading => heading.text)).size, headings.length);
  }
  const folio = projects.find(project => project.slug === "folio");
  const explainlab = projects.find(project => project.slug === "explainlab");
  const electricity = projects.find(project => project.slug === "nz-electricity-forecasting");
  const folioText = JSON.stringify(folio.caseStudy);
  assert.match(folioText, /optional|enabled separately/i);
  assert.match(folioText, /human|not become verified/i);
  assert.match(folioText, /not.*public demo/i);
  assert.equal(folio.liveUrl, undefined);
  assert.match(JSON.stringify(explainlab.caseStudy), /deterministic/i);
  assert.match(JSON.stringify(explainlab.caseStudy), /not a production benchmark/i);
  const electricityText = JSON.stringify(electricity.caseStudy);
  for (const fact of ["2025 H2", "17.2 MW MAE", "76.9%", "previous-week baseline"]) assert.ok(electricityText.includes(fact));
  assert.match(electricityText, /historical demonstration/);
  assert.match(electricityText, /not a live forecast/);
  assert.doesNotMatch(JSON.stringify(projects), /Tencent|腾讯|Incoming|Open to internship|seeking a role/i);
});

function withGalleryBrowser(callback, { address = "https://zhzhg-dev.github.io/projects/?ref=profile", initialState = { retainedState: "keep me" } } = {}) {
  const listeners = new Map();
  const classes = new Set();
  const writes = [];
  const entries = [{ address, state: initialState }];
  const pending = [];
  let at = 0;
  const browser = {
    location: new URL(address),
    history: {
      get state() { return entries[at].state; },
      get length() { return entries.length; },
      pushState(state, _unused, address) {
        browser.location = new URL(address, browser.location);
        entries.splice(at + 1, entries.length, { address: browser.location.href, state });
        at++;
        writes.push("push");
      },
      replaceState(state, _unused, address) {
        browser.location = new URL(address, browser.location);
        entries[at] = { address: browser.location.href, state };
        writes.push("replace");
      },
      back() { pending.push(-1); writes.push("back"); },
      forward() { pending.push(1); writes.push("forward"); },
      go(delta) { pending.push(delta); writes.push(delta < 0 ? "back" : "forward"); },
    },
    addEventListener(type, listener) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(listener); },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    emit(type) { for (const listener of listeners.get(type) ?? []) listener({ state: browser.history.state }); },
  };
  function flushHistory() {
    while (pending.length) {
      const next = Math.max(0, Math.min(entries.length - 1, at + pending.shift()));
      if (next === at) continue;
      const oldHash = browser.location.hash;
      at = next;
      browser.location = new URL(entries[at].address);
      browser.emit("popstate");
      if (oldHash !== browser.location.hash) browser.emit("hashchange");
    }
  }
  const document = { body: { classList: { add: value => classes.add(value), remove: value => classes.delete(value) } } };
  return withGlobals({ window: browser, document }, () => callback({ browser, classes, writes, listeners, entries, flushHistory, pending, index: () => at }));
}

function mountGallery() {
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
  function close() {
    render().find(node => node.type === "button" && node.props.className === "studio-case__close").props.onClick();
    return render();
  }
  return { fixture, focus, triggers, dialog, render, open, close };
}

test("case controls synchronize native dialog state, preserve query/history, restore focus and clean listeners", () => {
  withGalleryBrowser(({ browser, classes, writes, listeners, flushHistory }) => {
    const { fixture, focus, dialog, render, open } = mountGallery();
    try {
      render();
      assert.equal(dialog.open, false);
      assert.equal([...listeners.values()].reduce((sum, set) => sum + set.size, 0), 2);
      const selected = projects[1];
      dialog.scrollTop = 500;
      let nodes = open(selected);
      assert.equal(dialog.open, true);
      assert.equal(dialog.scrollTop, 0, "opening a case resets the previous reading position");
      assert.ok(classes.has("studio-case-open"));
      assert.ok(treeText(nodes.find(node => node.type === "dialog")).includes(selected.title));
      assert.equal(browser.location.search, "?ref=profile");
      assert.equal(browser.location.hash, `#${selected.slug}`);
      assert.equal(browser.history.state.retainedState, "keep me");
      assert.equal(writes.at(-1), "push");
      dialog.scrollTop = 500;
      open(projects[0]);
      assert.equal(dialog.scrollTop, 0, "switching to another case starts at its introduction");
      nodes = open(selected);
      nodes.find(node => node.type === "button" && node.props.className === "studio-case__close").props.onClick();
      render();
      assert.equal(dialog.open, false);
      assert.equal(writes.at(-1), "back", "an in-page case closes by returning to its actual base entry");
      flushHistory();
      render();
      assert.equal(browser.location.hash, "");
      assert.equal(focus.at(-1), selected.slug);
      assert.ok(!classes.has("studio-case-open"));
      browser.history.replaceState({ ...browser.history.state, unrelated: "still here" }, "", `/projects/?ref=profile#${projects[2].slug}`);
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
      assert.equal(browser.history.state.unrelated, "still here");
      browser.history.replaceState(browser.history.state, "", "/projects/?ref=profile#%E0%A4%A");
      browser.emit("hashchange");
      render();
      assert.equal(dialog.open, false);
    } finally { fixture.dispose(); }
    assert.equal([...listeners.values()].reduce((sum, set) => sum + set.size, 0), 0);
    assert.ok(!classes.has("studio-case-open"));
  });
});

test("repeated opens and closes reuse the base history entry and rapid cover clicks do not stack cases", () => {
  withGalleryBrowser(({ browser, entries, flushHistory, pending, index }) => {
    const gallery = mountGallery();
    try {
      gallery.render();
      for (const project of projects.slice(0, 4)) {
        gallery.open(project);
        assert.equal(index(), 1);
        assert.equal(entries.length, 2);
        gallery.close();
        gallery.close();
        assert.equal(pending.length, 1, "a second close does not request another history traversal");
        assert.equal(gallery.dialog.open, false);
        flushHistory();
        gallery.render();
        assert.equal(index(), 0);
        assert.equal(browser.location.href, "https://zhzhg-dev.github.io/projects/?ref=profile");
        assert.equal(browser.history.state.retainedState, "keep me");
      }
      const buttons = gallery.render().filter(node => node.type === "button" && node.props["aria-haspopup"] === "dialog");
      buttons[0].props.onClick({ currentTarget: gallery.triggers.get(projects[0].slug) });
      buttons[1].props.onClick({ currentTarget: gallery.triggers.get(projects[1].slug) });
      const nodes = gallery.render();
      assert.equal(index(), 1);
      assert.equal(entries.length, 2, "rapid changes replace the owned case entry, not add another one");
      assert.ok(treeText(nodes.find(node => node.type === "dialog")).includes(projects[1].title));
      gallery.close();
      flushHistory();
      gallery.render();
      assert.equal(index(), 0);
      assert.equal(browser.location.hash, "");
    } finally { gallery.fixture.dispose(); }
  });
});

test("Back and Forward restore case selection, query parameters, unrelated state and originating focus", () => {
  withGalleryBrowser(({ browser, flushHistory, index, entries }) => {
    const gallery = mountGallery();
    try {
      gallery.render();
      gallery.open(projects[0]);
      const caseState = browser.history.state;
      browser.history.back();
      flushHistory();
      gallery.render();
      assert.equal(gallery.dialog.open, false);
      assert.equal(gallery.focus.at(-1), projects[0].slug);
      browser.history.forward();
      flushHistory();
      const reopened = gallery.render();
      assert.equal(gallery.dialog.open, true);
      assert.ok(treeText(reopened.find(node => node.type === "dialog")).includes(projects[0].title));
      assert.deepEqual(browser.history.state, caseState);
      assert.equal(browser.history.state.retainedState, "keep me");
      assert.equal(browser.location.search, "?ref=profile");
      assert.equal(index(), 1);
      assert.equal(entries.length, 2);
      gallery.close();
      flushHistory();
      gallery.render();
      assert.equal(index(), 0);
      assert.equal(gallery.focus.at(-1), projects[0].slug);
    } finally { gallery.fixture.dispose(); }
  });
});

test("first-visit or refreshed case deep links close in place even with a stale instance marker", () => {
  for (const oldMarker of [undefined, { owner: "an-earlier-page-instance", slug: "folio", base: "/projects/?ref=shared" }]) {
    withGalleryBrowser(({ browser, entries, writes, pending }) => {
      const gallery = mountGallery();
      try {
        gallery.render();
        assert.equal(gallery.dialog.open, true);
        gallery.close();
        assert.equal(gallery.dialog.open, false);
        assert.deepEqual(writes, ["replace"]);
        assert.equal(pending.length, 0, "never traverse back out of a first-visit deep link");
        assert.equal(entries.length, 1);
        assert.equal(browser.location.href, "https://zhzhg-dev.github.io/projects/?ref=shared");
        assert.deepEqual(browser.history.state.analytics, { visit: 42 });
        assert.equal(gallery.focus.at(-1), "folio");
      } finally { gallery.fixture.dispose(); }
    }, {
      address: "https://zhzhg-dev.github.io/projects/?ref=shared#folio",
      initialState: { analytics: { visit: 42 }, ...(oldMarker ? { grantPortfolioCase: oldMarker } : {}) },
    });
  }
});

test("a cover clicked while close traversal is pending opens only the latest requested case", () => {
  withGalleryBrowser(({ browser, flushHistory, pending, entries, index }) => {
    const gallery = mountGallery();
    try {
      gallery.render();
      gallery.open(projects[0]);
      const beforeClose = gallery.render().find(node => node.type === "dialog");
      gallery.close();
      beforeClose.props.onClose();
      assert.equal(pending.length, 1, "the native close event does not request an extra traversal");
      gallery.open(projects[1]);
      gallery.open(projects[2]);
      assert.equal(pending.length, 1);
      flushHistory();
      const reopened = gallery.render();
      assert.equal(index(), 1);
      assert.equal(entries.length, 2);
      assert.equal(browser.location.hash, `#${projects[2].slug}`);
      assert.ok(treeText(reopened.find(node => node.type === "dialog")).includes(projects[2].title));
      assert.equal(gallery.dialog.open, true);
      assert.equal(browser.history.state.retainedState, "keep me");
      gallery.close();
      flushHistory();
      gallery.render();
      assert.equal(index(), 0);
      assert.equal(gallery.focus.at(-1), projects[2].slug);
    } finally { gallery.fixture.dispose(); }
  });
});

test("dialog keyboard wrapping and backdrop dismissal use the real source handlers", () => {
  withGalleryBrowser(() => {
    const fixture = componentHarness("StudioProjects", { projects });
    let nodes = treeNodes(fixture.render());
    nodes.find(node => node.type === "button" && node.props["aria-haspopup"] === "dialog").props.onClick({ currentTarget: { isConnected: true, focus() {} } });
    nodes = treeNodes(fixture.render());
    const dialog = nodes.find(node => node.type === "dialog");
    assert.ok(nodes.some(node => node.type === "summary" && treeText(node) === "Full project overview"));
    const focused = [];
    const focusSelectors = [];
    const first = { focus() { focused.push("first"); } };
    const last = { focus() { focused.push("last"); } };
    for (const [target, shiftKey, expected] of [[last, false, "first"], [first, true, "last"]]) {
      let prevented = false;
      dialog.props.onKeyDown({ key: "Tab", target, shiftKey, currentTarget: { querySelectorAll: selector => { focusSelectors.push(selector); return [first, last]; } }, preventDefault() { prevented = true; } });
      assert.equal(prevented, true);
      assert.equal(focused.at(-1), expected);
      assert.ok(focusSelectors.at(-1).split(",").map(selector => selector.trim()).includes("summary"), "the native overview toggle participates in keyboard focus wrapping");
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
