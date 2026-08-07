import { useEffect, useState } from "react";
import { ProjectCard } from "./components/ProjectCard";
import { SectionHeading } from "./components/SectionHeading";
import {
  community,
  education,
  experience,
  navigation,
  profile,
  projects,
  skills,
} from "./data/profile";

export type PageName = "home" | "experience" | "projects";

type AppProps = {
  page: PageName;
};

const pageMeta: Record<PageName, { title: string; description: string; url: string }> = {
  home: {
    title: "Grant Zhang | AI, Data & Software Portfolio",
    description:
      "Grant Zhang is a mathematics-trained problem solver in Auckland building practical AI, data, and software systems.",
    url: profile.canonicalUrl,
  },
  experience: {
    title: "Experience | Grant Zhang",
    description:
      "Grant Zhang's technical experience, education, leadership, and growing engineering toolkit.",
    url: `${profile.canonicalUrl}experience/`,
  },
  projects: {
    title: "Projects | Grant Zhang",
    description:
      "Selected AI, full-stack, Svelte, and mathematical modelling projects by Grant Zhang.",
    url: `${profile.canonicalUrl}projects/`,
  },
};

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function Header({ page }: { page: PageName }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Grant Zhang, home">
        <span className="brand__mark">GZ</span>
        <span className="brand__label">Grant Zhang</span>
      </a>

      <button
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="sr-only">Toggle navigation</span>
        <span />
        <span />
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
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-hero" id="top">
      <div className="page-hero__grid" aria-hidden="true" />
      <div className="page-hero__code">PORTFOLIO / {index}</div>
      <p className="page-hero__eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="page-hero__description">{description}</p>
      <div className="page-hero__line" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}

function HomePage() {
  const selectedProjects = projects.filter((project) => project.featured).slice(0, 3);

  return (
    <>
      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero__grid" aria-hidden="true" />
        <div className="hero__content">
          <div className="status-pill">
            <span className="status-pill__dot" />
            {profile.availability}
          </div>

          <p className="hero__kicker">Auckland · AI / Data / Software</p>
          <h1 id="hero-title">
            <span>Grant</span>
            <span className="hero__surname">Zhang.</span>
          </h1>
          <p className="hero__headline">{profile.headline}</p>
          <p className="hero__intro">
            From mathematical models to systems people can use—with a focus on
            machine learning, data, and thoughtful software.
          </p>

          <div className="hero__actions">
            <a className="button button--primary" href="/projects/">
              Explore selected work <span aria-hidden="true">→</span>
            </a>
            <a className="button button--quiet" href="/experience/">
              View experience
            </a>
          </div>
        </div>

        <div className="hero__visual" aria-label="Grant Zhang monogram">
          <div className="orbit orbit--outer" />
          <div className="orbit orbit--inner" />
          <div className="monogram">
            <span className="monogram__small">MATHEMATICS × TECHNOLOGY</span>
            <strong>GZ</strong>
            <span className="monogram__location">36.85° S / 174.76° E</span>
          </div>
          <span className="visual-note visual-note--one">MODELLING</span>
          <span className="visual-note visual-note--two">BUILDING</span>
        </div>

        <div className="hero__meta">
          <span>{profile.alternativeName}</span>
          <span>{profile.location}</span>
          <span>Master of Information Technology</span>
        </div>
      </section>

      <section className="section profile-section" aria-labelledby="profile-title">
        <SectionHeading
          id="profile-title"
          index="01"
          eyebrow="Profile"
          title="Analytical by training. Practical by choice."
        />

        <div className="profile-layout">
          <div className="profile-statement reveal">
            <p>
              I like work that begins with a difficult question and ends with
              something <em>clear, testable, and useful.</em>
            </p>
            <a className="text-link" href="/experience/">
              Follow my journey <ArrowIcon />
            </a>
          </div>

          <div className="profile-copy reveal">
            {profile.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="capability-rail" aria-label="Core capabilities">
              <span>01 · Machine learning</span>
              <span>02 · Full-stack systems</span>
              <span>03 · Mathematical modelling</span>
              <span>04 · Technical communication</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section selected-work" aria-labelledby="selected-title">
        <SectionHeading
          id="selected-title"
          index="02"
          eyebrow="Selected work"
          title="Ideas made concrete."
          description="Research, software, and learning tools built with care for the problem behind the interface."
        />
        <div className="project-grid project-grid--home">
          {selectedProjects.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} compact />
          ))}
        </div>
        <div className="section-end reveal">
          <span>Four projects · Two live demos · One evolving research direction</span>
          <a className="button button--quiet" href="/projects/">
            View all projects <span aria-hidden="true">→</span>
          </a>
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
        index="01"
        eyebrow="Experience"
        title="Learning in public. Building with purpose."
        description="A path shaped by technical study, patient teaching, and the habit of turning complex questions into useful next steps."
      />

      <section className="section" aria-labelledby="work-title">
        <SectionHeading
          id="work-title"
          index="01A"
          eyebrow="Work"
          title="Technical support, explained humanly."
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
          title="From theory toward application."
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
          title="Technology exists in a wider world."
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
          title="Capabilities developed through use."
          description="Tools applied across coursework, research, projects, and independent practice."
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
        index="02"
        eyebrow="Projects"
        title="Systems, simulations, and useful software."
        description="Selected work across intelligent systems, full-stack development, browser applications, and mathematical modelling."
      />

      <section className="project-stats" aria-label="Project overview">
        <div>
          <strong>04</strong>
          <span>Selected projects</span>
        </div>
        <div>
          <strong>02</strong>
          <span>Live demos</span>
        </div>
        <div>
          <strong>03</strong>
          <span>Technical domains</span>
        </div>
      </section>

      <section className="section projects-page" aria-labelledby="projects-title">
        <SectionHeading
          id="projects-title"
          index="02A"
          eyebrow="Selected work"
          title="Built to be explored."
          description="Open the live products, inspect the public source, or read the research summary for work that is not publicly released."
        />
        <div className="project-grid">
          {projects.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>
        <p className="project-disclosure reveal">
          Live demos use portfolio-safe sample data. Ongoing research and thesis
          work are presented as summaries where public source is not available.
        </p>
      </section>

      <ContactPanel />
    </>
  );
}

function ContactPanel() {
  return (
    <section className="contact" aria-labelledby="contact-title">
      <div className="contact__signal" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="contact__eyebrow">LET’S CONNECT</p>
      <h2 id="contact-title">Looking for an engineer who thinks in systems?</h2>
      <p>
        I’m interested in internship and graduate opportunities across AI,
        data, and software engineering in New Zealand.
      </p>
      <a
        className="button button--primary"
        href={profile.github}
        target="_blank"
        rel="noreferrer"
      >
        Start with GitHub <ArrowIcon />
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <p>© {new Date().getFullYear()} Grant Zhang</p>
      <p>Designed and built with care in Auckland.</p>
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

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const elements = document.querySelectorAll<HTMLElement>(".reveal");

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [page]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header page={page} />
      <main id="main-content">
        {page === "home" && <HomePage />}
        {page === "experience" && <ExperiencePage />}
        {page === "projects" && <ProjectsPage />}
      </main>
      <Footer />
    </>
  );
}

export default App;
