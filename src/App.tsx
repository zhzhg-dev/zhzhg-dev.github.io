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
  home: { title: ["Grant | AI Product Builder", "Grant｜AI 产品与好奇心"], description: ["Grant: a mathematical mind, an AI builder, and a teacher. Based in Auckland, New Zealand.", "我是 Grant，在奥克兰学习、构建 AI 产品，也参与计算机教学。从数学出发，探索 AI、仿真与有用的软件。"], url: profile.canonicalUrl },
  experience: { title: ["Experience | Grant", "经历与背景｜Grant"], description: ["Grant’s teaching experience, education, community work, and technical toolkit.", "Grant 的教学经历、教育背景、社区实践与技术工具。"], url: `${profile.canonicalUrl}experience/` },
  projects: { title: ["Projects | Grant", "项目｜Grant"], description: ["Explore Folio, ExplainLab, electricity forecasting, and other AI, simulation, and software projects by Grant.", "探索 Folio、ExplainLab、L2R 与新西兰电力预测：从 AI 产品到仿真研究，看看我的思考、实现与验证。"], url: `${profile.canonicalUrl}projects/` },
  contact: { title: ["Contact | Grant", "联系我｜Grant"], description: ["Connect with Grant on LinkedIn and GitHub. Based in Auckland, exploring AI products, game AI, and useful software.", "通过 LinkedIn 和 GitHub 联系 Grant。聊聊 AI 产品、游戏 AI、教学，或一个值得一起尝试的想法。"], url: `${profile.canonicalUrl}contact/` },
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
  return <><section className="studio-page-heading" id="top"><p>{t("About", "关于我")}</p><h1>{t("Work & background.", "经历与来路。")}</h1><p>{t("Teaching, a mathematical foundation, and the skills I use to build.", "教学的经历、数学的底子，以及把想法做出来的工具。")}</p></section><StudioBackground /></>;
}

function ContactPage() {
  const { t } = useLanguage();
  return <section className="studio-contact-page" id="top" aria-labelledby="contact-page-title">
    <div className="studio-contact-page__intro"><p className="studio-page-label">{t("The door is open.", "随时欢迎。")}</p><h1 id="contact-page-title">{t("Say hello.", "聊聊吧。")}</h1><p>{t("A question, a different perspective, or something worth building together. I’d like to hear it.", "一个问题、一种不同的看法，或是一个值得一起做的想法。我都很想听听。")}</p></div>
    <div className="studio-contact-options">
      <a className="studio-contact-option studio-contact-option--linkedin" href={profile.linkedin} target="_blank" rel="noreferrer"><span>{t("A conversation", "从交流开始")}</span><h2 translate="no">LinkedIn</h2><p>{t("The best place to say hello.", "找我聊聊，来这里就好。")}</p><span className="studio-contact-option__arrow" aria-hidden="true">↗</span></a>
      <a className="studio-contact-option studio-contact-option--github" href={profile.github} target="_blank" rel="noreferrer"><span>{t("Code & experiments", "代码与实验")}</span><h2 translate="no">GitHub</h2><p>{t("Explore the work behind the scenes.", "看看项目背后的实现。")}</p><span className="studio-contact-option__arrow" aria-hidden="true">↗</span></a>
    </div>
    <section className="studio-conversations" aria-labelledby="conversation-title"><h2 id="conversation-title">{t("A few good starting points.", "我们可以聊这些。")}</h2><ul><li>{t("Making AI research tools more useful—and easier to question.", "让 AI 研究工具更好用，也更经得起追问。")}</li><li>{t("Comparing approaches to game AI, simulation, or model evaluation.", "游戏 AI、仿真，以及如何公平地评价一个模型。")}</li><li>{t("Exchanging notes on a project, a technical decision, or teaching.", "交流项目思路、技术取舍，或教学中的小发现。")}</li></ul></section>
    <div className="studio-contact-note"><p>{t("Based in Auckland, New Zealand.", "目前在新西兰奥克兰。")}</p><p>{t("I’m curious about AI products, game AI, and tools that make difficult things a little clearer.", "我关注 AI 产品、游戏 AI，也喜欢把复杂的事情讲清楚、做明白。")}</p></div>
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
