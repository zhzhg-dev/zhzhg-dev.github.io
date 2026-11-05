import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadSource, repository, elements, attributes, treeNodes, treeText, withGlobals } from "./support/source-harness.mjs";

const cache = new Map();
const { projects } = loadSource(resolve(repository, "src/data/profile.ts"), undefined, cache);
const { localizeProjects, projectTranslations } = loadSource(resolve(repository, "src/data/projects.zh.ts"), undefined, cache);
const { LanguageProvider } = loadSource(resolve(repository, "src/i18n.tsx"), undefined, cache);
const { StudioProjects } = loadSource(resolve(repository, "src/components/StudioProjects.tsx"), undefined, cache);
const hasChinese = value => /[\u3400-\u9fff]/u.test(value);
const classificationText = project => `${project.classification.type} · ${project.classification.focus}`;
const classifications = {
  folio: { en: "AI product · Research evidence tracking", zh: "AI 产品 · 研究证据追溯" },
  explainlab: { en: "Systems simulation · Distributed systems reliability", zh: "系统仿真 · 分布式系统可靠性" },
  "nz-electricity-forecasting": { en: "Machine learning · Electricity demand forecasting", zh: "机器学习 · 电力需求预测" },
  "learn-to-race": { en: "Reinforcement learning · Autonomous racing simulation", zh: "强化学习 · 自动赛车仿真" },
  "course-review-system": { en: "Full-stack development · Campus course information", zh: "全栈开发 · 校园课程信息" },
  "svelte-study-planner": { en: "Front-end development · Study task management", zh: "前端开发 · 学习任务管理" },
  "rumour-propagation": { en: "Mathematical modelling · Rumour spread", zh: "数学建模 · 谣言传播" },
};

function assertClassification(markup, project, language) {
  const labels = elements(markup, "p").filter(item => item.class?.split(/\s+/).includes("studio-project-classification"));
  const expected = classifications[project.slug][language];
  assert.equal(classificationText(project), expected, `${project.slug} keeps its actual project type and focus`);
  assert.deepEqual(labels.map(label => label.text), [expected], `${project.slug} presents its classification exactly once`);
  return labels[0];
}

function renderGallery(language, hash = "") {
  return withGlobals({ window: { location: new URL(`https://zhzhg-dev.github.io/projects/?lang=${language}${hash}`), history: { state: null } } },
    () => renderToStaticMarkup(createElement(LanguageProvider, { initialLanguage: language }, createElement(StudioProjects, { projects }))));
}

test("all seven project translations preserve identities, public destinations and technical stacks without mutating the source", () => {
  const before = JSON.stringify(projects);
  assert.deepEqual(Object.keys(projectTranslations).sort(), projects.map(project => project.slug).sort());
  assert.equal(localizeProjects(projects, "en"), projects, "English uses the original verified data");
  const translated = localizeProjects(projects, "zh");
  assert.equal(translated.length, 7);
  for (const [index, project] of projects.entries()) {
    const zh = translated[index];
    for (const key of ["slug", "title", "liveUrl", "sourceUrl", "cover", "coverWidth", "coverHeight", "coverPosition", "coverFit", "featured"]) {
      assert.equal(zh[key], project[key], `${project.slug} preserves ${key}`);
    }
    assert.deepEqual(zh.technologies, project.technologies);
    for (const key of ["type", "focus"]) {
      assert.ok(project.classification[key].trim());
      assert.ok(hasChinese(zh.classification[key]));
      assert.notEqual(zh.classification[key], project.classification[key]);
    }
    assert.ok(project.cardSummary.trim());
    for (const key of ["status", "description", "coverAlt", "shortDescription", "cardSummary", "decisionTitle", "decision", "coverCaption"]) {
      if (project[key] !== undefined) {
        assert.ok(hasChinese(zh[key]), `${project.slug}.${key} has a real Chinese translation`);
        assert.notEqual(zh[key], project[key]);
      }
    }
  }
  assert.equal(JSON.stringify(projects), before);
});

