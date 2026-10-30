import { useEffect } from "react";
import { StudioHome } from "./components/StudioHome";
import { StudioProjects } from "./components/StudioProjects";
import { StudioBackground } from "./components/StudioBackground";
import { navigation, profile, projects } from "./data/profile";

export type PageName = "home" | "experience" | "projects" | "contact";

const pageMeta = {
  home: { title: "Grant Zhang | AI Product Builder", description: "Grant Zhang: a mathematical mind, an AI builder, and a teacher. Based in Auckland, New Zealand.", url: profile.canonicalUrl },
  experience: { title: "Experience | Grant Zhang", description: "Grant Zhang’s teaching experience, education, community work, and technical toolkit.", url: `${profile.canonicalUrl}experience/` },
  projects: { title: "Projects | Grant Zhang", description: "Explore Folio, ExplainLab, electricity forecasting, and other AI, simulation, and software projects by Grant Zhang.", url: `${profile.canonicalUrl}projects/` },
  contact: { title: "Contact | Grant Zhang", description: "Connect with Grant Zhang on LinkedIn and GitHub. Based in Auckland, exploring AI products, game AI, and useful software.", url: `${profile.canonicalUrl}contact/` },
};

function Header({ page }: { page: PageName }) {
  const activePage = page === "experience" ? "home" : page;
  return <header className="site-header">
    <a className="brand" href="/" aria-label="Grant Zhang, About"><span translate="no">Grant Zhang</span></a>
    <nav className="site-nav" id="site-navigation" aria-label="Primary navigation">
      {navigation.map(item => <a key={item.page} href={item.href} aria-current={activePage === item.page ? "page" : undefined}><span>{item.label}</span></a>)}
    </nav>
    <a className="studio-contact-link" href="/contact/">Get in touch</a>
  </header>;
}

function ExperiencePage() {
  return <><section className="studio-page-heading" id="top"><p>About</p><h1>Work & background.</h1><p>Teaching, a mathematical foundation, and the skills I use to build.</p></section><StudioBackground /></>;
}

function ContactPage() {
  return <section className="studio-contact-page" id="top" aria-labelledby="contact-page-title">
    <div className="studio-contact-page__intro"><p className="studio-page-label">Contact</p><h1 id="contact-page-title">Let’s talk.</h1><p>A question, a different perspective, or something worth building together.</p></div>
    <div className="studio-contact-options">
      <a className="studio-contact-option studio-contact-option--linkedin" href={profile.linkedin} target="_blank" rel="noreferrer"><span>A conversation</span><h2>LinkedIn</h2><p>The best place to say hello.</p><span className="studio-contact-option__arrow" aria-hidden="true">↗</span></a>
      <a className="studio-contact-option studio-contact-option--github" href={profile.github} target="_blank" rel="noreferrer"><span>Code & experiments</span><h2>GitHub</h2><p>Explore the work behind the scenes.</p><span className="studio-contact-option__arrow" aria-hidden="true">↗</span></a>
    </div>
    <section className="studio-conversations" aria-labelledby="conversation-title"><h2 id="conversation-title">A few good starting points.</h2><ul><li>Making AI research tools more useful—and easier to question.</li><li>Comparing approaches to game AI, simulation, or model evaluation.</li><li>Exchanging notes on a project, a technical decision, or teaching.</li></ul></section>
    <div className="studio-contact-note"><p>Based in Auckland, New Zealand.</p><p>I’m curious about AI products, game AI, and tools that make difficult things a little clearer.</p></div>
  </section>;
}

function ContactPanel() {
  return <section className="contact section-shell" aria-labelledby="contact-title"><div className="contact-intro"><p>A useful question. A new perspective.</p><h2 id="contact-title">Let’s compare notes.</h2></div><div className="contact-actions"><a href="/contact/">Get in touch<span aria-hidden="true">↗</span></a></div></section>;
}

function Footer() {
  return <footer className="site-footer section-shell"><p>© {new Intl.DateTimeFormat("en-NZ", { year: "numeric" }).format(new Date())} Grant Zhang</p><p>Mathematics. AI. A human point of view.</p><a href="#top">Back to top<span aria-hidden="true">↑</span></a></footer>;
}

function App({ page }: { page: PageName }) {
  useEffect(() => {
    const meta = pageMeta[page];
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", meta.url);
  }, [page]);
  return <div className="portfolio-shell studio-site">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Header page={page} />
    <main id="main-content" tabIndex={-1} className={`page-${page}`}>
      {page === "home" ? <><StudioHome /><StudioBackground compact /></> : page === "experience" ? <ExperiencePage /> : page === "projects" ? <StudioProjects projects={projects} /> : <ContactPage />}
      {page !== "contact" && <ContactPanel />}
    </main>
    <Footer />
  </div>;
}

export default App;
