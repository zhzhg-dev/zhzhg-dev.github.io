import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import type { Project } from "../data/profile";
import { localizeProjects } from "../data/projects.zh";
import { useLanguage } from "../i18n";
import { LanguageSwitch } from "./LanguageSwitch";
import { ProjectCover } from "./ProjectCover";
import { StudioToolkit } from "./StudioToolkit";
import "./studio-projects.css";

function projectFromHash(projects: Project[]) {
  if (typeof window === "undefined") return null;
  try {
    const slug = decodeURIComponent(window.location.hash.slice(1));
    return projects.some(project => project.slug === slug) ? slug : null;
  } catch { return null; }
}

type OwnedCaseEntry = { owner: string; slug: string; base: string };

function caseBase() {
  const query = new URLSearchParams(window.location.search);
  query.delete("lang");
  const search = query.toString();
  return `${window.location.pathname}${search ? `?${search}` : ""}`;
}

function caseAddress(slug: string | null, mode: "push" | "replace", ownedEntry?: OwnedCaseEntry) {
  const address = `${window.location.pathname}${window.location.search}${slug ? `#${encodeURIComponent(slug)}` : ""}`;
  const state = { ...window.history.state, studioProject: slug };
  if (ownedEntry) state.grantPortfolioCase = ownedEntry;
  else delete state.grantPortfolioCase;
  if (mode === "push") window.history.pushState(state, "", address);
  else window.history.replaceState(state, "", address);
}

