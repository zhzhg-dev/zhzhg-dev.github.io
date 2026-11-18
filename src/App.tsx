import { useEffect } from "react";
import { StudioHome } from "./components/StudioHome";
import { StudioProjects } from "./components/StudioProjects";
import { StudioBackground } from "./components/StudioBackground";
import { navigation, profile, projects } from "./data/profile";
import { useLanguage } from "./i18n";
import { LanguageSwitch } from "./components/LanguageSwitch";
import "./components/cozy-studio.css";
import "./components/bilingual.css";

export type PageName = "home" | "experience" | "projects" | "contact";

const pageMeta = {
  home: { title: ["Grant | Game AI Product Management", "Grant｜游戏 AI 产品管理"], description: ["Grant explores game AI product management in Auckland: testing what AI agents can do and building tools people can try for themselves.", "我是 Grant，在奥克兰探索游戏 AI 产品管理。我喜欢弄清楚 AI 智能体能做到什么，也喜欢把想法做成别人能亲手试试的工具。"], url: profile.canonicalUrl },
  experience: { title: ["Experience | Grant", "经历与背景｜Grant"], description: ["Grant’s current game AI internship at Tencent LIGHTSPEED STUDIOS, earlier teaching and newsroom roles, education and volunteer work.", "从腾讯光子工作室群的游戏 AI 产品实习，到此前的计算机教学与融媒采编：这里记录了 Grant 的工作、学习与志愿经历。"], url: `${profile.canonicalUrl}experience/` },
  projects: { title: ["Projects | Grant", "项目｜Grant"], description: ["Explore Folio, ExplainLab and L2R: Grant’s personal software projects and university research in AI, simulation and forecasting.", "看看工作之外的项目：从 Folio、ExplainLab 到 L2R，了解我如何做研究工具、用仿真测试赛车策略，以及预测用电需求。"], url: `${profile.canonicalUrl}projects/` },
  contact: { title: ["Contact | Grant", "联系我｜Grant"], description: ["Say hello to Grant in Auckland. Find him on LinkedIn or browse his personal code and experiments on GitHub.", "在 LinkedIn 找 Grant 聊聊游戏 AI 与评估，也可以到 GitHub 看看我的个人项目和实验。"], url: `${profile.canonicalUrl}contact/` },
};

function Header({ page }: { page: PageName }) {
  const { t, href } = useLanguage();
  const activePage = page === "experience" ? "home" : page;
  const labels = { home: "关于我", projects: "项目", contact: "联系" };
  return <header className="site-header">
    <a className="brand" href={href("/")} aria-label={t("Grant, About", "Grant，关于我")}><span translate="no">Grant</span></a>
    <nav className="site-nav" id="site-navigation" aria-label={t("Primary navigation", "主导航")}>
      {navigation.map(item => <a key={item.page} href={href(item.href)} aria-current={activePage === item.page ? "page" : undefined}><span>{t(item.label, labels[item.page])}</span></a>)}
    </nav>
    <div className="studio-header-actions">
      <LanguageSwitch />
      <a className="studio-contact-link" href={href("/contact/")}>{t("Say hello", "打个招呼")} <span aria-hidden="true">↗</span></a>
    </div>
  </header>;
}

function ExperiencePage() {
  const { t } = useLanguage();
  const sections = [
    { id: "work-title", label: t("Work & teaching", "工作与教学") },
    { id: "education-title", label: t("Courses & honours", "课程与荣誉") },
    { id: "community-title", label: t("Volunteering", "志愿活动") },
  ];
  return <>
    <section className="studio-page-heading" id="top">
      <p>{t("About", "关于我")}</p>
      <h1>{t("Work & background.", "经历与来路。")}</h1>
      <p>{t("I now work on game AI at Tencent LIGHTSPEED STUDIOS in Auckland. Before that, I taught computing labs and worked in a local newsroom.", "我现在在奥克兰的腾讯光子工作室群做游戏 AI 产品实习。在此之前，我带过计算机实验课，也在洛阳的新闻编辑部做过融媒采编。")}</p>
      <nav className="experience-index" aria-label={t("On this page", "本页导航")}>
        <ul>{sections.map(({ id, label }) => <li key={id}><a href={`#${id}`}>{label}<span aria-hidden="true">↓</span></a></li>)}</ul>
      </nav>
    </section>
    <StudioBackground />
  </>;
}

