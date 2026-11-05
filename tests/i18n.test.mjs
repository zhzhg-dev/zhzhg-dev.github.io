import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { elements, loadSource, plainText, repository, treeNodes, treeText, withGlobals } from "./support/source-harness.mjs";

const cache = new Map();
const { LanguageProvider, resolveLanguage, localizedHref } = loadSource(resolve(repository, "src/i18n.tsx"), undefined, cache);
const { WhiteboardExperiment } = loadSource(resolve(repository, "src/components/WhiteboardExperiment.tsx"), undefined, cache);
const { default: App } = loadSource(resolve(repository, "src/App.tsx"), undefined, cache);
const labProps = { open: false, onClose() {}, returnFocusRef: { current: null }, id: "bilingual-whiteboard" };

function renderLab(language) {
  return renderToStaticMarkup(createElement(LanguageProvider, { initialLanguage: language }, createElement(WhiteboardExperiment, labProps)));
}

function renderPage(page, language, slug) {
  const pathname = page === "home" ? "/" : `/${page}/`;
  return withGlobals({ window: slug ? { location: new URL(`https://zhzhg-dev.github.io${pathname}?lang=${language}#${slug}`), history: { state: null } } : undefined },
    () => renderToStaticMarkup(createElement(LanguageProvider, { initialLanguage: language }, createElement(App, { page }))));
}

function stateHooks(contextValue) {
  const slots = [];
  let cursor = 0;
  return {
    restart() { cursor = 0; },
    hooks: {
      useState(initial) {
        const index = cursor++;
        if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial };
        return [slots[index].value, next => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; }];
      },
      useId() { return `bilingual-${cursor++}`; },
      useRef(initial) {
        const index = cursor++;
        if (!slots[index]) slots[index] = { current: initial };
        return slots[index];
      },
      useContext(context) { return contextValue ? contextValue() : context._currentValue; },
      useEffect() { cursor++; },
      useMemo(callback) { cursor++; return callback(); },
      useCallback(callback) { cursor++; return callback; },
    },
  };
}

test("language choice defaults to Chinese and a valid URL choice takes priority over saved language", () => {
  for (const [search, stored, expected] of [
    ["", null, "zh"], ["", "zh", "zh"], ["", "en", "en"], ["", "fr", "zh"],
    ["?lang=en", "zh", "en"], ["?lang=zh", "en", "zh"],
    ["?v=172d7ef&lang=en", null, "en"], ["?lang=fr", "en", "en"], ["?lang=EN", null, "zh"],
  ]) assert.equal(resolveLanguage(search, stored), expected, `${search} / ${stored}`);
});

test("localized internal addresses retain route, query and project hash without modifying external or same-page links", () => {
  assert.equal(localizedHref("/", "zh"), "/?lang=zh");
  assert.equal(localizedHref("/projects/#learn-to-race", "en"), "/projects/?lang=en#learn-to-race");
  assert.equal(localizedHref("/projects/?v=release&lang=en#folio", "zh"), "/projects/?v=release&lang=zh#folio");
  for (const path of ["#studio-about", "https://github.com/zhzhg-dev", "//example.com/path", "mailto:hello@example.com", "relative-path"]) {
    assert.equal(localizedHref(path, "zh"), path);
  }
});

const pageCopy = {
  home: {
    zh: ["嗨，欢迎来我的小工作室。", "AI 产品构建者", "用数学理解问题，", "用好奇心探索可能。", "最近在探索。", "工作与教学", "教育背景", "我的工具箱", "课堂之外", "研究生助教", "信息技术硕士"],
    en: ["Hi, make yourself at home.", "AI product builder", "A mathematical mind.", "A curiosity for what’s possible.", "What I’m exploring.", "Work & teaching", "Education", "My toolkit", "Outside the classroom", "Graduate Teaching Assistant", "Master of Information Technology"],
  },
  experience: {
    zh: ["经历与来路。", "工作内容", "研究生助教", "雅思助教", "奥克兰大学", "西南民族大学", "教育背景", "产品与评估", "全国优秀团队"],
    en: ["Work & background.", "Responsibilities", "Graduate Teaching Assistant", "IELTS Teaching Assistant", "University of Auckland", "Southwest Minzu University", "Education", "Product & evaluation"],
  },
  projects: {
    zh: ["认真做过的事", "项目与探索", "点开封面，看看每个项目背后的问题、选择与思考。", "Folio", "ExplainLab", "L2R Autonomous Racing", "在线体验", "源代码", "有个想法？"],
    en: ["Selected", "Projects", "Open a cover to explore the thinking behind the work.", "Folio", "ExplainLab", "L2R Autonomous Racing", "Live demo", "Source", "Have an idea?"],
  },
  contact: {
    zh: ["随时欢迎。", "聊聊吧。", "从交流开始", "代码与实验", "我们可以聊这些。", "目前在新西兰奥克兰。", "LinkedIn", "GitHub"],
    en: ["The door is open.", "Say hello.", "A conversation", "Code & experiments", "A few good starting points.", "Based in Auckland, New Zealand.", "LinkedIn", "GitHub"],
  },
};

