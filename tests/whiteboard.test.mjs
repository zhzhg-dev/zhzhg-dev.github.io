import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { attributes, componentHarness, elements, loadSource, renderAt, repository, treeNodes, treeText, withGlobals } from "./support/source-harness.mjs";

const { default: App } = loadSource(resolve(repository, "src/App.tsx"));
const { WhiteboardExperiment } = loadSource(resolve(repository, "src/components/WhiteboardExperiment.tsx"));
const { DEFAULT_POINTS, CHECK_POINTS, fitCurve, rootMeanSquaredError, updatePoint } = loadSource(resolve(repository, "src/lib/whiteboard-model.ts"));

function labEnvironment(callback) {
  const classes = new Set();
  const browser = { matchMedia: () => ({ matches: false }) };
  const document = { body: { classList: { add(value) { classes.add(value); }, remove(value) { classes.delete(value); }, contains(value) { return classes.has(value); } } } };
  return withGlobals({ window: browser, document }, () => callback({ classes, browser }));
}

function mountLab(initiallyOpen = false) {
  const focused = [];
  const trigger = { isConnected: true, focus() { focused.push("trigger"); } };
  const props = { open: initiallyOpen, onClose() { props.open = false; closeRequests++; }, returnFocusRef: { current: trigger }, id: "test-whiteboard" };
  let closeRequests = 0;
  const fixture = componentHarness("WhiteboardExperiment", props);
  const dialog = { open: false, scrollTop: 500, showModal() { this.open = true; }, close() { this.open = false; } };
  const surface = { getBoundingClientRect() { return { top: 100, left: 20, width: 640, height: 400 }; } };
  function render() {
    const nodes = treeNodes(fixture.render());
    for (const node of nodes) {
      if (node.type === "dialog") node.props.ref.current = dialog;
      if (node.type === "button" && node.props["aria-label"] === "Close whiteboard experiment" && node.props.ref) node.props.ref.current = { focus() { focused.push("close"); } };
      if (node.props.className === "whiteboard-lab__plot-wrap") node.props.ref.current = surface;
    }
    fixture.flushEffects();
    return nodes;
  }
  return { fixture, props, dialog, focused, trigger, surface, render, closeRequests: () => closeRequests };
}

function button(nodes, label) {
  const found = nodes.find(node => node.type === "button" && (node.props["aria-label"] === label || treeText(node).replace(/\s*[+−↗]$/, "") === label));
  assert.ok(found, `find native button ${label}`);
  return found;
}

test("only About owns a closed, labelled whiteboard dialog and its dedicated board trigger", () => {
  const html = renderAt(App, { page: "home" });
  const dialogs = elements(html, "dialog");
  assert.equal(dialogs.length, 1);
  const lab = dialogs[0];
  assert.ok(lab.id && lab["aria-labelledby"] && lab["aria-describedby"]);
  assert.doesNotMatch(lab.markup.slice(0, lab.markup.indexOf(">") + 1), /\sopen(?:\s|=|>)/);
  assert.ok(elements(lab.markup, "h2").some(heading => heading.id === lab["aria-labelledby"]));
  assert.ok(elements(lab.markup, "p").some(copy => copy.id === lab["aria-describedby"]));
  const trigger = elements(html, "button").find(item => item["aria-label"] === "Try the whiteboard");
  assert.ok(trigger);
  assert.equal(trigger["aria-haspopup"], "dialog");
  assert.equal(trigger["aria-controls"], lab.id);
  assert.equal(trigger["aria-expanded"], "false");
  for (const page of ["experience", "contact"]) assert.equal(elements(renderAt(App, { page }), "dialog").length, 0);
  assert.doesNotMatch(renderAt(App, { page: "projects" }), /Close whiteboard experiment|whiteboard-lab/);
  assert.equal(elements(html, "h1").length, 1);
});

