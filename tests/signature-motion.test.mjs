import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const filename = fileURLToPath(new URL("../src/components/SignatureField.tsx", import.meta.url));
const nodeRequire = createRequire(import.meta.url);
// Exercise the production engine in an isolated realm. Only this in-memory
// compilation exposes its private entry points; the shipped module is unchanged.
const source = readFileSync(filename, "utf8")
  + "\nexport { mountField, makeSurface, along, stride };\n";
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
  let draws = 0;
  const pending = new Map();
  const resizeObservers = [];
  const intersectionObservers = [];
  const media = { ...listeners(), matches: reduced };
  const document = { ...listeners(), hidden: false };
  const bounds = { width: 600, height: 440 };
  const stage = { getBoundingClientRect: () => ({ ...bounds }) };
  const noop = () => {};
  const gradient = () => ({ addColorStop: noop });
  const transforms = [];
  // Drawing calls are deliberately no-ops: these tests validate scheduling and
  // lifecycle behavior, not the visual fidelity of Canvas or browser rendering.
  const context = {
    clearRect() { draws++; },
    save: noop,
    restore: noop,
    translate: noop,
    scale: noop,
    createRadialGradient: gradient,
    createLinearGradient: gradient,
    fillRect: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    closePath: noop,
    fill: noop,
    stroke: noop,
    setTransform(...values) { transforms.push(values); },
  };
  const canvas = { width: 600, height: 440, getContext: () => context };
  class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      resizeObservers.push(this);
    }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    emit() { if (!this.disconnected) this.callback([]); }
  }
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
      devicePixelRatio: 3,
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
    ResizeObserver,
    IntersectionObserver,
  });
  runInContext(outputText, sandbox, { filename });
  const engine = loaded.exports.mountField(canvas, stage);
  return {
    engine,
    pending,
    document,
    media,
    canvas,
    transforms,
    resizeObservers,
    intersectionObservers,
    exports: loaded.exports,
    get draws() { return draws; },
    step(timestamp) {
      assert.ok(timestamp >= now, "the fake animation clock must only move forwards");
      now = timestamp;
      const ready = [...pending.values()];
      pending.clear();
      for (const callback of ready) callback(now);
    },
    resize(width, height) {
      bounds.width = width;
      bounds.height = height;
      resizeObservers[0].emit();
    },
  };
}

test("the signature entrance draws briefly and leaves no idle animation frame", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  assert.equal(h.pending.size, 1);
  h.step(0);
  assert.equal(h.pending.size, 1, "the entrance should schedule its remaining transition");
  h.step(1000);
  assert.equal(h.pending.size, 0, "a settled sculpture must not keep requesting frames");
  assert.equal(h.draws, 2);
  h.step(2000);
  assert.equal(h.draws, 2, "advancing an idle clock must not cause another render");
});

test("each requested mode transition also settles with no continuous RAF", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  h.step(1000);
  for (const [index, mode] of ["build", "explain", "think"].entries()) {
    const start = 1000 + index * 1000;
    h.engine.select(mode);
    assert.equal(h.pending.size, 1, `${mode} should request its transition`);
    h.step(start + 100);
    assert.equal(h.pending.size, 1, `${mode} should still be transitioning`);
    h.step(start + 1000);
    assert.equal(h.pending.size, 0, `${mode} should finish rather than loop`);
  }
});

test("reduced-motion renders state changes once without entrance or pointer animation", (t) => {
  const h = harness({ reduced: true });
  t.after(() => h.engine.dispose());
  h.step(0);
  assert.equal(h.pending.size, 0);
  for (const mode of ["build", "explain", "think"]) {
    const before = h.draws;
    h.engine.select(mode);
    assert.equal(h.pending.size, 1);
    h.step(0);
    assert.equal(h.draws, before + 1);
    assert.equal(h.pending.size, 0, "a reduced-motion mode change should snap in one draw");
  }
  h.engine.point(.5, .5);
  assert.equal(h.pending.size, 0, "pointer movement must not animate under reduced motion");
});

