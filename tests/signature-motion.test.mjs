import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const filename = fileURLToPath(new URL("../src/components/SignatureField.tsx", import.meta.url));
const nodeRequire = createRequire(import.meta.url);
const productionSource = readFileSync(filename, "utf8");
const signatureCss = readFileSync(new URL("../src/components/signature-field.css", import.meta.url), "utf8");
// Expose private functions only in this in-memory compilation. Tests execute the
// production path builder and lifecycle code, without changing the shipped API.
const source = productionSource + "\nexport { mountSignature, buildSignaturePaths };\n";
const { outputText } = ts.transpileModule(source, {
  fileName: filename,
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
});

function listeners() {
  const entries = new Map();
  return {
    entries,
    addEventListener(type, callback) {
      if (!entries.has(type)) entries.set(type, new Set());
      entries.get(type).add(callback);
    },
    removeEventListener(type, callback) {
      entries.get(type)?.delete(callback);
    },
    emit(type) {
      for (const callback of [...(entries.get(type) ?? [])]) callback();
    },
    count() {
      return [...entries.values()].reduce((total, callbacks) => total + callbacks.size, 0);
    },
  };
}

function harness({ reduced = false, finePointer = true } = {}) {
  let now = 0;
  let nextFrame = 1;
  let pathWrites = 0;
  const pending = new Map();
  const intersectionObservers = [];
  const media = { ...listeners(), matches: reduced };
  const document = { ...listeners(), hidden: false };
  const stage = {};
  // Keep the actual SVG d values. No raster context, DPR, resize observer,
  // mesh, or projection substitute is supplied to this planar renderer.
  const lines = Array.from({ length: 48 }, () => ({
    d: "",
    setAttribute(name, value) {
      assert.equal(name, "d", "the signature engine should update planar paths");
      this.d = value;
      pathWrites++;
    },
  }));
  const svg = {
    querySelectorAll(selector) {
      assert.equal(selector, "[data-signature-line]");
      return lines;
    },
  };
  class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      intersectionObservers.push(this);
    }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    emit(isIntersecting) {
      if (!this.disconnected) this.callback([{ isIntersecting }]);
    }
  }
  const loaded = { exports: {} };
  const sandbox = createContext({
    module: loaded,
    exports: loaded.exports,
    require: (specifier) => specifier.endsWith(".css") ? {} : nodeRequire(specifier),
    window: {
      matchMedia: (query) => query.includes("prefers-reduced-motion")
        ? media : { matches: finePointer },
    },
    document,
    performance: { now: () => now },
    requestAnimationFrame(callback) {
      const id = nextFrame++;
      pending.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => pending.delete(id),
    IntersectionObserver,
  });
  runInContext(outputText, sandbox, { filename });
  const engine = loaded.exports.mountSignature(svg, stage);
  return {
    engine,
    pending,
    document,
    media,
    intersectionObservers,
    exports: loaded.exports,
    paths: () => lines.map((line) => line.d),
    expected: (mode, pointer) => Array.from(loaded.exports.buildSignaturePaths(mode, pointer)),
    get draws() { return pathWrites / lines.length; },
    get now() { return now; },
    step(timestamp) {
      assert.ok(timestamp >= now, "the fake animation clock must only move forwards");
      now = timestamp;
      const ready = [...pending.values()];
      pending.clear();
      for (const callback of ready) callback(now);
    },
    settle() {
      for (let frame = 0; pending.size && frame < 120; frame++) this.step(now + 16);
      assert.equal(pending.size, 0, "a pointer or mode interaction must settle rather than loop");
    },
  };
}