test("the board hotspot opens only the experiment while the personal note stays closed", () => {
  const fixture = componentHarness("StudioHome");
  try {
    let nodes = treeNodes(fixture.render());
    const trigger = { focus() {} };
    const board = button(nodes, "Try the whiteboard");
    board.props.onClick({ currentTarget: trigger });
    nodes = treeNodes(fixture.render());
    const experiment = nodes.find(node => node.type?.name === "WhiteboardExperiment");
    assert.ok(experiment);
    assert.equal(experiment.props.open, true);
    assert.equal(experiment.props.returnFocusRef.current, trigger);
    assert.equal(nodes.find(node => node.type === "aside").props.hidden, true);
    const selected = button(nodes, "Try the whiteboard");
    assert.equal(selected.props["aria-expanded"], true);
    assert.equal(selected.props["aria-pressed"], true);
    assert.equal(selected.props["aria-controls"], experiment.props.id);
    experiment.props.onClose();
    nodes = treeNodes(fixture.render());
    assert.equal(nodes.find(node => node.type?.name === "WhiteboardExperiment").props.open, false);
  } finally { fixture.dispose(); }
});

test("native whiteboard open, close and Escape synchronize scrolling, initial focus and trigger restoration", () => {
  labEnvironment(({ classes }) => {
    const lab = mountLab();
    try {
      lab.render();
      assert.equal(lab.dialog.open, false);
      assert.ok(!classes.has("whiteboard-lab-open"));
      for (const viaEscape of [false, true]) {
        lab.props.open = true;
        lab.dialog.scrollTop = 500;
        let nodes = lab.render();
        assert.equal(lab.dialog.open, true);
        assert.equal(lab.dialog.scrollTop, 0);
        assert.ok(classes.has("whiteboard-lab-open"));
        assert.equal(lab.focused.at(-1), "close");
        if (viaEscape) {
          let prevented = false;
          nodes.find(node => node.type === "dialog").props.onCancel({ preventDefault() { prevented = true; } });
          assert.ok(prevented, "native Escape goes through the controlled close path");
        } else button(nodes, "Close whiteboard experiment").props.onClick();
        lab.render();
        assert.equal(lab.dialog.open, false);
        assert.ok(!classes.has("whiteboard-lab-open"));
        assert.equal(lab.focused.at(-1), "trigger");
      }
      assert.equal(lab.closeRequests(), 2);
      lab.props.open = true;
      lab.render();
      assert.ok(classes.has("whiteboard-lab-open"));
    } finally { lab.fixture.dispose(); }
    assert.equal(lab.dialog.open, false);
    assert.ok(!classes.has("whiteboard-lab-open"), "unmount cleans its body lock");
    assert.equal(lab.focused.at(-1), "trigger");
  });
});

