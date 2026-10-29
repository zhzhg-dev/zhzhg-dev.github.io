import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import type { Project } from "../data/profile";
import "./studio-projects.css";

function projectFromHash(projects: Project[]) {
  if (typeof window === "undefined") return null;
  try {
    const slug = decodeURIComponent(window.location.hash.slice(1));
    return projects.some(project => project.slug === slug) ? slug : null;
  } catch { return null; }
}

function caseAddress(slug: string | null, mode: "push" | "replace") {
  const address = `${window.location.pathname}${window.location.search}${slug ? `#${encodeURIComponent(slug)}` : ""}`;
  const state = { ...window.history.state, studioProject: slug };
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
  const titleId = useId();
  const descriptionId = useId();
  const dialogId = `${titleId}-case`;
  const selectedProject = projects.find(project => project.slug === selectedSlug);

  useEffect(() => {
    const restore = () => {
      const slug = projectFromHash(projects);
      if (slug) returnFocusRef.current = triggerRefs.current.get(slug) ?? null;
      setSelectedSlug(slug);
    };
    window.addEventListener("hashchange", restore);
    window.addEventListener("popstate", restore);
    return () => {
      window.removeEventListener("hashchange", restore);
      window.removeEventListener("popstate", restore);
    };
  }, [projects]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selectedProject) {
      if (!returnFocusRef.current) returnFocusRef.current = triggerRefs.current.get(selectedProject.slug) ?? null;
      if (!dialog.open) dialog.showModal();
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
    returnFocusRef.current = event.currentTarget;
    caseAddress(project.slug, "push");
    setSelectedSlug(project.slug);
  }

  function closeCase() {
    if (!selectedSlug) return;
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
    const controls = event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]),a[href]");
    const first = controls[0], last = controls[controls.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && event.target === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && event.target === last) { event.preventDefault(); first.focus(); }
  }

  return <section className="studio-projects" id="top" aria-labelledby="studio-projects-title">
    <header className="studio-projects__heading"><p>Selected</p><h1 id="studio-projects-title">Projects</h1></header>
    <div className="studio-projects__grid">
      {projects.map((project, index) => <article className={`studio-project-card studio-project-card--${project.slug}`} id={project.slug} key={project.slug} aria-labelledby={`${project.slug}-title`}>
        <button className="studio-project-card__cover" type="button" ref={element => { if (element) triggerRefs.current.set(project.slug, element); else triggerRefs.current.delete(project.slug); }} aria-label={`Explore ${project.title} case study`} aria-haspopup="dialog" aria-controls={dialogId} onClick={event => openCase(project, event)}>
          <img src={project.cover} alt={project.coverAlt} width={project.coverWidth ?? 1280} height={project.coverHeight ?? 720} loading={index < 3 ? "eager" : "lazy"} decoding="async" style={{ objectPosition: project.coverPosition ?? "center" }} />
          <span className="studio-project-card__explore" aria-hidden="true">Explore project<span>↗</span></span>
        </button>
        <h2 id={`${project.slug}-title`}>{project.title}</h2>
        <p className="studio-project-card__subtitle">{project.eyebrow}</p>
        <ProjectLinks project={project} />
      </article>)}
      <a className="studio-project-invite" href="/contact/"><span className="studio-project-invite__image" aria-hidden="true">+</span><span className="studio-project-invite__title">Have an idea?</span><span className="studio-project-invite__copy">Let’s compare notes.</span></a>
    </div>
    <dialog className="studio-case" ref={dialogRef} id={dialogId} aria-labelledby={titleId} aria-describedby={selectedProject ? descriptionId : undefined} onCancel={event => { event.preventDefault(); closeCase(); }} onClose={() => { if (selectedSlug && !dialogRef.current?.open) closeCase(); }} onClick={closeOnBackdrop} onKeyDown={keepFocusInside}>
      <div className="studio-case__header"><p>{selectedProject?.status ?? "Project details"}</p><button ref={closeRef} type="button" className="studio-case__close" onClick={closeCase}><span aria-hidden="true">×</span>Close case study</button></div>
      {selectedProject ? <>
        <div className="studio-case__intro"><h2 id={titleId}>{selectedProject.title}</h2><p className="studio-case__category">{selectedProject.eyebrow}</p></div>
        <img className="studio-case__image" src={selectedProject.cover} alt={selectedProject.coverAlt} width={selectedProject.coverWidth ?? 1280} height={selectedProject.coverHeight ?? 720} decoding="async" />
        <div className="studio-case__body"><p id={descriptionId}>{selectedProject.description}</p>
          {selectedProject.decision && <section className="studio-case__decision"><h3>{selectedProject.decisionTitle ?? "A design decision"}</h3><p>{selectedProject.decision}</p></section>}
          <ul className="studio-case__technologies" aria-label={`${selectedProject.title} technologies`}>{selectedProject.technologies.map(technology => <li key={technology}>{technology}</li>)}</ul>
          <ProjectLinks project={selectedProject} />
        </div>
      </> : <h2 className="studio-case__empty" id={titleId}>Project details</h2>}
    </dialog>
  </section>;
}
