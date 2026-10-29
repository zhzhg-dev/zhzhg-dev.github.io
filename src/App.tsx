import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { FeaturedWork } from "./components/FeaturedWork";
import { ProjectCard } from "./components/ProjectCard";
import { SignatureField } from "./components/SignatureField";
import { community, education, experience, navigation, profile, projects, skills } from "./data/profile";
export type PageName = "home" | "experience" | "projects";
type AppProps = {
    page: PageName;
};
const pageMeta = {
    home: { title: "Grant Zhang | AI Product Builder", description: "Grant Zhang: a mathematical mind, an AI builder, and a teacher. A personal space for curiosity, craft, and what comes next.", url: profile.canonicalUrl },
    experience: { title: "Experience | Grant Zhang", description: "Grant Zhang’s teaching experience, education, community work, and technical toolkit.", url: `${profile.canonicalUrl}experience/` },
    projects: { title: "Projects | Grant Zhang", description: "Explore Folio, ExplainLab, electricity forecasting, and other AI, simulation, and software projects by Grant Zhang.", url: `${profile.canonicalUrl}projects/` },
};
function Arrow({ diagonal = false }: {
    diagonal?: boolean;
}) {
    return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={diagonal ? "arrow arrow--diagonal" : "arrow"}>
    <path d="M4 12h15M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>;
}
function MagneticLink({ href, children, className = "", external = false }: {
    href: string;
    children: ReactNode;
    className?: string;
    external?: boolean;
}) {
    function move(event: PointerEvent<HTMLAnchorElement>) {
        if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches || window.matchMedia("(prefers-reduced-motion:reduce)").matches)
            return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty("--mx", `${(event.clientX - bounds.left - bounds.width / 2) * .08}px`);
        event.currentTarget.style.setProperty("--my", `${(event.clientY - bounds.top - bounds.height / 2) * .12}px`);
    }
    function reset(event: PointerEvent<HTMLAnchorElement>) { event.currentTarget.style.setProperty("--mx", "0px"); event.currentTarget.style.setProperty("--my", "0px"); }
    return <a href={href} className={`magnetic-link ${className}`} onPointerMove={move} onPointerLeave={reset} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>{children}</a>;
}
function Header({ page }: {
    page: PageName;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        document.body.classList.toggle("menu-open", menuOpen);
        const background = document.querySelectorAll<HTMLElement>("main,footer");
        background.forEach(element => { element.inert = menuOpen; });
        const restoreBackground = () => { document.body.classList.remove("menu-open"); background.forEach(element => { element.inert = false; }); };
        if (!menuOpen)
            return restoreBackground;
        headerRef.current?.querySelector<HTMLAnchorElement>("nav a")?.focus();
        const key = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
                toggleRef.current?.focus();
            }
            if (event.key === "Tab") {
                const items = headerRef.current?.querySelectorAll<HTMLElement>("a,button");
                if (!items?.length)
                    return;
                const first = items[0], last = items[items.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                }
                else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener("keydown", key);
        return () => { restoreBackground(); document.removeEventListener("keydown", key); };
    }, [menuOpen]);
    useEffect(() => {
        const wide = window.matchMedia("(min-width:761px)");
        const close = () => { if (wide.matches)
            setMenuOpen(false); };
        wide.addEventListener("change", close);
        return () => wide.removeEventListener("change", close);
    }, []);
    return <header className="site-header" ref={headerRef}>
    <a href="/" className="brand" aria-label="Grant Zhang, home">
    <span className="brand-symbol" aria-hidden="true">g<span>.</span>
    </span>
    <span translate="no">Grant Zhang</span>
    </a>
    <span className="header-location">
    <span aria-hidden="true"/>Based in Auckland, NZ</span>
    <button className="menu-toggle" type="button" ref={toggleRef} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(!menuOpen)}>
    <span />
    <span />
    </button>
    <nav id="site-navigation" className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">{navigation.map(item => <a key={item.page} href={item.href} aria-current={page === item.page ? "page" : undefined} onClick={() => setMenuOpen(false)}>
        <span>{item.label}</span>
        <span className="nav-dot" aria-hidden="true"/>
        </a>)}</nav>
  </header>;
}
const interests = [
    { title: "AI products", text: "I’m interested in the space between what a model can do and what a person actually needs. Research workflows, on-device AI, and careful evaluation are where I’m spending time.", note: "Useful before impressive." },
    { title: "Game AI", text: "Simulation, reinforcement learning, and intelligent systems for games keep drawing me in. I like environments where a small change in the rules can produce an entirely different behaviour.", note: "A good question is something you can play with." },
    { title: "Making it clear", text: "Teaching introductory computing reminds me that understanding is something you build together. A patient explanation, a smaller example, or the right question can change everything.", note: "Clarity is part of the work." },
];
function PersonalFocus() {
    const [active, setActive] = useState(0);
    return <section className="personal-focus section-shell" aria-labelledby="focus-title">
    <div className="section-caption">
    <span className="small-orbit" aria-hidden="true"/>
    <h2 id="focus-title">What holds my attention</h2>
    </div>
    <div className="focus-layout">
    <div className="focus-choices" role="group" aria-label="Explore my interests">{interests.map((item, index) => <button key={item.title} type="button" aria-pressed={active === index} aria-controls="interest-detail" onClick={() => setActive(index)}>
        <span>{item.title}</span>
        <Arrow />
        </button>)}</div>
    <div className="focus-detail" id="interest-detail" aria-live="polite">
    <div key={active} className="focus-detail__content">
    <span className="focus-asterisk" aria-hidden="true">✳</span>
    <p>{interests[active].text}</p>
    <span>{interests[active].note}</span>
    </div>
    </div>
    </div>
    </section>;
}
function HomePage() {
    return <>
    <section className="personal-hero section-shell" id="top" aria-labelledby="hero-title">
    <div className="personal-hero__copy">
    <p className="hero-greeting">Hi, I’m Grant.</p>
    <h1 id="hero-title" translate="no">
    <span>Grant</span>
    <span>Zhang<span className="name-period">.</span>
    </span>
    </h1>
    <p className="hero-description">A mathematical mind.<br />A builder’s curiosity.<br />A human point of view.</p>
    <MagneticLink href="#about" className="hero-about">
    <span className="round-arrow">
    <Arrow />
    </span>A little about me</MagneticLink>
    </div>
    <div className="personal-hero__art">
    <SignatureField />
    </div>
    <div className="hero-footnote">
    <span>Mathematics, AI & the people in between.</span>
    <a href={profile.linkedin} target="_blank" rel="noreferrer">Say hello <Arrow diagonal/>
    </a>
    <span className="hero-footnote__name">{profile.alternativeName}</span>
    </div>
    </section>
    <section className="personal-intro section-shell" id="about" aria-labelledby="about-title">
    <div className="section-caption">
    <span className="small-orbit" aria-hidden="true"/>
    <span>Behind the name</span>
    </div>
    <div className="intro-layout">
    <h2 id="about-title" data-reveal>A mathematical mind.<br />
    <span>A human point of view.</span>
    </h2>
    <div className="intro-copy">
    <p>I’m Grant, a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland.</p>
    <p>Mathematics taught me to look for patterns. Building software taught me to question them. Teaching reminds me to bring people along.</p>
    <p>I’m drawn to AI that does something useful—and to the small, thoughtful details that make a complicated system feel simple.</p>
    <a className="text-link" href="/experience/">My experience & background <Arrow />
    </a>
    </div>
    </div>
    <div className="personal-facts">
    <span>
    <small>Foundation</small>Mathematics & computation</span>
    <span>
    <small>Currently</small>Studying, building & teaching</span>
    <span>
    <small>Home base</small>Auckland, New Zealand</span>
    </div>
    </section>
    <PersonalFocus />
    <section className="personal-next section-shell" aria-labelledby="next-title">
    <h2 id="next-title" data-reveal>A little more<br />to the story.</h2>
    <div className="next-links">
    <a href="/experience/">
    <div>
    <span>The path so far</span>
    <h3>Experience</h3>
    </div>
    <span className="next-arrow">
    <Arrow />
    </span>
    </a>
    <a href="/projects/">
    <div>
    <span>Ideas you can open</span>
    <h3>Projects</h3>
    </div>
    <span className="next-arrow">
    <Arrow />
    </span>
    </a>
    </div>
    </section>
    <ContactPanel />
  </>;
}
function PageHero({ page, title, description, children }: {
    page: string;
    title: ReactNode;
    description: string;
    children?: ReactNode;
}) {
    return <section className="page-hero section-shell" id="top">
    <p className="page-hero__label">{page}</p>
    <h1>{title}</h1>
    <div className="page-hero__bottom">
    <p>{description}</p>{children}</div>
    </section>;
}
function ExperiencePage() {
    return <>
    <PageHero page="Experience" title={<>Always learning.<br />
        <span>Often explaining.</span>
        </>} description="The people, places, and ideas that have shaped how I work.">
    <a className="text-link" href="#work-title">Explore my background <span aria-hidden="true">↓</span>
    </a>
    </PageHero>
    <section className="experience-section section-shell" aria-labelledby="work-title">
    <div className="section-caption">
    <span className="small-orbit" aria-hidden="true"/>
    <h2 id="work-title">Work & teaching</h2>
    </div>
    <div className="experience-list">{experience.map(role => <article className="experience-entry" key={role.role}>
        <p className="experience-period">{role.period}</p>
        <div>
        <p className="experience-org">{role.organisation}</p>
        <h3>{role.role}</h3>
        <p className="experience-summary">{role.summary}</p>
        <details className="experience-detail">
        <summary>What I do <span aria-hidden="true">+</span>
        </summary>
        <ul>{role.points.map(point => <li key={point}>{point}</li>)}</ul>
        </details>
        <ul className="inline-tags" aria-label={`${role.role} capabilities`}>{role.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
        </div>
        </article>)}</div>
    </section>
    <section className="experience-section section-shell" aria-labelledby="education-title">
    <div className="section-caption">
    <span className="small-orbit" aria-hidden="true"/>
    <span>Academic foundation</span>
    </div>
    <h2 className="section-title" id="education-title">A foundation to build on.</h2>
    <div className="education-list">{education.map(item => <article key={item.degree}>
        <p>{item.period}</p>
        <div>
        <h3>{item.degree}</h3>
        <p className="education-institution">{item.institution}</p>
        <p className="education-detail">{item.detail}</p>
        </div>
        </article>)}</div>
    </section>
    <section className="experience-section community-section section-shell" aria-labelledby="community-title">
    <div className="section-caption">
    <span className="small-orbit" aria-hidden="true"/>
    <span>Leadership & impact</span>
    </div>
    <div className="community-layout">
    <h2 className="section-title" id="community-title">Beyond<br />the classroom.</h2>
    <div>
    <p className="community-award">{community.distinction}</p>
    <h3>{community.title}</h3>
    <p>{community.description}</p>
    </div>
    </div>
    </section>
    <section className="experience-section section-shell" aria-labelledby="toolkit-title">
    <div className="section-caption">
    <span className="small-orbit" aria-hidden="true"/>
    <span>Working toolkit</span>
    </div>
    <h2 className="section-title" id="toolkit-title">Tools follow the question.</h2>
    <div className="toolkit-list">{skills.map(group => <article key={group.category}>
        <h3>{group.category}</h3>
        <ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul>
        </article>)}</div>
    </section>
    <ContactPanel />
  </>;
}
function ProjectsPage() {
    return <>
    <PageHero page="Projects" title={<>A few ideas.<br />
        <span>Made tangible.</span>
        </>} description="AI products, systems experiments, and a few useful things I wanted to exist.">
    <nav className="project-jump" aria-label="Featured projects">{projects.filter(p => p.featured).map(p => <a href={`#${p.slug}`} key={p.slug}>{p.slug === "nz-electricity-forecasting" ? "NZ Electricity" : p.title}<span aria-hidden="true">↓</span>
        </a>)}</nav>
    </PageHero>
    <section className="projects-main section-shell" aria-label="Selected project case studies">
    <FeaturedWork projects={projects.filter(p => p.featured)} detailed/>
    </section>
    <section className="archive-section section-shell" aria-labelledby="archive-title">
    <div className="archive-heading">
    <div className="section-caption">
    <span className="small-orbit" aria-hidden="true"/>
    <span>More explorations</span>
    </div>
    <h2 className="section-title" id="archive-title">Along the way.</h2>
    <p>Research, team projects, and smaller things built to learn.</p>
    </div>
    <div className="project-grid project-grid--archive">{projects.filter(p => !p.featured).map((project, index) => <ProjectCard project={project} index={index} key={project.slug} compact/>)}</div>
    </section>
    <ContactPanel />
  </>;
}
function ContactPanel() {
    return <section className="contact section-shell" aria-labelledby="contact-title">
    <div className="contact-top">
    <span className="small-orbit" aria-hidden="true"/>
    <p>Good conversations start with curiosity.</p>
    </div>
    <div className="contact-main">
    <h2 id="contact-title">Have a good<br />question<span>?</span>
    </h2>
    <MagneticLink href={profile.linkedin} external className="contact-circle">
    <Arrow diagonal/>
    <span>Let’s talk</span>
    </MagneticLink>
    </div>
    <div className="contact-links">
    <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn <Arrow diagonal/>
    </a>
    <a href={profile.github} target="_blank" rel="noreferrer">GitHub <Arrow diagonal/>
    </a>
    <p>AI, games, teaching—or something I haven’t thought of yet.</p>
    </div>
    </section>;
}
function Footer() {
    return <footer className="site-footer section-shell">
    <p>© {new Intl.DateTimeFormat("en-NZ", { year: "numeric" }).format(new Date())} Grant Zhang</p>
    <p>Made with curiosity, in Auckland.</p>
    <a href="#top">Back to top <span aria-hidden="true">↑</span>
    </a>
    </footer>;
}
function App({ page }: AppProps) {
    useEffect(() => {
        const meta = pageMeta[page];
        document.title = meta.title;
        document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
        document.querySelector('link[rel="canonical"]')?.setAttribute("href", meta.url);
        const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        } }); }, { threshold: .15 });
        document.querySelectorAll("[data-reveal]").forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [page]);
    return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Header page={page}/>
    <main id="main-content" tabIndex={-1}>{page === "home" ? <HomePage /> : page === "experience" ? <ExperiencePage /> : <ProjectsPage />}</main>
    <Footer />
    </>;
}
export default App;