function assertPlanarPaths(paths) {
  assert.equal(paths.length, 48);
  assert.equal(new Set(paths).size, 48, "the line field should contain distinct closed curves");
  for (const path of paths) {
    assert.equal(typeof path, "string");
    assert.doesNotMatch(path, /NaN|Infinity|undefined/);
    assert.match(path, /^[MCZ0-9.,+\-\s]+$/, "each d must contain only valid planar curve tokens");
    const commands = [...path.matchAll(/([MCZ])([^MCZ]*)/g)];
    assert.equal(commands[0]?.[1], "M");
    assert.equal(commands.at(-1)?.[1], "Z", "each interference curve must be closed");
    assert.equal(commands.at(-1)?.[2].trim(), "");
    assert.ok(commands.length >= 3 && commands.slice(1, -1).every(([, command]) => command === "C"));
    const start = commands[0][2].trim().split(/[\s,]+/).map(Number);
    const end = commands.at(-2)[2].trim().split(/[\s,]+/).map(Number).slice(-2);
    assert.deepEqual(end, start, "the final cubic must meet the starting point without a closing seam");
    for (const [, command, coordinates] of commands.slice(0, -1)) {
      const values = coordinates.trim().split(/[\s,]+/).map(Number);
      assert.equal(values.length, command === "M" ? 2 : 6);
      assert.ok(values.every(Number.isFinite));
      for (let index = 0; index < values.length; index += 2) {
        assert.ok(values[index] >= 0 && values[index] <= 620, "x coordinates should fit the SVG viewBox");
        assert.ok(values[index + 1] >= 0 && values[index + 1] <= 520, "y coordinates should fit the SVG viewBox");
      }
    }
  }
}

test("the signature draws its initial state once without scheduling an entrance animation", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  assert.equal(h.draws, 1);
  assert.deepEqual(h.paths(), h.expected(0));
  assert.equal(h.pending.size, 0, "the initial signature must not start an idle RAF loop");
  h.step(1000);
  assert.equal(h.draws, 1);
  h.intersectionObservers[0].emit(true);
  assert.equal(h.pending.size, 1, "an observer notification may request a single refresh");
  h.step(1000);
  assert.equal(h.pending.size, 0);
  assert.equal(h.draws, 2);
  h.step(2000);
  assert.equal(h.draws, 2);
});

test("each mode changes actual SVG paths and settles after its short transition", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  for (const [index, mode] of ["build", "explain", "think"].entries()) {
    const start = index * 1000;
    h.step(start);
    const previous = h.paths();
    h.engine.select(mode);
    assert.equal(h.pending.size, 1);
    h.step(start + 100);
    assert.equal(h.pending.size, 1);
    assert.notDeepEqual(h.paths(), previous, "a mode transition must change the drawn paths");
    assertPlanarPaths(h.paths());
    h.step(start + 620);
    assert.equal(h.pending.size, 0, mode + " should finish rather than loop");
    assert.deepEqual(h.paths(), h.expected([1, 2, 0][index]));
  }
});

test("a new mode interrupts smoothly from the currently drawn signature", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  h.engine.select("build");
  h.step(310);
  const intermediate = h.paths();
  h.engine.select("explain");
  h.step(310);
  assert.deepEqual(h.paths(), intermediate, "changing modes should not jump back to the prior endpoint");
  h.step(930);
  assert.deepEqual(h.paths(), h.expected(2));
  assert.equal(h.pending.size, 0);
});

test("reduced-motion updates each selected form once and ignores pointer movement", (t) => {
  const h = harness({ reduced: true });
  t.after(() => h.engine.dispose());
  assert.equal(h.pending.size, 0);
  for (const [mode, value] of [["build", 1], ["explain", 2], ["think", 0]]) {
    const before = h.draws;
    h.engine.select(mode);
    assert.equal(h.pending.size, 1);
    h.step(0);
    assert.equal(h.draws, before + 1);
    assert.deepEqual(h.paths(), h.expected(value));
    assert.equal(h.pending.size, 0);
  }
  h.engine.point(.5, .5);
  assert.equal(h.pending.size, 0);
});

test("enabling reduced motion stops an active transition at its requested form", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  h.engine.select("build");
  h.step(100);
  assert.equal(h.pending.size, 1);
  h.media.matches = true;
  h.media.emit("change");
  h.step(110);
  assert.equal(h.pending.size, 0);
  assert.deepEqual(h.paths(), h.expected(1));
  h.engine.point(.5, .5);
  assert.equal(h.pending.size, 0);
});

test("leaving reduced motion keeps an already completed form without restarting its morph", (t) => {
  const h = harness({ reduced: true });
  t.after(() => h.engine.dispose());
  h.engine.select("explain");
  h.step(0);
  const completed = h.paths();
  h.media.matches = false;
  h.media.emit("change");
  h.step(10);
  assert.ok(JSON.stringify(h.paths()) === JSON.stringify(completed),
    "restoring normal motion must not rewind a form that was already shown under reduced motion");
  assert.equal(h.pending.size, 0, "preference changes must not restart a completed transition");
});

