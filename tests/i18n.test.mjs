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

test("a fresh entrance defaults to English and only an explicit Chinese URL selects Chinese", () => {
  for (const [search, expected] of [
    ["", "en"], ["?v=release", "en"], ["?lang=en", "en"], ["?lang=zh", "zh"],
    ["?v=172d7ef&lang=en", "en"], ["?v=release&lang=zh", "zh"],
    ["?lang=fr", "en"], ["?lang=EN", "en"], ["?lang=ZH", "en"], ["?lang=", "en"],
  ]) assert.equal(resolveLanguage(search), expected, search || "bare entrance");
});

test("the actual provider renders its no-browser default in English rather than Chinese", () => {
  const html = withGlobals({ window: undefined }, () => renderToStaticMarkup(createElement(LanguageProvider, null, createElement(App, { page: "home" }))));
  const header = elements(html, "header").find(element => element.class === "site-header");
  assert.deepEqual(elements(elements(header.markup, "nav")[0].markup, "a").map(link => link.text), ["About", "Projects", "Contact"]);
  assert.match(plainText(html), /Hi, make yourself at home\./);
  assert.equal(elements(header.markup, "button").find(button => button["aria-label"] === "Switch to English")["aria-pressed"], "true");
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
    zh: ["嗨，欢迎来我的小工作室。", "AI 产品构建者", "用数学理解问题，", "用好奇心探索可能。", "最近在探索。", "工作与教学", "教育背景", "志愿活动", "研究生助教", "信息技术硕士"],
    en: ["Hi, make yourself at home.", "AI product builder", "A mathematical mind.", "A curiosity for what’s possible.", "What I’m exploring.", "Work & teaching", "Education", "Volunteering", "Graduate Teaching Assistant", "Master of Information Technology"],
  },
  experience: {
    zh: ["经历与来路。", "工作与成果", "研究生助教", "融媒采编", "奥克兰大学", "西南民族大学", "教育背景", "国家级优秀团队"],
    en: ["Work & background.", "Details & outcomes", "Graduate Teaching Assistant", "Multimedia Reporting & Editing Intern", "University of Auckland", "Southwest Minzu University", "Education", "National Outstanding Team"],
  },
  projects: {
    zh: ["认真做过的事", "项目与探索", "点开封面，看看每个项目背后的问题、选择与思考。", "Folio", "ExplainLab", "L2R Autonomous Racing", "在线体验", "源代码", "有个想法？", "我的工具箱", "产品与评估"],
    en: ["Selected", "Projects", "Open a cover to explore the thinking behind the work.", "Folio", "ExplainLab", "L2R Autonomous Racing", "Live demo", "Source", "Have an idea?", "My toolkit", "Product & evaluation"],
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

test("the Tencent internship is scheduled in both languages and only the teaching assistant is current", () => {
  const expectedCopy = {
    en: { employer: "Tencent / LIGHTSPEED STUDIOS", title: "Game AI Product Management Intern", start: "Scheduled to start 16 Nov 2026", location: "Auckland, New Zealand.", scope: /generative AI.*agents.*product requirements/i, teaching: "Graduate Teaching Assistant", end: "Jul 2026 — 16 Nov 2026 (scheduled end)" },
    zh: { employer: "腾讯光子工作室群", title: "游戏 AI 产品管理实习生", start: "计划于 2026 年 11 月 16 日入职", location: "新西兰奥克兰。", scope: /生成式 AI.*智能体.*产品需求/, teaching: "研究生助教", end: "2026 年 7 月 — 2026 年 11 月 16 日（预计结束）" },
  };
  for (const [language, copy] of Object.entries(expectedCopy)) {
    for (const page of ["home", "experience"]) {
      const html = renderPage(page, language);
      const work = elements(html, "section").find(section => section["aria-labelledby"] === "work-title");
      assert.ok(work);
      const records = elements(work.markup, "li").filter(item => item.class?.split(/\s+/).includes("background-work__entry"));
      const scheduled = records.find(item => item.text.includes(copy.employer));
      const current = records.filter(item => item.class.split(/\s+/).includes("background-work__entry--current"));
      assert.ok(scheduled);
      assert.equal(elements(scheduled.markup, "h3")[0]?.text, copy.title);
      assert.ok(elements(scheduled.markup, "article")[0]?.text.startsWith([copy.employer, copy.title, copy.location].join(" ")));
      assert.ok(scheduled.text.includes(copy.start));
      assert.doesNotMatch(scheduled.markup, /background-work__entry--current|<details\b|<dl\b|<ul\b/);
      if (page === "experience") assert.match(scheduled.text, copy.scope);
      else assert.doesNotMatch(scheduled.text, copy.scope);
      assert.equal(current.length, 1);
      assert.equal(elements(current[0].markup, "h3")[0]?.text, copy.teaching);
      assert.ok(current[0].text.includes(copy.end));
      assert.match(current[0].text, /COMPSCI 111/);
      if (page === "experience") assert.match(elements(current[0].markup, "details")[0]?.markup ?? "", /^<details\b[^>]*\sopen(?:=|\s|>)/);
      assert.doesNotMatch(html.replace(work.markup, ""), /Tencent|腾讯/);
    }
  }
});

test("the bilingual toolkit belongs only to Projects and follows the complete cover gallery", () => {
  for (const [language, title] of [["en", "My toolkit"], ["zh", "我的工具箱"]]) {
    const html = renderPage("projects", language);
    const [toolkit] = elements(html, "section").filter(item => item["aria-labelledby"] === "toolkit-title");
    const grid = elements(html, "div").find(item => item.class === "studio-projects__grid");
    assert.ok(toolkit && grid);
    assert.ok(html.indexOf(toolkit.markup) >= html.indexOf(grid.markup) + grid.markup.length);
    assert.deepEqual(elements(html, "h2").filter(item => item.id === "toolkit-title").map(item => item.text), [title]);
    assert.equal(elements(toolkit.markup, "div").filter(item => item.class === "studio-toolkit__group").length, 5);
    for (const page of ["home", "experience", "contact"]) {
      const other = renderPage(page, language);
      assert.doesNotMatch(other, /toolkit-title|studio-toolkit__group/);
      assert.ok(!plainText(other).includes(title));
    }
  }
});

test("only the detailed work history expands teaching and television into bilingual STAR stories", () => {
  const copy = {
    en: {
      media: "Multimedia Reporting & Editing Intern",
      teaching: "Graduate Teaching Assistant",
      labels: ["Context", "Task", "What I did", "Outcome"],
      channel: "Luoyang Rongmei",
      mediaSummary: ["three months", "Luoyang TV’s local news bulletin"],
      evidence: ["Luoyang TV’s local news bulletin", "Erlitou", "235 likes", "155 shares", "5 comments", "not my individual performance"],
      teachingEvidence: ["about 30 students", "two weekly COMPSCI 111 lab groups", "Open Lab"],
    },
    zh: {
      media: "融媒采编",
      teaching: "研究生助教",
      labels: ["背景", "任务", "我的行动", "成果"],
      channel: "洛阳融媒",
      mediaSummary: ["三个月", "洛阳电视台《新闻联播》"],
      evidence: ["洛阳电视台《新闻联播》", "二里头绿松石龙形器", "235 次点赞", "155 次转发", "5 条评论", "不代表个人业绩"],
      teachingEvidence: ["两组 COMPSCI 111 实验课", "约 30 名学生", "Open Lab"],
    },
  };
  for (const [language, expected] of Object.entries(copy)) {
    const getWork = page => elements(renderPage(page, language), "section").find(item => item["aria-labelledby"] === "work-title");
    const compact = getWork("home"), full = getWork("experience");
    for (const title of [expected.media, expected.teaching]) {
      const homeRole = elements(compact.markup, "article").find(item => elements(item.markup, "h3")[0]?.text === title);
      const detail = elements(full.markup, "article").find(item => elements(item.markup, "h3")[0]?.text === title);
      assert.ok(homeRole && detail);
      assert.doesNotMatch(homeRole.markup, /<details\b|<dl\b/);
      const [story] = elements(detail.markup, "dl");
      assert.ok(story);
      assert.deepEqual(elements(story.markup, "dt").map(item => item.text), expected.labels);
      const rows = elements(story.markup, "dd");
      assert.equal(rows.length, 4);
      assert.ok(rows.every(row => row.text.length > 0));
      const outcome = rows[3].text;
      for (const fact of title === expected.media ? [expected.channel, ...expected.evidence] : expected.teachingEvidence) {
        assert.ok(outcome.includes(fact), language + " outcome includes " + fact);
      }
      if (title === expected.media) {
        for (const fact of expected.mediaSummary) assert.ok(homeRole.text.includes(fact));
        assert.equal(elements(detail.markup, "a").length, 0, "no unverified WeChat video link");
      }
    }
    for (const html of [compact.markup, full.markup]) assert.doesNotMatch(plainText(html), /IELTS Teaching Assistant|雅思助教/);
  }
});

test("bilingual education lists grouped coursework and undergraduate honours without displaying master's GPA", () => {
  const copy = {
    en: {
      graduate: "Master of Information Technology",
      bachelor: "Bachelor of Science in Information and Computational Science",
      courses: ["Foundations of Machine Learning", "Advanced Topics in Database Systems", "System Dynamics and Complex Modelling"],
      undergraduate: [["Computing", ["Data Structures and Algorithms", "Object-Oriented Programming"]], ["Mathematics", ["Mathematical Analysis", "Advanced Algebra", "Probability Theory"]]],
      honours: /Outstanding Graduate.*Outstanding Student.*Sichuan Province Grade A Certificate/,
    },
    zh: {
      graduate: "信息技术硕士",
      bachelor: "信息与计算科学 · 理学学士",
      courses: ["机器学习基础", "高级数据库系统专题", "系统动力学与复杂建模"],
      undergraduate: [["计算机", ["数据结构与算法", "面向对象程序设计"]], ["数学", ["数学分析", "高等代数", "概率论"]]],
      honours: /优秀毕业生.*优秀学生.*四川省大学生综合素质 A 级证书/,
    },
  };
  for (const [language, expected] of Object.entries(copy)) {
    const html = renderPage("experience", language);
    const education = elements(html, "section").find(item => item["aria-labelledby"] === "education-title");
    assert.ok(education);
    const degrees = elements(education.markup, "article");
    const graduate = degrees.find(item => elements(item.markup, "h3")[0]?.text === expected.graduate);
    const bachelor = degrees.find(item => elements(item.markup, "h3")[0]?.text === expected.bachelor);
    assert.ok(graduate && bachelor);
    assert.doesNotMatch(graduate.text, /\bGPA\b|grade point average|绩点/i);
    assert.ok(elements(graduate.markup, "h4").length >= 2);
    const courses = elements(graduate.markup, "li").map(item => item.text);
    for (const title of expected.courses) assert.ok(courses.includes(title));
    const groups = elements(bachelor.markup, "div").filter(item => item.class === "background-education__group");
    const honours = groups.find(item => elements(item.markup, "h4")[0]?.text === (language === "en" ? "Honours" : "荣誉"));
    assert.ok(honours);
    assert.equal(elements(honours.markup, "li").length, 3);
    assert.match(honours.text, expected.honours);
    const courseGroups = groups.filter(item => item !== honours);
    assert.deepEqual(courseGroups.map(group => [
      elements(group.markup, "h4")[0]?.text,
      elements(group.markup, "li").map(item => item.text),
    ]), expected.undergraduate, "selected undergraduate maths and computer science courses appear separately");
  }
});

test("the bilingual volunteering section leads with the team award and keeps the two official field reports separate", () => {
  const copy = {
    en: { category: "Volunteering", honour: "National Outstanding Team", team: "Gesanghua Outreach Team", school: "School of Mathematics, Southwest Minzu University", locations: ["Hongyuan", "Xiangcheng"] },
    zh: { category: "志愿活动", honour: "国家级优秀团队", team: "格桑花", school: "西南民族大学数学学院", locations: ["红原", "乡城"] },
  };
  const reportUrls = ["https://sxxy.swun.edu.cn/info/1052/1327.htm", "https://sxxy.swun.edu.cn/info/1052/1413.htm"];
  for (const [language, expected] of Object.entries(copy)) {
    for (const page of ["home", "experience"]) {
      const card = elements(renderPage(page, language), "aside").find(note => note["aria-labelledby"] === "community-title");
      assert.ok(card);
      assert.deepEqual(elements(card.markup, "h2").map(heading => heading.text), [expected.honour]);
      for (const fact of [expected.category, expected.team, expected.school]) assert.ok(card.text.includes(fact), `${language} preserves ${fact}`);
      const reports = elements(card.markup, "article");
      assert.equal(reports.length, 2);
      assert.deepEqual(elements(card.markup, "a").map(link => link.href), reportUrls);
      for (const [index, report] of reports.entries()) {
        const year = [2022, 2021][index];
        assert.match(report.text, new RegExp(`\\b${year}\\b`));
        assert.ok(report.text.includes(expected.locations[index]));
        assert.equal(elements(report.markup, "h3").length, 1);
        const links = elements(report.markup, "a");
        assert.deepEqual(links.map(link => [link.href, link.target]), [[reportUrls[index], "_blank"]]);
      }
      assert.ok(!reports[1].text.includes(expected.honour), "the earlier 2021 trip is not attributed the 2022 team award");
      if (language === "zh") {
        for (const fact of ["科普", "全程", "宣传部", "撰写"]) assert.ok(reports[0].text.includes(fact), `2022 report preserves ${fact}`);
        assert.doesNotMatch(reports[1].text, /撰写|执笔/);
      } else {
        assert.match(reports[0].text, /mathematics|science outreach/i);
        assert.match(reports[0].text, /publicity|communications/i);
        assert.match(reports[0].text, /wrote|authored/i);
        assert.doesNotMatch(reports[1].text, /wrote|authored/i);
      }
      assert.doesNotMatch(card.text, /Official award list|查看全国优秀团队名单|party history|ideological education|党史|思想政治|政治学习/i);
      assert.doesNotMatch(card.text, /led the team|won an individual award|获个人奖项|带领团队/i);
    }
  }
});

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

test("English-first initialization and explicit switching do not access browser storage or lose project history", () => {
  let address = new URL("https://zhzhg-dev.github.io/projects/?v=release#folio");
  const historyState = { studioProject: "folio", grantPortfolioCase: { owner: "existing-owner", slug: "folio", base: "/projects/?v=release" } };
  let storageAccesses = 0;
  const browser = {
    get location() { return address; },
    get localStorage() { storageAccesses++; throw new Error("Storage blocked"); },
    history: { state: historyState, replaceState(state, _title, url) { assert.equal(state, historyState); address = new URL(url, address); } },
  };
  withGlobals({ window: browser }, () => {
    const state = stateHooks();
    const { LanguageProvider: Provider } = loadSource(resolve(repository, "src/i18n.tsx"), state.hooks);
    const render = () => { state.restart(); return Provider({ children: null }); };
    let rendered = render();
    assert.equal(rendered.props.value.language, "en");
    assert.doesNotThrow(() => rendered.props.value.setLanguage("zh"));
    rendered = render();
    assert.equal(rendered.props.value.language, "zh");
    assert.equal(rendered.props.value.t("Hello", "你好"), "你好");
    assert.equal(address.pathname, "/projects/");
    assert.equal(address.searchParams.get("v"), "release");
    assert.equal(address.searchParams.get("lang"), "zh");
    assert.equal(address.hash, "#folio");
    assert.equal(rendered.props.value.href("/contact/"), "/contact/?lang=zh");
    assert.equal(storageAccesses, 0, "the entrance and switch must work without reading or writing storage");
  });
});

test("a legacy saved Chinese preference cannot override a fresh English entrance, while explicit Chinese survives links and refresh", () => {
  let address = new URL("https://zhzhg-dev.github.io/");
  let storageReads = 0, storageWrites = 0;
  const browser = {
    get location() { return address; },
    localStorage: { getItem() { storageReads++; return "zh"; }, setItem() { storageWrites++; } },
    history: { state: { unrelated: "retained" }, replaceState(state, _title, url) { this.state = state; address = new URL(url, address); } },
  };
  withGlobals({ window: browser }, () => {
    const mount = () => {
      const state = stateHooks();
      const { LanguageProvider: Provider } = loadSource(resolve(repository, "src/i18n.tsx"), state.hooks);
      const render = () => { state.restart(); return Provider({ children: null }).props.value; };
      return { render };
    };
    const entrance = mount();
    assert.equal(entrance.render().language, "en");
    entrance.render().setLanguage("zh");
    assert.equal(entrance.render().language, "zh");
    assert.equal(address.searchParams.get("lang"), "zh");
    assert.equal(mount().render().language, "zh", "refresh keeps the explicit language in the current URL");
    address = new URL(entrance.render().href("/projects/#folio"), address);
    assert.equal(mount().render().language, "zh", "an internal page link carries Chinese without a saved preference");
    assert.equal(address.hash, "#folio");
    address = new URL("https://zhzhg-dev.github.io/?v=release");
    assert.equal(mount().render().language, "en", "a new plain entrance is English even after a previous Chinese visit");
    assert.equal(storageReads, 0);
    assert.equal(storageWrites, 0);
  });
});
