import { useEffect } from "react";
import { StudioHome } from "./components/StudioHome";
import { StudioProjects } from "./components/StudioProjects";
import { community, education, experience, navigation, profile, projects, skills } from "./data/profile";

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

function ExperienceDetails() {
  return <div className="studio-background">
    <section className="resume-section section-shell" aria-labelledby="work-title">
      <div className="resume-label"><h2 id="work-title">Work & teaching</h2></div>
      <div className="resume-content">{experience.map((role, index) => <article className="resume-role" key={role.role}>
        <div className="resume-role__meta"><p>{role.period}</p><p>{role.organisation}</p></div>
        <h3>{role.role}</h3><p className="resume-role__summary">{role.summary}</p>
        <details className="resume-details" open={index === 0}><summary>Responsibilities <span aria-hidden="true">+</span></summary><ul>{role.points.map(point => <li key={point}>{point}</li>)}</ul></details>
        <ul className="inline-tags" aria-label={`${role.role} capabilities`}>{role.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
      </article>)}</div>
    </section>
    <section className="resume-section section-shell" aria-labelledby="education-title">
      <div className="resume-label"><h2 id="education-title">Education</h2></div>
      <div className="resume-content">{education.map(item => <article className="education-entry" key={item.degree}><p className="entry-date">{item.period}</p><h3>{item.degree}</h3><p className="entry-institution">{item.institution}</p><p className="entry-note">{item.detail}</p></article>)}</div>
    </section>
    <section className="resume-section resume-community section-shell" aria-labelledby="community-title">
      <div className="resume-label"><h2 id="community-title">Outside the classroom</h2></div>
      <div className="resume-content"><p className="community-award">{community.distinction}</p><h3>{community.title}</h3><p className="community-copy">{community.description}</p></div>
    </section>
    <section className="resume-section section-shell" aria-labelledby="toolkit-title">
      <div className="resume-label"><h2 id="toolkit-title">My toolkit</h2></div>
      <div className="resume-content toolkit-list">{skills.map(group => <article key={group.category}><h3>{group.category}</h3><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></article>)}</div>
    </section>
  </div>;
}

function ExperiencePage() {
  return <><section className="studio-page-heading" id="top"><p>About</p><h1>Work & background.</h1><p>Teaching, a mathematical foundation, and the skills I use to build.</p></section><ExperienceDetails /></>;
}

function ContactPage() {
  return <section className="studio-contact-page" id="top" aria-labelledby="contact-page-title">
    <div className="studio-contact-page__intro"><p className="studio-page-label">Contact</p><h1 id="contact-page-title">Let’s talk.</h1><p>A question, a different perspective, or something worth building together.</p></div>
    <div className="studio-contact-options">
      <a className="studio-contact-option studio-contact-option--linkedin" href={profile.linkedin} target="_blank" rel="noreferrer"><span>A conversation</span><h2>LinkedIn</h2><p>The best place to say hello.</p><span className="studio-contact-option__arrow" aria-hidden="true">↗</span></a>
      <a className="studio-contact-option studio-contact-option--github" href={profile.github} target="_blank" rel="noreferrer"><span>Code & experiments</span><h2>GitHub</h2><p>Explore the work behind the scenes.</p><span className="studio-contact-option__arrow" aria-hidden="true">↗</span></a>
    </div>
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
      {page === "home" ? <><StudioHome /><ExperienceDetails /></> : page === "experience" ? <ExperiencePage /> : page === "projects" ? <StudioProjects projects={projects} /> : <ContactPage />}
      {page !== "contact" && <ContactPanel />}
    </main>
    <Footer />
  </div>;
}

export default App;