test("every structured case translates all problems, contributions, decisions, evidence and next steps", () => {
  const translated = localizeProjects(projects, "zh");
  assert.equal(translated.filter(project => project.caseStudy).length, 4);
  for (const [index, project] of projects.entries()) {
    if (!project.caseStudy) continue;
    const study = translated[index].caseStudy;
    for (const key of ["problem", "contribution", "next"]) {
      assert.ok(hasChinese(study[key]));
      assert.ok(study[key].length > 20);
      assert.notEqual(study[key], project.caseStudy[key]);
    }
    for (const key of ["decisions", "evidence"]) {
      assert.equal(study[key].length, project.caseStudy[key].length, `${project.slug} does not drop ${key}`);
      for (const item of study[key]) {
        assert.ok(hasChinese(item.title));
        assert.ok(hasChinese(item.body));
        assert.ok(item.body.length > 20);
      }
    }
  }
});

test("Chinese case copy keeps L2R team/personal simulation boundaries and other product limitations explicit", () => {
  const translated = localizeProjects(projects, "zh");
  const l2r = translated.find(project => project.slug === "learn-to-race");
  assert.match(l2r.caseStudy.contribution, /我完成了 10 次 SAC 训练/);
  assert.match(l2r.caseStudy.contribution, /Grid A 4 次、Grid B 6 次/);
  assert.match(l2r.caseStudy.contribution, /2,000 万环境步/);
  assert.match(l2r.caseStudy.contribution, /48 次训练.*属于团队成果，不是我独立完成/);
  assert.match(l2r.caseStudy.contribution, /Related Work/);
  assert.match(l2r.description, /五人研究项目/);
  assert.match(l2r.description, /全部评估均在 F1TENTH 仿真中进行/);
  assert.match(l2r.description, /不涉及实体车辆部署/);
  assert.match(l2r.caseStudy.evidence[0].body, /0\.11.*0\.68/);
  assert.match(l2r.caseStudy.evidence[0].body, /不是完整跑完一圈的成功率/);
  assert.match(l2r.caseStudy.evidence[1].body, /没有一致证明 SAC/);
  assert.match(l2r.coverCaption, /仿真而非实体驾驶.*一次回放不代表汇总成功率/);
  const folio = translated.find(project => project.slug === "folio");
  assert.equal(folio.liveUrl, undefined);
  assert.match(JSON.stringify(folio.caseStudy), /不是实时协作/);
  assert.match(JSON.stringify(folio.caseStudy), /不意味着.*是公开演示/);
  assert.match(JSON.stringify(folio.caseStudy), /不会自动成为已核实的发现/);
  assert.match(JSON.stringify(translated.find(project => project.slug === "explainlab").caseStudy), /不是生产基准测试/);
  const electricity = JSON.stringify(translated.find(project => project.slug === "nz-electricity-forecasting").caseStudy);
  assert.match(electricity, /17\.2 MW/);
  assert.match(electricity, /76\.9%/);
  assert.match(electricity, /2025 年下半年留出集/);
  assert.match(electricity, /不是实时预测或市场建议产品/);
  assert.doesNotMatch(JSON.stringify(translated), /腾讯|Tencent|IEEE.*发表|获得最终成绩/);
});