test("real model controls, selected-point slider and reset update the experiment without a drag gesture", () => {
  labEnvironment(() => {
    const lab = mountLab(true);
    try {
      let nodes = lab.render();
      assert.equal(button(nodes, "Gentle curve").props["aria-pressed"], true);
      const pathBefore = nodes.filter(node => node.type === "path").map(node => node.props.d).join(" ");
      button(nodes, "Straight line").props.onClick();
      nodes = lab.render();
      assert.equal(button(nodes, "Straight line").props["aria-pressed"], true);
      assert.notEqual(nodes.filter(node => node.type === "path").map(node => node.props.d).join(" "), pathBefore);
      button(nodes, "Show unseen points").props.onClick();
      nodes = lab.render();
      const straightLineInsight = treeText(nodes.find(node => node.props.className === "whiteboard-lab__insight"));
      assert.match(straightLineInsight, /similar errors do not necessarily mean a good fit/i);
      assert.doesNotMatch(straightLineInsight, /pattern carries across|learned the pattern/i, "similar fit and check errors must not be presented as proof against underfitting");
      button(nodes, "Hide unseen points").props.onClick();
      nodes = lab.render();
      button(nodes, "Flexible curve").props.onClick();
      nodes = lab.render();
      assert.equal(button(nodes, "Flexible curve").props["aria-pressed"], true);
      const selector = nodes.find(node => node.type === "select");
      assert.ok(selector);
      selector.props.onChange({ currentTarget: { value: "3" }, target: { value: "3" } });
      nodes = lab.render();
      const range = nodes.find(node => node.type === "input" && node.props.type === "range");
      assert.ok(range);
      assert.equal(Number(range.props.min), 5);
      assert.equal(Number(range.props.max), 95);
      assert.equal(Number(range.props.step), 1);
      const changedPathBefore = nodes.filter(node => node.type === "path").map(node => node.props.d).join(" ");
      range.props.onChange({ currentTarget: { value: "90" }, target: { value: "90" } });
      nodes = lab.render();
      assert.equal(Number(nodes.find(node => node.type === "input" && node.props.type === "range").props.value), 90);
      assert.notEqual(nodes.filter(node => node.type === "path").map(node => node.props.d).join(" "), changedPathBefore);
      const fittedCurve = nodes.find(node => node.props.className === "whiteboard-lab__curve").props.d;
      const expectedCoefficients = fitCurve(updatePoint(DEFAULT_POINTS, 3, 0.9), 6);
      button(nodes, "Show unseen points").props.onClick();
      nodes = lab.render();
      assert.equal(button(nodes, "Hide unseen points").props["aria-pressed"], true);
      assert.doesNotMatch(treeText(nodes), /Not revealed/);
      assert.equal(nodes.find(node => node.props.className === "whiteboard-lab__curve").props.d, fittedCurve, "revealing check points never retrains the curve");
      const reportedErrors = treeNodes(nodes.find(node => node.props.className === "whiteboard-lab__errors")).filter(node => node.type === "dd").map(node => Number(treeText(node)));
      assert.deepEqual(reportedErrors, [rootMeanSquaredError(updatePoint(DEFAULT_POINTS, 3, 0.9), expectedCoefficients), rootMeanSquaredError(CHECK_POINTS, expectedCoefficients)].map(value => Math.round(value * 1000) / 10), "reported fit and unseen errors match actual un-clipped model predictions");
      button(nodes, "Reset experiment").props.onClick();
      nodes = lab.render();
      assert.equal(button(nodes, "Gentle curve").props["aria-pressed"], true);
      assert.equal(Number(nodes.find(node => node.type === "select").props.value), 0);
      assert.equal(Number(nodes.find(node => node.type === "input" && node.props.type === "range").props.value), Math.round(DEFAULT_POINTS[0].y * 100));
      assert.equal(button(nodes, "Show unseen points").props["aria-pressed"], false);
      assert.match(treeText(nodes), /Not revealed/);
      assert.equal(nodes.filter(node => node.type === "path").map(node => node.props.d).join(" "), pathBefore);
    } finally { lab.fixture.dispose(); }
  });
});

test("point controls expose native keyboard alternatives with bounded height movement", () => {
  labEnvironment(() => {
    const lab = mountLab(true);
    try {
      let nodes = lab.render();
      const pointButtons = nodes.filter(node => node.type === "button" && /^Adjust point \d+$/.test(node.props["aria-label"] ?? ""));
      assert.equal(pointButtons.length, DEFAULT_POINTS.length);
      for (const item of pointButtons) assert.equal(item.props.type, "button");
      button(nodes, "Adjust point 2").props.onClick();
      nodes = lab.render();
      assert.equal(Number(nodes.find(node => node.type === "select").props.value), 1);
      const lastValue = Number(nodes.find(node => node.type === "input" && node.props.type === "range").props.value);
      for (const [key, shiftKey, expected] of [["ArrowUp", false, Math.min(95, lastValue + 2)], ["ArrowDown", true, Math.max(5, lastValue + 2 - 10)], ["Home", false, 95], ["End", false, 5]]) {
        let prevented = false;
        button(nodes, "Adjust point 2").props.onKeyDown({ key, shiftKey, preventDefault() { prevented = true; } });
        assert.ok(prevented);
        nodes = lab.render();
        const actual = Number(nodes.find(node => node.type === "input" && node.props.type === "range").props.value);
        assert.ok(Math.abs(actual - expected) < 1e-7);
      }
    } finally { lab.fixture.dispose(); }
  });
});