test("hidden documents cancel animation and restore the latest requested mode", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  h.engine.select("build");
  h.step(100);
  h.document.hidden = true;
  h.document.emit("visibilitychange");
  assert.equal(h.pending.size, 0);
  const before = h.draws;
  h.engine.select("explain");
  h.step(1000);
  assert.equal(h.pending.size, 0);
  assert.equal(h.draws, before);
  h.document.hidden = false;
  h.document.emit("visibilitychange");
  assert.equal(h.pending.size, 1);
  h.step(1200);
  assert.equal(h.pending.size, 0);
  assert.equal(h.draws, before + 1);
  assert.deepEqual(h.paths(), h.expected(2));
});

test("offscreen signatures suspend updates and show their latest mode on return", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  h.engine.select("build");
  h.intersectionObservers[0].emit(false);
  assert.equal(h.pending.size, 0);
  const before = h.draws;
  h.engine.select("explain");
  h.step(1000);
  assert.equal(h.draws, before);
  assert.equal(h.pending.size, 0);
  h.intersectionObservers[0].emit(true);
  h.step(1200);
  assert.equal(h.pending.size, 0);
  assert.equal(h.draws, before + 1);
  assert.deepEqual(h.paths(), h.expected(2));
});

test("fine-pointer feedback deforms planar paths, clamps input, and returns to rest", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  const initial = h.paths();
  h.engine.point(2, -3);
  assert.equal(h.pending.size, 1);
  h.settle();
  assert.notDeepEqual(h.paths(), initial);
  assert.deepEqual(h.paths(), h.expected(0, [.5, -.5]));
  assertPlanarPaths(h.paths());
  h.engine.point(0, 0);
  h.settle();
  assert.deepEqual(h.paths(), initial);
});

test("coarse pointers skip hover motion while explicit mode changes remain available", (t) => {
  const h = harness({ finePointer: false });
  t.after(() => h.engine.dispose());
  h.engine.point(.5, .5);
  assert.equal(h.pending.size, 0);
  h.engine.select("build");
  assert.equal(h.pending.size, 1);
  h.step(620);
  assert.equal(h.pending.size, 0);
  assert.deepEqual(h.paths(), h.expected(1));
});

test("dispose cancels frames and releases every observer and event subscription", () => {
  const h = harness();
  h.engine.select("build");
  assert.equal(h.pending.size, 1);
  assert.equal(h.document.count(), 1);
  assert.equal(h.media.count(), 1);
  const before = h.draws;
  h.engine.dispose();
  assert.equal(h.pending.size, 0);
  assert.ok(h.intersectionObservers.every((observer) => observer.disconnected));
  assert.equal(h.document.count(), 0);
  assert.equal(h.media.count(), 0);
  h.document.emit("visibilitychange");
  h.media.emit("change");
  h.intersectionObservers[0].emit(true);
  h.engine.point(.5, .5);
  h.engine.select("explain");
  h.step(2000);
  assert.equal(h.pending.size, 0);
  assert.equal(h.draws, before, "disposed signature paths must never be written again");
});

test("all modes and intermediate states produce 48 finite, distinct closed planar curves", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  for (const mode of [0, .25, .5, 1, 1.5, 2]) {
    for (const pointer of [[0, 0], [-.5, -.5], [.5, .5], [.5, -.5]]) {
      assertPlanarPaths(h.expected(mode, pointer));
    }
  }
  assert.notDeepEqual(h.expected(0), h.expected(1));
  assert.notDeepEqual(h.expected(1), h.expected(2));
  assert.notDeepEqual(h.expected(0), h.expected(2));
});

test("the signature stays SVG-only without a raster renderer or simulated 3D depth", () => {
  assert.doesNotMatch(productionSource, /<canvas\b|getContext\s*\(|WebGL|WebGPU|makeSurface|\bmesh\b/i);
  assert.doesNotMatch(signatureCss,
    /(?:perspective|transform-style|box-shadow|text-shadow|filter)\s*:|(?:translate3d|rotate[XYZ]|matrix3d|drop-shadow)\s*\(/i);
});
