import { useEffect, useState, type MouseEvent } from "react";
import type { Project } from "../data/profile";
import { ProjectPreview } from "./ProjectPreview";
import "./projects.css";

type FeaturedWorkProps = {
  projects: Project[];
  detailed?: boolean;
};

function projectFromLocation(projects: Project[]) {
  const firstProject = projects[0]?.slug ?? "";
  if (typeof window === "undefined") return firstProject;

  let requestedProject = "";
  try {
    requestedProject = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return firstProject;
  }

  if (projects.some((project) => project.slug === requestedProject)) return requestedProject;
  if (!requestedProject && window.history?.state?.portfolioProject === "") return "";
  return firstProject;
}

export function FeaturedWork({ projects, detailed = false }: FeaturedWorkProps) {
  const [activeSlug, setActiveSlug] = useState(() => projectFromLocation(projects));

  useEffect(() => {
    const restoreProject = () => setActiveSlug(projectFromLocation(projects));
    window.addEventListener("hashchange", restoreProject);
    window.addEventListener("popstate", restoreProject);
    return () => {
      window.removeEventListener("hashchange", restoreProject);
      window.removeEventListener("popstate", restoreProject);
    };
  }, [projects]);

  function toggleProject(event: MouseEvent<HTMLElement>, slug: string) {
    event.preventDefault();
    const nextSlug = activeSlug === slug ? "" : slug;
    setActiveSlug(nextSlug);

    const url = new URL(window.location.href);
    url.hash = nextSlug;
    const previousState = window.history.state;
    const preservedState = previousState && typeof previousState === "object" ? previousState : {};
    window.history.pushState(
      { ...preservedState, portfolioProject: nextSlug },
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <div className={`featured-work projects-editorial${detailed ? " featured-work--detailed" : ""}`}>
      {projects.map((project) => (
        <article
          id={project.slug}
          key={project.slug}
          className={`feature-case feature-case--${project.slug}`}
          aria-labelledby={`${project.slug}-title`}
        >
          <details
            id={`${project.slug}-case`}
            className="feature-case__disclosure"
            open={activeSlug === project.slug}
          >
            <summary
              className="feature-case__index"
              onClick={(event) => toggleProject(event, project.slug)}
            >
              <h2 className="feature-case__heading" id={`${project.slug}-title`}>
                <span className="feature-case__title" translate="no">{project.title}</span>
                <span className="feature-case__status">{project.status}</span>
                <span className="feature-case__indicator" aria-hidden="true">
                  {activeSlug === project.slug ? "−" : "+"}
                </span>
              </h2>
            </summary>

            <div className="feature-case__content">
              <div className="feature-case__reading">
                <p className="feature-case__summary">
                  {project.shortDescription ?? project.description}
                </p>

                {(detailed || project.decision) && (
                  <details className="project-details">
                    <summary>Design &amp; implementation</summary>
                    <div className="project-details__body">
                      {detailed && project.shortDescription && (
                        <p className="feature-case__description">{project.description}</p>
                      )}
                      {project.decision && (
                        <div className="feature-case__decision">
                          <h3>{project.decisionTitle ?? "A design decision"}</h3>
                          <p>{project.decision}</p>
                        </div>
                      )}
                      {detailed && (
                        <ul
                          className="feature-case__technologies project-technologies"
                          aria-label={`${project.title} technologies`}
                        >
                          {project.technologies.map((technology) => (
                            <li key={technology}>{technology}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </details>
                )}
              </div>
              <ProjectPreview project={project} className="feature-case__media" />
            </div>
          </details>

          <div className="feature-case__links">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${project.title} live demo in a new tab`}
              >
                View demo
              </a>
            )}
            {project.sourceUrl && (
              <a
                href={project.sourceUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`View ${project.title} source code in a new tab`}
              >
                View source
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