test("dragging moves only the captured point vertically and stops on pointer cancellation or capture loss", () => {
  labEnvironment(() => {
    const lab = mountLab(true);
    const captures = new Set();
    const pointerTarget = {
      focus() {},
      setPointerCapture(id) { captures.add(id); },
      hasPointerCapture(id) { return captures.has(id); },
      releasePointerCapture(id) { captures.delete(id); },
    };
    const pointerEvent = (pointerId, clientY, extra = {}) => ({ pointerId, clientY, button: 0, isPrimary: true, currentTarget: pointerTarget, preventDefault() {}, ...extra });
    const height = nodes => Number(nodes.find(node => node.type === "input" && node.props.type === "range").props.value);
    try {
      let nodes = lab.render();
      const original = height(nodes);
      button(nodes, "Adjust point 1").props.onPointerDown(pointerEvent(7, 200, { button: 2 }));
      button(nodes, "Adjust point 1").props.onPointerMove(pointerEvent(7, 128));
      nodes = lab.render();
      assert.equal(height(nodes), original, "secondary-button input does not start a drag");
      button(nodes, "Adjust point 1").props.onPointerDown(pointerEvent(7, 200, { isPrimary: false }));
      assert.equal(captures.size, 0, "a second touch is not treated as another training point drag");
      button(nodes, "Adjust point 1").props.onPointerDown(pointerEvent(7, 200));
      assert.ok(captures.has(7));
      button(nodes, "Adjust point 1").props.onPointerMove(pointerEvent(8, 128));
      nodes = lab.render();
      assert.equal(height(nodes), original, "an unrelated pointer cannot move the captured point");
      button(nodes, "Adjust point 1").props.onPointerMove(pointerEvent(7, 288));
      nodes = lab.render();
      assert.equal(height(nodes), 50, "plot bounds are converted to the model’s vertical scale");
      button(nodes, "Adjust point 1").props.onPointerMove(pointerEvent(7, -1000));
      nodes = lab.render();
      assert.equal(height(nodes), 95);
      button(nodes, "Adjust point 1").props.onPointerMove(pointerEvent(7, 2000));
      nodes = lab.render();
      assert.equal(height(nodes), 5);
      button(nodes, "Adjust point 1").props.onPointerCancel(pointerEvent(7, 2000));
      assert.equal(captures.size, 0);
      button(nodes, "Adjust point 1").props.onPointerMove(pointerEvent(7, 288));
      nodes = lab.render();
      assert.equal(height(nodes), 5, "cancelled drags do not continue updating");
      button(nodes, "Adjust point 1").props.onPointerDown(pointerEvent(9, 200));
      captures.clear();
      button(nodes, "Adjust point 1").props.onLostPointerCapture(pointerEvent(9, 200));
      button(nodes, "Adjust point 1").props.onPointerMove(pointerEvent(9, 288));
      nodes = lab.render();
      assert.equal(height(nodes), 5, "lost capture ends dragging without writing more points");
    } finally { lab.fixture.dispose(); }
  });
});

