import { useEffect, useRef, useState } from "react";
import { ProjectCard } from "./components/ProjectCard";
import { SectionHeading } from "./components/SectionHeading";
import { FeaturedWork } from "./components/FeaturedWork";
import { HeroWorkbench } from "./components/HeroWorkbench";
import { IdentityOrbit } from "./components/IdentityOrbit";
export { HeroWorkbench } from "./components/HeroWorkbench";
import {
  community,
  education,
  experience,
  navigation,
  profile,
  projects,
  projectStats,
  skills,
} from "./data/profile";

export type PageName = "home" | "experience" | "projects";

type AppProps = {
  page: PageName;
};

const pageMeta: Record<PageName, { title: string; description: string; url: string }> = {
  home: {
    title: "Grant Zhang | AI Product Builder",
    description:
      "Grant Zhang builds practical AI-enabled products, connecting user needs, working prototypes, and model evaluation. Based in Auckland, New Zealand.",
    url: profile.canonicalUrl,
  },
  experience: {
    title: "Experience | Grant Zhang",
    description:
      "Grant Zhang's teaching experience, mathematics foundation, and toolkit for product prototyping, requirements analysis, and model evaluation.",
    url: `${profile.canonicalUrl}experience/`,
  },
  projects: {
    title: "Projects | Grant Zhang",
    description:
      "Explore Folio, ExplainLab, electricity forecasting, and other AI, simulation, and software projects by Grant Zhang.",
    url: `${profile.canonicalUrl}projects/`,
  },
};

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function Header({ page }: { page: PageName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 861px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    headerRef.current?.querySelector<HTMLAnchorElement>("nav a")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key === "Tab") {
        const items = headerRef.current?.querySelectorAll<HTMLElement>("a, button");
        if (!items?.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="site-header" ref={headerRef}>
      <a className="brand" href="/" aria-label="Grant Zhang, home">
        <span className="brand__mark">GZ</span>
        <span className="brand__label" translate="no">Grant Zhang</span>
      </a>

      <button
        className="menu-toggle"
        ref={toggleRef}
        type="button"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <nav
        id="site-navigation"
        className={`site-nav ${menuOpen ? "is-open" : ""}`}
        aria-label="Primary navigation"
      >
        {navigation.map((item) => (
          <a
            key={item.page}
            href={item.href}
            aria-current={page === item.page ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </a>
        ))}
        <a
          className="nav-github"
          href={profile.github}
          target="_blank"
          rel="noreferrer"
        >
          GitHub <ArrowIcon />
        </a>
      </nav>
    </header>
  );
}

function PageHero({
  eyebrow,
  title,
  description,
  links,
}: {
  eyebrow: string;
  title: string;
  description: string;
  links: { label: string; href: string }[];
}) {
  return (
    <section className="page-hero" id="top">
      <div className="page-hero__atmosphere" aria-hidden="true">
        <svg viewBox="0 0 480 360" fill="none">
          <ellipse cx="348" cy="178" rx="190" ry="144" transform="rotate(-28 348 178)" />
          <ellipse cx="348" cy="178" rx="162" ry="118" transform="rotate(-28 348 178)" />
          <path d="M143 178h20 M348 0v20 M348 336v20 M167 57h16v16 M454 294h-16v-16" />
          <circle cx="190" cy="91" r="3" className="page-hero__point" />
          <circle cx="469" cy="254" r="3" className="page-hero__point" />
        </svg>
      </div>
      <div className="page-hero__content">
        <p className="page-hero__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-hero__description">{description}</p>
        <nav className="page-hero__links" aria-label={`${eyebrow} sections`}>
          {links.map((link) => (
            <a key={link.href} href={link.href}>{link.label}<span aria-hidden="true">↓</span></a>
          ))}
        </nav>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <>
      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero__grid" aria-hidden="true" />
        <div className="hero__content">
          <div className="status-pill">
            <span className="status-pill__dot" aria-hidden="true" />
            {profile.availability}
          </div>
          <p className="hero__kicker">Auckland · AI product builder</p>
          <h1 id="hero-title" translate="no">
            <span>Grant</span>
            <span className="hero__surname">Zhang.</span>
          </h1>
          <p className="hero__headline">I build useful AI products—from a question to a working system.</p>
          <p className="hero__intro">
            A mathematics background, a builder’s curiosity, and a focus on
            useful AI experiences—from research workflows to intelligent systems.
          </p>

          <div className="hero__actions">
            <a className="button button--primary" href="#selected-title">
              Explore my work <span aria-hidden="true">↓</span>
            </a>
            <a className="button button--quiet" href="/experience/">
              View experience
            </a>
          </div>
        </div>

        <IdentityOrbit />

        <div className="hero__meta">
          <span>{profile.alternativeName}</span>
          <span>{profile.location}</span>
          <span>Master of Information Technology</span>
        </div>
      </section>

      <section className="section selected-work" aria-labelledby="selected-title">
        <SectionHeading
          id="selected-title"
          index="02"
          eyebrow="Selected work"
          title="Ideas made concrete."
          description="Research tools, systems experiments, and forecasts. Choose a project to take a closer look."
        />
        <HeroWorkbench />
        <div className="section-end reveal">
          <span>
            {projectStats.total} projects · {projectStats.live} live demos · {projectStats.source} public repositories
          </span>
          <a className="button button--quiet" href="/projects/">
            View all projects <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <section className="section profile-section" aria-labelledby="profile-title">
        <div className="profile-heading">
          <span className="profile-heading__mark" aria-hidden="true">GZ</span>
          <div><p>A little background</p><h2 id="profile-title">A builder’s curiosity.<br />A teacher’s patience.</h2></div>
        </div>
        <div className="profile-copy">
          <p>{profile.about[0]}</p>
          <p>Currently exploring game AI, simulation, and how intelligent systems can support creative work.</p>
          <a className="text-link" href="/experience/">Experience & education <ArrowIcon /></a>
        </div>
      </section>

      <ContactPanel />
    </>
  );
}

function ExperiencePage() {
  return (
    <>
      <PageHero
        eyebrow="Experience"
        title="Experience & background."
        description="Teaching, a mathematical foundation, and the skills I use to build."
        links={[
          { label: "Work & teaching", href: "#work-title" },
          { label: "Education", href: "#education-title" },
          { label: "Community", href: "#impact-title" },
          { label: "Toolkit", href: "#toolkit-title" },
        ]}
      />

      <section className="section" aria-labelledby="work-title">
        <SectionHeading
          id="work-title"
          index="01A"
          eyebrow="Work"
          title="Work & teaching."
        />
        <div className="timeline">
          {experience.map((role, index) => (
            <article className="timeline__item reveal" key={role.role}>
              <div className="timeline__rail" aria-hidden="true">
                <span>0{index + 1}</span>
              </div>
              <div className="timeline__when">{role.period}</div>
              <div className="timeline__content">
                <p className="timeline__organisation">{role.organisation}</p>
                <h2>{role.role}</h2>
                <p className="timeline__summary">{role.summary}</p>
                <ul className="timeline__points">
                  {role.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <ul className="tag-list" aria-label={`${role.role} capabilities`}>
                  {role.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="education-title">
        <SectionHeading
          id="education-title"
          index="01B"
          eyebrow="Academic foundation"
          title="Education."
        />
        <div className="education-grid">
          {education.map((item, index) => (
            <article className="education-card reveal" key={item.degree}>
              <div className="education-card__number">0{index + 1}</div>
              <p className="education-card__period">{item.period}</p>
              <h2>{item.degree}</h2>
              <p className="education-card__institution">{item.institution}</p>
              <p className="education-card__detail">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section impact-section" aria-labelledby="impact-title">
        <SectionHeading
          id="impact-title"
          index="01C"
          eyebrow="Leadership & impact"
          title="Beyond the classroom."
        />
        <article className="impact-card reveal">
          <div className="impact-card__mark" aria-hidden="true">
            <span>TEAM</span>
            <strong>共</strong>
          </div>
          <div>
            <p className="impact-card__distinction">{community.distinction}</p>
            <h2>{community.title}</h2>
            <p>{community.description}</p>
          </div>
        </article>
      </section>

      <section className="section" aria-labelledby="toolkit-title">
        <SectionHeading
          id="toolkit-title"
          index="01D"
          eyebrow="Working toolkit"
          title="Tools I work with."
        />
        <div className="skills-grid">
          {skills.map((group, index) => (
            <article className="skill-group reveal" key={group.category}>
              <div className="skill-group__head">
                <span>0{index + 1}</span>
                <h2>{group.category}</h2>
              </div>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="section-end reveal">
          <span>Experience is the context. Projects are the evidence.</span>
          <a className="button button--primary" href="/projects/">
            Explore projects <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </>
  );
}

function ProjectsPage() {
  return (
    <>
      <PageHero
        eyebrow="Projects"
        title="Projects worth opening."
        description="Research tools, systems experiments, forecasting, and the software I’ve built along the way."
        links={[
          ...projects.filter((project) => project.featured).map((project) => ({
            label: project.slug === "nz-electricity-forecasting" ? "NZ Electricity" : project.title,
            href: `#${project.slug}`,
          })),
          { label: "More projects", href: "#archive-title" },
        ]}
      />

      <section className="project-stats" aria-label="Project overview">
        <div>
          <strong>{projectStats.total}</strong>
          <span>Selected projects</span>
        </div>
        <div>
          <strong>{projectStats.live}</strong>
          <span>Live demos</span>
        </div>
        <div>
          <strong>{projectStats.source}</strong>
          <span>Public repositories</span>
        </div>
      </section>

      <section className="section projects-page" aria-labelledby="projects-title">
        <SectionHeading
          id="projects-title"
          index="02A"
          eyebrow="Selected work"
          title="Current work."
          description="A look at the problem, the implementation, and a decision that shaped each project."
        />
        <FeaturedWork projects={projects.filter((project) => project.featured)} detailed />
        <p className="project-disclosure reveal">
          Demonstrations include sample workflows, simulated systems, and historical
          market data. Project descriptions distinguish working previews and research
          from released demos; ExplainLab’s results are educational simulations.
        </p>
      </section>

      <section className="section archive-section" aria-labelledby="archive-title">
        <SectionHeading id="archive-title" eyebrow="More projects" title="The rest of the collection." />
        <div className="project-grid project-grid--archive">
          {projects.filter((project) => !project.featured).map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} compact />
          ))}
        </div>
      </section>

      <ContactPanel />
    </>
  );
}

function ContactPanel() {
  return (
    <section className="contact" aria-labelledby="contact-title">
      <div className="contact__copy"><p className="contact__eyebrow">Let’s connect</p>
      <h2 id="contact-title">What are you working on?</h2>
      <p>I’m always interested in a useful question, an AI product idea, or a new way to explain something complex.</p></div>
      <div className="contact__actions">
        <a
          className="button button--primary"
          href={profile.linkedin}
          target="_blank"
          rel="noreferrer"
        >
          Connect on LinkedIn <ArrowIcon />
        </a>
        <a
          className="button button--quiet"
          href={profile.github}
          target="_blank"
          rel="noreferrer"
        >
          Explore GitHub <ArrowIcon />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <p>© {new Intl.DateTimeFormat("en-NZ", { year: "numeric" }).format(new Date())} Grant Zhang</p>
      <p>Building in Auckland, New Zealand.</p>
      <a href="#top">Back to top ↑</a>
    </footer>
  );
}

function App({ page }: AppProps) {
  useEffect(() => {
    const meta = pageMeta[page];
    document.title = meta.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", meta.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", meta.url);

  }, [page]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header page={page} />
      <main id="main-content" tabIndex={-1}>
        {page === "home" && <HomePage />}
        {page === "experience" && <ExperiencePage />}
        {page === "projects" && <ProjectsPage />}
      </main>
      <Footer />
    </>
  );
}

export default App;
