import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import type { Project } from "../data/profile";
import { ProjectCover } from "./ProjectCover";
import "./studio-projects.css";

function projectFromHash(projects: Project[]) {
  if (typeof window === "undefined") return null;
  try {
    const slug = decodeURIComponent(window.location.hash.slice(1));
    return projects.some(project => project.slug === slug) ? slug : null;
  } catch { return null; }
}

type OwnedCaseEntry = { owner: string; slug: string; base: string };

function caseAddress(slug: string | null, mode: "push" | "replace", ownedEntry?: OwnedCaseEntry) {
  const address = `${window.location.pathname}${window.location.search}${slug ? `#${encodeURIComponent(slug)}` : ""}`;
  const state = { ...window.history.state, studioProject: slug };
  if (ownedEntry) state.grantPortfolioCase = ownedEntry;
  else delete state.grantPortfolioCase;
  if (mode === "push") window.history.pushState(state, "", address);
  else window.history.replaceState(state, "", address);
}

function ProjectLinks({ project }: { project: Project }) {
  return <div className="studio-project-links">
    {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} live demo in a new tab`}>Live demo<span aria-hidden="true">↗</span></a>}
    {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noreferrer" aria-label={`View ${project.title} source code in a new tab`}>Source<span aria-hidden="true">↗</span></a>}
    {!project.liveUrl && !project.sourceUrl && <span className="studio-project-links__status">{project.status}</span>}
  </div>;
}

export function StudioProjects({ projects }: { projects: Project[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() => projectFromHash(projects));
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const historyOwnerRef = useRef<string | null>(null);
  const pendingBackRef = useRef(false);
  const pendingOpenRef = useRef<{ project: Project; trigger: HTMLButtonElement } | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const dialogId = `${titleId}-case`;
  const selectedProject = projects.find(project => project.slug === selectedSlug);

  useEffect(() => {
    const restore = () => {
      if (pendingBackRef.current) {
        pendingBackRef.current = false;
        const pending = pendingOpenRef.current;
        pendingOpenRef.current = null;
        if (pending) {
          returnFocusRef.current = pending.trigger;
          const base = `${window.location.pathname}${window.location.search}`;
          caseAddress(pending.project.slug, "push", { owner: historyOwnerRef.current!, slug: pending.project.slug, base });
          setSelectedSlug(pending.project.slug);
          return;
        }
      }
      const slug = projectFromHash(projects);
      if (slug) returnFocusRef.current = triggerRefs.current.get(slug) ?? null;
      setSelectedSlug(slug);
    };
    window.addEventListener("hashchange", restore);
    window.addEventListener("popstate", restore);
    return () => {
      window.removeEventListener("hashchange", restore);
      window.removeEventListener("popstate", restore);
      pendingOpenRef.current = null;
    };
  }, [projects]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selectedProject) {
      if (!returnFocusRef.current) returnFocusRef.current = triggerRefs.current.get(selectedProject.slug) ?? null;
      if (!dialog.open) dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add("studio-case-open");
      closeRef.current?.focus({ preventScroll: true });
    } else {
      if (dialog.open) dialog.close();
      document.body.classList.remove("studio-case-open");
      const trigger = returnFocusRef.current;
      returnFocusRef.current = null;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    }
  }, [selectedProject]);

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (dialog?.open) dialog.close();
      document.body.classList.remove("studio-case-open");
    };
  }, []);

  function openCase(project: Project, event: MouseEvent<HTMLButtonElement>) {
    if (pendingBackRef.current) {
      pendingOpenRef.current = { project, trigger: event.currentTarget };
      return;
    }
    returnFocusRef.current = event.currentTarget;
    if (!historyOwnerRef.current) historyOwnerRef.current = `${Date.now()}-${Math.random()}`;
    const base = `${window.location.pathname}${window.location.search}`;
    const previous = window.history.state?.grantPortfolioCase;
    const ownsCurrent = previous?.owner === historyOwnerRef.current && previous?.base === base && previous?.slug === projectFromHash(projects);
    caseAddress(project.slug, ownsCurrent ? "replace" : "push", { owner: historyOwnerRef.current, slug: project.slug, base });
    setSelectedSlug(project.slug);
  }

  function closeCase() {
    if (!selectedSlug || pendingBackRef.current) return;
    const base = `${window.location.pathname}${window.location.search}`;
    const entry = window.history.state?.grantPortfolioCase;
    const ownsCurrent = historyOwnerRef.current !== null && entry?.owner === historyOwnerRef.current && entry?.base === base && entry?.slug === selectedSlug && projectFromHash(projects) === selectedSlug;
    if (ownsCurrent) {
      pendingBackRef.current = true;
      setSelectedSlug(null);
      window.history.back();
      return;
    }
    caseAddress(null, "replace");
    setSelectedSlug(null);
  }

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeCase();
  }

  function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],summary");
    const first = controls[0], last = controls[controls.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && event.target === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && event.target === last) { event.preventDefault(); first.focus(); }
  }

  return <section className="studio-projects" id="top" aria-labelledby="studio-projects-title">
    <header className="studio-projects__heading"><p className="studio-projects__label">Selected</p><h1 id="studio-projects-title">Projects</h1><p className="studio-projects__hint">Open a cover to explore the thinking behind the work.</p></header>
    <div className="studio-projects__grid">
      {projects.map((project, index) => <article className={`studio-project-card studio-project-card--${project.slug}`} id={project.slug} key={project.slug} aria-labelledby={`${project.slug}-title`}>
        <button className="studio-project-card__cover" type="button" ref={element => { if (element) triggerRefs.current.set(project.slug, element); else triggerRefs.current.delete(project.slug); }} aria-label={`Explore ${project.title} case study`} aria-haspopup="dialog" aria-controls={dialogId} onClick={event => openCase(project, event)}>
          <ProjectCover project={project} index={index} />
          <span className="studio-project-card__explore" aria-hidden="true">Explore project<span>↗</span></span>
        </button>
        <h2 id={`${project.slug}-title`}>{project.title}</h2>
        <p className="studio-project-card__subtitle">{project.cardSummary ?? project.shortDescription ?? project.eyebrow}</p>
        <ProjectLinks project={project} />
      </article>)}
      <a className="studio-project-invite" href="/contact/"><span className="studio-project-invite__image" aria-hidden="true">+</span><span className="studio-project-invite__title">Have an idea?</span><span className="studio-project-invite__copy">Let’s compare notes.</span></a>
    </div>
    <dialog className="studio-case" ref={dialogRef} id={dialogId} aria-labelledby={titleId} aria-describedby={selectedProject ? descriptionId : undefined} onCancel={event => { event.preventDefault(); closeCase(); }} onClose={() => { if (selectedSlug && !dialogRef.current?.open) closeCase(); }} onClick={closeOnBackdrop} onKeyDown={keepFocusInside}>
      <div className="studio-case__header"><p>{selectedProject?.status ?? "Project details"}</p><button ref={closeRef} type="button" className="studio-case__close" onClick={closeCase}><span aria-hidden="true">×</span>Close case study</button></div>
      {selectedProject ? <>
        <div className="studio-case__intro"><h2 id={titleId}>{selectedProject.title}</h2><p className="studio-case__category">{selectedProject.eyebrow}</p><p className="studio-case__summary" id={descriptionId}>{selectedProject.shortDescription ?? selectedProject.description}</p></div>
        {selectedProject.caseStudy && <div className="studio-case__context"><section><h3>The problem</h3><p>{selectedProject.caseStudy.problem}</p></section><section><h3>My work</h3><p>{selectedProject.caseStudy.contribution}</p></section></div>}
        <figure className="studio-case__figure"><img className="studio-case__image" src={selectedProject.cover} alt={selectedProject.coverAlt} width={selectedProject.coverWidth ?? 1280} height={selectedProject.coverHeight ?? 720} decoding="async" /><figcaption>{selectedProject.featured ? "Actual interface. The gallery cover is an edited crop of this screenshot." : /abstract/i.test(selectedProject.coverAlt) ? "Project illustration, not a screenshot of a deployed product." : "Actual interface screenshot."}</figcaption></figure>
        <div className="studio-case__body">
          {selectedProject.caseStudy ? <>
            <section className="studio-case__section"><h3>Key decisions</h3><div className="studio-case__decisions">{selectedProject.caseStudy.decisions.map(decision => <article key={decision.title}><h4>{decision.title}</h4><p>{decision.body}</p></article>)}</div></section>
            <section className="studio-case__section studio-case__evidence"><h3>Evidence & limitations</h3>{selectedProject.caseStudy.evidence.map(item => <article key={item.title}><h4>{item.title}</h4><p>{item.body}</p></article>)}</section>
            <section className="studio-case__section studio-case__next"><h3>Next iteration</h3><p>{selectedProject.caseStudy.next}</p></section>
            <details className="studio-case__overview"><summary>Full project overview</summary><p>{selectedProject.description}</p></details>
          </> : <>{selectedProject.shortDescription && <p>{selectedProject.description}</p>}{selectedProject.decision && <section className="studio-case__decision"><h3>{selectedProject.decisionTitle ?? "A design decision"}</h3><p>{selectedProject.decision}</p></section>}</>}
          <ul className="studio-case__technologies" aria-label={`${selectedProject.title} technologies`}>{selectedProject.technologies.map(technology => <li key={technology}>{technology}</li>)}</ul>
          <ProjectLinks project={selectedProject} />
        </div>
      </> : <h2 className="studio-case__empty" id={titleId}>Project details</h2>}
    </dialog>
  </section>;
}
