import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const repository = fileURLToPath(new URL("../", import.meta.url));

// Load the actual source in memory. CSS is exercised by Vite and browser QA,
// not by this isolated SSR/state harness.
function loadSource(filename, hooks, cache = new Map()) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const requireNode = createRequire(filename);
  const requireSource = (specifier) => {
    if (specifier === "react" && hooks) return { ...requireNode(specifier), ...hooks };
    if (specifier.endsWith(".css")) return {};
    if (specifier.startsWith(".")) {
      const base = resolve(dirname(filename), specifier);
      const found = [base, `${base}.tsx`, `${base}.ts`].find(existsSync);
      if (found) return loadSource(found, hooks, cache);
    }
    return requireNode(specifier);
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
  new Function("require", "module", "exports", outputText)(requireSource, module, module.exports);
  return module.exports;
}

const { default: App } = loadSource(resolve(repository, "src/App.tsx"));
const { StudioHome } = loadSource(resolve(repository, "src/components/StudioHome.tsx"));

function browserAt(address, callback, matchMedia = () => ({ matches: false })) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  if (address) {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: new URL(address), history: { state: null }, matchMedia },
    });
  } else delete globalThis.window;
  try { return callback(); }
  finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else delete globalThis.window;
  }
}

function renderPage(page, address) {
  return browserAt(address, () => renderToStaticMarkup(createElement(App, { page })));
}

function plainText(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !node.props) return [];
  return [node, ...nodes(node.props.children)];
}

function textOf(node) {
  if (Array.isArray(node)) return node.map(textOf).join(" ").replace(/\s+/g, " ").trim();
  if (typeof node === "string" || typeof node === "number") return String(node);
  return node?.props ? textOf(node.props.children) : "";
}

function studioHarness() {
  const slots = [];
  let cursor = 0;
  const hooks = {
    useId() { return `studio-test-${cursor++}`; },
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, (next) => {
        slots[index].value = typeof next === "function" ? next(slots[index].value) : next;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: initial };
      return slots[index];
    },
  };
  const Component = loadSource(resolve(repository, "src/components/StudioHome.tsx"), hooks).StudioHome;
  return () => { cursor = 0; return Component(); };
}

test("the studio introduction is the default About design with or without query parameters", () => {
  const defaultHtml = renderPage("home");
  assert.match(defaultHtml, /class="studio-hero"/);
  assert.match(defaultHtml, /class="portfolio-shell studio-site"/);
  for (const search of ["", "?v=93d0796", "?design=Studio", "?design=unknown", "?design=studio&ref=preview"]) {
    const html = renderPage("home", `https://zhzhg-dev.github.io/${search}`);
    assert.match(html, /class="studio-hero"/);
    assert.match(html, /class="portfolio-shell studio-site"/);
    assert.doesNotMatch(html, /personal-home__hero|Compare with the current website/);
  }
});

test("all pages share the studio system while independent page responsibilities remain intact", () => {
  for (const page of ["experience", "projects", "contact"]) {
    const html = renderPage(page, `https://zhzhg-dev.github.io/${page}/?design=studio`);
    assert.match(html, /class="portfolio-shell studio-site"/);
    assert.doesNotMatch(html, /class="studio-hero"/);
    assert.match(html, new RegExp(`class="page-${page}"`));
  }
  const html = renderPage("home", "https://zhzhg-dev.github.io/");
  for (const href of ["/", "/projects/", "/contact/"]) {
    assert.ok(html.includes(`href="${href}"`), `keep the actual ${href} route`);
  }
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /href="#main-content"/);
  assert.match(html, /id="main-content"/);
  assert.match(html, /href="#studio-about"/);
  assert.match(html, /id="studio-about"/);
  assert.doesNotMatch(html, /Compare with the current website/);
});

test("the illustrated introduction preserves current personal facts and one meaningful hero image", () => {
  const html = renderToStaticMarkup(createElement(StudioHome));
  const text = plainText(html);
  assert.match(text, /Grant\s+Zhang\s*\./);
  for (const fact of ["Master of Information Technology", "Graduate Teaching Assistant", "University of Auckland", "Mathematics", "AI product"]) {
    assert.ok(text.toLowerCase().includes(fact.toLowerCase()), `preserve ${fact}`);
  }
  assert.doesNotMatch(text, /Tencent|腾讯|Incoming|Open to internship|seeking|looking for (?:a|an) (?:role|internship)/i);
  assert.doesNotMatch(text, /David Heckhoff|Dennis Snellenberg|production-ready|award-winning/i);
  assert.equal((html.match(/<img\b/g) || []).length, 1);
  assert.match(html, /src="\/studio\/grant-daylight-studio-v1\.png"/);
  assert.match(html, /width="1448"/);
  assert.match(html, /height="1086"/);
  assert.match(html, /fetchPriority="high"|fetchpriority="high"/);
  assert.match(html, /alt="[^\"]*(?:workspace|studio)[^\"]*"/i);
  assert.doesNotMatch(html, /loading="lazy"|<canvas\b|<iframe\b|<video\b/);
  assert.match(html, /<aside\b[^>]*aria-label="Workspace detail"[^>]*hidden=""/);
});