function ContactPage() {
  const { t } = useLanguage();
  return <section className="studio-contact-page" id="top" aria-labelledby="contact-page-title">
    <div className="studio-contact-page__intro"><p className="studio-page-label">{t("The door is open.", "随时欢迎。")}</p><h1 id="contact-page-title">{t("Say hello.", "聊聊吧。")}</h1><p>{t("Tried one of my projects? Tell me what worked, what surprised you, or where it fell short.", "试过我的某个项目吗？哪里好用，哪里让你意外，哪一步没走通，我都想听听。")}</p></div>
    <div className="studio-contact-options">
      <a className="studio-contact-option studio-contact-option--linkedin" href={profile.linkedin} target="_blank" rel="noreferrer"><span>{t("A conversation", "从交流开始")}</span><h2 translate="no">LinkedIn</h2><p>{t("The best place to say hello.", "找我聊聊，来这里就好。")}</p><span className="studio-contact-option__arrow" aria-hidden="true">↗</span></a>
      <a className="studio-contact-option studio-contact-option--github" href={profile.github} target="_blank" rel="noreferrer"><span>{t("Code & experiments", "代码与实验")}</span><h2 translate="no">GitHub</h2><p>{t("Explore the work behind the scenes.", "看看项目背后的实现。")}</p><span className="studio-contact-option__arrow" aria-hidden="true">↗</span></a>
    </div>
    <section className="studio-conversations" aria-labelledby="conversation-title"><h2 id="conversation-title">{t("A few good starting points.", "我们可以聊这些。")}</h2><ul><li>{t("Making AI research tools more useful—and easier to question.", "让 AI 研究工具更好用，也更经得起追问。")}</li><li>{t("Comparing approaches to game AI, simulation, or model evaluation.", "游戏 AI、仿真，以及如何公平地评价一个模型。")}</li><li>{t("Exchanging notes on a project, a technical decision, or teaching.", "交流项目思路、技术取舍，或教学中的小发现。")}</li></ul></section>
    <div className="studio-contact-note"><p>{t("Based in Auckland, New Zealand.", "目前在新西兰奥克兰。")}</p><p>{t("If you have a question about a project, send me its name or a link. I’ll know where to start.", "如果是项目上的问题，把项目名或链接一起发给我，我们就能从具体的地方聊起。")}</p></div>
  </section>;
}

function ContactPanel() {
  const { t, href } = useLanguage();
  return <section className="contact section-shell" aria-labelledby="contact-title"><div className="contact-intro"><p>{t("There’s always room for a good conversation.", "好想法，往往从一次聊天开始。")}</p><h2 id="contact-title">{t("Let’s compare notes.", "来交换想法吧。")}</h2></div><div className="contact-actions"><a href={href("/contact/")}>{t("Say hello", "打个招呼")}<span aria-hidden="true">↗</span></a></div></section>;
}

function Footer() {
  const { t } = useLanguage();
  return <footer className="site-footer section-shell"><p>© {new Date().getFullYear()} <span translate="no">Grant</span></p><p>{t("Mathematics. AI. A human point of view.", "数学、AI，以及人的视角。")}</p><a href="#top">{t("Back to top", "回到顶部")}<span aria-hidden="true">↑</span></a></footer>;
}

function App({ page }: { page: PageName }) {
  const { language, t } = useLanguage();
  useEffect(() => {
    const meta = pageMeta[page];
    const title = t(meta.title[0], meta.title[1]);
    const description = t(meta.description[0], meta.description[1]);
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) document.querySelector(selector)?.setAttribute("content", title);
    for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) document.querySelector(selector)?.setAttribute("content", description);
    const imageDescription = t("Grant’s illustrated Auckland studio, with a wooden desk, a mathematical whiteboard and a city window.", "Grant 的奥克兰小工作室：温暖的木桌、数学白板和窗外的城市。");
    for (const selector of ['meta[property="og:image:alt"]', 'meta[name="twitter:image:alt"]']) document.querySelector(selector)?.setAttribute("content", imageDescription);
    document.querySelector('meta[property="og:locale"]')?.setAttribute("content", language === "zh" ? "zh_CN" : "en_NZ");
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", meta.url);
  }, [page, language, t]);
  return <div className="portfolio-shell studio-site" data-language={language}>
    <a className="skip-link" href="#main-content">{t("Skip to content", "跳至正文")}</a>
    <Header page={page} />
    <main id="main-content" tabIndex={-1} className={`page-${page}`}>
      {page === "home" ? <><StudioHome /><StudioBackground compact /></> : page === "experience" ? <ExperiencePage /> : page === "projects" ? <StudioProjects projects={projects} /> : <ContactPage />}
      {page !== "contact" && <ContactPanel />}
    </main>
    <Footer />
  </div>;
}

export default App;