test("changing reduced-motion preference stops an already running transition", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  h.step(0);
  assert.equal(h.pending.size, 1);
  h.media.matches = true;
  h.media.emit("change");
  h.step(10);
  assert.equal(h.pending.size, 0);
  h.engine.point(.5, .5);
  assert.equal(h.pending.size, 0);
});

test("hidden documents cancel pending animation and render the latest mode on return", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  h.step(1000);
  h.engine.select("build");
  assert.equal(h.pending.size, 1);
  h.document.hidden = true;
  h.document.emit("visibilitychange");
  assert.equal(h.pending.size, 0);
  const before = h.draws;
  h.engine.select("explain");
  h.step(2000);
  assert.equal(h.pending.size, 0);
  assert.equal(h.draws, before, "no draw should be performed while the document is hidden");
  h.document.hidden = false;
  h.document.emit("visibilitychange");
  assert.equal(h.pending.size, 1);
  h.step(3000);
  assert.equal(h.pending.size, 0);
  assert.equal(h.draws, before + 1);
});

test("offscreen intersection cancels pending RAF and suppresses invisible changes", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  h.step(1000);
  h.engine.select("build");
  assert.equal(h.pending.size, 1);
  h.intersectionObservers[0].emit(false);
  assert.equal(h.pending.size, 0);
  const before = h.draws;
  h.engine.select("explain");
  h.step(2000);
  assert.equal(h.pending.size, 0);
  assert.equal(h.draws, before);
  h.intersectionObservers[0].emit(true);
  assert.equal(h.pending.size, 1);
  h.step(3000);
  assert.equal(h.pending.size, 0);
  assert.equal(h.draws, before + 1);
});

test("coarse-pointer environments do not start hover-driven motion", (t) => {
  const h = harness({ finePointer: false });
  t.after(() => h.engine.dispose());
  h.step(1000);
  h.engine.point(.5, .5);
  assert.equal(h.pending.size, 0);
  h.engine.select("build");
  assert.equal(h.pending.size, 1, "the mode control must remain available without a mouse");
  h.step(2000);
  assert.equal(h.pending.size, 0);
});

test("ResizeObserver respects the container and caps the drawing DPR at 2", (t) => {
  const h = harness({ reduced: true });
  t.after(() => h.engine.dispose());
  assert.equal(h.canvas.width, 1200);
  assert.equal(h.canvas.height, 880);
  assert.deepEqual(h.transforms.at(-1), [2, 0, 0, 2, 0, 0]);
  h.step(0);
  h.resize(320, 260);
  assert.equal(h.canvas.width, 640);
  assert.equal(h.canvas.height, 520);
  assert.equal(h.pending.size, 1);
  h.step(0);
  assert.equal(h.pending.size, 0);
});

test("dispose cancels frames and releases all observers and event subscriptions", () => {
  const h = harness();
  assert.equal(h.pending.size, 1);
  assert.equal(h.document.count(), 1);
  assert.equal(h.media.count(), 1);
  h.engine.dispose();
  assert.equal(h.pending.size, 0);
  assert.ok(h.resizeObservers.every((observer) => observer.disconnected));
  assert.ok(h.intersectionObservers.every((observer) => observer.disconnected));
  assert.equal(h.document.count(), 0);
  assert.equal(h.media.count(), 0);
  h.document.emit("visibilitychange");
  h.media.emit("change");
  h.resizeObservers[0].emit();
  h.intersectionObservers[0].emit(true);
  h.engine.point(.5, .5);
  h.engine.select("build");
  assert.equal(h.pending.size, 0, "a disposed renderer must not be resurrected by later events");
});

test("all three ribbon surfaces have finite positions and an identical closing row", (t) => {
  const h = harness();
  t.after(() => h.engine.dispose());
  const { makeSurface, along, stride } = h.exports;
  for (const mode of ["think", "build", "explain"]) {
    const surface = makeSurface(mode);
    assert.ok(surface.every(Number.isFinite));
    for (let index = 0; index < stride * 3; index++) {
      assert.equal(surface[index], surface[along * stride * 3 + index],
        `${mode} must not contain a positional jump at the ribbon seam`);
    }
  }
});
