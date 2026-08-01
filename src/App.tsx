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

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
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
      { threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Grant Zhang, back to top">
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
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
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

      <main id="main-content">
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
              Moving from mathematical models to systems people can use — with
              a focus on machine learning, data, and thoughtful software.
            </p>

            <div className="hero__actions">
              <a className="button button--primary" href="#projects">
                Explore selected work <span aria-hidden="true">↓</span>
              </a>
              <a
                className="button button--quiet"
                href={profile.github}
                target="_blank"
                rel="noreferrer"
              >
                View GitHub <ArrowIcon />
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

        <section className="section about" id="about" aria-labelledby="about-title">
          <SectionHeading
            id="about-title"
            index="01"
            eyebrow="About"
            title="Analytical by training. Practical by choice."
          />
          <div className="about__layout">
            <div className="about__statement reveal">
              <p>
                I like work that begins with a difficult question and ends with
                something <em>clear, testable, and useful.</em>
              </p>
            </div>
            <div className="about__copy reveal">
              {profile.about.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <dl className="about__facts">
                <div>
                  <dt>Based in</dt>
                  <dd>{profile.location}</dd>
                </div>
                <div>
                  <dt>Interested in</dt>
                  <dd>AI · Data · Software engineering</dd>
                </div>
                <div>
                  <dt>Current focus</dt>
                  <dd>Applied machine learning & dependable systems</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section
          className="section experience"
          id="experience"
          aria-labelledby="experience-title"
        >
          <SectionHeading
            id="experience-title"
            index="02"
            eyebrow="Experience"
            title="Technical support, explained humanly."
            description="Early-career experience built around patient problem-solving, communication, and dependable support."
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
                  <h3>{role.role}</h3>
                  <p className="timeline__summary">{role.summary}</p>
                  <ul>
                    {role.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section projects" id="projects" aria-labelledby="projects-title">
          <SectionHeading
            id="projects-title"
            index="03"
            eyebrow="Featured projects"
            title="Ideas made concrete."
            description="Selected work across intelligent systems, full-stack development, and mathematical modelling."
          />
          <div className="projects__grid">
            {projects.map((project, index) => (
              <ProjectCard key={project.title} project={project} index={index} />
            ))}
          </div>
        </section>

        <section className="section skills" id="skills" aria-labelledby="skills-title">
          <SectionHeading
            id="skills-title"
            index="04"
            eyebrow="Capabilities"
            title="A growing technical toolkit."
            description="Tools I have used in coursework, projects, and independent practice."
          />
          <div className="skills__grid">
            {skills.map((group, index) => (
              <article className="skill-group reveal" key={group.category}>
                <div className="skill-group__head">
                  <span>0{index + 1}</span>
                  <h3>{group.category}</h3>
                </div>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section
          className="section education"
          id="education"
          aria-labelledby="education-title"
        >
          <SectionHeading
            id="education-title"
            index="05"
            eyebrow="Education"
            title="From theory toward application."
          />
          <div className="education__list">
            {education.map((item) => (
              <article className="education-card reveal" key={item.degree}>
                <p className="education-card__period">{item.period}</p>
                <div>
                  <h3>{item.degree}</h3>
                  <p className="education-card__institution">{item.institution}</p>
                  <p className="education-card__detail">{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="section community"
          id="community"
          aria-labelledby="community-title"
        >
          <SectionHeading
            id="community-title"
            index="06"
            eyebrow="Leadership & community"
            title="Technology exists in a wider world."
          />
          <article className="community-card reveal">
            <div className="community-card__mark" aria-hidden="true">
              <span>TEAM</span>
              <strong>共</strong>
            </div>
            <div className="community-card__body">
              <p className="community-card__distinction">{community.distinction}</p>
              <h3>{community.title}</h3>
              <p>{community.description}</p>
            </div>
          </article>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <div className="contact__signal" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="contact__eyebrow">07 · Let’s connect</p>
          <h2 id="contact-title">
            Looking for an early-career engineer who thinks in systems?
          </h2>
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
      </main>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Grant Zhang</p>
        <p>Designed and built with care in Auckland.</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </>
  );
}

export default App;