for (const page of Object.keys(pageCopy)) {
  for (const language of ["zh", "en"]) {
    test(`${page} renders complete ${language} copy with the matching language choice and Grant-only identity`, () => {
      const html = renderPage(page, language);
      const text = plainText(html);
      for (const expected of pageCopy[page][language]) assert.ok(text.includes(expected), `${page}/${language} includes ${expected}`);
      assert.doesNotMatch(text, /Grant Zhang|Zhang Zihang|张子航|张梓航/);
      const header = elements(html, "header").find(element => element.class === "site-header");
      assert.ok(header);
      const brand = elements(header.markup, "a").find(link => link.class === "brand");
      assert.equal(brand.text, "Grant");
      assert.equal(brand.href, `/?lang=${language}`);
      const languageButtons = elements(header.markup, "button");
      assert.equal(languageButtons.length, 2);
      assert.equal(languageButtons.find(button => button["aria-label"] === "切换到中文")["aria-pressed"], String(language === "zh"));
      assert.equal(languageButtons.find(button => button["aria-label"] === "Switch to English")["aria-pressed"], String(language === "en"));
      const nav = elements(header.markup, "nav")[0];
      assert.equal(nav["aria-label"], language === "zh" ? "主导航" : "Primary navigation");
      const tabs = elements(nav.markup, "a");
      assert.deepEqual(tabs.map(tab => tab.text), language === "zh" ? ["关于我", "项目", "联系"] : ["About", "Projects", "Contact"]);
      assert.deepEqual(tabs.map(tab => tab.href), ["/", "/projects/", "/contact/"].map(path => localizedHref(path, language)));
      assert.equal(tabs.find(tab => tab["aria-current"] === "page").href, localizedHref(page === "experience" || page === "home" ? "/" : `/${page}/`, language));
      assert.equal(elements(html, "h1").length, 1);
      if (page === "home") assert.equal(elements(html, "h1")[0].text.replace(/\s/g, ""), "Grant.");
      for (const link of elements(html, "a").filter(link => link.href?.startsWith("/") && !link.href.startsWith("//"))) {
        assert.equal(new URL(link.href, "https://zhzhg-dev.github.io").searchParams.get("lang"), language, `${link.text} preserves chosen language`);
      }
      assert.ok(elements(html, "footer").some(footer => /© \d{4} Grant/.test(footer.text)));
    });
  }
}

test("project cases keep their English identities while translating full evidence and contribution details", () => {
  for (const [slug, title] of [["folio", "Folio"], ["explainlab", "ExplainLab"], ["nz-electricity-forecasting", "NZ Electricity Intelligence"], ["learn-to-race", "L2R Autonomous Racing"]]) {
    const chinese = renderPage("projects", "zh", slug);
    const english = renderPage("projects", "en", slug);
    const chineseCase = elements(chinese, "dialog")[0];
    const englishCase = elements(english, "dialog")[0];
    for (const expected of [title, "想解决的问题", "我做了什么", "关键选择", "结果与局限", "下一步", "完整项目介绍"]) {
      assert.ok(chineseCase.text.includes(expected), `${slug}/zh includes ${expected}`);
    }
    for (const expected of [title, "The problem", "My work", "Key decisions", "Evidence & limitations", "Next iteration", "Full project overview"]) {
      assert.ok(englishCase.text.includes(expected), `${slug}/en includes ${expected}`);
    }
    assert.doesNotMatch(chineseCase.text, /The problem|My work|Key decisions|Evidence & limitations|Next iteration/);
    assert.equal(elements(chineseCase.markup, "h2")[0].text, title);
    if (slug === "learn-to-race") {
      for (const expected of ["10 次 SAC", "48 次训练", "团队成果", "0.11", "0.68", "不是完整跑完一圈的成功率", "实体车辆"]) assert.ok(chineseCase.text.includes(expected));
    }
  }
});