test("the studio illustration is a local transparent PNG with the declared intrinsic dimensions", () => {
  const asset = readFileSync(resolve(repository, "public/studio/grant-daylight-studio-v1.png"));
  assert.deepEqual([...asset.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(asset.toString("ascii", 12, 16), "IHDR");
  assert.equal(asset.readUInt32BE(16), 1448);
  assert.equal(asset.readUInt32BE(20), 1086);
  assert.equal(asset[25], 6, "RGBA preserves generated transparency instead of painting a rectangular background");
  assert.ok(asset.length < 3 * 1024 * 1024, "the single illustrated scene stays under 3 MiB");
});

test("the screen and window workspace notes preserve their real content and close or Escape restores trigger focus", () => {
  const render = studioHarness();
  const targets = [
    ["At the screen", "From an idea to something useful.", "/projects/"],
    ["Out the window", "Auckland, New Zealand.", "/#studio-about"],
  ];
  const initial = nodes(render());
  const initialAside = initial.find(node => node.type === "aside");
  assert.equal(initialAside.props.hidden, true);
  assert.equal(initialAside.props["aria-live"], "polite");
  assert.ok(initial.some(node => node.props.role === "group" && node.props["aria-label"] === "Explore my illustrated workspace"));
  for (const [label, title, href] of targets) {
    let focused = 0;
    const trigger = { focus() { focused++; } };
    const button = nodes(render()).find(node => node.type === "button" && node.props["aria-label"] === label);
    assert.equal(button.props.type, "button");
    assert.equal(button.props["aria-controls"], initialAside.props.id);
    assert.equal(typeof button.props.onClick, "function");
    button.props.onClick({ currentTarget: trigger });
    let current = nodes(render());
    let aside = current.find(node => node.type === "aside");
    assert.equal(aside.props.hidden, false);
    assert.ok(textOf(aside).includes(title));
    assert.ok(current.some(node => node.type === "a" && node.props.href === href));
    const selected = current.filter(node => node.type === "button" && node.props["aria-pressed"]);
    assert.deepEqual(selected.map(node => node.props["aria-label"]), [label]);
    assert.equal(selected[0].props["aria-expanded"], true);
    const close = current.find(node => node.type === "button" && node.props["aria-label"] === "Close workspace detail");
    assert.equal(close.props.type, "button");
    close.props.onClick();
    assert.equal(nodes(render()).find(node => node.type === "aside").props.hidden, true);
    assert.equal(focused, 1);

    nodes(render()).find(node => node.type === "button" && node.props["aria-label"] === label).props.onClick({ currentTarget: trigger });
    current = nodes(render());
    const section = current.find(node => node.type === "section" && node.props.id === "top");
    let prevented = false;
    section.props.onKeyDown({ key: "Escape", preventDefault() { prevented = true; } });
    assert.ok(prevented);
    assert.equal(nodes(render()).find(node => node.type === "aside").props.hidden, true);
    assert.equal(focused, 2);
  }

  const sameButton = nodes(render()).find(node => node.type === "button" && node.props["aria-label"] === targets[0][0]);
  sameButton.props.onClick({ currentTarget: { focus() {} } });
  nodes(render()).find(node => node.type === "button" && node.props["aria-label"] === targets[0][0]).props.onClick({ currentTarget: { focus() {} } });
  assert.equal(nodes(render()).find(node => node.type === "aside").props.hidden, true, "pressing the active hotspot again closes its note");
});

test("pointer response is bounded and disabled for touch or reduced motion", () => {
  let fine = true;
  let reduce = false;
  browserAt("https://zhzhg-dev.github.io/?design=studio", () => {
    const render = studioHarness();
    const tree = nodes(render());
    const movement = tree.find(node => node.props.className === "studio-scene__movement");
    const changes = new Map();
    movement.props.ref.current = { style: { setProperty(name, value) { changes.set(name, value); } } };
    const scene = tree.find(node => node.props.className === "studio-scene");
    const event = {
      currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) },
      clientX: 500,
      clientY: 500,
    };
    scene.props.onPointerMove(event);
    assert.equal(changes.get("--scene-x"), "6px");
    assert.equal(changes.get("--scene-y"), "4px");
    scene.props.onPointerMove({ ...event, clientX: -500, clientY: -500 });
    assert.equal(changes.get("--scene-x"), "-6px");
    assert.equal(changes.get("--scene-y"), "-4px");
    scene.props.onPointerLeave();
    assert.equal(changes.get("--scene-x"), "0px");
    assert.equal(changes.get("--scene-y"), "0px");
    changes.clear();
    fine = false;
    scene.props.onPointerMove(event);
    assert.equal(changes.size, 0);
    fine = true;
    reduce = true;
    scene.props.onPointerMove(event);
    assert.equal(changes.size, 0);
  }, query => ({ matches: query.includes("prefers-reduced-motion") ? reduce : fine }));
});

test("the studio layout has explicit mobile, keyboard-focus and reduced-motion treatment", () => {
  const css = readFileSync(resolve(repository, "src/components/studio-home.css"), "utf8");
  const globalCss = readFileSync(resolve(repository, "src/styles.css"), "utf8");
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.studio-scene__movement\s*\{[^}]*transform:\s*none;[^}]*transition:\s*none;/);
  assert.match(css, /\.studio-note\[hidden\]\s*\{\s*display:\s*none;/);
  assert.match(css, /\.studio-hotspot:focus-visible/);
  assert.match(globalCss, /:focus-visible/);
  assert.match(css, /object-fit:\s*contain/);
  assert.doesNotMatch(css, /animation:\s*[^;]*(?:infinite)/);
});
