import type { Project } from "../data/profile";
import { ProjectPreview } from "./ProjectPreview";

type ProjectCardProps = {
  project: Project;
  index: number;
  compact?: boolean;
};

export function ProjectCard({ project, index, compact = false }: ProjectCardProps) {
  return (
    <article
      className={`project-card project-archive-item ${project.featured ? "project-card--featured" : ""} ${compact ? "project-card--compact" : ""}`}
      data-project-order={index + 1}
      aria-labelledby={`archive-${project.slug}-title`}
    >
      <ProjectPreview project={project} className="project-card__media" />

      <div className="project-card__body">
        <header className="project-card__heading">
          <h2 id={`archive-${project.slug}-title`} translate="no">{project.title}</h2>
          <p className="project-card__eyebrow">{project.eyebrow}</p>
          <p className="project-card__status">{project.status}</p>
        </header>
        <p className="project-card__description">{project.description}</p>

        <div className="project-card__links">
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
          {!project.liveUrl && !project.sourceUrl && (
            <span className="project-card__private">Case study summary</span>
          )}
        </div>

        <details className="project-details project-details--archive">
          <summary>Implementation</summary>
          <div className="project-details__body">
            {project.decision && (
              <div className="feature-case__decision">
                <h3>{project.decisionTitle ?? "A design decision"}</h3>
                <p>{project.decision}</p>
              </div>
            )}
            <ul className="project-technologies" aria-label={`${project.title} technologies`}>
              {project.technologies.map((technology) => (
                <li key={technology}>{technology}</li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </article>
  );
}