test("dialog keyboard wrapping includes native inputs and backdrop dismissal ignores clicks inside the panel", () => {
  labEnvironment(() => {
    const lab = mountLab(true);
    try {
      let nodes = lab.render();
      const dialog = nodes.find(node => node.type === "dialog");
      const focused = [];
      const first = { focus() { focused.push("first"); } }, last = { focus() { focused.push("last"); } };
      let selector;
      for (const [target, shiftKey, expected] of [[first, true, "last"], [last, false, "first"]]) {
        let prevented = false;
        dialog.props.onKeyDown({ key: "Tab", target, shiftKey, currentTarget: { querySelectorAll(query) { selector = query; return [first, last]; } }, preventDefault() { prevented = true; } });
        assert.ok(prevented);
        assert.equal(focused.at(-1), expected);
        assert.match(selector, /input/);
        assert.match(selector, /select/);
      }
      const panel = { getBoundingClientRect() { return { left: 10, right: 100, top: 10, bottom: 100 }; } };
      dialog.props.onClick({ currentTarget: panel, target: panel, clientX: 50, clientY: 50 });
      assert.equal(lab.closeRequests(), 0, "panel padding is not treated as the backdrop");
      dialog.props.onClick({ currentTarget: panel, target: {}, clientX: 5, clientY: 5 });
      assert.equal(lab.closeRequests(), 0, "bubbled control clicks are not backdrop clicks");
      dialog.props.onClick({ currentTarget: panel, target: panel, clientX: 5, clientY: 5 });
      assert.equal(lab.closeRequests(), 1);
      nodes = lab.render();
      assert.equal(lab.dialog.open, false);
      nodes.find(node => node.type === "dialog").props.onClose();
      assert.equal(lab.closeRequests(), 1, "the controlled native close event does not close twice");
      lab.props.open = true;
      nodes = lab.render();
      assert.equal(lab.dialog.open, true);
      dialog.props.onClose();
      assert.equal(lab.closeRequests(), 1, "a delayed close event from the previous opening cannot dismiss the reopened dialog");
      nodes.find(node => node.type === "dialog").props.onClose();
      assert.equal(lab.closeRequests(), 1, "a native close event is ignored while the dialog is actually open");
      lab.dialog.open = false;
      nodes.find(node => node.type === "dialog").props.onClose();
      assert.equal(lab.closeRequests(), 2, "an unexpected native closure synchronizes the owning open state");
    } finally { lab.fixture.dispose(); }
  });
});

test("the whiteboard presents labelled local illustrative controls and contains no remote model or new runtime dependency", () => {
  const html = renderAt(WhiteboardExperiment, { open: false, onClose() {}, returnFocusRef: { current: null }, id: "preview-whiteboard" });
  const labelText = elements(html, "label").map(label => label.text).join(" ");
  assert.match(labelText, /Selected point/);
  assert.match(labelText, /Point height/);
  assert.match(html, /Simulated|Synthetic|synthetic|simulated/);
  assert.match(html, /local|browser/i);
  for (const control of [...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(([tag]) => attributes(tag))) {
    assert.ok(control.id);
    assert.ok(elements(html, "label").some(label => label.for === control.id));
  }
  const sources = ["src/components/WhiteboardExperiment.tsx", "src/lib/whiteboard-model.ts"].map(path => readFileSync(resolve(repository, path), "utf8")).join("\n");
  assert.doesNotMatch(sources, /\bfetch\s*\(|new\s+(?:WebSocket|XMLHttpRequest)|\blocalStorage\b/);
  const dependencies = JSON.parse(readFileSync(resolve(repository, "package.json"), "utf8")).dependencies;
  assert.deepEqual(Object.keys(dependencies).sort(), ["react", "react-dom"]);
});

test("whiteboard styles retain responsive sizing, visible focus, direct touch controls and reduced-motion safeguards", () => {
  const css = readFileSync(resolve(repository, "src/components/whiteboard-experiment.css"), "utf8");
  assert.match(css, /whiteboard-lab-open\s*\{[^}]*overflow:\s*hidden/);
  assert.match(css, /@media\s*\(max-width:/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /touch-action:\s*none/);
  assert.match(css, /overscroll-behavior:\s*contain/);
  assert.doesNotMatch(css, /transition:\s*all|animation:[^;]*infinite/);
});
