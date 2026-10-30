import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

export const repository = fileURLToPath(new URL("../../", import.meta.url));

// Load actual source callbacks. Native layout, rendering and real keyboard
// focus are independently checked in a browser, not emulated by this fixture.
export function loadSource(filename, hooks, cache = new Map()) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const requireNode = createRequire(filename);
  const requireSource = specifier => {
    if (specifier === "react" && hooks) return { ...requireNode(specifier), ...hooks };
    if (specifier.endsWith(".css")) return {};
    if (specifier.startsWith(".")) {
      const base = resolve(dirname(filename), specifier);
      const source = [base, `${base}.tsx`, `${base}.ts`].find(existsSync);
      if (source) return loadSource(source, hooks, cache);
    }
    return requireNode(specifier);
  };
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  new Function("require", "module", "exports", outputText)(requireSource, module, module.exports);
  return module.exports;
}

export function withGlobals(values, callback) {
  const descriptors = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete globalThis[key];
    else Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  try { return callback(); }
  finally {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

export function renderAt(Component, props = {}, address) {
  return withGlobals({ window: address ? { location: new URL(address), history: { state: null } } : undefined },
    () => renderToStaticMarkup(createElement(Component, props)));
}

export function decodeText(value) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
export function plainText(html) { return decodeText(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim(); }
export function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key.toLowerCase(), decodeText(value)]));
}
export function elements(html, tag) {
  // Return both outer and nested elements. A non-greedy pair regex stops at
  // the first inner closing tag and cannot faithfully inspect nested sections.
  const stack = [], matched = [];
  for (const token of html.matchAll(new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi"))) {
    if (!token[1]) {
      if (!token[0].endsWith("/>")) stack.push({ start: token.index, opening: token[0] });
      continue;
    }
    const opening = stack.pop();
    if (!opening) continue;
    const markup = html.slice(opening.start, token.index + token[0].length);
    matched.push({ start: opening.start, value: { ...attributes(opening.opening), markup, text: plainText(markup) } });
  }
  return matched.sort((left, right) => left.start - right.start).map(item => item.value);
}
export function treeNodes(node) {
  if (Array.isArray(node)) return node.flatMap(treeNodes);
  if (!node || typeof node !== "object" || !node.props) return [];
  return [node, ...treeNodes(node.props.children)];
}
export function treeText(node) {
  if (Array.isArray(node)) return node.map(treeText).join(" ").replace(/\s+/g, " ").trim();
  if (typeof node === "string" || typeof node === "number") return String(node);
  return node?.props ? treeText(node.props.children) : "";
}

export function componentHarness(name, props = {}) {
  const slots = [];
  const pendingEffects = new Set();
  let cursor = 0;
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, next => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; }];
    },
    useId() { return `test-${name}-${cursor++}`; },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(callback, dependencies) {
      const index = cursor++;
      const previous = slots[index];
      const changed = !previous || !dependencies || dependencies.length !== previous.dependencies?.length
        || dependencies.some((value, at) => !Object.is(value, previous.dependencies[at]));
      if (changed) { slots[index] = { dependencies, callback, cleanup: previous?.cleanup }; pendingEffects.add(index); }
    },
    useMemo(callback) { cursor++; return callback(); },
    useCallback(callback) { cursor++; return callback; },
  };
  const Component = loadSource(resolve(repository, `src/components/${name}.tsx`), hooks)[name];
  return {
    render() { cursor = 0; return Component(props); },
    flushEffects() {
      for (const index of pendingEffects) { slots[index].cleanup?.(); slots[index].cleanup = slots[index].callback(); }
      pendingEffects.clear();
    },
    dispose() { for (const slot of slots) slot?.cleanup?.(); pendingEffects.clear(); },
  };
}