function ProjectLinks({ project }: { project: Project }) {
  const { t } = useLanguage();
  return <div className="studio-project-links">
    {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" aria-label={t(`Open ${project.title} live demo in a new tab`, `在新标签页打开 ${project.title} 在线演示`)}>{t("Live demo", "在线体验")}<span aria-hidden="true">↗</span></a>}
    {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noreferrer" aria-label={t(`View ${project.title} source code in a new tab`, `在新标签页查看 ${project.title} 源代码`)}>{t("Source", "源代码")}<span aria-hidden="true">↗</span></a>}
    {!project.liveUrl && !project.sourceUrl && <span className="studio-project-links__status">{project.status}</span>}
  </div>;
}

function ProjectClassification({ project }: { project: Project }) {
  return <p className="studio-project-classification"><span>{project.classification.type}</span>{" · "}{project.classification.focus}</p>;
}

export function StudioProjects({ projects }: { projects: Project[] }) {
  const { language, t } = useLanguage();
  const localizedProjects = useMemo(() => localizeProjects(projects, language), [projects, language]);
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
  const selectedProject = localizedProjects.find(project => project.slug === selectedSlug);
  const spotlight = localizedProjects.find(project => project.slug === "folio");
  const gallery = localizedProjects.filter(project => project !== spotlight);

  useEffect(() => {
    const restore = () => {
      if (pendingBackRef.current) {
        pendingBackRef.current = false;
        const pending = pendingOpenRef.current;
        pendingOpenRef.current = null;
        if (pending) {
          returnFocusRef.current = pending.trigger;
          const base = caseBase();
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
    if (selectedSlug) {
      if (!returnFocusRef.current) returnFocusRef.current = triggerRefs.current.get(selectedSlug) ?? null;
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
  }, [selectedSlug]);

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
    const base = caseBase();
    const previous = window.history.state?.grantPortfolioCase;
    const ownsCurrent = previous?.owner === historyOwnerRef.current && previous?.base === base && previous?.slug === projectFromHash(projects);
    caseAddress(project.slug, ownsCurrent ? "replace" : "push", { owner: historyOwnerRef.current, slug: project.slug, base });
    setSelectedSlug(project.slug);
  }

  function closeCase() {
    if (!selectedSlug || pendingBackRef.current) return;
    const base = caseBase();
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

  function renderCaseTrigger(project: Project, fullScreenshot = false) {
    const stickerId = `${project.slug}-project-type`;
    return <div className="studio-project-card__media">
      <button className={`studio-project-card__cover${fullScreenshot ? " studio-project-card__cover--spotlight" : ""}`} type="button"
        ref={element => { if (element) triggerRefs.current.set(project.slug, element); else triggerRefs.current.delete(project.slug); }}
        aria-label={t(`View details: ${project.title}`, `查看详情：${project.title}`)} aria-describedby={stickerId}
        aria-haspopup="dialog" aria-controls={dialogId} onClick={event => openCase(project, event)}>
        {fullScreenshot
          ? <img src={project.cover} alt={project.coverAlt} width={project.coverWidth ?? 1280} height={project.coverHeight ?? 720} loading="eager" fetchPriority="high" decoding="async" />
          : <span className="studio-project-card__visual"><ProjectCover project={project} /></span>}
        <span className="studio-project-card__explore" aria-hidden="true">{t("View details", "查看详情")}<span>→</span></span>
      </button>
      <span className="studio-project-card__type" id={stickerId} aria-hidden="true">{project.classification.type}</span>
    </div>;
  }

  return <section className="studio-projects" id="top" aria-labelledby="studio-projects-title">
    <header className="studio-projects__heading"><p className="studio-projects__label">{t("Selected", "认真做过的事")}</p><h1 id="studio-projects-title">{t("Projects", "项目与探索")}</h1><p className="studio-projects__hint">{t("AI products, systems experiments, and research.", "从 AI 产品到系统实验与研究。")}</p></header>
    {spotlight && <article className="studio-project-card studio-project-card--folio studio-project-card--spotlight" id={spotlight.slug} aria-labelledby={`${spotlight.slug}-title`}>
      {renderCaseTrigger(spotlight, true)}
      <div className="studio-spotlight__copy">
        <p className="studio-spotlight__eyebrow">{t("Featured case", "精选案例")}</p>
        <h2 id={`${spotlight.slug}-title`} translate="no">{spotlight.title}</h2>
        <p className="studio-spotlight__summary">{spotlight.cardSummary}</p>
        {spotlight.decision && <p className="studio-spotlight__decision">{spotlight.decision}</p>}
        <div className="studio-spotlight__actions">
          <p className="studio-spotlight__status">{spotlight.status}</p>
          <ProjectLinks project={spotlight} />
        </div>
      </div>
    </article>}
    {gallery.length > 0 && <section className="studio-projects__gallery" aria-labelledby="project-gallery-title">
      <h2 id="project-gallery-title">{spotlight ? t("More projects", "更多项目") : t("Project gallery", "项目展区")}</h2>
      <div className="studio-projects__grid">
        {gallery.map(project => <article className={`studio-project-card studio-project-card--${project.slug}`} id={project.slug} key={project.slug} aria-labelledby={`${project.slug}-title`}>
          {renderCaseTrigger(project)}
          <h3 id={`${project.slug}-title`} translate="no">{project.title}</h3>
          <p className="studio-project-card__subtitle">{project.cardSummary}</p>
          <ProjectLinks project={project} />
        </article>)}
      </div>
    </section>}
    <StudioToolkit />
    <dialog className="studio-case" ref={dialogRef} id={dialogId} aria-labelledby={titleId} aria-describedby={selectedProject ? descriptionId : undefined} onCancel={event => { event.preventDefault(); closeCase(); }} onClose={() => { if (selectedSlug && !dialogRef.current?.open) closeCase(); }} onClick={closeOnBackdrop} onKeyDown={keepFocusInside}>
      <div className="studio-case__header"><p>{selectedProject?.status ?? t("Project details", "项目详情")}</p><div className="studio-dialog-actions"><LanguageSwitch /><button ref={closeRef} type="button" className="studio-case__close" onClick={closeCase}><span aria-hidden="true">×</span>{t("Close case study", "关闭项目详情")}</button></div></div>
      {selectedProject ? <>
        <div className="studio-case__intro">
          <h2 id={titleId} translate="no">{selectedProject.title}</h2>
          <ProjectClassification project={selectedProject} />
          <p className="studio-case__summary" id={descriptionId}>{selectedProject.shortDescription ?? selectedProject.description}</p>
          {(selectedProject.liveUrl || selectedProject.sourceUrl) && <ProjectLinks project={selectedProject} />}
        </div>
        {selectedProject.caseStudy && <div className="studio-case__context"><section><h3>{t("The problem", "想解决的问题")}</h3><p>{selectedProject.caseStudy.problem}</p></section><section><h3>{t("My work", "我做了什么")}</h3><p>{selectedProject.caseStudy.contribution}</p></section></div>}
        <figure className="studio-case__figure"><img className="studio-case__image" src={selectedProject.cover} alt={selectedProject.coverAlt} width={selectedProject.coverWidth ?? 1280} height={selectedProject.coverHeight ?? 720} decoding="async" /><figcaption>{selectedProject.coverCaption ?? (selectedProject.featured ? t("Actual interface. The gallery cover is an edited crop of this screenshot.", "真实界面截图。项目封面是在此截图基础上裁切编排而成。") : /abstract/i.test(selectedProject.coverAlt) ? t("Project illustration, not a screenshot of a deployed product.", "项目主题插画，不是已部署产品的界面截图。") : t("Actual interface screenshot.", "真实界面截图。"))}</figcaption></figure>
        <div className="studio-case__body">
          {selectedProject.caseStudy ? <>
            <section className="studio-case__section"><h3>{t("Key decisions", "关键选择")}</h3><div className="studio-case__decisions">{selectedProject.caseStudy.decisions.map(decision => <article key={decision.title}><h4>{decision.title}</h4><p>{decision.body}</p></article>)}</div></section>
            <section className="studio-case__section studio-case__evidence"><h3>{t("Evidence & limitations", "结果与局限")}</h3>{selectedProject.caseStudy.evidence.map(item => <article key={item.title}><h4>{item.title}</h4><p>{item.body}</p></article>)}</section>
            <section className="studio-case__section studio-case__next"><h3>{t("Next iteration", "下一步")}</h3><p>{selectedProject.caseStudy.next}</p></section>
            <details className="studio-case__overview"><summary>{t("Full project overview", "完整项目介绍")}</summary><p>{selectedProject.description}</p></details>
          </> : <>{selectedProject.shortDescription && <p>{selectedProject.description}</p>}{selectedProject.decision && <section className="studio-case__decision"><h3>{selectedProject.decisionTitle ?? t("A design decision", "一个设计选择")}</h3><p>{selectedProject.decision}</p></section>}</>}
          <ul className="studio-case__technologies" aria-label={t(`${selectedProject.title} technologies`, `${selectedProject.title} 技术栈`)}>{selectedProject.technologies.map(technology => <li key={technology} translate="no">{technology}</li>)}</ul>
        </div>
      </> : <h2 className="studio-case__empty" id={titleId}>{t("Project details", "项目详情")}</h2>}
    </dialog>
  </section>;
}