test("the real language provider renders each card with a single type sticker, a distinct purpose and a clear detail action in both languages", () => {
  for (const language of ["en", "zh"]) {
    const html = renderGallery(language);
    const data = localizeProjects(projects, language);
    const cards = elements(html, "article");
    assert.equal(cards.length, 7);
    assert.equal(new Set(data.map(classificationText)).size, 7);
    assert.equal(new Set(data.map(project => project.cardSummary.trim())).size, 7);
    assert.equal(elements(html, "h1")[0].text, language === "zh" ? "项目与探索" : "Projects");
    assert.equal(elements(html, "h2").find(heading => heading.id === "project-gallery-title")?.text, language === "zh" ? "更多项目" : "More projects");
    for (const project of data) {
      const card = cards.find(card => card.id === project.slug);
      assert.ok(card.text.includes(project.title));
      const media = elements(card.markup, "div").find(item => item.class === "studio-project-card__media");
      const stickers = elements(card.markup, "span").filter(item => item.class === "studio-project-card__type");
      const [expectedType] = classifications[project.slug][language].split(" · ");
      assert.deepEqual(stickers.map(item => item.text), [expectedType]);
      assert.ok(media?.markup.includes(stickers[0].markup), "the sticker belongs to the cover");
      assert.doesNotMatch(card.markup, /studio-project-classification/);
      assert.ok(elements(card.markup, "p").some(item => item.text === project.cardSummary), `${project.slug} has a concrete purpose before opening`);
      const trigger = elements(card.markup, "button")[0];
      assert.equal(trigger["aria-label"], language === "zh" ? `查看详情：${project.title}` : `View details: ${project.title}`);
      assert.equal(trigger["aria-haspopup"], "dialog");
      assert.ok(stickers[0].id);
      assert.equal(stickers[0]["aria-hidden"], "true", "the type is spoken once, through the button description");
      assert.equal(trigger["aria-describedby"], stickers[0].id);
      assert.ok(!trigger.markup.includes(stickers[0].markup), "the paper sticker is a sibling, not an interactive child");
      const detailAction = elements(trigger.markup, "span").find(item => item.class?.split(/\s+/).includes("studio-project-card__explore"));
      assert.equal(detailAction?.text.replace(/\s*[↗→]\s*$/, ""), language === "zh" ? "查看详情" : "View details");
      const image = attributes(trigger.markup.match(/<img\b[^>]*>/)[0]);
      assert.equal(image.alt, project.coverAlt);
      for (const target of [project.liveUrl, project.sourceUrl].filter(Boolean)) {
        const link = elements(card.markup, "a").find(link => link.href === target);
        assert.ok(link);
        assert.equal(link.target, "_blank");
        assert.ok(link.rel.includes("noreferrer"));
        if (language === "zh") assert.ok(hasChinese(link["aria-label"]));
      }
    }
    assert.doesNotMatch(html, /studio-project-invite|project-cover--folio/);
    assert.equal(elements(cards.find(card => card.id === "folio").markup, "a").some(link => link.text.includes(language === "zh" ? "在线体验" : "Live demo")), false);
  }
});

test("provider-rendered case deep links expose the complete translated case and accurately label screenshot/illustration content", () => {
  for (const language of ["en", "zh"]) {
    for (const project of localizeProjects(projects, language)) {
      const dialog = elements(renderGallery(language, `#${project.slug}`), "dialog")[0];
      assert.ok(dialog.text.includes(project.title));
      const title = elements(dialog.markup, "h2").find(item => item.id === dialog["aria-labelledby"]);
      const classification = assertClassification(dialog.markup, project, language);
      assert.ok(title && dialog.markup.indexOf(classification.markup) > dialog.markup.indexOf(title.markup));
      assert.ok(dialog.text.includes(project.description));
      for (const technology of project.technologies) assert.ok(dialog.text.includes(technology));
      if (project.caseStudy) {
        for (const key of ["problem", "contribution", "next"]) assert.ok(dialog.text.includes(project.caseStudy[key]));
        for (const key of ["decisions", "evidence"]) for (const item of project.caseStudy[key]) {
          assert.ok(dialog.text.includes(item.title));
          assert.ok(dialog.text.includes(item.body));
        }
        assert.ok(elements(dialog.markup, "summary").some(summary => summary.text === (language === "zh" ? "完整项目介绍" : "Full project overview")));
      }
      assert.ok(elements(dialog.markup, "button").some(button => button.text.includes(language === "zh" ? "关闭项目详情" : "Close case study")));
      if (project.slug === "rumour-propagation") {
        const caption = elements(dialog.markup, "figcaption")[0];
        assert.ok(caption.text.includes(language === "zh" ? "不是已部署产品的界面截图" : "not a screenshot of a deployed product"));
      }
    }
  }
});

