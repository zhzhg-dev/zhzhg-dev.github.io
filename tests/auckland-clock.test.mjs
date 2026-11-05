import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { componentHarness, elements, loadSource, repository, treeNodes, treeText, withGlobals } from "./support/source-harness.mjs";

const clockSource = resolve(repository, "src/components/AucklandClock.tsx");
const cache = new Map();
const { formatAucklandClock } = loadSource(clockSource, undefined, cache);
const { default: App } = loadSource(resolve(repository, "src/App.tsx"), undefined, cache);
const { LanguageProvider } = loadSource(resolve(repository, "src/i18n.tsx"), undefined, cache);

test("the Auckland clock handles both 2026 daylight-saving transitions in English and Chinese", () => {
  for (const language of ["en", "zh"]) {
    for (const [utc, localTime] of [
      ["2026-04-04T13:59:00Z", "02:59"],
      ["2026-04-04T14:00:00Z", "02:00"],
      ["2026-09-26T13:59:00Z", "01:59"],
      ["2026-09-26T14:00:00Z", "03:00"],
    ]) {
      assert.equal(formatAucklandClock(new Date(utc), language).time, localTime, `${utc}, ${language}`);
    }
  }
});

test("Auckland midnight advances the localized date before UTC does", () => {
  const before = new Date("2026-11-05T10:59:00Z");
  const after = new Date("2026-11-05T11:00:00Z");
  const english = [before, after].map(now => formatAucklandClock(now, "en"));
  const chinese = [before, after].map(now => formatAucklandClock(now, "zh"));
  assert.deepEqual(english.map(item => item.time), ["23:59", "00:00"]);
  assert.deepEqual(chinese.map(item => item.time), ["23:59", "00:00"]);
  assert.match(english[0].date, /Thu/i);
  assert.match(english[0].date, /\b5\b/);
  assert.match(english[1].date, /Fri/i);
  assert.match(english[1].date, /\b6\b/);
  assert.match(english[1].date, /Nov/i);
  assert.match(chinese[0].date, /11\s*月\s*5\s*日/);
  assert.match(chinese[1].date, /11\s*月\s*6\s*日/);
  assert.match(chinese[1].date, /(?:周|星期)五/);
});

test("the clock schedules one minute-boundary tick, resynchronizes after a delayed tick and clears on unmount", () => {
  const RealDate = Date;
  let now = RealDate.parse("2026-11-05T10:59:40.250Z");
  class ControlledDate extends RealDate {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  let nextId = 0;
  const timers = new Map();
  const browser = {
    setTimeout(callback, delay) { timers.set(++nextId, { callback, delay }); return nextId; },
    clearTimeout(id) { timers.delete(id); },
  };
  withGlobals({ Date: ControlledDate, window: browser }, () => {
    const clock = componentHarness("AucklandClock");
    function assertClock(time, iso) {
      const nodes = treeNodes(clock.render());
      assert.ok(nodes.some(node => node.props.className?.split(/\s+/).includes("studio-window-clock") && node.props["aria-live"] === "off"),
        "minute ticks are not announced as live updates");
      const timeElement = nodes.find(node => node.type === "time");
      assert.equal(timeElement.props.dateTime, iso);
      assert.equal(treeText(timeElement), time);
    }
    function onlyTimer(delay) {
      assert.equal(timers.size, 1, "one active timer while mounted");
      const [[id, timer]] = timers;
      assert.equal(timer.delay, delay);
      return [id, timer];
    }
    try {
      assertClock("23:59", "2026-11-05T10:59:40.250Z");
      clock.flushEffects();
      const [id, tick] = onlyTimer(19_750);
      timers.delete(id);
      now = RealDate.parse("2026-11-05T11:02:07.500Z");
      tick.callback();
      assertClock("00:02", "2026-11-05T11:02:07.500Z");
      clock.flushEffects();
      onlyTimer(52_500);
    } finally {
      clock.dispose();
    }
    assert.equal(timers.size, 0, "leaving the clock note cancels the pending tick");
  });
});

test("opening the clock reveals it on a short phone only when it would fall below the fold", () => {
  for (const [mobile, bottom, shouldReveal] of [[true, 720, true], [true, 610, false], [false, 720, false]]) {
    const calls = [];
    const browser = { innerHeight: 640, matchMedia: () => ({ matches: mobile }), setTimeout: () => 1, clearTimeout() {} };
    withGlobals({ window: browser }, () => {
      const clock = componentHarness("AucklandClock");
      try {
        clock.render().props.ref.current = { getBoundingClientRect: () => ({ bottom }), scrollIntoView: options => calls.push(options) };
        clock.flushEffects();
        assert.deepEqual(calls, shouldReveal ? [{ block: "nearest", behavior: "instant" }] : []);
      } finally {
        clock.dispose();
      }
    });
  }
});

test("the bilingual clock has one home-only trigger, starts closed, and has no network or persistence", () => {
  for (const [initialLanguage, label] of [["en", "Auckland time"], ["zh", "奥克兰时钟"]]) {
    for (const page of ["home", "projects", "experience", "contact"]) {
      const html = withGlobals({ window: undefined }, () => renderToStaticMarkup(createElement(LanguageProvider, { initialLanguage }, createElement(App, { page }))));
      assert.doesNotMatch(html, /class="studio-window-clock"/);
      const trigger = elements(html, "button").filter(button => button["aria-label"] === label);
      if (page === "home") {
        assert.equal(trigger.length, 1);
        assert.equal(trigger[0]["aria-expanded"], "false");
        const note = elements(html, "aside").find(aside => aside.id === trigger[0]["aria-controls"]);
        assert.ok(note, "the clock hotspot controls the window note");
        assert.equal(note.hidden, "");
      } else {
        assert.equal(trigger.length, 0);
      }
    }
  }
  assert.doesNotMatch(readFileSync(clockSource, "utf8"),
    /localStorage|sessionStorage|indexedDB|XMLHttpRequest|sendBeacon|geolocation|\bfetch\s*\(/);
});
