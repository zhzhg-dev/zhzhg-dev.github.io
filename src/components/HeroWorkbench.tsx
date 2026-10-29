import { useEffect, useState } from "react";
import { projects } from "../data/profile";
import { ProjectPreview } from "./ProjectPreview";

const featured = projects.filter((project) => project.featured).slice(0, 3);

function selectedFromLocation() {
  if (typeof window === "undefined") return featured[0].slug;
  const requested = new URLSearchParams(window.location.search).get("workbench");
  return featured.some((project) => project.slug === requested)
    ? requested!
    : featured[0].slug;
}

export function HeroWorkbench() {
  const [selected, setSelected] = useState(selectedFromLocation);
  const project = featured.find((item) => item.slug === selected) ?? featured[0];

  useEffect(() => {
    const syncLocation = () => setSelected(selectedFromLocation());
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, []);

  function selectProject(slug: string) {
    if (slug === selected) return;
    setSelected(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("workbench", slug);
    window.history.pushState(window.history.state, "", url);
  }

  return (
    <div className={`project-showcase project-showcase--${project.slug}`}>
      <div className="project-showcase__tabs" role="group" aria-label="Preview a project">
        {featured.map((item) => (
          <button
            key={item.slug}
            type="button"
            aria-label={item.title}
            aria-pressed={selected === item.slug}
            aria-controls="project-showcase-panel"
            onClick={() => selectProject(item.slug)}
          >
            {item.slug === "nz-electricity-forecasting" ? "NZ Electricity" : item.title}
          </button>
        ))}
      </div>
      <div className="project-showcase__layout" id="project-showcase-panel">
        <div className="project-showcase__content">
          <div aria-live="polite" aria-atomic="true">
            <p className="project-showcase__status">{project.status}</p>
            <h2 className="project-showcase__title" translate="no">{project.title}</h2>
            <p className="project-showcase__summary">
              {project.shortDescription ?? project.description}
            </p>
            {project.decision && (
              <div className="project-showcase__decision">
                <h3>{project.decisionTitle ?? "A design decision"}</h3>
                <p>{project.decision}</p>
              </div>
            )}
          </div>

          <ul
            className="project-showcase__technologies"
            aria-label={`${project.title} technologies`}
          >
            {project.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>

          <div className="project-showcase__links">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${project.title} live demo in a new tab`}
              >
                View demo
              </a>
            )}
            {project.sourceUrl && (
              <a
                href={project.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${project.title} source code in a new tab`}
              >
                View source
              </a>
            )}
            <a
              className="project-showcase__case-link"
              href={`/projects/#${project.slug}`}
              aria-label={`Read ${project.title} case study`}
            >
              Read case study
            </a>
          </div>
        </div>

        <ProjectPreview project={project} className="project-showcase__media" />
      </div>
    </div>
  );
}