test("the whiteboard renders its full controls, instructions, model choices and accessible names in either language", () => {
  const chinese = renderLab("zh");
  const english = renderLab("en");
  for (const text of ["曲线，越灵活越好吗？", "选中的数据点", "数据点高度", "直线", "平缓曲线", "灵活曲线", "显示未见数据", "拟合误差", "未见数据误差", "尚未显示", "重置实验", "模拟数据", "RMSE"]) {
    assert.ok(chinese.includes(text), `Chinese includes ${text}`);
  }
  assert.ok(elements(chinese, "button").some(button => button["aria-label"] === "关闭白板实验"));
  assert.equal(elements(chinese, "button").filter(button => /^调整第 \d+ 个数据点$/.test(button["aria-label"] ?? "")).length, 7);
  assert.ok(elements(chinese, "a").some(link => link.href === "/?lang=zh#education-title"));
  assert.doesNotMatch(chinese, /Selected point|Point height|Close experiment|Curve flexibility|Show unseen points/);
  for (const text of ["How much curve is enough?", "Selected point", "Point height", "Straight line", "Gentle curve", "Flexible curve", "Show unseen points", "Simulated data"]) {
    assert.ok(english.includes(text), `English includes ${text}`);
  }
  assert.ok(elements(english, "a").some(link => link.href === "/?lang=en#education-title"));
});

test("switching the whiteboard language preserves curve selection, edited data and revealed checks", () => {
  let language = "en";
  const value = () => ({ language, t: (en, zh) => language === "zh" ? zh : en, href: path => localizedHref(path, language), setLanguage() {} });
  const state = stateHooks(value);
  const { WhiteboardExperiment: Lab } = loadSource(resolve(repository, "src/components/WhiteboardExperiment.tsx"), state.hooks);
  const render = () => { state.restart(); return treeNodes(Lab(labProps)); };
  let nodes = render();
  nodes.find(node => node.type === "button" && node.props["aria-label"] === "Flexible curve").props.onClick();
  nodes = render();
  nodes.find(node => node.type === "input" && node.props.type === "range").props.onChange({ currentTarget: { value: "79" } });
  nodes = render();
  nodes.find(node => node.props.className === "whiteboard-lab__reveal").props.onClick();
  nodes = render();
  const curve = nodes.find(node => node.props.className === "whiteboard-lab__curve").props.d;
  const errors = treeText(nodes.find(node => node.props.className === "whiteboard-lab__errors"));
  language = "zh";
  nodes = render();
  assert.equal(nodes.find(node => node.type === "button" && node.props["aria-label"] === "灵活曲线").props["aria-pressed"], true);
  assert.equal(nodes.find(node => node.type === "input" && node.props.type === "range").props.value, 79);
  assert.equal(nodes.find(node => node.props.className === "whiteboard-lab__curve").props.d, curve);
  assert.equal(nodes.find(node => node.props.className === "whiteboard-lab__reveal").props["aria-pressed"], true);
  assert.match(treeText(nodes.find(node => node.props.className === "whiteboard-lab__reveal")), /隐藏未见数据/);
  assert.deepEqual(treeText(nodes.find(node => node.props.className === "whiteboard-lab__errors")).match(/\d+\.\d/g), errors.match(/\d+\.\d/g));
  assert.ok(nodes.some(node => node.props.className === "whiteboard-lab__check-dot"));
});

test("language initialization and switching remain functional when browser storage is denied", () => {
  let address = new URL("https://zhzhg-dev.github.io/projects/?v=release#folio");
  const historyState = { studioProject: "folio", grantPortfolioCase: { owner: "existing-owner", slug: "folio", base: "/projects/?v=release" } };
  const browser = {
    get location() { return address; },
    localStorage: { getItem() { throw new Error("Storage blocked"); }, setItem() { throw new Error("Storage blocked"); } },
    history: { state: historyState, replaceState(state, _title, url) { assert.equal(state, historyState); address = new URL(url, address); } },
  };
  withGlobals({ window: browser }, () => {
    const state = stateHooks();
    const { LanguageProvider: Provider } = loadSource(resolve(repository, "src/i18n.tsx"), state.hooks);
    const render = () => { state.restart(); return Provider({ children: null }); };
    let rendered = render();
    assert.equal(rendered.props.value.language, "zh");
    assert.doesNotThrow(() => rendered.props.value.setLanguage("en"));
    rendered = render();
    assert.equal(rendered.props.value.language, "en");
    assert.equal(rendered.props.value.t("Hello", "你好"), "Hello");
    assert.equal(address.pathname, "/projects/");
    assert.equal(address.searchParams.get("v"), "release");
    assert.equal(address.searchParams.get("lang"), "en");
    assert.equal(address.hash, "#folio");
    assert.equal(rendered.props.value.href("/contact/"), "/contact/?lang=en");
  });
});