// Execute the real component callbacks with hook slots and a small history
// fixture. This checks ownership/focus state, not native browser rendering.
function switchingGallery(callback) {
  const slots = [], effects = new Set(), listeners = new Map(), writes = [], focus = [];
  let cursor = 0, language = "en";
  const entries = [{ address: "https://zhzhg-dev.github.io/projects/?ref=profile&lang=en&v=release", state: { analytics: "retained" } }];
  let at = 0;
  const browser = {
    location: new URL(entries[0].address),
    history: {
      get state() { return entries[at].state; },
      pushState(state, _, address) { browser.location = new URL(address, browser.location); entries.splice(at + 1, entries.length, { address: browser.location.href, state }); at++; writes.push("push"); },
      replaceState(state, _, address) { browser.location = new URL(address, browser.location); entries[at] = { address: browser.location.href, state }; writes.push("replace"); },
      back() { at--; browser.location = new URL(entries[at].address); writes.push("back"); for (const listener of listeners.get("popstate") ?? []) listener({ state: browser.history.state }); },
    },
    addEventListener(name, listener) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(listener); },
    removeEventListener(name, listener) { listeners.get(name)?.delete(listener); },
  };
  const hooks = {
    useContext() { return { language, t: (en, zh) => language === "zh" ? zh : en, href: path => path }; },
    useState(initial) { const index = cursor++; if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial }; return [slots[index].value, next => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; }]; },
    useId() { return `projects-switch-${cursor++}`; },
    useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { current: initial }; return slots[index]; },
    useEffect(callback, dependencies) { const index = cursor++; const previous = slots[index]; if (!previous || dependencies.some((value, at) => !Object.is(value, previous.dependencies[at]))) { slots[index] = { dependencies, callback, cleanup: previous?.cleanup }; effects.add(index); } },
    useMemo(callback, dependencies) { const index = cursor++; const previous = slots[index]; if (!previous || dependencies.some((value, at) => !Object.is(value, previous.dependencies[at]))) slots[index] = { value: callback(), dependencies }; return slots[index].value; },
  };
  const { StudioProjects: Component } = loadSource(resolve(repository, "src/components/StudioProjects.tsx"), hooks);
  const dialog = { open: false, scrollTop: 0, showModal() { this.open = true; }, close() { this.open = false; } };
  const triggers = new Map(projects.map(project => [project.slug, { isConnected: true, focus() { focus.push(project.slug); } }]));
  const document = { body: { classList: { add() {}, remove() {} } } };
  function render() {
    cursor = 0;
    const nodes = treeNodes(Component({ projects }));
    for (const node of nodes) {
      if (node.type === "dialog") node.props.ref.current = dialog;
      else if (node.type === "button" && node.props.className === "studio-case__close") node.props.ref.current = { focus() { focus.push("close"); } };
      else if (node.type === "button" && node.props["aria-haspopup"] === "dialog") {
        const project = projects.find(project => node.props["aria-label"].includes(project.title));
        node.props.ref(triggers.get(project.slug));
      }
    }
    for (const index of effects) { slots[index].cleanup?.(); slots[index].cleanup = slots[index].callback(); }
    effects.clear();
    return nodes;
  }
  return withGlobals({ window: browser, document }, () => {
    try { return callback({ browser, writes, focus, dialog, triggers, entries, render, setLanguage(next) { language = next; const address = new URL(browser.location); address.searchParams.set("lang", next); browser.history.replaceState(browser.history.state, "", address); } }); }
    finally { for (const slot of slots) slot?.cleanup?.(); }
  });
}

test("changing only language preserves open-case scroll/focus and still closes through the owned gallery history entry", () => {
  switchingGallery(({ browser, writes, focus, dialog, triggers, entries, render, setLanguage }) => {
    const trigger = render().find(node => node.type === "button" && node.props["aria-label"] === "View details: Folio");
    trigger.props.onClick({ currentTarget: triggers.get("folio") });
    render();
    assert.equal(dialog.open, true);
    assert.equal(entries.length, 2);
    assert.equal(browser.history.state.grantPortfolioCase.base, "/projects/?ref=profile&v=release", "only lang is omitted from the ownership base");
    assert.equal(browser.history.state.analytics, "retained");
    const beforeFocus = focus.slice();
    dialog.scrollTop = 365;
    setLanguage("zh");
    const translated = render();
    assert.equal(dialog.open, true);
    assert.equal(dialog.scrollTop, 365);
    assert.deepEqual(focus, beforeFocus);
    assert.equal(browser.location.hash, "#folio");
    assert.equal(browser.location.search, "?ref=profile&lang=zh&v=release");
    assert.ok(treeText(translated.find(node => node.type === "dialog")).includes(projectTranslations.folio.caseStudy.problem));
    translated.find(node => node.type === "button" && node.props.className === "studio-case__close").props.onClick();
    render();
    assert.equal(writes.at(-1), "back", "language switching must not cause the case to be mistaken for an unowned deep link");
    assert.equal(dialog.open, false);
    assert.equal(browser.location.hash, "");
    assert.equal(browser.history.state.analytics, "retained");
    assert.equal(focus.at(-1), "folio");
    assert.equal(entries.length, 2);
  });
});
