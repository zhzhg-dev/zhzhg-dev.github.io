import { useEffect, useRef, useState, type ReactNode } from "react";
import { PersonalHome } from "./components/PersonalHome";
import { FeaturedWork } from "./components/FeaturedWork";
import { ProjectCard } from "./components/ProjectCard";
import { community, education, experience, navigation, profile, projects, skills } from "./data/profile";

export type PageName = "home" | "experience" | "projects";

const pageMeta = {
  home: { title: "Grant Zhang | AI Product Builder", description: "Grant Zhang: a mathematical mind, an AI builder, and a teacher. Based in Auckland, New Zealand.", url: profile.canonicalUrl },
  experience: { title: "Experience | Grant Zhang", description: "Grant Zhang’s teaching experience, education, community work, and technical toolkit.", url: `${profile.canonicalUrl}experience/` },
  projects: { title: "Projects | Grant Zhang", description: "Explore Folio, ExplainLab, electricity forecasting, and other AI, simulation, and software projects by Grant Zhang.", url: `${profile.canonicalUrl}projects/` },
};

function Header({ page }: { page: PageName }) {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const background = document.querySelectorAll<HTMLElement>("main,footer");
    document.body.classList.toggle("menu-open", open);
    background.forEach(element => { element.inert = open; });
    const restore = () => {
      document.body.classList.remove("menu-open");
      background.forEach(element => { element.inert = false; });
    };
    if (!open) return restore;
    headerRef.current?.querySelector<HTMLAnchorElement>("nav a")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); }
      if (event.key !== "Tab") return;
      const items = headerRef.current?.querySelectorAll<HTMLElement>("a,button");
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { restore(); document.removeEventListener("keydown", key); };
  }, [open]);
  useEffect(() => {
    const wide = window.matchMedia("(min-width:761px)");
    const close = () => { if (wide.matches) setOpen(false); };
    wide.addEventListener("change", close);
    return () => wide.removeEventListener("change", close);
  }, []);
  return <header className="site-header" ref={headerRef}>
    <a className="brand" href="/" aria-label="Grant Zhang, home"><span translate="no">Grant Zhang</span><span className="brand-location">Auckland, New Zealand</span></a>
    <button className="menu-toggle" ref={toggleRef} type="button" aria-expanded={open} aria-controls="site-navigation" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
    <nav className={`site-nav${open ? " is-open" : ""}`} id="site-navigation" aria-label="Primary navigation">{navigation.map(item => <a key={item.page} href={item.href} aria-current={page === item.page ? "page" : undefined} onClick={() => setOpen(false)}><span>{item.label}</span></a>)}</nav>
  </header>;
}

function PageHero({ label, title, description, links }: { label: string; title: ReactNode; description: string; links: { label: string; href: string }[] }) {
  return <section className="page-hero section-shell" id="top">
    <div className="page-hero__rail"><p>{label}</p><nav aria-label={`${label} sections`}>{links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav></div>
    <div className="page-hero__body"><h1>{title}</h1><p>{description}</p></div>
  </section>;
}

function ExperiencePage() {
  return <>
    <PageHero label="Experience" title={<>Work &<br />background.</>} description="Teaching, a mathematical foundation, and the skills I use to build." links={[{ label: "Work & teaching", href: "#work-title" }, { label: "Education", href: "#education-title" }, { label: "Community", href: "#community-title" }, { label: "Toolkit", href: "#toolkit-title" }]} />
    <section className="resume-section section-shell" aria-labelledby="work-title"><div className="resume-label"><h2 id="work-title">Work & teaching</h2></div><div className="resume-content">{experience.map((role, index) => <article className="resume-role" key={role.role}>
      <div className="resume-role__meta"><p>{role.period}</p><p>{role.organisation}</p></div>
      <h3>{role.role}</h3><p className="resume-role__summary">{role.summary}</p>
      <details className="resume-details" open={index === 0}><summary>Responsibilities <span aria-hidden="true">+</span></summary><ul>{role.points.map(point => <li key={point}>{point}</li>)}</ul></details>
      <ul className="inline-tags" aria-label={`${role.role} capabilities`}>{role.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
    </article>)}</div></section>
    <section className="resume-section section-shell" aria-labelledby="education-title"><div className="resume-label"><p>Academic foundation</p><h2 id="education-title">Education</h2></div><div className="resume-content">{education.map(item => <article className="education-entry" key={item.degree}><p className="entry-date">{item.period}</p><h3>{item.degree}</h3><p className="entry-institution">{item.institution}</p><p className="entry-note">{item.detail}</p></article>)}</div></section>
    <section className="resume-section resume-community section-shell" aria-labelledby="community-title"><div className="resume-label"><p>Leadership & impact</p><h2 id="community-title">Outside the classroom</h2></div><div className="resume-content"><p className="community-award">{community.distinction}</p><h3>{community.title}</h3><p className="community-copy">{community.description}</p></div></section>
    <section className="resume-section section-shell" aria-labelledby="toolkit-title"><div className="resume-label"><p>Working toolkit</p><h2 id="toolkit-title">Tools follow the question.</h2></div><div className="resume-content toolkit-list">{skills.map(group => <article key={group.category}><h3>{group.category}</h3><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></article>)}</div></section>
  </>;
}

function ProjectsPage() {
  return <>
    <PageHero label="Projects" title="Selected work." description="Research tools, systems experiments, and forecasting. Open a case to explore the decisions behind it." links={projects.filter(project => project.featured).map(project => ({ label: project.slug === "nz-electricity-forecasting" ? "NZ Electricity" : project.title, href: `#${project.slug}` }))} />
    <section className="projects-main section-shell" aria-label="Selected project case studies"><FeaturedWork projects={projects.filter(project => project.featured)} detailed /></section>
    <section className="archive-section section-shell" aria-labelledby="archive-title"><div className="archive-heading"><p>Research & smaller explorations</p><h2 id="archive-title">Along the way.</h2></div><div className="project-grid project-grid--archive">{projects.filter(project => !project.featured).map((project, index) => <ProjectCard project={project} index={index} key={project.slug} compact />)}</div></section>
  </>;
}

function ContactPanel() {
  return <section className="contact section-shell" aria-labelledby="contact-title"><div className="contact-intro"><p>A useful question. A new perspective.</p><h2 id="contact-title">Let’s compare notes.</h2></div><div className="contact-actions"><a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn<span aria-hidden="true">↗</span></a><a href={profile.github} target="_blank" rel="noreferrer">GitHub<span aria-hidden="true">↗</span></a></div></section>;
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
  return <><a className="skip-link" href="#main-content">Skip to content</a><Header page={page} /><main id="main-content" tabIndex={-1} className={`page-${page}`}>{page === "home" ? <PersonalHome /> : page === "experience" ? <ExperiencePage /> : <ProjectsPage />}<ContactPanel /></main><Footer /></>;
}

export default App;
